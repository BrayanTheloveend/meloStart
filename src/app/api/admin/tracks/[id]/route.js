import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deletePublicFile } from "@/lib/storage";

/**
 * DELETE /api/admin/tracks/[id]
 * Suppression administrative d'un morceau.
 */
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const session = await getServerAuthSession();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès refusé. Privilèges administrateur requis." },
        { status: 403 }
      );
    }

    const track = await prisma.track.findUnique({ where: { id } });
    if (!track) {
      return NextResponse.json({ error: "Morceau introuvable." }, { status: 404 });
    }

    await prisma.track.delete({ where: { id } });

    // Nettoyage du fichier audio local stocké dans public/
    if (track.s3AudioKey || track.audioUrl) {
      await deletePublicFile(track.s3AudioKey || track.audioUrl);
    }

    await prisma.adminLog.create({
      data: {
        adminId: session.user.id,
        action: "DELETE_TRACK",
        target: id,
        details: { title: track.title, userId: track.userId },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Morceau supprimé par l'administrateur.",
    });
  } catch (error) {
    console.error("[API Admin Track DELETE] Erreur:", error);
    return NextResponse.json(
      { error: "Impossible de supprimer le morceau." },
      { status: 500 }
    );
  }
}
