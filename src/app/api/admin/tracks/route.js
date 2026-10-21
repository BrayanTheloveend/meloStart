import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";


/**
 * GET /api/admin/tracks
 * Console Admin : Liste complète de toutes les pistes générées sur la plateforme.
 */
export async function GET(req) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Accès refusé. Privilèges administrateur requis." },
          { status: 403 }
        );
      }
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
    const skip = (page - 1) * limit;

    const where = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { prompt: { contains: search, mode: "insensitive" } },
        { genre: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    const [tracks, total, completedCount, processingCount, queuedCount, failedCount] = await Promise.all([
      prisma.track.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      }),
      prisma.track.count({ where }),
      prisma.track.count({ where: { status: "COMPLETED" } }),
      prisma.track.count({ where: { status: "PROCESSING" } }),
      prisma.track.count({ where: { status: { in: ["PENDING", "QUEUED"] } } }),
      prisma.track.count({ where: { status: "FAILED" } }),
    ]);

    const finishedTotal = completedCount + failedCount;
    const successRate = finishedTotal > 0 ? ((completedCount / finishedTotal) * 100).toFixed(1) : "100.0";

    // Formatage adapté à l'interface Admin
    const formatted = tracks.map((t) => ({
      id: t.id,
      title: t.title,
      genre: t.genre || "Pop",
      duration: `${Math.floor(t.duration / 60)}:${String(t.duration % 60).padStart(2, "0")}`,
      status: t.status,
      audioUrl: t.audioUrl,
      coverUrl: t.coverUrl,
      prompt: t.prompt,
      lyrics: t.lyrics,
      progress: t.progress,
      errorMessage: t.errorMessage,
      user: {
        name: t.user?.name || "Utilisateur anonyme",
        email: t.user?.email || "",
        avatar: t.user?.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop",
      },
      createdAt: new Date(t.createdAt).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

    return NextResponse.json({
      success: true,
      tracks: formatted,
      metrics: {
        total: completedCount + processingCount + queuedCount + failedCount,
        completed: completedCount,
        processing: processingCount,
        queued: queuedCount,
        inQueueTotal: processingCount + queuedCount,
        failed: failedCount,
        successRate: `${successRate}%`,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[API Admin Tracks GET] Erreur:", error);
    return NextResponse.json(
      { error: "Impossible de charger les pistes." },
      { status: 500 }
    );
  }
}
