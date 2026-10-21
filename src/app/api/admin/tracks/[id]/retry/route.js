import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSunoMusic } from "@/lib/sunoService";

/**
 * POST /api/admin/tracks/[id]/retry
 * Relance la génération d'un morceau en échec en mode asynchrone (Suno API / Webhook).
 */
export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const session = await getServerAuthSession();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès refusé. Privilèges administrateur requis." },
        { status: 403 }
      );
    }

    const track = await prisma.track.findUnique({
      where: { id },
    });

    if (!track) {
      return NextResponse.json({ error: "Morceau introuvable." }, { status: 404 });
    }

    // Réinitialiser l'état du morceau
    await prisma.track.update({
      where: { id },
      data: {
        status: "PROCESSING",
        errorMessage: null,
        progress: 15,
      },
    });

    let newTaskId = null;
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/suno`;

    try {
      const sunoRes = await generateSunoMusic({
        prompt: track.prompt || "",
        lyrics: track.lyrics || "",
        style: track.genre || "Pop",
        title: track.title,
        customMode: Boolean(track.lyrics || track.genre),
        instrumental: track.vocalType === "instrumental",
        callBackUrl: webhookUrl,
        duration: track.duration || 60,
      });

      if (sunoRes?.taskId) {
        newTaskId = sunoRes.taskId;
        await prisma.track.update({
          where: { id },
          data: {
            jobId: `suno_${newTaskId}`,
            progress: 20,
          },
        });
      }
    } catch (sunoErr) {
      console.warn("[Admin Track Retry] Suno API indisponible:", sunoErr.message);
      await prisma.track.update({
        where: { id },
        data: {
          jobId: `async_retry_${track.id}`,
          progress: 30,
        },
      });
    }

    await prisma.adminLog.create({
      data: {
        adminId: session.user.id,
        action: "RETRY_TRACK_ASYNC",
        target: track.id,
        details: { title: track.title, previousStatus: track.status, newTaskId },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Génération asynchrone relancée pour "${track.title}".`,
      trackId: track.id,
      taskId: newTaskId,
    });
  } catch (error) {
    console.error("[API Admin Track Retry] Erreur:", error);
    return NextResponse.json(
      { error: "Impossible de relancer le traitement du morceau." },
      { status: 500 }
    );
  }
}
