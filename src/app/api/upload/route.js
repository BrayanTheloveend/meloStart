import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { saveBufferToPublic } from "@/lib/storage";
import crypto from "crypto";
import path from "path";

export const dynamic = "force-dynamic";

/**
 * POST /api/upload
 * Endpoint de téléversement pour les fichiers de référence (Images, Audio, Vidéo).
 * Stocke les fichiers dans public/uploads/references/ et renvoie l'URL publique.
 */
export async function POST(req) {
  try {
    const session = await getServerAuthSession();
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Vous devez être connecté pour téléverser un fichier." },
        { status: 401 }
      );
    }

    const formData = await req.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json(
        { error: "Données de formulaire invalides." },
        { status: 400 }
      );
    }

    const file = formData.get("file");
    const mediaType = formData.get("type") || "general"; // image | video | audio

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "Aucun fichier fourni." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validation des tailles selon les directives
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
    const MAX_AUDIO_SIZE = 500 * 1024 * 1024; // 500MB

    if (mediaType === "image" && buffer.length > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: "L'image ne doit pas dépasser 10MB." },
        { status: 400 }
      );
    }
    if (mediaType === "video" && buffer.length > MAX_VIDEO_SIZE) {
      return NextResponse.json(
        { error: "La vidéo ne doit pas dépasser 100MB." },
        { status: 400 }
      );
    }
    if (mediaType === "audio" && buffer.length > MAX_AUDIO_SIZE) {
      return NextResponse.json(
        { error: "Le fichier audio ne doit pas dépasser 500MB." },
        { status: 400 }
      );
    }

    const originalName = file.name || "media";
    const ext = path.extname(originalName) || (mediaType === "image" ? ".jpg" : mediaType === "video" ? ".mp4" : ".mp3");
    const safeHash = crypto.randomBytes(8).toString("hex");
    const fileKey = `references/${session.user.id}/${Date.now()}-${safeHash}${ext}`;

    const uploadResult = await saveBufferToPublic({
      buffer,
      key: fileKey,
      contentType: file.type || "application/octet-stream",
      metadata: {
        userId: session.user.id,
        originalName,
        mediaType,
      },
    });

    // Construit l'URL absolue si l'application dispose d'une URL publique configurée
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const fullUrl = baseUrl.startsWith("http") && !baseUrl.includes("localhost")
      ? `${baseUrl.replace(/\/$/, "")}${uploadResult.url}`
      : uploadResult.url;

    return NextResponse.json({
      success: true,
      url: fullUrl,
      localUrl: uploadResult.url,
      name: originalName,
      size: buffer.length,
      type: mediaType,
    });
  } catch (error) {
    console.error("[API Upload] Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors du téléversement du fichier." },
      { status: 500 }
    );
  }
}
