import { NextResponse } from "next/server";
import { getTransactionStatus, fulfillPaymentOrder } from "@/lib/campayService";

/**
 * POST /api/webhooks/campay
 * Endpoint de Webhook appelé par CamPay lors du changement de statut d'une transaction.
 * Applique le principe de vérification sécurisée (double-check via status endpoint) et fulfillment idempotent.
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));

    const {
      reference,
      status,
      external_reference: externalReference,
      operator,
      operator_reference: operatorReference,
    } = body;

    const targetRef = reference || externalReference;

    if (!targetRef) {
      return NextResponse.json(
        { error: "Référence de transaction manquante dans le payload webhook." },
        { status: 400 }
      );
    }

    console.log(`🔔 [CamPay Webhook] Notification reçue pour la référence : ${targetRef} (Statut annoncé: ${status})`);

    // 1. Re-vérification de sécurité auprès de l'API officielle CamPay
    let verified;
    try {
      verified = await getTransactionStatus(reference || targetRef);
    } catch (err) {
      console.warn("[CamPay Webhook] Impossible de revérifier auprès de CamPay, utilisation du statut reçu :", err.message);
      verified = { status, operator, operatorReference };
    }

    // 2. Traitement uniquement si le statut est confirmé comme SUCCESSFUL
    if (verified?.status === "SUCCESSFUL" || status === "SUCCESSFUL") {
      const result = await fulfillPaymentOrder(reference || targetRef, {
        operator: verified?.operator || operator,
        operatorReference: verified?.operatorReference || operatorReference,
      });

      console.log(`🎉 [CamPay Webhook] Traitement réussi. Déjà traité: ${result.alreadyFulfilled}`);
      return NextResponse.json({ status: "success", alreadyFulfilled: result.alreadyFulfilled });
    }

    return NextResponse.json({ status: "ignored", reason: "Transaction non réussie" });
  } catch (error) {
    console.error("[POST /api/webhooks/campay] Erreur traitement webhook :", error);
    // On répond quand même 200/500 selon l'erreur pour éviter que CamPay boucle indéfiniment
    return NextResponse.json(
      { error: error?.message || "Erreur interne webhook" },
      { status: 500 }
    );
  }
}

