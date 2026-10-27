import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { findTargetFile, toWebStream, MIME_TYPES } from "@/lib/fileServer";

/**
 * GET /api/tracks/[id]/download
 * Endpoint dédié au téléchargement officiel d'un morceau musical.
 *
 * Fonctionnalités :
 * 1. Force le téléchargement côté navigateur avec 'Content-Disposition: attachment'.
 * 2. Prise en charge des fichiers locaux stockés sur le serveur (/uploads/...).
 * 3. Prise en charge des fichiers distants (Suno API CDN) via proxy/streaming
 *    serveur pour contourner les restrictions CORS qui bloquent l'attribut HTML5 'download'.
 */
export async function GET(req, context) {
  try {
    const params = await context.params;
    const trackId = params?.id;

    if (!trackId) {
      return NextResponse.json({ error: "Identifiant du morceau requis." }, { status: 400 });
    }

    const track = await prisma.track.findUnique({
      where: { id: trackId },
      select: {
        id: true,
        title: true,
        audioUrl: true,
        s3AudioKey: true,
        status: true,
      },
    });

    if (!track) {
      return NextResponse.json({ error: "Morceau introuvable." }, { status: 404 });
    }

    if (!track.audioUrl) {
      return NextResponse.json(
        { error: "Ce morceau n'a pas encore de fichier audio finalisé." },
        { status: 404 }
      );
    }

    // Nom de fichier propre et sécurisé
    const sanitizedTitle = (track.title || "pretymelo-track")
      .replace(/[^\w\s\u00C0-\u017F-]/gi, "")
      .trim()
      .replace(/\s+/g, "_")
      .slice(0, 60) || "track";

    const isRemote =
      track.audioUrl.startsWith("http://") || track.audioUrl.startsWith("https://");

    // CAS 1 : Morceau hébergé en local (/uploads/...)
    if (!isRemote) {
      const cleanPath = track.audioUrl.replace(/^\/+/, "").replace(/^uploads\//, "");
      const segments = cleanPath.split("/").filter(Boolean);

      const localFile = findTargetFile(segments);
      if (localFile && fs.existsSync(localFile)) {
        const stat = await fs.promises.stat(localFile);
        const ext = path.extname(localFile).toLowerCase() || ".mp3";
        const filename = `${sanitizedTitle}${ext}`;
        const contentType = MIME_TYPES[ext] || "audio/mpeg";

        const nodeStream = fs.createReadStream(localFile);
        const webStream = toWebStream(nodeStream);

        return new Response(webStream, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Content-Length": String(stat.size),
            "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
            "Content-Description": "File Transfer",
            "Cache-Control": "private, no-cache",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    }

    // CAS 2 : Morceau distant (Suno CDN) ou fallback URL distante
    if (isRemote) {
      try {
        const remoteRes = await fetch(track.audioUrl, {
          headers: {
            "User-Agent": "pretymelo-Media-Fetcher/1.0",
          },
        });

        if (remoteRes.ok && remoteRes.body) {
          const contentType = remoteRes.headers.get("content-type") || "audio/mpeg";
          let ext = ".mp3";
          if (contentType.includes("wav")) ext = ".wav";
          else if (contentType.includes("ogg")) ext = ".ogg";
          else if (contentType.includes("mp4") || contentType.includes("m4a")) ext = ".m4a";

          const filename = `${sanitizedTitle}${ext}`;
          const contentLength = remoteRes.headers.get("content-length");

          const responseHeaders = {
            "Content-Type": contentType,
            "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
            "Content-Description": "File Transfer",
            "Cache-Control": "private, no-cache",
            "Access-Control-Allow-Origin": "*",
          };

          if (contentLength) {
            responseHeaders["Content-Length"] = contentLength;
          }

          return new Response(remoteRes.body, {
            status: 200,
            headers: responseHeaders,
          });
        }
      } catch (remoteErr) {
        console.warn("[Download Route] Erreur proxy audio distant:", remoteErr.message);
      }

      // Si le fetch distant échoue côté serveur, rediriger directement vers l'URL
      return NextResponse.redirect(track.audioUrl, 302);
    }

    return NextResponse.json(
      { error: "Impossible de localiser le fichier audio à télécharger." },
      { status: 404 }
    );
  } catch (error) {
    console.error("[API Download Track] Erreur :", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la préparation du téléchargement." },
      { status: 500 }
    );
  }
}
