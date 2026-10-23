/**
 * Service API pour la génération de musique par IA (Suno API).
 * Connecté directement à l'API route Next.js /api/tracks/generate.
 *
 * Règle économique officielle : 1 chanson = 2 Notes
 * Pas de Redis, pas de BullMQ : utilise l'API Suno, callBackUrl / webhooks et polling temps réel.
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
  { progress: 15, label: "Transmission des consignes créatives à l'IA..." },
  { progress: 35, label: "Écriture et structure mélodique..." },
  { progress: 55, label: "Arrangement instrumental et orchestration..." },
  { progress: 75, label: "Synthèse vocale et harmonisation des voix..." },
  { progress: 90, label: "Mastering dynamique et mixage audio HD..." },
  { progress: 100, label: "Morceau finalisé avec succès !" },
];

/**
 * Lance la génération d'un morceau via l'API backend melostars et suit son avancement en direct.
 * Compatible avec le formulaire par étapes (Wizard) et le mode Suno direct.
 *
 * @param {Object} params Paramètres de composition
 * @param {Function} [onProgress] Callback de progression (progress: number, label: string)
 * @returns {Promise<Object>} Morceau finalisé avec son URL audio réelle
 */
export async function generateMusicWithAI(params = {}, onProgress) {
  // Extraction compatible avec le wizard (genre, description, vocalType, occasion)
  const description = params.description || params.story || params.prompt || "";
  const genre = params.genre || params.style || "Afrobeat";
  const vocalType = params.vocalType || "female";
  const occasion = params.occasion || "birthday";

  const isInstrumental =
    typeof params.instrumental === "boolean"
      ? params.instrumental
      : vocalType === "instrumental";

  const vocalGender =
    params.vocalGender ||
    (vocalType === "male" ? "m" : vocalType === "female" ? "f" : null);

  const customMode = Boolean(params.customMode || params.customLyrics || (params.lyrics && params.lyrics.length > 0));
  const model = params.model || "V6";
  const lyrics = params.lyrics || params.customLyrics || "";
  const title = params.title || "";
  const negativeTags = params.negativeTags || "";
  const duration = params.duration || 180;

  if (onProgress) {
    onProgress(15, "Transmission des consignes créatives à l'IA...");
  }

  // 1. Appel POST vers notre API de génération
  const createRes = await api.post("/api/tracks/generate", {
    description,
    story: description,
    prompt: params.prompt || description,
    genre,
    style: params.style || genre,
    vocalType,
    occasion,
    vocalGender,
    instrumental: isInstrumental,
    customMode,
    model,
    lyrics,
    customLyrics: lyrics,
    title,
    negativeTags,
    duration,
    imageUrls: params.imageUrls || [],
    videoUrls: params.videoUrls || [],
    audioUrls: params.audioUrls || [],
    isPublic: params.isPublic,
  });

  const trackId = createRes?.track?.id;
  if (!trackId) {
    throw new Error(createRes?.error || "Échec de création du morceau.");
  }

  if (onProgress) {
    onProgress(25, "Composition de la mélodie et des arrangements en cours...");
  }

  // 2. Polling asynchrone régulier toutes les 2.5 secondes
  const maxAttempts = 70; // 70 * 2.5s = 175s
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;
    await new Promise((r) => setTimeout(r, 2500));

    const statusRes = await api.get(`/api/tracks/${trackId}`).catch(() => null);
    const polledTrack = statusRes?.track;

    if (polledTrack) {
      if (polledTrack.status === "COMPLETED") {
        if (onProgress) onProgress(100, "Morceau finalisé avec succès !");

        const dur = Number(polledTrack.duration) || duration || 180;
        const min = Math.floor(dur / 60);
        const sec = String(Math.floor(dur % 60)).padStart(2, "0");

        return {
          id: polledTrack.id,
          title: polledTrack.title,
          genre: polledTrack.genre || genre,
          duration: dur,
          length: `${min}:${sec}`,
          seconds: dur,
          vocalType: polledTrack.vocalType || vocalType,
          audioUrl: polledTrack.audioUrl,
          coverUrl: polledTrack.coverUrl || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop",
          lyrics: polledTrack.lyrics || lyrics,
          lyricsText: polledTrack.lyrics || lyrics,
          createdAt: polledTrack.createdAt,
          isFavorite: polledTrack.isFavorite,
          model: polledTrack.model || model,
        };
      }

      if (polledTrack.status === "FAILED") {
        throw new Error(polledTrack.errorMessage || "La composition audio a échoué chez Suno AI. Vos crédits ont été remboursés.");
      }

      // Calcul de la progression visuelle
      const baseProgress = polledTrack.progress || 25;
      const calculatedProgress = Math.min(95, Math.max(baseProgress, Math.round(attempts * 1.5) + 25));
      const stage = [...GENERATION_STAGES].reverse().find((s) => calculatedProgress >= s.progress);

      if (onProgress) {
        onProgress(calculatedProgress, stage?.label || "Rendu audio studio en cours...");
      }
    }
  }

  throw new Error("Délai d'attente dépassé. La piste musicale continue son rendu sur les serveurs.");
}
