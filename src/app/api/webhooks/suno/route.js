import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { refundCredits } from "@/lib/credits";

export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/suno
 * Endpoint Webhook pour recevoir les callbacks asynchrones de Suno API (sunoapi.org).
 * Conforme aux spécifications : https://docs.sunoapi.org/suno-api/generate-music-callbacks
 *
 * Événements Suno :
 * - "text"     : génération des paroles/structure terminée (progress ~45%)
 * - "first"    : première strophe/variation audio prête (progress ~80%)
 * - "complete" : rendu finalisé de la piste avec audioUrl et coverUrl (status COMPLETED, progress 100%)
 * - échec      : notification d'erreur Suno -> remboursement automatique des 2 Notes
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));

    console.log("[Suno Webhook] Réception callback:", JSON.stringify(body, null, 2));

    const { code, msg, data } = body;
    const taskId =
      data?.task_id ||
      data?.taskId ||
      body?.task_id ||
      body?.taskId ||
      data?.id;

    const callbackType = data?.callbackType || body?.callbackType || "complete";

    const audioItems =
      data?.sunoData ||
      data?.data ||
      body?.data ||
      (Array.isArray(body) ? body : []);

    const primaryAudio = Array.isArray(audioItems) ? audioItems[0] : audioItems;

    if (!taskId) {
      console.warn("[Suno Webhook] Aucune référence task_id trouvée dans le payload.");
      return NextResponse.json({ code: 400, msg: "Missing task_id" }, { status: 400 });
    }

    // Recherche de la piste associée dans PostgreSQL (Prisma)
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
      console.warn(`[Suno Webhook] Aucun morceau trouvé en BDD pour le taskId: ${taskId}`);
      return NextResponse.json({ code: 200, msg: "Task acknowledged (no track matching)" });
    }

    // 1. Détection d'un échec rapporté par Suno
    const isFailure =
      (code !== 200 && code !== undefined && code !== null) ||
      ["FAILED", "fail", "CREATE_TASK_FAILED", "GENERATE_AUDIO_FAILED", "CALLBACK_EXCEPTION"].includes(data?.status) ||
      ["FAILED", "fail"].includes(body?.status);

    if (isFailure) {
      const errorDetail = msg || data?.errorMessage || body?.errorMessage || "Échec rapporté par Suno API";
      console.warn(`[Suno Webhook] ❌ Échec pour la piste ${track.id}: ${errorDetail}`);

      await prisma.track.update({
        where: { id: track.id },
        data: {
          status: "FAILED",
          progress: 0,
          errorMessage: errorDetail,
        },
      });

      // Remboursement automatique et immédiat des 2 Notes
      await refundCredits(track.userId, 2, {
        trackId: track.id,
        reason: `Échec Suno Webhook: ${errorDetail}`,
      }).catch((refundErr) => {
        console.error("[Suno Webhook] Erreur lors du remboursement:", refundErr);
      });

      return NextResponse.json({ code: 200, msg: "Track marked FAILED and 2 notes refunded" });
    }

    // 2. Événement "text" : structure et paroles générées
    if (callbackType === "text" || data?.status === "TEXT_SUCCESS") {
      await prisma.track.update({
        where: { id: track.id },
        data: {
          status: "PROCESSING",
          progress: 45,
          lyrics: primaryAudio?.prompt || track.lyrics,
        },
      });
      return NextResponse.json({ code: 200, msg: "Text event processed" });
    }

    // 3. Événement "first" : premier aperçu audio prêt
    if (callbackType === "first" || data?.status === "FIRST_SUCCESS") {
      if (primaryAudio) {
        await prisma.track.update({
          where: { id: track.id },
          data: {
            status: "PROCESSING",
            progress: 80,
            audioUrl: primaryAudio.audio_url || primaryAudio.stream_audio_url || track.audioUrl,
            coverUrl: primaryAudio.image_url || primaryAudio.image_large_url || track.coverUrl,
            duration: primaryAudio.duration ? Math.round(primaryAudio.duration) : track.duration,
          },
        });
      }
      return NextResponse.json({ code: 200, msg: "First clip processed" });
    }

    // 4. Événement "complete" / "SUCCESS" : morceau finalisé
    if (
      callbackType === "complete" ||
      data?.status === "SUCCESS" ||
      body?.status === "SUCCESS" ||
      primaryAudio?.audio_url
    ) {
      const finalAudioUrl =
        primaryAudio?.audio_url ||
        primaryAudio?.stream_audio_url ||
        primaryAudio?.source_audio_url ||
        track.audioUrl;

      const finalCoverUrl =
        primaryAudio?.image_url ||
        primaryAudio?.image_large_url ||
        primaryAudio?.source_image_url ||
        track.coverUrl;

      const finalDuration = primaryAudio?.duration
        ? Math.round(primaryAudio.duration)
        : track.duration;

      const finalTitle = primaryAudio?.title || track.title;
      const finalLyrics = primaryAudio?.prompt || track.lyrics;

      await prisma.track.update({
        where: { id: track.id },
        data: {
          status: "COMPLETED",
          progress: 100,
          audioUrl: finalAudioUrl,
          coverUrl: finalCoverUrl,
          duration: finalDuration,
          title: finalTitle,
          lyrics: finalLyrics,
          errorMessage: null,
        },
      });

      console.log(`[Suno Webhook] ✅ Morceau ${track.id} (Task ${taskId}) finalisé avec succès.`);
      return NextResponse.json({ code: 200, msg: "Track successfully marked as COMPLETED" });
    }

    return NextResponse.json({ code: 200, msg: "Event acknowledged" });
  } catch (err) {
    console.error("[Suno Webhook] Erreur serveur webhook:", err);
    return NextResponse.json({ code: 500, msg: err.message || "Internal error" }, { status: 500 });
  }
}
