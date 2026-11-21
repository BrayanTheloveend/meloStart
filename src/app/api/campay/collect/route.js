import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPricingPlanById, calculatePaymentAmount } from "@/lib/pricingService";
import { collectDirectPayment, formatCampayPhoneNumber, detectCarrier } from "@/lib/campayService";

/**
 * POST /api/campay/collect
 * Initie un paiement DIRECT Mobile Money (MTN MoMo ou Orange Money).
 * Déclenche une notification USSD sur le téléphone de l'utilisateur pour saisie du code PIN.
 */
export async function POST(req) {
  try {
    const session = await getServerAuthSession();
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Vous devez être connecté pour recharger vos Notes." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { packId, phone } = body;

    if (!phone || typeof phone !== "string" || phone.trim().length < 8) {
      return NextResponse.json(
        { error: "Veuillez fournir un numéro de téléphone Mobile Money valide (ex: 677XXXXXX ou 2376XXXXXXXX)." },
        { status: 400 }
      );
    }

    // 1. Détermination du pack depuis les paramètres de tarification en Base de Données (Settings Admin)
    const pack = await getPricingPlanById(packId);
    if (!pack) {
      return NextResponse.json(
        { error: "Pack de crédits introuvable dans la configuration du système." },
        { status: 404 }
      );
    }

    // 2. Calcul du montant final selon la politique de frais CamPay configurée par l'admin
    const paymentCalc = await calculatePaymentAmount(pack.price || pack.amount);

    const normalizedPhone = formatCampayPhoneNumber(phone);
    if (!normalizedPhone || normalizedPhone.length < 9) {
      return NextResponse.json(
        { error: "Format de numéro invalide. Seuls les numéros MTN et Orange camerounais sont acceptés (ex: 2376XXXXXXXX)." },
        { status: 400 }
      );
    }

    const operator = detectCarrier(normalizedPhone);
    const externalReference = `melo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 3. Création de la commande de paiement en base de données (PENDING)
    const paymentOrder = await prisma.paymentOrder.create({
      data: {
        userId: session.user.id,
        packId: pack.id,
        notes: pack.notes,
        amount: paymentCalc.totalAmount, // Montant total à prélever
        currency: "XAF",
        provider: "CAMPAY",
        paymentType: "DIRECT",
        externalReference,
        phone: normalizedPhone,
        operator,
        status: "PENDING",
        metadata: {
          userEmail: session.user.email,
          packName: pack.name,
          basePrice: paymentCalc.basePrice,
          feeAmount: paymentCalc.feeAmount,
          feePercentage: paymentCalc.feePercentage,
          passFeesToCustomer: paymentCalc.passFeesToCustomer,
        },
      },
    });

    // 4. Appel de l'API CamPay Collect
    let campayRes;
    try {
      campayRes = await collectDirectPayment({
        amount: paymentCalc.totalAmount,
        from: normalizedPhone,
        description: `Recharge ${pack.name} (${pack.notes} Notes) - pretymelo`,
        externalReference,
      });
    } catch (campayError) {
      // Log serveur détaillé pour le débogage technique (visible uniquement dans la console / logs)
      console.error("🔴 [CamPay Collect Failed - Server Log]:", campayError.message || campayError);

      // Marquer la commande comme échouée avec l'erreur brute enregistrée pour l'audit
      await prisma.paymentOrder.update({
        where: { id: paymentOrder.id },
        data: {
          status: "FAILED",
          metadata: {
            rawError: campayError.message || String(campayError),
            operator,
            phone: normalizedPhone,
            paymentCalc,
          },
        },
      });

      // Message utilisateur propre et orienté opérateur (masque les erreurs d'infrastructure ou de clés API)
      const operatorLabel = operator === "MTN" ? "MTN MoMo" : operator === "Orange" ? "Orange Money" : "Mobile Money";
      const userFriendlyMessage = `Le service de paiement ${operatorLabel} est momentanément indisponible ou subit des perturbations réseau. Veuillez réessayer dans quelques instants.`;

      return NextResponse.json(
        { error: userFriendlyMessage },
        { status: 502 }
      );
    }

    // 5. Mise à jour de la commande avec la référence CamPay (UUID)
    await prisma.paymentOrder.update({
      where: { id: paymentOrder.id },
      data: {
        reference: campayRes.reference,
        operator: campayRes.operator || operator,
      },
    });

    return NextResponse.json({
      success: true,
      orderId: paymentOrder.id,
      reference: campayRes.reference,
      status: campayRes.status || "PENDING",
      operator: campayRes.operator || operator,
      notes: pack.notes,
      amount: paymentCalc.totalAmount,
      baseAmount: paymentCalc.basePrice,
      feeAmount: paymentCalc.feeAmount,
      passFeesToCustomer: paymentCalc.passFeesToCustomer,
      currency: "XAF",
      message: `Demande de débit de ${paymentCalc.totalAmount.toLocaleString()} FCFA envoyée sur votre téléphone ${operator} (${normalizedPhone}). Veuillez valider en entrant votre code secret PIN.`,
    });
  } catch (error) {
    console.error("[POST /api/campay/collect] Erreur :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'initiation du paiement direct." },
      { status: 500 }
    );
  }
}

