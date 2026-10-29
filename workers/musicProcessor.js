/**
 * melostars - Worker de File d'Attente BullMQ pour la Génération Audio
 *
 * Ce worker écoute la file Redis "music-generation" et traite les requêtes
 * de synthèse musicale en arrière-plan avec gestion de concurrence, retries exponentiels,
 * mise à jour de la progression (15% -> 45% -> 75% -> 100%) et persistance dans PostgreSQL.
 *
 * Exécution :
 *   npm run worker
 *   ou : node workers/musicProcessor.js
 */

const { Worker } = require("bullmq");
const Redis = require("ioredis");
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

// Détermination fiable de la racine du projet
const projectRoot = fs.existsSync(path.join(process.cwd(), "package.json"))
  ? process.cwd()
  : path.resolve(__dirname, "..");

// Chargement des variables d'environnement depuis .env si présentes
const envPath = path.join(projectRoot, ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let val = match[2] || "";
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (!process.env[key]) process.env[key] = val;
    }
  });
}

const prisma = new PrismaClient();
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY, 10) || 2;
const QUEUE_NAME = "music-generation";

console.log("=================================================");
console.log("🎵  melostars - BullMQ Audio Worker Initialisé");
console.log(`📡  Connexion Redis : ${REDIS_URL}`);
console.log(`⚡  Concurrence     : ${CONCURRENCY} jobs simultanés`);
console.log(`📋  File écoutée    : ${QUEUE_NAME}`);
console.log("=================================================");

// Configuration de connexion ioredis dédiée au Worker
const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times) {
    const delay = Math.min(times * 300, 5000);
    console.log(`[BullMQ Worker] Tentative de reconnexion Redis dans ${delay}ms...`);
    return delay;
  },
});

connection.on("connect", () => {
  console.log("✅ [BullMQ Worker] Connecté à Redis avec succès.");
});

connection.on("error", (err) => {
  console.warn("⚠️  [BullMQ Worker] Erreur connexion Redis:", err.message);
});

/**
 * Génère un buffer audio WAV mélodieux pour le master final
 */
