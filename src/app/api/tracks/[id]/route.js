import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refundCredits } from "@/lib/credits";
import { deletePublicFile } from "@/lib/storage";
import { getSunoTaskStatus } from "@/lib/sunoService";


/**
 * GET /api/tracks/[id]
 * Endpoint de synchronisation et polling direct avec Suno API (sans Redis ni BullMQ).
 * Récupère l'avancement de la piste et synchronise l'état avec Suno API.
 */
export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const session = await getServerAuthSession();

    let track = await prisma.track.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    if (!track) {
      return NextResponse.json({ error: "Morceau introuvable." }, { status: 404 });
    }

    // Polling Suno en direct si la piste est en cours de traitement
    if (["PENDING", "QUEUED", "PROCESSING"].includes(track.status) && track.jobId) {
      const sunoTaskId = track.jobId.replace(/^suno_/, "").trim();

      if (sunoTaskId) {
        try {
          const sunoState = await getSunoTaskStatus(sunoTaskId);

          const isSuccess = sunoState?.status === "SUCCESS";
          const isFailed = [
            "FAILED",
            "fail",
            "CREATE_TASK_FAILED",
            "GENERATE_AUDIO_FAILED",
            "CALLBACK_EXCEPTION",
          ].includes(sunoState?.status);

          const audioItems =
            sunoState?.response?.sunoData ||
            sunoState?.response?.data ||
            sunoState?.sunoData ||
            sunoState?.data ||
            [];
          const primaryAudio = Array.isArray(audioItems) ? audioItems[0] : audioItems;

          if (isSuccess && primaryAudio) {
            const finalAudioUrl =
              primaryAudio.audio_url || primaryAudio.stream_audio_url || track.audioUrl;
            const finalCoverUrl =
              primaryAudio.image_url || primaryAudio.image_large_url || track.coverUrl;
            const finalDuration = primaryAudio.duration
              ? Math.round(primaryAudio.duration)
              : track.duration;
            const finalTitle = primaryAudio.title || track.title;
            const finalLyrics = primaryAudio.prompt || track.lyrics;

            track = await prisma.track.update({
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
              include: {
                user: { select: { id: true, name: true, image: true } },
              },
            });
          } else if (isFailed) {
            const errorMsg =
              sunoState?.errorMessage ||
              sunoState?.msg ||
              "Échec rapporté par les serveurs Suno AI.";

            track = await prisma.track.update({
              where: { id: track.id },
              data: {
                status: "FAILED",
                progress: 0,
                errorMessage: errorMsg,
              },
              include: {
                user: { select: { id: true, name: true, image: true } },
              },
            });

            // Remboursement automatique des 2 Notes
            await refundCredits(track.userId, 2, {
              trackId: track.id,
              reason: errorMsg,
            }).catch(() => {});
          } else if (sunoState?.status === "FIRST_SUCCESS" && primaryAudio) {
            track = await prisma.track.update({
              where: { id: track.id },
              data: {
                progress: 80,
                audioUrl: primaryAudio.audio_url || primaryAudio.stream_audio_url || track.audioUrl,
                coverUrl: primaryAudio.image_url || track.coverUrl,
              },
              include: {
                user: { select: { id: true, name: true, image: true } },
              },
            });
          } else if (sunoState?.status === "TEXT_SUCCESS") {
            track = await prisma.track.update({
              where: { id: track.id },
              data: { progress: 45 },
              include: {
                user: { select: { id: true, name: true, image: true } },
              },
            });
          }
        } catch (pollErr) {
          // Erreur réseau temporaire vers Suno, le client retentera au prochain cycle
          console.warn(`[API Track Polling] Avertissement Suno task ${sunoTaskId}:`, pollErr.message);
        }
      }
    }

    return NextResponse.json({
      success: true,
      track,
    });
  } catch (error) {
    console.error("[API Track GET ID] Erreur:", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les détails du morceau." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tracks/[id]
 * Met à jour un morceau (titre, favori, visibilité publique, paroles).
 */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const session = await getServerAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }

    const existingTrack = await prisma.track.findUnique({
      where: { id },
    });

    if (!existingTrack) {
      return NextResponse.json({ error: "Morceau introuvable." }, { status: 404 });
    }

    // Vérifier les permissions (propriétaire ou administrateur)
    const isOwner = existingTrack.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Vous n'avez pas l'autorisation de modifier ce morceau." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const allowedFields = ["title", "isFavorite", "isPublic", "lyrics"];
    const updateData = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const updated = await prisma.track.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      track: updated,
    });
  } catch (error) {
    console.error("[API Track PATCH ID] Erreur:", error);
    return NextResponse.json(
      { error: "Impossible de mettre à jour le morceau." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tracks/[id]
 * Supprime un morceau.
 */
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const session = await getServerAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }

    const existingTrack = await prisma.track.findUnique({
      where: { id },
    });

    if (!existingTrack) {
      return NextResponse.json({ error: "Morceau introuvable." }, { status: 404 });
    }

    const isOwner = existingTrack.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Vous n'avez pas l'autorisation de supprimer ce morceau." },
        { status: 403 }
      );
    }

    await prisma.track.delete({
      where: { id },
    });

    // Supprimer le fichier local stocké dans public/
    if (existingTrack.s3AudioKey || existingTrack.audioUrl) {
      await deletePublicFile(existingTrack.s3AudioKey || existingTrack.audioUrl);
    }

    return NextResponse.json({
      success: true,
      message: "Morceau supprimé avec succès.",
    });
  } catch (error) {
    console.error("[API Track DELETE ID] Erreur:", error);
    return NextResponse.json(
      { error: "Impossible de supprimer le morceau." },
      { status: 500 }
    );
  }
}
