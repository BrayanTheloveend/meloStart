/**
 * melostars - Architecture Asynchrone (Sans Redis, Sans BullMQ)
 *
 * Le pipeline audio repose désormais sur les Webhooks asynchrones officiels Suno API
 * (callBackUrl: /api/webhooks/suno) et le Polling côté client (/api/tracks/[id])
 * avec persistance d'état dans PostgreSQL (Prisma).
 *
 * Ce module conserve une compatibilité d'interface sans nécessiter de serveur Redis.
 */

import { prisma } from "./prisma";

export const MUSIC_QUEUE_NAME = "music-generation-webhook";

/**
 * Interface simplifiée sans Redis pour la gestion des jobs dans la base PostgreSQL.
 */
export const musicQueue = {
  name: MUSIC_QUEUE_NAME,
  isBullMQDisabled: true,
  getJobCounts: async () => {
    try {
      const [waiting, active, completed, failed] = await Promise.all([
        prisma.track.count({ where: { status: "QUEUED" } }),
        prisma.track.count({ where: { status: "PROCESSING" } }),
        prisma.track.count({ where: { status: "COMPLETED" } }),
        prisma.track.count({ where: { status: "FAILED" } }),
      ]);
      return { waiting, active, completed, failed };
    } catch (_) {
      return { waiting: 0, active: 0, completed: 0, failed: 0 };
    }
  },
  getJob: async (jobId) => {
    try {
      const track = await prisma.track.findFirst({
        where: {
          OR: [{ jobId }, { id: jobId.replace(/^track-/, "") }],
        },
      });
      if (!track) return null;
      return {
        id: jobId,
        getState: async () => track.status.toLowerCase(),
        progress: track.progress,
        returnvalue: track,
      };
    } catch (_) {
      return null;
    }
  },
};

/**
 * Enregistre une tâche de génération sans Redis.
 *
 * @param {Object} jobPayload
 * @returns {Promise<{ id: string }>}
 */
export async function addTrackGenerationJob(jobPayload) {
  const jobId = `async_${jobPayload.trackId}_${Date.now()}`;
  return { id: jobId, name: "async-track-job" };
}

/**
 * Récupère l'état d'avancement d'une piste depuis PostgreSQL.
 *
 * @param {string} jobId
 */
export async function getTrackJobState(jobId) {
  try {
    const track = await prisma.track.findFirst({
      where: {
        OR: [
          { jobId },
          { id: jobId?.replace(/^track-/, "") || "" },
        ],
      },
    });

    if (!track) return null;

    return {
      id: jobId,
      state: track.status.toLowerCase(),
      progress: track.progress || 0,
      failedReason: track.errorMessage,
      track,
    };
  } catch (_) {
    return null;
  }
}

export default musicQueue;
