import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/transactions
 * Liste des transactions financières et mouvements de crédits (Notes).
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
    const search = searchParams.get("search");
    const type = searchParams.get("type");
    const method = searchParams.get("method");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
    const skip = (page - 1) * limit;

    const where = {};

    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { stripePaymentId: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (type && type !== "ALL") {
      where.type = type;
    }

    if (method && method !== "ALL") {
      where.paymentMethod = { contains: method, mode: "insensitive" };
    }

    const [transactions, total] = await Promise.all([
      prisma.creditTransaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      }),
      prisma.creditTransaction.count({ where }),
    ]);

    const formatted = transactions.map((tx) => ({
      id: tx.id,
      amount: tx.amountMoney ? `${tx.amountMoney.toLocaleString("fr-FR")} ${tx.currency?.toUpperCase() || "XAF"}` : `${tx.amount > 0 ? "+" : ""}${tx.amount} Notes`,
      notes: tx.amount,
      balanceAfter: tx.balanceAfter,
      type: tx.type,
      paymentMethod: tx.paymentMethod || "Système",
      status: "COMPLETED",
      packName: tx.description || "Mouvement de Notes",
      stripeId: tx.stripePaymentId || `tx_${tx.id.slice(0, 8)}`,
      user: {
        name: tx.user?.name || "Utilisateur anonyme",
        email: tx.user?.email || "",
        avatar: tx.user?.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop",
      },
      createdAt: new Date(tx.createdAt).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

    return NextResponse.json({
      success: true,
      transactions: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[API Admin Transactions GET] Erreur:", error);
    return NextResponse.json(
      { error: "Impossible de charger les transactions." },
      { status: 500 }
    );
  }
}
