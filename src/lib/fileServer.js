import fs from "fs";
import path from "path";
import { Readable } from "stream";

/**
 * Table des types MIME supportés pour le streaming audio, images et médias
 */
const MIME_TYPES = {
  // Audio
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".oga": "audio/ogg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".flac": "audio/flac",
  ".weba": "audio/webm",
  ".webm": "audio/webm",
  ".mid": "audio/midi",
  ".midi": "audio/midi",

  // Images
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",

  // Documents & Autres
  ".json": "application/json",
  ".txt": "text/plain",
  ".pdf": "application/pdf",
};

/**
 * Convertit un Readable Node.js en ReadableStream Web Standard de façon résiliente
 */
function toWebStream(nodeStream) {
  if (typeof Readable.toWeb === "function") {
    return Readable.toWeb(nodeStream);
  }

  return new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk) => controller.enqueue(chunk));
      nodeStream.on("end", () => controller.close());
      nodeStream.on("error", (err) => controller.error(err));
    },
    cancel() {
      nodeStream.destroy();
    },
  });
}

export { MIME_TYPES, toWebStream, findTargetFile };

/**
 * Recherche l'existence d'un fichier parmi les répertoires de stockage potentiels
 */
export function findTargetFile(segments) {
  const cwd = process.cwd();
  const cleanSegments = [...segments];

  // Si le premier segment est "uploads", on prépare aussi la version sans ce préfixe
  const withoutUploads = cleanSegments[0] === "uploads" ? cleanSegments.slice(1) : cleanSegments;

  const candidatePaths = [
    // 1. Emplacement principal : public/uploads/...
    path.join(cwd, "public", "uploads", ...withoutUploads),
    // 2. Si le chemin incluait déjà uploads sous public/
    path.join(cwd, "public", ...cleanSegments),
    // 3. Dossier uploads à la racine
    path.join(cwd, "uploads", ...withoutUploads),
    // 4. Dossier public direct
    path.join(cwd, "public", ...cleanSegments),
    // 5. Chemin direct depuis la racine
    path.join(cwd, ...cleanSegments),
  ];

  for (const candidate of candidatePaths) {
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return candidate;
      }
    } catch (_) {}
  }

  return null;
}

/**
 * Gestionnaire unifié de service de fichiers publics avec support HTTP Range (streaming audio)
 *
 * @param {Request} req Requête HTTP entrante
 * @param {string[]|string} rawPathSegments Segments de chemin issus de l'URL
 */
export async function handleServeFile(req, rawPathSegments) {
  try {
    const segments = (Array.isArray(rawPathSegments) ? rawPathSegments : [rawPathSegments])
      .filter(Boolean)
      .map((s) => decodeURIComponent(s));

    if (segments.length === 0) {
      return new Response("Chemin non spécifié", { status: 400 });
    }

    // Sécurité stricte : anti-directory traversal
    const hasTraversal = segments.some(
      (seg) => seg.includes("..") || seg.includes("/") || seg.includes("\\")
    );
    if (hasTraversal) {
      return new Response("Chemin interdit", { status: 403 });
    }

    const filePath = findTargetFile(segments);
    if (!filePath) {
      return new Response("Fichier introuvable sur le serveur", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // Vérification de sécurité finale : le fichier doit être dans le dossier de l'application
    const normalizedFile = path.normalize(filePath);
    const normalizedCwd = path.normalize(process.cwd());
    if (!normalizedFile.startsWith(normalizedCwd)) {
      return new Response("Accès refusé", { status: 403 });
    }

    const stat = await fs.promises.stat(normalizedFile);
    const fileSize = stat.size;
    const ext = path.extname(normalizedFile).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    // Détection de la demande de téléchargement direct (?download=1 ou ?download=true ou ?dl=1)
    let isDownload = false;
    let customFilename = path.basename(normalizedFile);
    try {
      const parsedUrl = new URL(req.url);
      isDownload =
        parsedUrl.searchParams.get("download") === "1" ||
        parsedUrl.searchParams.get("download") === "true" ||
        parsedUrl.searchParams.has("dl");
      const nameParam = parsedUrl.searchParams.get("filename");
      if (nameParam) customFilename = nameParam;
    } catch (_) {}

    // En-têtes standards CORS et cache
    const baseHeaders = {
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Range, Content-Type",
      "Cache-Control": isDownload ? "private, no-cache" : "public, max-age=86400, stale-while-revalidate=604800",
    };

    if (isDownload) {
      const sanitizedName = customFilename.replace(/["\r\n]/g, "_");
      baseHeaders["Content-Disposition"] = `attachment; filename="${sanitizedName}"; filename*=UTF-8''${encodeURIComponent(sanitizedName)}`;
      baseHeaders["Content-Description"] = "File Transfer";
    }

    // Prise en charge des requêtes HEAD (souvent émises par les lecteurs multimédia)
    if (req.method === "HEAD") {
      return new Response(null, {
        status: 200,
        headers: {
          ...baseHeaders,
          "Content-Length": String(fileSize),
        },
      });
    }

    // Prise en charge du streaming par morceaux (HTTP 206 Partial Content pour audio/vidéo)
    const range = req.headers.get("range");

    if (range && range.startsWith("bytes=")) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      // Validation des bornes
      if (isNaN(start) || start >= fileSize || (parts[1] && isNaN(end)) || start > end) {
        return new Response(null, {
          status: 416, // Range Not Satisfiable
          headers: {
            "Content-Range": `bytes */${fileSize}`,
            "Accept-Ranges": "bytes",
          },
        });
      }

      const safeEnd = Math.min(end, fileSize - 1);
      const chunkSize = safeEnd - start + 1;
      const nodeStream = fs.createReadStream(normalizedFile, { start, end: safeEnd });
      const webStream = toWebStream(nodeStream);

      return new Response(webStream, {
        status: 206, // Partial Content
        headers: {
          ...baseHeaders,
          "Content-Range": `bytes ${start}-${safeEnd}/${fileSize}`,
          "Content-Length": String(chunkSize),
        },
      });
    }

    // Réponse complète (HTTP 200 OK)
    const nodeStream = fs.createReadStream(normalizedFile);
    const webStream = toWebStream(nodeStream);

    return new Response(webStream, {
      status: 200,
      headers: {
        ...baseHeaders,
        "Content-Length": String(fileSize),
      },
    });
  } catch (error) {
    console.error("[FileServer] Erreur lors de la lecture du fichier :", error);
    return new Response("Erreur interne du serveur lors de la lecture du fichier", {
      status: 500,
    });
  }
}

/**
 * Réponse aux requêtes pré-vol CORS
 */
export function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Range, Content-Type",
    },
  });
}
