import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPricingPlanById } from "@/lib/pricingService";
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

    const normalizedPhone = formatCampayPhoneNumber(phone);
    if (!normalizedPhone || normalizedPhone.length < 9) {
      return NextResponse.json(
        { error: "Format de numéro invalide. Seuls les numéros MTN et Orange camerounais sont acceptés (ex: 2376XXXXXXXX)." },
        { status: 400 }
      );
    }

    const operator = detectCarrier(normalizedPhone);
    const externalReference = `melo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 2. Création de la commande de paiement en base de données (PENDING)
    const paymentOrder = await prisma.paymentOrder.create({
      data: {
        userId: session.user.id,
        packId: pack.id,
        notes: pack.notes,
        amount: pack.amount,
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
        },
      },
    });

    // 3. Appel de l'API CamPay Collect
    let campayRes;
    try {
      campayRes = await collectDirectPayment({
        amount: pack.amount,
        from: normalizedPhone,
        description: `Recharge ${pack.name} (${pack.notes} Notes) - pretymelo`,
        externalReference,
      });
    } catch (campayError) {
      // Marquer la commande comme échouée
      await prisma.paymentOrder.update({
        where: { id: paymentOrder.id },
        data: {
          status: "FAILED",
          metadata: { error: campayError.message },
        },
      });

      return NextResponse.json(
        { error: campayError.message || "Impossible de contacter l'opérateur Mobile Money pour le moment." },
        { status: 502 }
      );
    }

    // 4. Mise à jour de la commande avec la référence CamPay (UUID)
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
      amount: pack.amount,
      currency: "XAF",
      message: `Demande de débit envoyée sur votre téléphone ${operator} (${normalizedPhone}). Veuillez valider en entrant votre code secret PIN.`,
    });
  } catch (error) {
    console.error("[POST /api/campay/collect] Erreur :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'initiation du paiement direct." },
      { status: 500 }
    );
  }
}

