import fs from "fs";
import path from "path";

/**
 * Service de stockage de fichiers local dans le dossier "public/" du serveur Next.js.
 * Remplace totalement l'utilisation d'AWS S3 / Cloudflare R2.
 */

const PUBLIC_DIR = path.join(process.cwd(), "public");
const UPLOADS_DIR = path.join(PUBLIC_DIR, "uploads");

/**
 * Génère un buffer audio WAV mélodieux valide si aucun fichier externe n'est disponible (100% offline).
 */
export function generateMelodyWavBuffer(durationSeconds = 6, baseFreq = 440) {
  const sampleRate = 22050;
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const totalSamples = sampleRate * durationSeconds;
  const dataSize = totalSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // En-tête RIFF / WAVE
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);

  // Sous-chunk fmt
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // Sous-chunk data
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Composition musicale d'accords doux avec enveloppe harmonique
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    // Progression d'accords toutes les 1.5s
    const step = Math.floor(t / 1.5);
    const chords = [1, 1.25, 1.33, 1.5]; // Tonique, Tierce, Quarte, Quinte
    const root = baseFreq * (chords[step % chords.length] || 1);

    const env = Math.sin((Math.PI * (i % (sampleRate * 1.5))) / (sampleRate * 1.5));
    const s1 = Math.sin(2 * Math.PI * root * t);
    const s2 = Math.sin(2 * Math.PI * (root * 1.25) * t) * 0.5;
    const s3 = Math.sin(2 * Math.PI * (root * 1.5) * t) * 0.35;
    const sample = Math.floor(((s1 + s2 + s3) / 1.85) * 14000 * Math.max(0, env));

    buffer.writeInt16LE(sample, 44 + i * 2);
  }

  return buffer;
}

/**
 * Obtient un buffer audio réel pour une piste (téléchargeable en ligne ou généré localement).
 */
export async function getPlayableAudioBuffer() {
  try {
    const res = await fetch("https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg", {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer();
      return {
        buffer: Buffer.from(arrayBuffer),
        contentType: "audio/ogg",
        extension: "ogg",
      };
    }
  } catch (_) {}

  // Fallback haute fidélité local 100% autonome
  return {
    buffer: generateMelodyWavBuffer(8, 440),
    contentType: "audio/wav",
    extension: "wav",
  };
}

/**
 * Sauvegarde un Buffer brut (musique, image, etc.) directement dans le dossier public du serveur.
 *
 * @param {Object} params
 * @param {Buffer|Uint8Array|ArrayBuffer} params.buffer Contenu brut du fichier
 * @param {string} params.key Clé ou chemin relatif souhaité (ex: "tracks/usr_1/trk_2/master.mp3")
 * @param {string} [params.contentType] Type MIME (ex: "audio/mpeg")
 * @param {Object} [params.metadata] Métadonnées optionnelles
 * @returns {Promise<{ key: string, url: string, size: number }>}
 */
export async function saveBufferToPublic({ buffer, key, contentType = "application/octet-stream", metadata = {} }) {
  if (!buffer) {
    throw new Error("Aucun buffer fourni pour la sauvegarde locale.");
  }

  // Nettoyage de la clé pour éviter le directory traversal
  const sanitizedKey = key.replace(/^(\.\.[\/\\])+/, "").replace(/^[\/\\]+/, "");

  // Placement automatique sous public/uploads/
  const relativeSubpath = sanitizedKey.startsWith("uploads/")
    ? sanitizedKey
    : path.posix.join("uploads", sanitizedKey);

  const fullPath = path.join(PUBLIC_DIR, relativeSubpath);

  // Sécurité anti fuite hors de public/
  if (!fullPath.startsWith(PUBLIC_DIR)) {
    throw new Error("Chemin de destination invalide.");
  }

  // Création du répertoire cible s'il n'existe pas
  await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });

  const nodeBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  await fs.promises.writeFile(fullPath, nodeBuffer);

  const publicUrl = `/${relativeSubpath.split(path.sep).join("/")}`;

  return {
    key: relativeSubpath,
    url: publicUrl,
    size: nodeBuffer.length,
    contentType,
  };
}

/**
 * Supprime un fichier stocké dans le dossier public du serveur.
 *
 * @param {string} keyOrUrl Chemin relatif ou URL publique (ex: "/uploads/tracks/...", "uploads/tracks/...")
 * @returns {Promise<boolean>}
 */
