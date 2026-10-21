import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { createCheckoutSession, CREDIT_PACKS } from "@/lib/stripe";
import { getPricingPlansFromDb } from "@/lib/pricingService";

/**
 * POST /api/stripe/checkout
 * Crée une session Checkout Stripe pour l'achat de packs de Notes.
 */
export async function POST(req) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Vous devez être connecté pour acheter des packs de Notes." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { packId = "pack_createur" } = body;

    // 1. Recherche du pack dans la base de données (modifié par l'admin)
    const dbPlans = await getPricingPlansFromDb();
    const dbPack = dbPlans.find((p) => p.id === packId || p.name?.toLowerCase() === packId?.toLowerCase());

    const pack = dbPack
      ? {
          id: dbPack.id,
          name: dbPack.name,
          notes: dbPack.notes,
          amount: dbPack.price,
          currency: (dbPack.currency || "xaf").toLowerCase(),
        }
      : Object.values(CREDIT_PACKS).find((p) => p.id === packId);

    if (!pack) {
      return NextResponse.json({ error: "Pack de crédits introuvable." }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const successUrl = `${appUrl}/studio/recharge?success=true&session_id={CHECKOUT_SESSION_ID}&notes=${pack.notes}`;
    const cancelUrl = `${appUrl}/studio/recharge?canceled=true`;

    // Si la clé Stripe n'est pas configurée en mode local
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes("placeholder")) {
      return NextResponse.json({
        success: true,
        mock: true,
        message: "Mode local détecté (clés Stripe de test requises pour checkout en ligne).",
        url: `${appUrl}/studio/recharge?mock_success=true&notes=${pack.notes}&pack=${pack.id}`,
      });
    }

    const checkoutSession = await createCheckoutSession({
      userId: session.user.id,
      userEmail: session.user.email,
      packId: pack.id,
      notes: pack.notes,
      successUrl,
      cancelUrl,
    });

    return NextResponse.json({
      success: true,
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error("[API Stripe Checkout] Erreur:", error);
    return NextResponse.json(
      { error: "Impossible d'initialiser la session de paiement." },
      { status: 500 }
    );
  }
}
