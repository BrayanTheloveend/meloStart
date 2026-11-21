import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPricingPlanById } from "@/lib/pricingService";
import { createPaymentLink, formatCampayPhoneNumber } from "@/lib/campayService";

/**
 * POST /api/campay/link
 * Génère un LIEN DE PAIEMENT sécurisé CamPay (Hosted Checkout).
 * Permet à l'utilisateur de payer sur la page de paiement CamPay s'il ne souhaite pas le prompt direct.
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

    // Détermination du pack depuis les paramètres de tarification en Base de Données (Settings Admin)
    const pack = await getPricingPlanById(packId);
    if (!pack) {
      return NextResponse.json(
        { error: "Pack de crédits introuvable dans la configuration du système." },
        { status: 404 }
      );
    }

    const normalizedPhone = phone ? formatCampayPhoneNumber(phone) : null;
    const externalReference = `melo_link_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUrl = `${origin.replace(/\/$/, "")}/studio/recharge?status=success&ref=${externalReference}`;
    const failureRedirectUrl = `${origin.replace(/\/$/, "")}/studio/recharge?status=failed&ref=${externalReference}`;

    // 1. Enregistrement de la commande en base de données
    const paymentOrder = await prisma.paymentOrder.create({
      data: {
        userId: session.user.id,
        packId: pack.id,
        notes: pack.notes,
        amount: pack.amount,
        currency: "XAF",
        provider: "CAMPAY",
        paymentType: "LINK",
        externalReference,
        phone: normalizedPhone,
        status: "PENDING",
        metadata: {
          userEmail: session.user.email,
          packName: pack.name,
        },
      },
    });

    // 2. Appel de l'API CamPay get_payment_link
    let campayRes;
    try {
      campayRes = await createPaymentLink({
        amount: pack.amount,
        from: normalizedPhone,
        description: `Recharge ${pack.name} (${pack.notes} Notes) - pretymelo`,
        externalReference,
        redirectUrl,
        failureRedirectUrl,
      });
    } catch (campayError) {
      // Log serveur détaillé pour le débogage technique
      console.error("🔴 [CamPay Link Failed - Server Log]:", campayError.message || campayError);

      await prisma.paymentOrder.update({
        where: { id: paymentOrder.id },
        data: {
          status: "FAILED",
          metadata: { rawError: campayError.message || String(campayError) },
        },
      });

      return NextResponse.json(
        { error: "Le service de paiement Mobile Money est momentanément indisponible. Veuillez réessayer dans quelques instants." },
        { status: 502 }
      );
    }

    // 3. Mise à jour de la commande avec le lien et la référence
    await prisma.paymentOrder.update({
      where: { id: paymentOrder.id },
      data: {
        reference: campayRes.reference,
        paymentLink: campayRes.link,
      },
    });

    return NextResponse.json({
      success: true,
      orderId: paymentOrder.id,
      link: campayRes.link,
      reference: campayRes.reference,
      notes: pack.notes,
      amount: pack.amount,
      currency: "XAF",
    });
  } catch (error) {
    console.error("[POST /api/campay/link] Erreur :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la création du lien de paiement." },
      { status: 500 }
    );
  }
}

