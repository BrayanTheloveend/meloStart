import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getCampayBalance,
  getCampayTransactionHistory,
  fulfillPaymentOrder,
  parseFailureReason,
} from "@/lib/campayService";

/**
 * GET /api/admin/transactions
 * Interroge l'historique officiel des transactions CamPay via POST /api/history/
 * et effectue la réconciliation avec les commandes locales (PaymentOrder / User).
 *
 * Documentation officielle CamPay :
 * https://documenter.getpostman.com/view/2391374/T1LV8PVA
 */
export async function GET(req) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Accès refusé. Privilèges administrateur requis." },
          { status: 403 }
        );
      }
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase();
    const statusFilter = searchParams.get("status")?.toUpperCase();
    const operatorFilter = searchParams.get("operator")?.toUpperCase();
    const startDate = searchParams.get("startDate")?.trim();
    const endDate = searchParams.get("endDate")?.trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
    const skip = (page - 1) * limit;

    // 1. Récupération simultanée : Historique CamPay (POST /api/history/), Balance CamPay (GET /api/balance/) et Commandes locales
    const [campayHistoryRes, campayBalance, localOrders] = await Promise.all([
      getCampayTransactionHistory({ startDate, endDate, itemsPerPage: 100 }).catch((err) => {
        console.warn("[Admin Transactions] Échec appel POST /api/history/ de CamPay :", err.message);
        return { transactions: [], total: 0, isLive: false };
      }),
      getCampayBalance().catch(() => ({
        totalBalance: 0,
        mtnBalance: 0,
        orangeBalance: 0,
        currency: "XAF",
        isLive: false,
      })),
      prisma.paymentOrder.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      }),
    ]);

    // 2. Indexation des commandes locales pour une réconciliation rapide
    const localByRef = new Map();
    const localByExtRef = new Map();
    for (const order of localOrders) {
      if (order.reference) localByRef.set(order.reference.toLowerCase(), order);
      if (order.externalReference) localByExtRef.set(order.externalReference.toLowerCase(), order);
    }

    const processedReferences = new Set();
    const unifiedList = [];

    // 3. Traitement des transactions retournées par l'API officielle CamPay (POST /api/history/)
    const campayTransactions = Array.isArray(campayHistoryRes.transactions)
      ? campayHistoryRes.transactions
      : [];

    for (const ctx of campayTransactions) {
      const ref = (ctx.reference || "").trim();
      const extRef = (ctx.external_reference || ctx.externalReference || "").trim();
      const lookupKey = (ref || extRef).toLowerCase();

      if (lookupKey) processedReferences.add(lookupKey);
      if (ref) processedReferences.add(ref.toLowerCase());
      if (extRef) processedReferences.add(extRef.toLowerCase());

      // Recherche de correspondance dans notre base
      const matchedOrder = (ref && localByRef.get(ref.toLowerCase())) ||
        (extRef && localByExtRef.get(extRef.toLowerCase())) ||
        null;

      const campayStatus = (ctx.status || "PENDING").toUpperCase();

      // Si CamPay indique SUCCESSFUL et que notre commande était PENDING, synchronisation idempotente
      if (matchedOrder && matchedOrder.status === "PENDING" && campayStatus === "SUCCESSFUL") {
        fulfillPaymentOrder(matchedOrder.id, {
          operator: ctx.operator,
          operatorReference: ctx.operator_reference || ctx.operatorReference,
        }).catch((err) => console.warn("[Admin Sync Fulfillment Warning]:", err.message));
      }

      const meta = matchedOrder?.metadata && typeof matchedOrder.metadata === "object" ? matchedOrder.metadata : {};
      const failureReason =
        ctx.reason ||
        ctx.code ||
        meta?.failureDetails?.message ||
        (campayStatus === "FAILED" ? parseFailureReason(ctx, ctx.operator).message : null);

      const parsedAmount = Number(ctx.amount || matchedOrder?.amount || 0);

      unifiedList.push({
        id: matchedOrder?.id || ref || extRef || `ctx_${Math.random().toString(36).substring(2, 9)}`,
        reference: ref || matchedOrder?.reference || extRef,
        externalReference: extRef || matchedOrder?.externalReference || null,
        operatorReference: ctx.operator_reference || ctx.operatorReference || matchedOrder?.operatorReference || null,
        status: campayStatus, // "SUCCESSFUL" | "PENDING" | "FAILED" | "EXPIRED"
        operator: ctx.operator || matchedOrder?.operator || "MOMO",
        paymentType: matchedOrder?.paymentType || (ctx.type || "DIRECT"),
        phone: ctx.phone_number || ctx.phone || matchedOrder?.phone || "",
        amount: parsedAmount,
        basePrice: meta?.paymentCalc?.basePrice || parsedAmount,
        feeAmount: meta?.paymentCalc?.feeAmount || 0,
        currency: ctx.currency || matchedOrder?.currency || "XAF",
        notes: matchedOrder?.notes || 0,
        packId: matchedOrder?.packId || ctx.description || "Recharge CamPay",
        failureReason,
        creditedAt: matchedOrder?.creditedAt || (campayStatus === "SUCCESSFUL" ? (ctx.created_at || ctx.date) : null),
        createdAt: ctx.created_at || ctx.date || matchedOrder?.createdAt || new Date().toISOString(),
        isLiveFromCampay: true,
        user: {
          id: matchedOrder?.user?.id || null,
          name: matchedOrder?.user?.name || "Client CamPay",
          email: matchedOrder?.user?.email || "",
          image: matchedOrder?.user?.image || null,
        },
      });
    }

    // 4. Ajout des commandes locales récentes non encore listées par l'API history de CamPay (ex: initiées il y a quelques secondes)
    for (const order of localOrders) {
      const ref = (order.reference || "").toLowerCase();
      const extRef = (order.externalReference || "").toLowerCase();

      if ((ref && processedReferences.has(ref)) || (extRef && processedReferences.has(extRef))) {
        continue;
      }

      const meta = typeof order.metadata === "object" && order.metadata !== null ? order.metadata : {};
      const failureReason = meta?.failureDetails?.message || meta?.rawError || null;

      unifiedList.push({
        id: order.id,
        reference: order.reference || order.externalReference,
        externalReference: order.externalReference,
        operatorReference: order.operatorReference || null,
        status: order.status,
        operator: order.operator || "MOMO",
        paymentType: order.paymentType || "DIRECT",
        phone: order.phone || "",
        amount: order.amount,
        basePrice: meta?.paymentCalc?.basePrice || order.amount,
        feeAmount: meta?.paymentCalc?.feeAmount || 0,
        currency: order.currency || "XAF",
        notes: order.notes,
        packId: order.packId,
        failureReason,
        creditedAt: order.creditedAt,
        createdAt: order.createdAt,
        isLiveFromCampay: false,
        user: {
          id: order.user?.id,
          name: order.user?.name || "Client Anonyme",
          email: order.user?.email || "",
          image: order.user?.image || null,
        },
      });
    }

    // 5. Tri chronologique décroissant
    unifiedList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 6. Calcul des métriques globales (sur l'ensemble consolidé)
    let totalCollected = 0;
    let successfulCount = 0;
    let pendingCount = 0;
    let failedCount = 0;

    for (const tx of unifiedList) {
      if (tx.status === "SUCCESSFUL") {
        totalCollected += tx.amount;
        successfulCount++;
      } else if (tx.status === "PENDING") {
        pendingCount++;
      } else if (tx.status === "FAILED") {
        failedCount++;
      }
    }

    const totalTransactions = unifiedList.length;
    const successRate = totalTransactions > 0
      ? `${((successfulCount / totalTransactions) * 100).toFixed(1)}%`
      : "100%";

    // 7. Filtrage selon les paramètres utilisateur
    const filtered = unifiedList.filter((tx) => {
      if (statusFilter && statusFilter !== "ALL" && tx.status !== statusFilter) {
        return false;
      }

      if (operatorFilter && operatorFilter !== "ALL") {
        const op = (tx.operator || "").toUpperCase();
        if (!op.includes(operatorFilter)) return false;
      }

      if (search) {
        const matches =
          (tx.reference || "").toLowerCase().includes(search) ||
          (tx.externalReference || "").toLowerCase().includes(search) ||
          (tx.operatorReference || "").toLowerCase().includes(search) ||
          (tx.phone || "").toLowerCase().includes(search) ||
          (tx.packId || "").toLowerCase().includes(search) ||
          (tx.user?.name || "").toLowerCase().includes(search) ||
          (tx.user?.email || "").toLowerCase().includes(search);
        if (!matches) return false;
      }

      return true;
    });

    // 8. Pagination
    const paginated = filtered.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      transactions: paginated,
      metrics: {
        totalCollected: campayBalance.totalBalance > 0 ? campayBalance.totalBalance : totalCollected,
        totalBalance: campayBalance.totalBalance || totalCollected,
        mtnBalance: campayBalance.mtnBalance || 0,
        orangeBalance: campayBalance.orangeBalance || 0,
        currency: "XAF",
        isLiveCampay: campayBalance.isLive || campayHistoryRes.isLive,
        successfulCount,
        pendingCount,
        failedCount,
        totalCount: totalTransactions,
        successRate,
      },
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit) || 1,
      },
    });
  } catch (error) {
    console.error("[API Admin Transactions GET] Erreur :", error);
    return NextResponse.json(
      { error: "Impossible de charger les transactions officielles CamPay." },
      { status: 500 }
    );
  }
}
