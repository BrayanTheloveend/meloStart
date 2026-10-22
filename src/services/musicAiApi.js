/**
 * Service API pour la génération de musique par IA (Suno API).
 * Connecté directement à l'API route Next.js /api/tracks/generate.
 *
 * Règle économique officielle : 1 chanson = 2 Notes
 * Aucune simulation fictive : retourne uniquement le vrai résultat audio de Suno API.
 */

import { api, ApiError } from "@/lib/apiClient";

export const NOTES_PER_SONG = 2;

/**
 * Modèles officiels supportés par Suno API
 */
export const SUNO_MODELS = [
  { id: "V6", label: "V6", badge: "Recommandé", desc: "Expression musicale avancée, voix naturelles HD" },
  { id: "V6_WILD", label: "V6_WILD", desc: "Créativité décuplée, audace stylistique" },
  { id: "V6_MINI", label: "V6_MINI", desc: "Ultra-rapide et équilibré" },
  { id: "V5_5", label: "V5_5", desc: "Modèle personnalisé haute fidélité" },
  { id: "V4_5ALL", label: "V4_5ALL", desc: "Structure longue et complexe" },
  { id: "V4", label: "V4", desc: "Modèle historique Suno" },
];

/**
 * Étapes visuelles de génération
 */
export const GENERATION_STAGES = [
  { progress: 15, label: "Initialisation et transmission des paramètres à Suno AI..." },
  { progress: 35, label: "Écriture et structure mélodique..." },
  { progress: 55, label: "Arrangement instrumental et orchestration..." },
  { progress: 75, label: "Synthèse vocale et harmonisation des voix..." },
  { progress: 90, label: "Mastering dynamique et mixage audio HD..." },
  { progress: 100, label: "Morceau finalisé avec succès !" },
];

/**
 * Lance la génération d'un morceau via l'API backend melostars et suit son avancement en direct.
 *
 * @param {Object} params Paramètres de composition conformes à Suno API
 * @param {Function} [onProgress] Callback de progression (progress: number, label: string)
 * @returns {Promise<Object>} Morceau finalisé avec son URL audio réelle
 */
export async function generateMusicWithAI(params, onProgress) {
  const {
    customMode = false,
    instrumental = false,
    model = "V6",
    // Mode Standard (Non-Custom)
    prompt = "",
    style = "",
    lyrics = "",
    imageUrls = [],
    videoUrls = [],
    audioUrls = [],
    // Mode Custom
    title = "",
    negativeTags = "",
    vocalGender = null,
    duration = 180,
  } = params;

  if (onProgress) {
    onProgress(10, "Envoi de la requête de composition à Suno AI...");
  }

  // 1. Appel POST vers notre API de génération
  const createRes = await api.post("/api/tracks/generate", {
    customMode,
    instrumental,
    model,
    prompt,
    style,
    lyrics,
    imageUrls,
    videoUrls,
    audioUrls,
    title,
    negativeTags,
    vocalGender,
    duration,
  });

  const trackId = createRes?.track?.id;
  if (!trackId) {
    throw new Error(createRes?.error || "Échec de création du morceau.");
  }

  if (onProgress) {
    onProgress(20, "Tâche enregistrée par Suno. Génération des multipistes en cours...");
  }

  // 2. Polling asynchrone régulier toutes les 2.5 secondes
  const maxAttempts = 60; // 60 * 2.5s = 150s (temps largement suffisant pour Suno V6)
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;
    await new Promise((r) => setTimeout(r, 2500));

    const statusRes = await api.get(`/api/tracks/${trackId}`).catch(() => null);
    const polledTrack = statusRes?.track;

    if (polledTrack) {
      if (polledTrack.status === "COMPLETED") {
        if (onProgress) onProgress(100, "Morceau finalisé avec succès !");

        const dur = Number(polledTrack.duration) || 180;
        const min = Math.floor(dur / 60);
        const sec = String(Math.floor(dur % 60)).padStart(2, "0");

        return {
          id: polledTrack.id,
          title: polledTrack.title,
          genre: polledTrack.genre || style || "Pop",
          duration: dur,
          length: `${min}:${sec}`,
          seconds: dur,
          vocalType: polledTrack.vocalType,
          audioUrl: polledTrack.audioUrl,
          coverUrl: polledTrack.coverUrl,
          lyricsText: polledTrack.lyrics || lyrics,
          createdAt: polledTrack.createdAt,
          isFavorite: polledTrack.isFavorite,
          model,
        };
      }

      if (polledTrack.status === "FAILED") {
        throw new Error(polledTrack.errorMessage || "La génération audio a échoué chez Suno AI. Vos crédits ont été remboursés.");
      }

      // Calcul de la progression visuelle
      const baseProgress = polledTrack.progress || 20;
      const calculatedProgress = Math.min(95, Math.max(baseProgress, Math.round(attempts * 1.5) + 20));
      const stage = [...GENERATION_STAGES].reverse().find((s) => calculatedProgress >= s.progress);

      if (onProgress) {
        onProgress(calculatedProgress, stage?.label || "Génération audio en cours chez Suno AI...");
      }
    }
  }

  throw new Error("Délai d'attente de génération dépassé. Le morceau continue d'être traité en arrière-plan.");
}
