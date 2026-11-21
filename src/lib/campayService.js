import { prisma } from "@/lib/prisma";

/**
 * Service officiel d'intégration avec l'agrégateur de paiement CamPay.
 * Documentation : https://documenter.getpostman.com/view/2391374/T1LV8PVA0
 *
 * Fonctionnalités supportées :
 * 1. Paiement direct (Collect USSD Push) : envoie une invite de débit directement sur le mobile (MTN MoMo / Orange Money).
 * 2. Lien de paiement (Hosted Checkout) : génère une URL de paiement sécurisée.
 * 3. Vérification de statut (/api/transaction/{reference}/) : polling et contrôle d'authenticité.
 * 4. Fulfillment idempotent avec transaction PostgreSQL (attribution automatique des Notes).
 */

const IS_LIVE = process.env.CAMPAY_ENV === "live";
const CAMPAY_BASE_URL =
  process.env.CAMPAY_BASE_URL ||
  (IS_LIVE ? "https://www.campay.net/api/" : "https://demo.campay.net/api/");

// Cache en mémoire pour le token temporaire (si généré dynamiquement)
let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Normalise un numéro de téléphone au format requis par CamPay (ex: 2376XXXXXXXX).
 */
export function formatCampayPhoneNumber(input) {
  if (!input) return "";
  let clean = String(input).replace(/[^\d]/g, "");

  // Supprimer les 00 initiaux (ex: 00237)
  if (clean.startsWith("00")) {
    clean = clean.slice(2);
  }

  // Si l'utilisateur saisit 9 chiffres commençant par 6 (format camerounais standard : 6XXXXXXXX)
  if (clean.length === 9 && clean.startsWith("6")) {
    clean = `237${clean}`;
  }

  return clean;
}

/**
 * Détecte l'opérateur mobile à partir du numéro normalisé.
 */
export function detectCarrier(normalizedPhone) {
  if (!normalizedPhone || !normalizedPhone.startsWith("237")) return "MOMO";
  const suffix = normalizedPhone.slice(3); // 9 chiffres

  // Préfixes MTN Cameroon : 67X, 68X, 650-654
  if (suffix.startsWith("67") || suffix.startsWith("68") || /^(65[0-4])/.test(suffix)) {
    return "MTN";
  }

  // Préfixes Orange Cameroon : 69X, 655-659
  if (suffix.startsWith("69") || /^(65[5-9])/.test(suffix)) {
    return "ORANGE";
  }

  return "MOMO";
}

/**
 * Obtient un token d'authentification CamPay valide.
 * Priorité : CAMPAY_APP_TOKEN (Permanent) > POST /api/token/ (Username / Password).
 */
export async function getCampayToken() {
  // 1. Token permanent d'application (App Keys dashboard)
  if (process.env.CAMPAY_APP_TOKEN) {
    return process.env.CAMPAY_APP_TOKEN.trim();
  }

  // 2. Token temporaire mis en cache (valide avec 60s de marge)
  const now = Date.now();
  if (cachedToken && tokenExpiresAt > now + 60000) {
    return cachedToken;
  }

  const username = process.env.CAMPAY_USERNAME;
  const password = process.env.CAMPAY_PASSWORD;

  if (!username || !password) {
    // Mode simulation dev sans clés
    console.warn("[CamPay] Aucune clé CamPay configurée (CAMPAY_APP_TOKEN ou CAMPAY_USERNAME/CAMPAY_PASSWORD). Mode simulation actif.");
    return "SIMULATED_DEV_TOKEN";
  }

  // 3. Demande de token via POST /api/token/
  const tokenUrl = `${CAMPAY_BASE_URL.replace(/\/$/, "")}/token/`;
  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`[CamPay Token Error] Code ${res.status}: ${errorBody}`);
  }

  const data = await res.json();
  if (!data?.token) {
    throw new Error("[CamPay Token Error] Token absent de la réponse.");
  }

  cachedToken = data.token;
  const expiresIn = Number(data.expires_in) || 3600;
  tokenExpiresAt = now + expiresIn * 1000;

  return cachedToken;
}

/**
 * PAIEMENT DIRECT (Mode principal) : Déclenche une demande de débit USSD sur le téléphone du client.
 * Endpoint : POST /api/collect/
 *
 * @param {Object} params
 * @param {number|string} params.amount Montant en FCFA (sans décimales)
 * @param {string} params.from Numéro de téléphone du payeur (format 2376XXXXXXXX)
 * @param {string} params.description Libellé de la transaction
 * @param {string} params.externalReference Référence unique de commande interne
 */
