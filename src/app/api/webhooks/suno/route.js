import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { refundCredits } from "@/lib/credits";

/**
 * Endpoint Webhook pour recevoir les callbacks asynchrones de Suno API (sunoapi.org).
 * Spécification officielle : https://docs.sunoapi.org/suno-api/generate-music-callbacks
 *
 * Événements supportés :
 * - "text"     : génération des paroles/titres terminée
 * - "first"    : première piste audio prête
 * - "complete" : ensemble des variations finalisées
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));

    console.log("[Suno Webhook] Réception callback:", JSON.stringify(body, null, 2));

    const { code, msg, data } = body;
    const taskId = data?.task_id || data?.taskId || body?.task_id;
    const callbackType = data?.callbackType || "complete";
    const audioItems = data?.data || [];

    if (!taskId) {
      console.warn("[Suno Webhook] Aucune référence task_id dans le payload.");
      return NextResponse.json({ code: 400, msg: "Missing task_id" }, { status: 400 });
    }

    // Recherche de la piste associée dans la base de données
    const track = await prisma.track.findFirst({
      where: {
        OR: [
          { jobId: taskId },
          { jobId: `suno_${taskId}` },
          { id: taskId },
        ],
      },
    });

    if (!track) {
      console.warn(`[Suno Webhook] Aucun morceau trouvé pour le taskId: ${taskId}`);
      // On acquitte néanmoins le webhook pour éviter les relances infinies
      return NextResponse.json({ code: 200, msg: "Task acknowledged (no track matching)" });
    }

    // Gestion selon le statut ou le callbackType
    if (code !== 200 && code !== undefined) {
      // Échec de génération rapporté par Suno
      await prisma.track.update({
        where: { id: track.id },
        data: {
          status: "FAILED",
          progress: 0,
          errorMessage: msg || "Échec de génération rapporté par Suno API.",
        },
      });

      // Remboursement automatique des 2 Notes
      await refundCredits(track.userId, 2, {
        trackId: track.id,
        reason: msg || "Échec rapporté par le Webhook Suno",
      }).catch(() => {});

      return NextResponse.json({ code: 200, msg: "Track marked as failed and credits refunded" });
    }

    if (callbackType === "first" && audioItems.length > 0) {
      // Première piste disponible
      const first = audioItems[0];
      await prisma.track.update({
        where: { id: track.id },
        data: {
          status: "PROCESSING",
          progress: 85,
          audioUrl: first.audio_url || first.stream_audio_url || track.audioUrl,
          coverUrl: first.image_url || track.coverUrl,
          duration: first.duration ? Math.round(first.duration) : track.duration,
        },
      });
      return NextResponse.json({ code: 200, msg: "First track processed" });
    }

    if (callbackType === "complete" || audioItems.length > 0) {
      const primary = audioItems[0] || {};
      const finalAudioUrl =
        primary.audio_url || primary.stream_audio_url || primary.source_audio_url;
      const finalCoverUrl =
        primary.image_url || primary.source_image_url || track.coverUrl;
      const finalDuration = primary.duration
        ? Math.round(primary.duration)
        : track.duration;

      await prisma.track.update({
        where: { id: track.id },
        data: {
          status: "COMPLETED",
          progress: 100,
          audioUrl: finalAudioUrl || track.audioUrl,
          coverUrl: finalCoverUrl || track.coverUrl,
          duration: finalDuration,
          errorMessage: null,
          title: primary.title || track.title,
        },
      });

      console.log(`[Suno Webhook] ✅ Morceau ${track.id} (Task ${taskId}) marqué COMPLETED.`);
      return NextResponse.json({ code: 200, msg: "Track marked as completed successfully" });
    }

    return NextResponse.json({ code: 200, msg: "Event processed" });
  } catch (err) {
    console.error("[Suno Webhook] Erreur traitement:", err);
    return NextResponse.json(
      { code: 500, msg: "Internal server error" },
      { status: 500 }
    );
  }
}
