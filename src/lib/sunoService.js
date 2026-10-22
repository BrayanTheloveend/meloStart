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
 * Harmonise les paramètres disparates (prompt, genre, style, moods, vocalType, language, lyrics, etc.)
 * en une directive musicale puissante et cohérente pour obtenir un rendu audio de très haute fidélité.
 *
 * Élimine les contradictions, enrichit la description et sélectionne le mode Suno optimal :
 * - Mode Standard (Prompt riche) : quand aucune parole n'est fournie (le modèle compose lui-même les paroles, rimes et mélodies).
 * - Mode Custom (Style tags + Lyrics) : quand l'utilisateur fournit explicitement ses paroles.
 */
export function buildHarmonizedMusicDirectives(params = {}) {
  // Extraction sécurisée des variables d'entrée (tolère strings, booleans, objets, null)
  const rawPromptParam =
    typeof params.prompt === "string"
      ? params.prompt
      : typeof params.description === "string"
      ? params.description
      : typeof params.story === "string"
      ? params.story
      : "";

  const cleanPrompt = rawPromptParam.trim();

  // Les paroles ne doivent être extraites que s'il s'agit d'une VRAIE chaîne de texte (pas un booléen `lyrics: true`)
  const rawLyricsParam =
    typeof params.customLyrics === "string" && params.customLyrics.trim()
      ? params.customLyrics.trim()
      : typeof params.lyrics === "string" && params.lyrics.trim()
      ? params.lyrics.trim()
      : "";

  const rawGenreParam =
    typeof params.style === "string" && params.style.trim()
      ? params.style.trim()
      : typeof params.genre === "string" && params.genre.trim()
      ? params.genre.trim()
      : "Pop";

  const rawGenre = rawGenreParam;

  const moodsList = Array.isArray(params.moods)
    ? params.moods.map((m) => (typeof m === "string" ? m.trim() : m?.label || "")).filter(Boolean)
    : typeof params.moods === "string" && params.moods.trim()
    ? [params.moods.trim()]
    : ["Joyeux"];

  const moodsStr = moodsList.join(", ");

  const vocalType = typeof params.vocalType === "string" ? params.vocalType.trim() : "female";
  const language = typeof params.language === "string" && params.language.trim() ? params.language.trim() : "Français";

  const isInstrumental =
    typeof params.instrumental === "boolean"
      ? params.instrumental
      : vocalType === "instrumental" || params.vocals === false || params.lyrics === false;

  // Mode Custom Suno : activé uniquement si l'utilisateur a fourni de véritables paroles écrites
  const isCustomMode =
    typeof params.customMode === "boolean"
      ? params.customMode
      : Boolean(rawLyricsParam.length > 0);

  // Description vocale et tags
  let vocalDesc = "";
  let vocalTag = "";
  const gender =
    params.vocalGender || (vocalType === "female" ? "f" : vocalType === "male" ? "m" : null);

  if (isInstrumental) {
    vocalDesc = "morceau 100% instrumental sans chant ni paroles";
    vocalTag = "Instrumental";
  } else if (gender === "f" || vocalType === "female") {
    vocalDesc = `chanté par une voix féminine douce et mélodieuse en ${language}`;
    vocalTag = `Female Vocal, ${language}`;
  } else if (gender === "m" || vocalType === "male") {
    vocalDesc = `chanté par une voix masculine chaude et expressive en ${language}`;
    vocalTag = `Male Vocal, ${language}`;
  } else if (vocalType === "duo") {
    vocalDesc = `chanté en duo voix masculine et féminine harmonieuses en ${language}`;
    vocalTag = `Duet, Male & Female Vocal, ${language}`;
  } else {
    vocalDesc = `chanté en ${language}`;
    vocalTag = language;
  }

  // 1. Prompt musical harmonisé pour le mode Standard
  const promptElements = [];
  promptElements.push(`Morceau de ${rawGenre}`);
  if (moodsStr) promptElements.push(`ambiance ${moodsStr.toLowerCase()}`);
  if (vocalDesc) promptElements.push(vocalDesc);
  promptElements.push("production studio moderne, mixage dynamique, mélodie entraînante et refrain accrocheur");
  if (cleanPrompt) {
    promptElements.push(`Thème : ${cleanPrompt}`);
  }
  const harmonizedPrompt = promptElements.join(", ");

  // 2. Tags de style pour le mode Custom
  const styleTags = [rawGenre];
  if (moodsStr) styleTags.push(moodsStr);
  if (vocalTag) styleTags.push(vocalTag);
  styleTags.push("Studio Master, Crisp Production");
  const harmonizedStyle = styleTags.filter(Boolean).join(", ");

  // 3. Titre dérivé sécurisé
  let title = typeof params.title === "string" ? params.title.trim() : "";
  if (!title) {
    const words = cleanPrompt ? cleanPrompt.split(/\s+/).slice(0, 4).join(" ") : `${rawGenre} Vibe`;
    title = (words.charAt(0).toUpperCase() + words.slice(1)).slice(0, 80);
  }

  // 4. Negative tags protecteurs contre les artefacts audio
  const defaultNegative = isInstrumental
    ? "vocals, singing, speech, low quality, distorted, noisy, glitch, clipping"
    : "low quality, distorted, noisy, robotic, glitch, harsh frequencies, out of tune, mumble";
  const userNeg = typeof params.negativeTags === "string" && params.negativeTags.trim() ? params.negativeTags.trim() : "";
  const finalNegativeTags = userNeg ? `${userNeg}, ${defaultNegative}` : defaultNegative;

  return {
    customMode: isCustomMode,
    instrumental: isInstrumental,
    prompt: harmonizedPrompt,
    style: harmonizedStyle,
    lyrics: rawLyricsParam,
    title,
    model: typeof params.model === "string" && params.model ? params.model : "V6",
    negativeTags: finalNegativeTags,
    genre: rawGenre,
    moods: moodsList,
    vocalType,
    language,
    rawPrompt: cleanPrompt,
  };
}

