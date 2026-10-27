import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";

/**
 * Instance du client Stripe API.
 */
export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-12-18.acacia",
  appInfo: {
    name: "pretymelo",
    version: "1.0.0",
  },
});

/**
 * Configuration des packs de crédits (Notes) pretymelo.
 */
export const CREDIT_PACKS = {
  decouverte: {
    id: "pack_decouverte",
    name: "Pack Découverte",
    notes: 4,
    songs: 2,
    amount: 2000, // XAF ou centimes selon devise
    currency: "xaf",
  },
  createur: {
    id: "pack_createur",
    name: "Pack Créateur",
    notes: 12,
    songs: 6,
    amount: 5000,
    currency: "xaf",
    popular: true,
  },
  studio: {
    id: "pack_studio",
    name: "Pack Studio Pro",
    notes: 30,
    songs: 15,
    amount: 10000,
    currency: "xaf",
  },
};

/**
 * Crée une session Checkout Stripe pour l'achat de packs de crédits ou abonnement.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.userEmail
 * @param {string} params.packId Identifiant du pack
 * @param {number} params.notes Nombre de crédits/notes à ajouter
 * @param {string} params.successUrl
 * @param {string} params.cancelUrl
 */
export async function createCheckoutSession({
  userId,
  userEmail,
  packId,
  notes,
  successUrl,
  cancelUrl,
}) {
  const pack = Object.values(CREDIT_PACKS).find((p) => p.id === packId) || {
    name: `Recharge de ${notes} Notes`,
    amount: 2000,
    currency: "eur",
  };

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    customer_email: userEmail,
    client_reference_id: userId,
    line_items: [
      {
        price_data: {
          currency: pack.currency || "eur",
          product_data: {
            name: pack.name,
            description: `Crédite votre compte de ${notes} Notes pretymelo`,
          },
          unit_amount: pack.amount,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: {
      userId,
      packId: packId || "custom",
      notes: String(notes),
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

/**
 * Crée une session de portail client Stripe pour la gestion des factures / moyens de paiement.
 */
export async function createCustomerPortalSession(customerId, returnUrl) {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

/**
 * Vérifie et reconstruit l'événement Webhook Stripe à partir de la signature cryptographique.
 */
export function constructStripeEvent(payload, signature, secret) {
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

export default stripe;
