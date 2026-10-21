import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { addCredits } from "@/lib/credits";

/**
 * Route Webhook Stripe pour l'App Router Next.js.
 * Réceptionne et traite les événements de paiement asynchrones.
 */
export async function POST(req) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[Stripe Webhook] Erreur : STRIPE_WEBHOOK_SECRET non configuré.");
    return NextResponse.json(
      { error: "Configuration serveur incomplète (Webhook Secret manquant)." },
      { status: 500 }
    );
  }

  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Signature Stripe manquante dans les en-têtes." },
      { status: 400 }
    );
  }

  let event;
  const rawBody = await req.text();

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error(`[Stripe Webhook] Échec de vérification de signature : ${err.message}`);
    return NextResponse.json(
      { error: `Webhook Signature Verification Failed: ${err.message}` },
      { status: 400 }
    );
  }

  console.log(`[Stripe Webhook] Événement reçu : ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId || session.client_reference_id;
        const notesPurchased = parseInt(session.metadata?.notes || "0", 10);
        const packId = session.metadata?.packId;

        if (userId && notesPurchased > 0) {
          console.log(`[Stripe Webhook] Crédit de ${notesPurchased} Notes pour l'utilisateur ${userId}`);

          // Ajout atomique des notes avec traçabilité dans CreditTransaction
          await addCredits(userId, notesPurchased, {
            type: "PURCHASE",
            description: `Achat Pack (${packId || "sur mesure"}) via Stripe`,
            metadata: {
              stripeSessionId: session.id,
              stripePaymentIntent: session.payment_intent,
              amountTotal: session.amount_total,
              currency: session.currency,
            },
          });

          // Association du stripeCustomerId au profil utilisateur si présent
          if (session.customer) {
            await prisma.user.update({
              where: { id: userId },
              data: { stripeCustomerId: String(session.customer) },
            });
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        const customerId = invoice.customer;

        if (subscriptionId) {
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { stripeSubscriptionId: subscriptionId },
                { stripeCustomerId: customerId },
              ],
            },
          });

          if (user) {
            // Recharge automatique mensuelle pour abonnés (ex: 20 notes)
            const refillNotes = 20;
            console.log(`[Stripe Webhook] Renouvellement abonnement : +${refillNotes} Notes pour ${user.id}`);

            await addCredits(user.id, refillNotes, {
              type: "SUBSCRIPTION_REFILL",
              description: "Recharge mensuelle d'abonnement",
              metadata: {
                invoiceId: invoice.id,
                subscriptionId,
              },
            });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        console.log(`[Stripe Webhook] Résiliation abonnement : ${subscription.id}`);

        await prisma.user.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            stripeSubscriptionId: null,
            stripePriceId: null,
            stripeCurrentPeriodEnd: null,
          },
        });
        break;
      }

      default:
        console.log(`[Stripe Webhook] Événement ignoré : ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[Stripe Webhook] Erreur de traitement interne :", error);
    return NextResponse.json(
      { error: "Erreur serveur lors du traitement du webhook." },
      { status: 500 }
    );
  }
}