/**
 * Lance la génération d'un morceau musical via Suno API (docs.sunoapi.org/suno-api/generate-music).
 * POST /api/v1/generate
 *
 * @param {Object} options Options de composition selon la documentation officielle Suno
 * @param {string} [customApiKey] Clé API optionnelle
 * @returns {Promise<{ taskId: string, model: string, customMode: boolean }>} Identifiant de la tâche Suno
 */
export async function generateSunoMusic(options = {}, customApiKey = null) {
  const apiKey = customApiKey || (await getSunoApiKey());
  if (!apiKey) {
    throw new Error("Clé Suno API manquante. Veuillez la configurer dans les variables d'environnement (.env) ou dans l'administration.");
  }

  const {
    customMode = false,
    instrumental = false,
    model = "V6",
    // Paramètres Mode Non-Custom (Screenshot)
    prompt = "",
    style = "",
    lyrics = "",
    imageUrls = [],
    videoUrls = [],
    audioUrls = [],
    // Paramètres Mode Custom
    title = "",
    negativeTags = "",
    vocalGender = null,
    duration = null,
    styleWeight = null,
    weirdnessConstraint = null,
    audioWeight = null,
    variety = null,
    callBackUrl = null,
  } = options;

  const isCustom = Boolean(customMode);
  const isInstrumental = Boolean(instrumental);
  const validModel = typeof model === "string" && model.trim() ? model.trim() : "V6";

  // Construction du payload selon les règles de la documentation officielle Suno
  const payload = {
    customMode: isCustom,
    instrumental: isInstrumental,
    model: validModel,
  };

  // Webhook callBackUrl (conforme aux spécifications Suno OpenAPI)
  const targetCallback =
    callBackUrl ||
    process.env.SUNO_WEBHOOK_URL ||
    (process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/api/webhooks/suno` : null);

  if (
    targetCallback &&
    typeof targetCallback === "string" &&
    targetCallback.startsWith("http")
  ) {
    // Si l'URL n'est pas un localhost inaccessible depuis l'extérieur, on l'envoie à Suno
    if (!targetCallback.includes("localhost") && !targetCallback.includes("127.0.0.1")) {
      payload.callBackUrl = targetCallback;
    } else if (callBackUrl) {
      // Si l'utilisateur a explicitement passé une callBackUrl personnalisée
      payload.callBackUrl = callBackUrl;
    }
  }

  if (isCustom) {
    // ========================================================
    // 1. MODE PERSONNALISÉ (customMode: true)
    // ========================================================
    const cleanLyrics = typeof lyrics === "string" ? lyrics.trim() : "";
    const cleanPrompt = typeof prompt === "string" ? prompt.trim() : "";

    // Paroles : lyrics est prioritaire, prompt est utilisé en fallback
    if (cleanLyrics) {
      payload.lyrics = cleanLyrics.slice(0, 5000);
      if (cleanPrompt) {
        payload.prompt = cleanPrompt.slice(0, 3000);
      }
    } else if (cleanPrompt) {
      payload.prompt = cleanPrompt.slice(0, 5000);
    }

    // Titre (max 80 chars - UNIQUEMENT en mode Custom)
    if (title && typeof title === "string" && title.trim()) {
      payload.title = title.trim().slice(0, 80);
    }

    // Style de musique (max 1000 chars)
    if (style && typeof style === "string" && style.trim()) {
      payload.style = style.trim().slice(0, 1000);
    }

    // Negative tags (max 1000 chars - UNIQUEMENT en mode Custom)
    if (negativeTags && typeof negativeTags === "string" && negativeTags.trim()) {
      payload.negativeTags = negativeTags.trim().slice(0, 1000);
    }

    // Préférence de genre de voix ('m' ou 'f' - UNIQUEMENT en mode Custom)
    if (vocalGender && ["m", "f"].includes(vocalGender)) {
      payload.vocalGender = vocalGender;
    }

    // Durée en secondes (10 à 360 - UNIQUEMENT en mode Custom)
    if (typeof duration === "number" && duration >= 10 && duration <= 360) {
      payload.duration = Math.round(duration);
    }

    // Poids et contraintes avancées
    if (typeof styleWeight === "number" && styleWeight >= 0 && styleWeight <= 1) {
      payload.styleWeight = Number(styleWeight.toFixed(2));
    }
    if (typeof weirdnessConstraint === "number" && weirdnessConstraint >= 0 && weirdnessConstraint <= 1) {
      payload.weirdnessConstraint = Number(weirdnessConstraint.toFixed(2));
    }
    if (typeof audioWeight === "number" && audioWeight >= 0 && audioWeight <= 1) {
      payload.audioWeight = Number(audioWeight.toFixed(2));
    }
    if (typeof variety === "number" && variety >= 0 && variety <= 4) {
      payload.variety = Math.round(variety);
    }

    // Règle doc Suno : en Custom Mode, au moins l'un de style, lyrics, prompt ou negativeTags doit être fourni
    if (!payload.style && !payload.lyrics && !payload.prompt && !payload.negativeTags) {
      payload.style = "Pop, Modern Studio Melodic";
    }

    // Règle stricte doc Suno : NE JAMAIS ENVOYER imageUrls, videoUrls, audioUrls en customMode: true !
  } else {
    // ========================================================
    // 2. MODE NON-PERSONNALISÉ / SIMPLE (customMode: false)
    // ========================================================
    // Prompt = description de la chanson, idée centrale (max 3000 chars)
    if (prompt && typeof prompt === "string" && prompt.trim()) {
      payload.prompt = prompt.trim().slice(0, 3000);
    }

    // Style de musique (max 1000 chars)
    if (style && typeof style === "string" && style.trim()) {
      payload.style = style.trim().slice(0, 1000);
    }

    // Paroles d'accompagnement (max 5000 chars)
    if (lyrics && typeof lyrics === "string" && lyrics.trim()) {
      payload.lyrics = lyrics.trim().slice(0, 5000);
    }

    // Références médias (UNIQUEMENT en mode Non-Custom)
    const isValidPublicMediaUrl = (u) =>
      typeof u === "string" &&
      (u.startsWith("http://") || u.startsWith("https://")) &&
      !u.includes("localhost") &&
      !u.includes("127.0.0.1");

    if (Array.isArray(imageUrls) && imageUrls.length > 0) {
      const valid = imageUrls.filter(isValidPublicMediaUrl).slice(0, 5);
      if (valid.length > 0) payload.imageUrls = valid;
    }
    if (Array.isArray(videoUrls) && videoUrls.length > 0) {
      const valid = videoUrls.filter(isValidPublicMediaUrl).slice(0, 1);
      if (valid.length > 0) payload.videoUrls = valid;
    }
    if (Array.isArray(audioUrls) && audioUrls.length > 0) {
      const valid = audioUrls.filter(isValidPublicMediaUrl).slice(0, 10);
      if (valid.length > 0) payload.audioUrls = valid;
    }

    // Règle doc Suno : en mode non-custom, au moins un élément doit être présent
    if (!payload.prompt && !payload.style && !payload.lyrics && !payload.imageUrls?.length && !payload.videoUrls?.length && !payload.audioUrls?.length) {
      payload.prompt = "A high-quality melodic track with modern production";
    }

    // Règle stricte doc Suno : NE JAMAIS ENVOYER title, negativeTags, vocalGender, duration, styleWeight en customMode: false !
  }

  // Tentative avec endpoint principal puis endpoint backup
  const endpointsToTry = [
    `${SUNO_API_BASE_URL}/generate`,
    `${SUNO_BACKUP_BASE_URL}/generate`,
  ];

  let lastError = null;

  for (const endpoint of endpointsToTry) {
    try {
      console.log(`[Suno API] Envoi requête de génération vers ${endpoint}...`);
      console.log(`[Suno API] Payload:`, JSON.stringify(payload));

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(18000),
      });

      const resJson = await response.json().catch(() => null);

      if (response.ok && resJson?.code === 200 && resJson?.data?.taskId) {
        console.log(`[Suno API] ✅ Tâche créée avec succès ! TaskId: ${resJson.data.taskId}`);
        return {
          success: true,
          taskId: resJson.data.taskId,
          model: payload.model,
          customMode: payload.customMode,
        };
      }

      const errorMsg = resJson?.msg || `Erreur Suno API HTTP ${response.status}`;
      console.warn(`[Suno API] Échec sur ${endpoint} (code ${resJson?.code || response.status}): ${errorMsg}`);
      lastError = new Error(errorMsg);
      lastError.statusCode = resJson?.code || response.status;
      lastError.sunoCode = resJson?.code;
    } catch (err) {
      console.warn(`[Suno API] Exception réseau sur ${endpoint}:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("Impossible de joindre le service de génération Suno AI.");
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

  const cleanTaskId = taskId.replace(/^suno_/, "").trim();

  const urlsToTry = [
    `${SUNO_API_BASE_URL}/generate/record-info?taskId=${encodeURIComponent(cleanTaskId)}`,
    `${SUNO_BACKUP_BASE_URL}/generate/record-info?taskId=${encodeURIComponent(cleanTaskId)}`,
  ];

  let lastError = null;

  for (const url of urlsToTry) {
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        signal: AbortSignal.timeout(8000),
      });

      const json = await res.json().catch(() => null);
      if (res.ok && json?.code === 200 && json?.data) {
        return json.data;
      }
      lastError = new Error(json?.msg || `Erreur statut tâche Suno HTTP ${res.status}`);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("Impossible d'obtenir le statut de la tâche Suno.");
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
  buildHarmonizedMusicDirectives,
  getSunoTaskStatus,
};

