/**
 * Remplacement du stockage S3 par le stockage direct dans le dossier public du serveur.
 * Fournit une compatibilité totale avec les signatures d'appels existantes.
 */
import {
  saveBufferToPublic,
  deletePublicFile,
  getPublicUrl,
} from "./storage.js";

/**
 * Uploade un Buffer vers le dossier public du serveur (au lieu de S3).
 *
 * @param {Object} params
 * @param {Buffer|Uint8Array} params.buffer Contenu du fichier
 * @param {string} params.key Clé/Chemin du fichier (ex: tracks/123/master.mp3)
 * @param {string} params.contentType Type MIME (ex: audio/mpeg)
 * @param {Object} [params.metadata] Métadonnées
 * @returns {Promise<{ key: string, url: string }>}
 */
export async function uploadBufferToS3({ buffer, key, contentType, metadata = {} }) {
  const result = await saveBufferToPublic({
    buffer,
    key,
    contentType,
    metadata,
  });

  return {
    key: result.key,
    url: result.url,
  };
}

/**
 * Supprime un fichier stocké localement dans public/.
 *
 * @param {string} key Clé ou chemin sous public/ (ex: "uploads/tracks/...")
 */
export async function deleteS3Object(key) {
  return await deletePublicFile(key);
}

/**
 * Construit l'URL publique directe d'un fichier hébergé dans public/.
 *
 * @param {string} key
 */
export function getPublicMediaUrl(key) {
  return getPublicUrl(key);
}

/**
 * En mode local sans S3, renvoie directement l'URL publique locale.
 *
 * @param {string} key
 */
export async function getPresignedDownloadUrl(key) {
  return getPublicUrl(key);
}

/**
 * En mode local, renvoie l'URL locale de la ressource.
 *
 * @param {string} key
 */
export async function getPresignedUploadUrl(key) {
  return getPublicUrl(key);
}

/**
 * Client simulé pour éviter toute tentative ou dépendance de connexion AWS S3 externe.
 */
export const s3Client = {
  send: async () => ({ $metadata: { httpStatusCode: 200 } }),
};

export default s3Client;
