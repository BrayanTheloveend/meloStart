import { prisma } from "@/lib/prisma";

/**
 * Service officiel d'intégration et de métriques Suno AI API (sunoapi.org).
 * Conforme aux spécifications OpenAPI de https://docs.sunoapi.org
 *
 * Base URL : https://api.sunoapi.org/api/v1
 * Documentation : https://docs.sunoapi.org/suno-api/generate-music
 */

export const SUNO_API_BASE_URL =
  process.env.SUNO_API_URL || "https://api.sunoapi.org/api/v1";

export const SUNO_BACKUP_BASE_URL = "https://apibox.erweima.ai/api/v1";

// Règle économique officielle Suno : 10 crédits par chanson générée (2 clips multipistes)
export const SUNO_CREDITS_PER_TRACK = 10;

// Modèles Suno officiels (V6 est la référence recommandée)
export const SUNO_SUPPORTED_MODELS = [
  { id: "V6", label: "V6 (Recommandé)", description: "Expression musicale avancée, voix naturelles HD" },
  { id: "V6_WILD", label: "V6 Wild", description: "Créativité décuplée, audace stylistique" },
  { id: "V6_MINI", label: "V6 Mini", description: "Ultra-rapide et équilibré" },
  { id: "V5_5", label: "V5.5", description: "Modèles personnalisés de synthèse" },
  { id: "V4_5ALL", label: "V4.5 All", description: "Structure longue jusqu'à 8 minutes" },
  { id: "V4", label: "V4", description: "Modèle historique de composition" },
];

/**
 * Récupère la clé API Suno configurée.
 * Priorité : Base de données (SystemSetting) > Variable d'environnement SUNO_API_KEY / AI_MUSIC_API_KEY.
 */
export async function getSunoApiKey() {
  try {
    const dbSetting = await prisma.systemSetting.findUnique({
      where: { key: "suno_api_key" },
    });
    if (dbSetting?.value) return dbSetting.value.trim();
  } catch (_) {}

  return (
    process.env.SUNO_API_KEY ||
    process.env.AI_MUSIC_API_KEY 
  );
}

/**
 * Masque une clé API pour l'affichage sécurisé (ex: 7bc8••••••••de911).
 */
export function maskApiKey(key) {
  if (!key) return "Non configurée";
  const clean = key.trim();
  if (clean.length <= 8) return "••••••••";
  return `${clean.slice(0, 4)}••••••••${clean.slice(-5)}`;
}

/**
 * Interroge l'endpoint officiel Suno API pour obtenir le solde réel de crédits.
 * GET https://api.sunoapi.org/api/v1/generate/credit
 */
export async function getSunoCredits(customKey = null) {
  const apiKey = customKey || (await getSunoApiKey());
  if (!apiKey) {
    return {
      success: false,
      credits: 0,
      latencyMs: 0,
      statusCode: 401,
      error: "Aucune clé API Suno configurée.",
    };
  }

  const startTime = Date.now();
  const urlsToTry = [
    `${SUNO_API_BASE_URL}/generate/credit`,
    `${SUNO_BACKUP_BASE_URL}/generate/credit`,
  ];

  let lastError = null;

  for (const url of urlsToTry) {
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(6000),
      });

      const latencyMs = Date.now() - startTime;
      const data = await res.json().catch(() => null);

      if (res.ok && data?.code === 200) {
        return {
          success: true,
          credits: typeof data.data === "number" ? data.data : 0,
          latencyMs,
          statusCode: 200,
          message: data.msg || "success",
          providerUrl: url,
        };
      }

      // Cas d'authentification invalide ou erreur retournée par l'API
      return {
        success: false,
        credits: 0,
        latencyMs,
        statusCode: data?.code || res.status,
        error: data?.msg || `Erreur Suno API HTTP ${res.status}`,
        providerUrl: url,
      };
    } catch (err) {
      lastError = err;
    }
  }

  return {
    success: false,
    credits: 0,
    latencyMs: Date.now() - startTime,
    statusCode: 503,
    error: lastError?.message || "Impossible de joindre les serveurs Suno API.",
  };
}

/**
 * Récupère les métriques globales et l'état de Suno API en temps réel pour le dashboard.
 */
