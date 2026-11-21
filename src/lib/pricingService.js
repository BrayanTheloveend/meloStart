import { prisma } from "@/lib/prisma";

export const DEFAULT_PRICING_PLANS = [
  {
    id: "pack_decouverte",
    name: "Pack Découverte",
    description: "Pour essayer pretymelo sans engagement et créer vos premières musiques.",
    price: 2000,
    currency: "XAF",
    notes: 4,
    note: 4,
    songs: 2,
    popular: false,
    badge: null,
    cta: "Pour Démarrer",
    features: [
      "4 Notes de création (2 titres complets)",
      "Génération de styles et d'ambiances",
      "Durée jusqu'à 1 minute par titre",
      "Export au format MP3",
      "Usage personnel",
    ],
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "pack_createur",
    name: "Pack Créateur",
    description: "Pour les créateurs de contenu réguliers et artistes passionnés.",
    price: 2900,
    currency: "XAF",
    notes: 10,
    note: 10,
    songs: 5,
    popular: true,
    badge: "Le plus populaire",
    cta: "Choisir Créateur",
    features: [
      "10 Notes de création (5 titres complets)",
      "Création & déclinaisons illimitées à la demande",
      "Durée jusqu'à 3 minutes par titre",
      "Génération de paroles et voix personnalisées",
      "Export Haute Qualité (MP3 & WAV)",
      "Licence commerciale incluse",
    ],
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "pack_studio",
    name: "Pack Studio Pro",
    description: "Pour les équipes, agences, labels, créateurs pros et marques.",
    price: 5000,
    currency: "XAF",
    notes: 24,
    note: 24,
    songs: 12,
    popular: false,
    badge: "Pro",
    cta: "Choisir Studio",
    features: [
      "24 Notes de création (12 titres complets)",
      "Création prioritaire ultra-rapide sur GPU",
      "Clonage et personnalisation de voix",
      "Exportation des stems multipistes séparées",
      "Accès collaboratif jusqu'à 5 membres",
      "Support prioritaire 7j/7",
      "Licence commerciale mondiale incluse",
    ],
    isActive: true,
    sortOrder: 3,
  },
];

const PRICING_SETTING_KEY = "pricing_plans";

/**
 * Récupère les plans tarifaires depuis la base de données.
 * Si aucun plan n'existe encore, initialise automatiquement avec les plans par défaut.
 */
export async function getPricingPlansFromDb() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: PRICING_SETTING_KEY },
    });

    if (setting?.value) {
      const parsed = JSON.parse(setting.value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Normaliser note & notes
        return parsed.map((p) => ({
          ...p,
          note: p.note ?? p.notes ?? 4,
          notes: p.notes ?? p.note ?? 4,
          price: Number(p.price) || 0,
          isActive: p.isActive !== false,
        }));
      }
    }

    // Initialisation automatique avec les plans par défaut
    await savePricingPlansToDb(DEFAULT_PRICING_PLANS);
    return DEFAULT_PRICING_PLANS;
  } catch (error) {
    console.warn("[Pricing Service] Impossible de charger les tarifs depuis PostgreSQL, utilisation des valeurs par défaut :", error.message);
    return DEFAULT_PRICING_PLANS;
  }
}

/**
 * Recherche et retourne un pack configuré dans la base de données (settings admin).
 * @param {string} packId - ID ou nom du pack
 * @returns {Promise<{ id: string, name: string, notes: number, price: number, amount: number, currency: string } | null>}
 */
export async function getPricingPlanById(packId) {
  const plans = await getPricingPlansFromDb();
  if (!plans || plans.length === 0) return null;

  const cleanId = String(packId || "").trim().toLowerCase();

  // 1. Recherche par ID exact
  let match = plans.find((p) => String(p.id).toLowerCase() === cleanId);

  // 2. Recherche par nom exact ou partiel
  if (!match) {
    match = plans.find((p) => String(p.name).toLowerCase() === cleanId);
  }
  if (!match) {
    match = plans.find((p) =>
      cleanId.includes(String(p.id).toLowerCase()) ||
      cleanId.includes(String(p.name).toLowerCase()) ||
      String(p.name).toLowerCase().includes(cleanId)
    );
  }

  // 3. Fallback sur le pack actif par défaut (ex: populaire ou premier actif)
  if (!match) {
    match = plans.find((p) => p.isActive && p.popular) || plans.find((p) => p.isActive) || plans[0];
  }

  if (!match) return null;

  const notes = Number(match.notes ?? match.note ?? 4);
  const price = Number(match.price) || 0;

  return {
    ...match,
    id: match.id,
    name: match.name,
    notes,
    note: notes,
    price,
    amount: price,
    currency: match.currency || "XAF",
  };
}

/**
 * Sauvegarde la liste complète des plans tarifaires dans PostgreSQL.
 */
export async function savePricingPlansToDb(plans) {
  const normalized = plans.map((p, idx) => ({
    ...p,
    id: p.id || `pack_${Date.now()}_${idx}`,
    note: Number(p.notes ?? p.note ?? 4),
    notes: Number(p.notes ?? p.note ?? 4),
    price: Number(p.price) || 0,
    currency: p.currency || "XAF",
    features: Array.isArray(p.features) ? p.features : [],
    popular: Boolean(p.popular),
    isActive: p.isActive !== false,
    sortOrder: p.sortOrder !== undefined ? Number(p.sortOrder) : idx + 1,
  }));

  await prisma.systemSetting.upsert({
    where: { key: PRICING_SETTING_KEY },
    update: {
      value: JSON.stringify(normalized),
      description: "Plans de tarification et packs de notes pretymelo (CRUD Admin)",
    },
    create: {
      key: PRICING_SETTING_KEY,
      value: JSON.stringify(normalized),
      description: "Plans de tarification et packs de notes pretymelo (CRUD Admin)",
    },
  });

  return normalized;
}
