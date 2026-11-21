import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTransactionStatus, fulfillPaymentOrder, parseFailureReason } from "@/lib/campayService";

/**
 * GET /api/campay/status?reference=...&orderId=...
 * Interroge le statut de la transaction auprès de CamPay.
 * Si le statut est SUCCESSFUL, crédite immédiatement les Notes de manière idempotente.
 */
export async function GET(req) {
  try {
    const session = await getServerAuthSession();
    const { searchParams } = new URL(req.url);

    const reference = searchParams.get("reference")?.trim();
    const orderId = searchParams.get("orderId")?.trim();
    const externalRef = searchParams.get("ref")?.trim();

    if (!reference && !orderId && !externalRef) {
      return NextResponse.json(
        { error: "Veuillez fournir une référence de transaction ou un ID de commande." },
        { status: 400 }
      );
    }

    // 1. Recherche de la commande dans notre base
    const order = await prisma.paymentOrder.findFirst({
      where: {
        OR: [
          ...(reference ? [{ reference }] : []),
          ...(orderId ? [{ id: orderId }] : []),
          ...(externalRef ? [{ externalReference: externalRef }] : []),
        ],
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Commande de paiement introuvable." },
        { status: 404 }
      );
    }

    // 2. Si déjà validée et créditée avec succès
    if (order.status === "SUCCESSFUL" && order.creditedAt) {
      const user = await prisma.user.findUnique({
        where: { id: order.userId },
        select: { credits: true },
      });

      return NextResponse.json({
        success: true,
        status: "SUCCESSFUL",
        notes: order.notes,
        newBalance: user?.credits ?? 0,
        alreadyFulfilled: true,
        message: "Paiement confirmé ! Vos Notes sont disponibles.",
      });
    }

    // 3. Si la commande n'a pas encore de référence CamPay externe
    const targetRef = reference || order.reference;
    if (!targetRef) {
      return NextResponse.json({
        success: true,
        status: order.status,
        message: "Commande en cours d'initialisation...",
      });
    }

    // 4. Interrogation de l'API CamPay pour connaître le statut réel
    let liveStatus;
    try {
      liveStatus = await getTransactionStatus(targetRef);
    } catch (statusErr) {
      console.warn("[CamPay Status Check] Échec d'interrogation CamPay :", statusErr.message);
      return NextResponse.json({
        success: true,
        status: order.status,
        message: "En attente de confirmation de l'opérateur...",
      });
    }

    // 5. Traitement selon le statut retourné par CamPay
    if (liveStatus.status === "SUCCESSFUL") {
      const result = await fulfillPaymentOrder(order.id, {
        operator: liveStatus.operator,
        operatorReference: liveStatus.operatorReference,
        code: liveStatus.code,
      });

      return NextResponse.json({
        success: true,
        status: "SUCCESSFUL",
        notes: order.notes,
        newBalance: result.newBalance,
        message: `Paiement validé avec succès ! +${order.notes} Notes créditées sur votre compte.`,
      });
    }

    if (liveStatus.status === "FAILED") {
      const failureDetails = parseFailureReason(liveStatus, order.operator);

      await prisma.paymentOrder.update({
        where: { id: order.id },
        data: {
          status: "FAILED",
          metadata: {
            ...(order.metadata && typeof order.metadata === "object" ? order.metadata : {}),
            failureDetails,
            rawCampayStatus: liveStatus.raw || liveStatus,
          },
        },
      });

      return NextResponse.json({
        success: false,
        status: "FAILED",
        failureReason: failureDetails.type,
        isInsufficientFunds: failureDetails.isInsufficientFunds,
        title: failureDetails.title,
        message: failureDetails.message,
      });
    }

    // PENDING : L'utilisateur n'a pas encore composé son code PIN
    return NextResponse.json({
      success: true,
      status: "PENDING",
      operator: liveStatus.operator || order.operator,
      message: "En attente de saisie de votre code secret PIN...",
    });
  } catch (error) {
    console.error("[GET /api/campay/status] Erreur :", error);
    return NextResponse.json(
      { error: "Impossible de vérifier le statut de la transaction." },
      { status: 500 }
    );
  }
}

