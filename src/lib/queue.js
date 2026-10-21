import { Queue } from "bullmq";
import { redis } from "./redis";
import { prisma } from "./prisma";

/**
 * Nom unique de la file de traitement BullMQ pour la génération audio.
 */
export const MUSIC_QUEUE_NAME = "music-generation";

const globalForQueue = globalThis;

/**
 * Instance Singleton de la file BullMQ pour Next.js (Producer).
 */
export const musicQueue =
  globalForQueue.musicQueueInstance ||
  new Queue(MUSIC_QUEUE_NAME, {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: {
        age: 3600 * 24, // Conserver l'historique réussi pendant 24h
        count: 500,
      },
      removeOnFail: {
        age: 3600 * 48, // Conserver les échecs pendant 48h
        count: 1000,
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForQueue.musicQueueInstance = musicQueue;
}

/**
 * Ajoute une tâche de génération de piste dans la file d'attente BullMQ.
 *
 * @param {Object} jobPayload Données nécessaires au worker
 * @param {string} jobPayload.trackId Identifiant de la piste dans Prisma
 * @param {string} jobPayload.userId Identifiant de l'utilisateur
 * @param {string} jobPayload.prompt Description / Thématique
 * @param {string} jobPayload.genre Genre musical
 * @param {Array<string>} jobPayload.moods Humeurs / Ambiance
 * @param {number} jobPayload.duration Durée en secondes
 * @param {string} [jobPayload.lyrics] Paroles personnalisées
 * @param {string} [jobPayload.vocalType] "male" | "female" | "instrumental"
 * @param {Object} [options] Options spécifiques pour ce job
 * @returns {Promise<import("bullmq").Job>} Le job créé
 */
export async function addTrackGenerationJob(jobPayload, options = {}) {
  const jobId = `track-${jobPayload.trackId}`;

  try {
    const job = await musicQueue.add("generate-track", jobPayload, {
      jobId,
      ...options,
    });
    return job;
  } catch (err) {
    console.warn("[BullMQ] Avertissement ajout queue (Redis non connecté?):", err.message);
    return null;
  }
}

/**
 * Récupère l'état d'un job de génération par son ID depuis BullMQ ou la BDD.
 *
 * @param {string} jobId
 */
export async function getTrackJobState(jobId) {
  try {
    const job = await musicQueue.getJob(jobId);
    if (job) {
      const state = await job.getState();
      return {
        id: job.id,
        state,
        progress: job.progress || 0,
        failedReason: job.failedReason,
        returnvalue: job.returnvalue,
      };
    }
  } catch (_) {}

  // Repli sur l'état persistant dans la base PostgreSQL si BullMQ/Redis n'est pas joignable
  try {
    const track = await prisma.track.findFirst({
      where: {
        OR: [{ jobId }, { id: jobId?.replace(/^track-/, "") || "" }],
      },
    });

    if (track) {
      return {
        id: jobId,
        state: track.status.toLowerCase(),
        progress: track.progress || 0,
        failedReason: track.errorMessage,
        track,
      };
    }
  } catch (_) {}

  return null;
}

/**
 * Récupère le décompte en direct des jobs BullMQ (waiting, active, completed, failed).
 */
export async function getQueueMetrics() {
  try {
    const counts = await musicQueue.getJobCounts(
      "waiting",
      "active",
      "completed",
      "failed",
      "delayed",
      "paused"
    );
    return {
      isAvailable: true,
      counts: {
        waiting: counts.waiting || 0,
        active: counts.active || 0,
        completed: counts.completed || 0,
        failed: counts.failed || 0,
      },
    };
  } catch (err) {
    return {
      isAvailable: false,
      counts: null,
      error: err.message,
    };
  }
}

/**
 * Purge les jobs terminés et échoués de la file BullMQ.
 */
export async function purgeQueue() {
  try {
    await musicQueue.clean(0, 1000, "completed");
    await musicQueue.clean(0, 1000, "failed");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export default musicQueue;

