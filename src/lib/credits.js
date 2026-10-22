import { prisma } from "./prisma";

/**
 * Coût par défaut en notes/crédits pour une génération standard (1 musique = 2 notes).
 */
export const DEFAULT_TRACK_COST = 2;

/**
 * Récupère le solde actuel de crédits/notes d'un utilisateur.
 *
 * @param {string} userId
 * @returns {Promise<number>}
 */
export async function getUserCredits(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });

  return user?.credits ?? 0;
}

/**
 * Vérifie si l'utilisateur possède un nombre suffisant de crédits.
 *
 * @param {string} userId
 * @param {number} requiredCredits
 * @returns {Promise<boolean>}
 */
export async function hasEnoughCredits(userId, requiredCredits = DEFAULT_TRACK_COST) {
  const balance = await getUserCredits(userId);
  return balance >= requiredCredits;
}

/**
 * Déduit des crédits de manière ATOMIQUE via une transaction Prisma.
 * Empêche les conditions de concurrence (race conditions) et garantit la traçabilité.
 *
 * @param {string} userId Identifiant de l'utilisateur
 * @param {number} amount Nombre de crédits à déduire (positif, ex: 2)
 * @param {Object} context Informations contextuelles
 * @param {string} [context.trackId] Identifiant de la piste musicale générée
 * @param {string} [context.description] Libellé explicatif
 * @param {Object} [context.metadata] Données JSON supplémentaires
 * @returns {Promise<{ newBalance: number, transactionId: string }>}
 */
export async function deductCredits(
  userId,
  amount = DEFAULT_TRACK_COST,
  { trackId, description = "Génération de musique par IA", metadata = {} } = {}
) {
  if (amount <= 0) {
    throw new Error("Le montant à débiter doit être strictement supérieur à 0.");
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Récupération et verrou logique du solde utilisateur
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    if (!user) {
      throw new Error(`Utilisateur introuvable (${userId}).`);
    }

    if (user.credits < amount) {
      const error = new Error("Solde de crédits insuffisant pour cette opération.");
      error.code = "INSUFFICIENT_CREDITS";
      error.currentCredits = user.credits;
      error.requiredCredits = amount;
      throw error;
    }

    // 2. Décrémentation atomique
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        credits: {
          decrement: amount,
        },
      },
      select: { credits: true },
    });

    // 3. Enregistrement de l'historique d'audit
    const transaction = await tx.creditTransaction.create({
      data: {
        userId,
        amount: -amount,
        balanceAfter: updatedUser.credits,
        type: "GENERATION",
        description,
        trackId: trackId || null,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    });

    return {
      newBalance: updatedUser.credits,
      transactionId: transaction.id,
    };
  });
}

/**
 * Ajoute des crédits de manière ATOMIQUE (Achat Stripe, Refill abonnement, Parrainage, Bonus).
 *
 * @param {string} userId
 * @param {number} amount Nombre de crédits à ajouter (positif)
 * @param {Object} context
 * @param {"PURCHASE"|"SUBSCRIPTION_REFILL"|"BONUS"|"REFUND"} [context.type]
 * @param {string} [context.description]
 * @param {Object} [context.metadata]
 * @returns {Promise<{ newBalance: number, transactionId: string }>}
 */
export async function addCredits(
  userId,
  amount,
  {
    type = "PURCHASE",
    description = "Achat de pack de crédits",
    metadata = {},
  } = {}
) {
  if (amount <= 0) {
    throw new Error("Le montant à créditer doit être supérieur à zéro.");
  }

  return await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        credits: {
          increment: amount,
        },
      },
      select: { credits: true },
    });

    const transaction = await tx.creditTransaction.create({
      data: {
        userId,
        amount: +amount,
        balanceAfter: updatedUser.credits,
        type,
        description,
        metadata,
      },
    });

    return {
      newBalance: updatedUser.credits,
      transactionId: transaction.id,
    };
  });
}

/**
 * Rembourse des crédits automatiquement en cas d'échec de la génération asynchrone ou d'erreur IA.
 *
 * @param {string} userId
 * @param {number} amount
 * @param {Object} context
 */
export async function refundCredits(
  userId,
  amount = DEFAULT_TRACK_COST,
  { trackId, reason = "Échec du pipeline de génération audio" } = {}
) {
  return await addCredits(userId, amount, {
    type: "REFUND",
    description: `Remboursement : ${reason}`,
    metadata: { trackId, refundedAt: new Date().toISOString() },
  });
}

/**
 * Historique paginé des transactions de crédits d'un utilisateur.
 */
export async function getCreditTransactions(userId, limit = 20) {
  return await prisma.creditTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