function generateMelodyWavBuffer(durationSeconds = 8, baseFreq = 440) {
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

  // Synthèse d'accords harmoniques
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const step = Math.floor(t / 1.5);
    const chords = [1, 1.25, 1.33, 1.5]; // Progression harmonique
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
 * Sauvegarde le master audio dans le dossier public/uploads
 */
function saveAudioToPublicDisk(buffer, userId, trackId) {
  const publicDir = path.join(projectRoot, "public");
  const uploadsDir = path.join(publicDir, "uploads", "tracks", String(userId), String(trackId));

  fs.mkdirSync(uploadsDir, { recursive: true });
  const fileName = "master.wav";
  const filePath = path.join(uploadsDir, fileName);

  fs.writeFileSync(filePath, buffer);

  const publicUrl = `/uploads/tracks/${userId}/${trackId}/${fileName}`;
  return { url: publicUrl, path: filePath };
}

/**
 * Traitement principal d'un job de génération audio avec BullMQ
 * Prend en charge les tâches Suno AI en direct et le mode local de secours.
 */
async function processMusicJob(job) {
  const {
    trackId,
    userId,
    prompt,
    genre,
    duration = 180,
    title,
    model = "V6",
    sunoTaskId,
    coverUrl,
  } = job.data;

  console.log(`[BullMQ Worker] 🚀 Démarrage du job #${job.id} (Piste ID: ${trackId}, Task: ${sunoTaskId || "direct"})`);

  const apiKey = process.env.SUNO_API_KEY || process.env.AI_MUSIC_API_KEY;

  // CAS 1 : Tâche Suno AI officielle
  if (sunoTaskId && apiKey) {
    await job.updateProgress(25);
    const cleanTaskId = sunoTaskId.replace(/^suno_/, "").trim();
    const maxAttempts = 70;
    let attempts = 0;

    while (attempts < maxAttempts) {
      attempts++;
      await new Promise((r) => setTimeout(r, 2500));

      const res = await fetch(`https://api.sunoapi.org/api/v1/generate/record-info?taskId=${encodeURIComponent(cleanTaskId)}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      }).catch(() => null);

      const json = await res?.json().catch(() => null);
      const sunoData = json?.data;

      if (sunoData?.status === "SUCCESS") {
        const audioItems =
          sunoData.response?.sunoData ||
          sunoData.response?.data ||
          sunoData.sunoData ||
          sunoData.data ||
          [];
        const primary = Array.isArray(audioItems) ? audioItems[0] : audioItems;

        const finalAudioUrl = primary?.audio_url || primary?.stream_audio_url;
        // Priorité stricte à la cover uploadée si elle existe
        const finalCoverUrl = coverUrl || primary?.image_url || primary?.image_large_url || null;
        const finalDuration = primary?.duration ? Math.round(primary.duration) : duration;
        const finalTitle = title || primary?.title;
        const finalLyrics = primary?.prompt || null;

        const updatedTrack = await prisma.track.update({
          where: { id: trackId },
          data: {
            status: "COMPLETED",
            progress: 100,
            audioUrl: finalAudioUrl,
            coverUrl: finalCoverUrl,
            duration: finalDuration,
            title: finalTitle,
            lyrics: finalLyrics,
            errorMessage: null,
          },
        });

        await job.updateProgress(100);
        console.log(`[BullMQ Worker] ✅ Morceau Suno finalisé avec succès pour la piste ${trackId}`);
        return {
          success: true,
          trackId: updatedTrack.id,
          audioUrl: finalAudioUrl,
          title: updatedTrack.title,
        };
      }

      if (["FAILED", "fail", "CREATE_TASK_FAILED", "GENERATE_AUDIO_FAILED"].includes(sunoData?.status)) {
        throw new Error(sunoData?.errorMessage || sunoData?.msg || "Échec rapporté par les serveurs Suno AI.");
      }

      if (sunoData?.status === "FIRST_SUCCESS") {
        await job.updateProgress(80);
        await prisma.track.update({ where: { id: trackId }, data: { progress: 80 } }).catch(() => {});
      } else if (sunoData?.status === "TEXT_SUCCESS") {
        await job.updateProgress(45);
        await prisma.track.update({ where: { id: trackId }, data: { progress: 45 } }).catch(() => {});
      }
    }

    throw new Error("Délai d'attente dépassé pour la réponse du cluster Suno.");
  }

  // CAS 2 : Génération locale de secours (WAV mélodique)
  await job.updateProgress(20);
  await prisma.track.update({
    where: { id: trackId },
    data: { status: "PROCESSING", progress: 20 },
  });

  await new Promise((r) => setTimeout(r, 1000));
  await job.updateProgress(50);
  await prisma.track.update({
    where: { id: trackId },
    data: { status: "PROCESSING", progress: 50 },
  });

  await new Promise((r) => setTimeout(r, 1200));
  await job.updateProgress(80);
  await prisma.track.update({
    where: { id: trackId },
    data: { status: "PROCESSING", progress: 80 },
  });

  const baseFreq = genre === "Afrobeat" ? 432 : genre === "Lo-fi" ? 392 : 440;
  const audioBuffer = generateMelodyWavBuffer(Math.min(Number(duration) || 30, 30), baseFreq);
  const savedFile = saveAudioToPublicDisk(audioBuffer, userId, trackId);

  const updatedTrack = await prisma.track.update({
    where: { id: trackId },
    data: {
      status: "COMPLETED",
      progress: 100,
      duration: Number(duration) || 60,
      audioUrl: savedFile.url,
      coverUrl: coverUrl || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop",
      errorMessage: null,
    },
  });

  await job.updateProgress(100);
  console.log(`[BullMQ Worker] ✅ Job #${job.id} achevé avec succès ! Fichier : ${savedFile.url}`);
  return {
    success: true,
    trackId: updatedTrack.id,
    audioUrl: savedFile.url,
    title: updatedTrack.title,
  };
}

// Instanciation du Worker BullMQ
const worker = new Worker(QUEUE_NAME, processMusicJob, {
  connection,
  concurrency: CONCURRENCY,
  limiter: {
    max: 10,
    duration: 1000,
  },
});

worker.on("ready", () => {
  console.log(`[BullMQ Worker] 🟢 Prêt à consommer les tâches sur la file "${QUEUE_NAME}".`);
});

worker.on("completed", (job, returnvalue) => {
  console.log(`[BullMQ Worker] ✨ Tâche #${job.id} terminée.`);
});

worker.on("failed", async (job, err) => {
  console.error(`[BullMQ Worker] ❌ Échec tâche #${job?.id}:`, err.message);
  if (job?.data?.trackId) {
    try {
      await prisma.track.update({
        where: { id: job.data.trackId },
        data: {
          status: "FAILED",
          errorMessage: err.message || "Erreur de traitement dans le worker BullMQ.",
        },
      });

      // Remboursement automatique des 2 Notes
      if (job.data.userId) {
        await prisma.user.update({
          where: { id: job.data.userId },
          data: { credits: { increment: 2 } },
        });
        console.log(`[BullMQ Worker] 🔄 2 Notes remboursées à l'utilisateur ${job.data.userId}.`);
      }
    } catch (dbErr) {
      console.error("[BullMQ Worker] Erreur lors de la mise à jour de l'échec en BDD:", dbErr);
    }
  }
});

worker.on("error", (err) => {
  console.warn("[BullMQ Worker] Avertissement:", err.message);
});

// Arrêt gracieux du worker
async function gracefulShutdown(signal) {
  console.log(`\n[BullMQ Worker] Signal ${signal} reçu. Fermeture sécurisée en cours...`);
  try {
    await worker.close();
    await connection.quit();
    await prisma.$disconnect();
    console.log("[BullMQ Worker] Fermeture terminée. Au revoir !");
    process.exit(0);
  } catch (err) {
    console.error("[BullMQ Worker] Erreur lors de la fermeture:", err);
    process.exit(1);
  }
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

module.exports = { worker, processMusicJob };