export async function getSunoMetrics() {
  const apiKey = await getSunoApiKey();
  const maskedKey = maskApiKey(apiKey);

  // 1. Récupération du solde réel en direct depuis sunoapi.org
  const creditResult = await getSunoCredits(apiKey);

  // 2. Statistiques de la plateforme locale (Prisma)
  const [
    totalTracks,
    completedTracks,
    processingTracks,
    failedTracks,
    queuedTracks,
  ] = await Promise.all([
    prisma.track.count(),
    prisma.track.count({ where: { status: "COMPLETED" } }),
    prisma.track.count({ where: { status: "PROCESSING" } }),
    prisma.track.count({ where: { status: "FAILED" } }),
    prisma.track.count({ where: { status: { in: ["PENDING", "QUEUED"] } } }),
  ]);

  const finishedTotal = completedTracks + failedTracks;
  const successRate =
    finishedTotal > 0
      ? ((completedTracks / finishedTotal) * 100).toFixed(1)
      : "100.0";

  // 3. Détermination de l'état du service
  let status = "ONLINE";
  let statusLabel = "Opérationnel";

  if (!creditResult.success) {
    if (creditResult.statusCode === 401) {
      status = "UNAUTHORIZED";
      statusLabel = "Clé API Invalide";
    } else if (creditResult.statusCode === 429) {
      status = "RATE_LIMITED";
      statusLabel = "Quota Dépassé";
    } else {
      status = "DEGRADED";
      statusLabel = "Réseau Dégradé";
    }
  } else if (creditResult.credits === 0) {
    status = "EXHAUSTED";
    statusLabel = "Solde à 0 (Recharge requise)";
  }

  const creditsRemaining = creditResult.credits;
  const songsRemaining = Math.floor(creditsRemaining / SUNO_CREDITS_PER_TRACK);

  // Date de renouvellement estimée (début du mois suivant)
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const daysUntilRenewal = Math.ceil((nextMonth - now) / (1000 * 60 * 60 * 24));

  return {
    suno: {
      status,
      statusLabel,
      isConfigured: Boolean(apiKey),
      apiKeyMasked: maskedKey,
      creditsRemaining,
      // creditsTotal: Math.max(1000, creditsRemaining > 0 ? creditsRemaining * 2 : 1000),
      creditsPercent: creditsRemaining > 0 ? Math.min(100, Math.round((creditsRemaining / (creditsRemaining + 100)) * 100)) : 0,
      costPerSongCredits: SUNO_CREDITS_PER_TRACK,
      songsRemaining,
      latencyMs: `${creditResult.latencyMs}ms`,
      activeModel: "Suno V6 Master HD",
      supportedModels: SUNO_SUPPORTED_MODELS.map((m) => m.id),
      modelsDetail: SUNO_SUPPORTED_MODELS,
      apiEndpoint: "https://api.sunoapi.org/api/v1",
      portalUrl: "https://sunoapi.org",
      renewalDate: nextMonth.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      daysUntilRenewal,
      averageGenerationTime: "25-30s",
      concurrency: {
        active: processingTracks,
        max: 5,
        percent: Math.min(100, Math.round((processingTracks / 5) * 100)),
      },
    },
    platformMetrics: {
      totalTracks,
      completedTracks,
      processingTracks,
      queuedTracks,
      inQueueTotal: processingTracks + queuedTracks,
      failedTracks,
      successRate: `${successRate}%`,
      estimatedSunoCreditsConsumedTotal: (completedTracks + processingTracks + failedTracks) * SUNO_CREDITS_PER_TRACK,
    },
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Lance la génération d'un morceau musical via Suno API (docs.sunoapi.org/suno-api/generate-music).
 * POST /api/v1/generate
 *
 * @param {Object} options Options de composition Suno
 * @param {string} [customApiKey] Clé API optionnelle
 * @returns {Promise<{ taskId: string }>} Identifiant de la tâche Suno
 */
export async function generateSunoMusic(options = {}, customApiKey = null) {
  const apiKey = customApiKey || (await getSunoApiKey());
  if (!apiKey) {
    throw new Error("Clé Suno API manquante. Veuillez la configurer dans l'administration.");
  }

  const {
    prompt = "",
    lyrics = "",
    style = "",
    title = "",
    customMode = true,
    instrumental = false,
    model = "V6",
    callBackUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/suno`,
    negativeTags = "",
    vocalGender = null,
    duration = 60,
    variety = 1,
    styleWeight = 0.65,
    weirdnessConstraint = 0.65,
    audioWeight = 0.65,
    imageUrls = [],
    videoUrls = [],
    audioUrls = [],
  } = options;

  // Construction du payload selon la spécification OpenAPI officielle de Suno
  const payload = {
    customMode: Boolean(customMode),
    instrumental: Boolean(instrumental),
    model: model || "V6",
    callBackUrl,
  };

  if (customMode) {
    // Mode Personnalisé (Custom Mode)
    if (title) payload.title = title.slice(0, 80);
    if (style) payload.style = style.slice(0, 1000);
    if (lyrics) payload.lyrics = lyrics.slice(0, 5000);
    if (prompt && !lyrics) payload.prompt = prompt.slice(0, 5000);
    if (negativeTags) payload.negativeTags = negativeTags.slice(0, 1000);
    if (vocalGender && ["m", "f"].includes(vocalGender)) payload.vocalGender = vocalGender;
    if (duration) payload.duration = Math.min(360, Math.max(10, Number(duration) || 60));
    if (typeof variety === "number") payload.variety = Math.min(4, Math.max(0, variety));
    if (typeof styleWeight === "number") payload.styleWeight = styleWeight;
    if (typeof weirdnessConstraint === "number") payload.weirdnessConstraint = weirdnessConstraint;
    if (!instrumental && typeof audioWeight === "number") payload.audioWeight = audioWeight;

    // Règle de validation Suno : au moins un des trois champs requis
    if (!payload.style && !payload.lyrics && !payload.negativeTags && !payload.prompt) {
      payload.style = "Pop Modern";
    }
  } else {
    // Mode Standard (Non-custom)
    if (prompt) payload.prompt = prompt.slice(0, 3000);
    if (lyrics) payload.lyrics = lyrics;
    if (style) payload.style = style;
    if (Array.isArray(imageUrls) && imageUrls.length) payload.imageUrls = imageUrls.slice(0, 5);
    if (Array.isArray(videoUrls) && videoUrls.length) payload.videoUrls = videoUrls.slice(0, 1);
    if (Array.isArray(audioUrls) && audioUrls.length) payload.audioUrls = audioUrls;

    if (!payload.prompt && !payload.style && !payload.lyrics) {
      payload.prompt = "A high-quality melodic track";
    }
  }

  const endpoint = `${SUNO_API_BASE_URL}/generate`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });

  const resJson = await response.json().catch(() => null);

  if (!response.ok || resJson?.code !== 200) {
    const errorMsg = resJson?.msg || `Erreur Suno API HTTP ${response.status}`;
    const error = new Error(errorMsg);
    error.statusCode = resJson?.code || response.status;
    error.sunoCode = resJson?.code;
    throw error;
  }

  const taskId = resJson?.data?.taskId;
  if (!taskId) {
    throw new Error("L'API Suno n'a retourné aucun taskId valide.");
  }

  return {
    success: true,
    taskId,
    model: payload.model,
    customMode: payload.customMode,
  };
}

/**
 * Récupère le statut et les liens audio d'une tâche de génération Suno.
 * GET /api/v1/generate/record-info?taskId=...
 *
 * @param {string} taskId Identifiant de la tâche Suno
 * @param {string} [customApiKey] Clé API optionnelle
 */
export async function getSunoTaskStatus(taskId, customApiKey = null) {
  const apiKey = customApiKey || (await getSunoApiKey());
  if (!apiKey) throw new Error("Clé Suno API manquante.");

  const url = `${SUNO_API_BASE_URL}/generate/record-info?taskId=${encodeURIComponent(taskId)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(8000),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || json?.code !== 200) {
    throw new Error(json?.msg || `Erreur statut tâche Suno HTTP ${res.status}`);
  }

  return json.data;
}

export default {
  SUNO_API_BASE_URL,
  SUNO_CREDITS_PER_TRACK,
  SUNO_SUPPORTED_MODELS,
  getSunoApiKey,
  maskApiKey,
  getSunoCredits,
  getSunoMetrics,
  generateSunoMusic,
  getSunoTaskStatus,
};