export async function deletePublicFile(keyOrUrl) {
  if (!keyOrUrl) return false;

  try {
    let cleanKey = keyOrUrl.trim();
    if (cleanKey.startsWith("http://") || cleanKey.startsWith("https://")) {
      const parsed = new URL(cleanKey);
      cleanKey = parsed.pathname;
    }

    cleanKey = cleanKey.replace(/^[\/\\]+/, "");
    const fullPath = path.join(PUBLIC_DIR, cleanKey);

    // Sécurité
    if (!fullPath.startsWith(PUBLIC_DIR)) return false;

    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    console.warn("[Storage Local] Erreur suppression fichier :", error.message);
    return false;
  }
}

/**
 * Construit l'URL publique accessible par le navigateur d'un fichier hébergé dans le dossier public.
 *
 * @param {string} keyOrPath
 * @returns {string}
 */
export function getPublicUrl(keyOrPath) {
  if (!keyOrPath) return null;
  if (keyOrPath.startsWith("http://") || keyOrPath.startsWith("https://")) {
    return keyOrPath;
  }
  const clean = keyOrPath.replace(/^[\/\\]+/, "");
  return `/${clean}`;
}

/**
 * Télécharge un fichier audio distant (ex: Suno/QuickDraw tempfile CDN) et le persiste localement
 * dans public/uploads/tracks/[trackId]/master.mp3.
 *
 * @param {string} remoteUrl URL distante à télécharger
 * @param {string} trackId ID du morceau
 * @returns {Promise<string>} URL locale persistée (/uploads/tracks/...) ou URL d'origine en cas d'échec
 */
export async function downloadAndPersistAudio(remoteUrl, trackId) {
  if (!remoteUrl || (!remoteUrl.startsWith("http://") && !remoteUrl.startsWith("https://"))) {
    return remoteUrl;
  }

  // Si déjà sous /uploads/, rien à faire
  if (remoteUrl.startsWith("/uploads/") || remoteUrl.startsWith("uploads/")) {
    return remoteUrl.startsWith("/") ? remoteUrl : `/${remoteUrl}`;
  }

  try {
    console.log(`[Storage] 📥 Téléchargement audio distant pour la piste ${trackId}: ${remoteUrl}`);
    const res = await fetch(remoteUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; pretymelo/1.0; +https://pretymelo.com)",
      },
      signal: AbortSignal.timeout(45000), // 45s max
    });

    if (!res.ok) {
      console.warn(`[Storage] ⚠️ Échec téléchargement HTTP ${res.status}: ${remoteUrl}`);
      return remoteUrl;
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length < 1024) {
      console.warn(`[Storage] ⚠️ Fichier audio trop petit (${buffer.length} octets).`);
      return remoteUrl;
    }

    const contentType = res.headers.get("content-type") || "audio/mpeg";
    let ext = "mp3";
    if (contentType.includes("wav")) ext = "wav";
    else if (contentType.includes("ogg")) ext = "ogg";

    const saved = await saveBufferToPublic({
      buffer,
      key: `tracks/${trackId}/master.${ext}`,
      contentType,
    });

    console.log(`[Storage] ✅ Piste audio ${trackId} rapatriée avec succès : ${saved.url} (${buffer.length} octets)`);
    return saved.url;
  } catch (err) {
    console.error(`[Storage] ❌ Erreur lors du rapatriement de l'audio (${trackId}):`, err.message);
    return remoteUrl;
  }
}

/**
 * Télécharge une image de pochette distante et la persiste localement.
 *
 * @param {string} remoteUrl
 * @param {string} trackId
 * @returns {Promise<string>}
 */
export async function downloadAndPersistCover(remoteUrl, trackId) {
  if (!remoteUrl || (!remoteUrl.startsWith("http://") && !remoteUrl.startsWith("https://"))) {
    return remoteUrl;
  }
  if (remoteUrl.startsWith("/uploads/") || remoteUrl.startsWith("uploads/")) {
    return remoteUrl.startsWith("/") ? remoteUrl : `/${remoteUrl}`;
  }

  try {
    const res = await fetch(remoteUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; pretymelo/1.0; +https://pretymelo.com)",
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) return remoteUrl;

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length < 500) return remoteUrl;

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";

    const saved = await saveBufferToPublic({
      buffer,
      key: `tracks/${trackId}/cover.${ext}`,
      contentType,
    });

    console.log(`[Storage] ✅ Pochette ${trackId} rapatriée avec succès : ${saved.url}`);
    return saved.url;
  } catch (_) {
    return remoteUrl;
  }
}

export default {
  saveBufferToPublic,
  deletePublicFile,
  getPublicUrl,
  getPlayableAudioBuffer,
  generateMelodyWavBuffer,
  downloadAndPersistAudio,
  downloadAndPersistCover,
};
