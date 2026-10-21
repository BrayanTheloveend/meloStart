import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refundCredits } from "@/lib/credits";
import { deletePublicFile } from "@/lib/storage";
import { getSunoTaskStatus } from "@/lib/sunoService";

/**
 * GET /api/tracks/[id]
 * Endpoint de Polling asynchrone client (sans Redis).
 * Récupère l'avancement de la piste et synchronise l'état avec Suno API si nécessaire.
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

    // Polling asynchrone : si le morceau est en cours et lié à Suno API
    let jobInfo = null;
    if (["QUEUED", "PROCESSING"].includes(track.status) && track.jobId) {
      const isSunoJob = track.jobId.startsWith("suno_");
      const sunoTaskId = track.jobId.replace(/^suno_/, "");

      if (isSunoJob && sunoTaskId) {
        try {
          const sunoState = await getSunoTaskStatus(sunoTaskId);
          jobInfo = { provider: "suno_async", status: sunoState.status, taskId: sunoTaskId };

          if (sunoState.status === "SUCCESS") {
            const audioData = sunoState.response?.data?.[0];
            if (audioData) {
              track = await prisma.track.update({
                where: { id: track.id },
                data: {
                  status: "COMPLETED",
                  progress: 100,
                  audioUrl: audioData.audio_url || audioData.stream_audio_url || track.audioUrl,
                  coverUrl: audioData.image_url || track.coverUrl,
                  duration: audioData.duration ? Math.round(audioData.duration) : track.duration,
                  title: audioData.title || track.title,
                },
                include: {
                  user: { select: { id: true, name: true, image: true } },
                },
              });
            }
          } else if (sunoState.status === "FAILED") {
            track = await prisma.track.update({
              where: { id: track.id },
              data: {
                status: "FAILED",
                progress: 0,
                errorMessage: sunoState.errorMessage || "Échec rapporté par les serveurs Suno API.",
              },
              include: {
                user: { select: { id: true, name: true, image: true } },
              },
            });
            // Remboursement automatique des 2 Notes si échec
            await refundCredits(track.userId, 2, {
              trackId: track.id,
              reason: "Échec rapporté par Suno API",
            }).catch(() => {});
          }
        } catch (_) {
          // Erreur réseau temporaire vers Suno, le polling client retentera au prochain cycle
        }
      } else {
        jobInfo = { provider: "local_async", status: track.status, progress: track.progress };
      }
    }


    return NextResponse.json({
      success: true,
      track,
      job: jobInfo,
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