export async function collectDirectPayment({
  amount,
  from,
  description = "Achat de Notes pretymelo",
  externalReference,
}) {
  const token = await getCampayToken();
  const normalizedPhone = formatCampayPhoneNumber(from);

  // Simulation locale en dev si aucune clé réelle n'est fournie
  if (token === "SIMULATED_DEV_TOKEN") {
    console.log("💳 [CamPay SIMULATION DIRECT] Collect de", amount, "XAF sur le numéro", normalizedPhone);
    const mockRef = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return {
      reference: mockRef,
      status: "PENDING",
      operator: detectCarrier(normalizedPhone),
      isSimulation: true,
    };
  }

  const endpoint = `${CAMPAY_BASE_URL.replace(/\/$/, "")}/collect/`;
  const payload = {
    amount: String(Math.round(Number(amount))),
    currency: "XAF",
    from: normalizedPhone,
    description: String(description).slice(0, 100),
    external_reference: String(externalReference),
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseText = await res.text();
  let data;
  try {
    data = JSON.parse(responseText);
  } catch (_) {
    throw new Error(`[CamPay Collect Error] Réponse invalide (${res.status}): ${responseText}`);
  }

  if (!res.ok) {
    const errorMsg = data?.message || data?.detail || responseText;
    throw new Error(`[CamPay Collect Failed] Code ${res.status}: ${errorMsg}`);
  }

  return {
    reference: data.reference,
    status: data.status || "PENDING",
    operator: detectCarrier(normalizedPhone),
  };
}

/**
 * LIEN DE PAIEMENT (Mode alternatif) : Génère une page de checkout hébergée CamPay.
 * Endpoint : POST /api/get_payment_link/
 *
 * @param {Object} params
 * @param {number|string} params.amount Montant en FCFA
 * @param {string} [params.from] Numéro de téléphone (optionnel)
 * @param {string} params.description
 * @param {string} params.externalReference
 * @param {string} params.redirectUrl URL de redirection en cas de succès
 * @param {string} params.failureRedirectUrl URL de redirection en cas d'échec
 */
export async function createPaymentLink({
  amount,
  from = "",
  description = "Achat de Notes pretymelo",
  externalReference,
  redirectUrl,
  failureRedirectUrl,
}) {
  const token = await getCampayToken();
  const normalizedPhone = from ? formatCampayPhoneNumber(from) : undefined;

  if (token === "SIMULATED_DEV_TOKEN") {
    console.log("🔗 [CamPay SIMULATION LINK] Génération de lien pour", amount, "XAF");
    const mockRef = `sim_link_${Date.now()}`;
    return {
      link: redirectUrl || "https://demo.campay.net",
      reference: mockRef,
      isSimulation: true,
    };
  }

  const endpoint = `${CAMPAY_BASE_URL.replace(/\/$/, "")}/get_payment_link/`;
  const payload = {
    amount: String(Math.round(Number(amount))),
    currency: "XAF",
    description: String(description).slice(0, 100),
    external_reference: String(externalReference),
    redirect_url: redirectUrl,
    failure_redirect_url: failureRedirectUrl,
    ...(normalizedPhone ? { from: normalizedPhone } : {}),
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseText = await res.text();
  let data;
  try {
    data = JSON.parse(responseText);
  } catch (_) {
    throw new Error(`[CamPay Link Error] Réponse invalide (${res.status}): ${responseText}`);
  }

  if (!res.ok) {
    const errorMsg = data?.message || data?.detail || responseText;
    throw new Error(`[CamPay Link Failed] Code ${res.status}: ${errorMsg}`);
  }

  return {
    link: data.link,
    reference: data.reference,
  };
}

/**
 * VÉRIFICATION DE STATUT : Interroge CamPay pour connaître l'état réel d'une transaction.
 * Endpoint : GET /api/transaction/{reference}/
 *
 * @param {string} reference Référence CamPay (UUID)
 */
export async function getTransactionStatus(reference) {
  if (!reference) throw new Error("Référence de transaction requise.");

  // Gestion de la simulation locale en dev
  if (reference.startsWith("sim_")) {
    return {
      reference,
      status: "SUCCESSFUL",
      amount: 5000,
      currency: "XAF",
      operator: "MTN",
      isSimulation: true,
    };
  }

  const token = await getCampayToken();
  const endpoint = `${CAMPAY_BASE_URL.replace(/\/$/, "")}/transaction/${encodeURIComponent(reference)}/`;

  const res = await fetch(endpoint, {
    method: "GET",
    headers: {
      "Authorization": `Token ${token}`,
      "Content-Type": "application/json",
    },
  });

  const responseText = await res.text();
  let data;
  try {
    data = JSON.parse(responseText);
  } catch (_) {
    throw new Error(`[CamPay Status Error] Réponse invalide (${res.status}): ${responseText}`);
  }

  if (!res.ok) {
    throw new Error(`[CamPay Status Failed] Code ${res.status}: ${data?.message || responseText}`);
  }

  return {
    reference: data.reference,
    status: data.status, // "PENDING" | "SUCCESSFUL" | "FAILED"
    amount: Number(data.amount),
    currency: data.currency || "XAF",
    operator: data.operator,
    code: data.code,
    operatorReference: data.operator_reference,
    externalReference: data.external_reference,
  };
}

/**
 * ATRIBUTION DES CRÉDITS (FULFILLMENT IDEMPOTENT) :
 * Lorsqu'un paiement est confirmé avec succès (via Polling ou Webhook),
 * crédite atomiquement le compte de l'utilisateur et met à jour l'audit.
 *
 * @param {string} referenceOrOrderId Référence CamPay ou ID de commande pretymelo
 * @param {Object} [extraDetails] Détails supplémentaires de la confirmation
 */
export async function fulfillPaymentOrder(referenceOrOrderId, extraDetails = {}) {
  return await prisma.$transaction(async (tx) => {
    // 1. Recherche de la commande de paiement
    const order = await tx.paymentOrder.findFirst({
      where: {
        OR: [
          { id: referenceOrOrderId },
          { reference: referenceOrOrderId },
          { externalReference: referenceOrOrderId },
        ],
      },
    });

    if (!order) {
      throw new Error(`Commande de paiement introuvable (${referenceOrOrderId}).`);
    }

    // 2. Si déjà créditée, ne pas créditer deux fois (idempotence stricte)
    if (order.status === "SUCCESSFUL" && order.creditedAt) {
      const user = await tx.user.findUnique({
        where: { id: order.userId },
        select: { credits: true },
      });
      return {
        order,
        newBalance: user?.credits ?? 0,
        alreadyFulfilled: true,
      };
    }

    // 3. Mise à jour de la commande vers SUCCESSFUL
    const updatedOrder = await tx.paymentOrder.update({
      where: { id: order.id },
      data: {
        status: "SUCCESSFUL",
        creditedAt: new Date(),
        operator: extraDetails.operator || order.operator,
        operatorReference: extraDetails.operatorReference || order.operatorReference,
        metadata: {
          ...(typeof order.metadata === "object" && order.metadata !== null ? order.metadata : {}),
          ...extraDetails,
        },
      },
    });

    // 4. Incrémentation atomique des Notes de l'utilisateur
    const updatedUser = await tx.user.update({
      where: { id: order.userId },
      data: {
        credits: { increment: order.notes },
      },
      select: { credits: true },
    });

    // 5. Enregistrement de la transaction d'audit comptable
    await tx.creditTransaction.create({
      data: {
        userId: order.userId,
        amount: +order.notes,
        balanceAfter: updatedUser.credits,
        type: "PURCHASE",
        description: `Recharge Mobile Money CamPay (${updatedOrder.operator || "MoMo"}) : +${order.notes} Notes`,
        paymentMethod: "Mobile Money",
        amountMoney: order.amount,
        currency: order.currency.toLowerCase(),
        metadata: {
          orderId: order.id,
          campayReference: order.reference,
          externalReference: order.externalReference,
          phone: order.phone,
          operator: updatedOrder.operator,
          packId: order.packId,
        },
      },
    });

    console.log(`✅ [CamPay Fulfillment] Utilisateur ${order.userId} crédité de +${order.notes} Notes (Nouveau solde: ${updatedUser.credits}).`);

    return {
      order: updatedOrder,
      newBalance: updatedUser.credits,
      alreadyFulfilled: false,
    };
  });
}

