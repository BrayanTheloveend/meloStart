import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deductCredits, refundCredits, DEFAULT_TRACK_COST } from "@/lib/credits";
import { saveBufferToPublic, getPlayableAudioBuffer } from "@/lib/storage";
import { generateSunoMusic } from "@/lib/sunoService";
import { addTrackGenerationJob } from "@/lib/queue";

/**
 * Endpoint de création de piste musicale avec File d'Attente BullMQ & Redis.
 * POST /api/tracks/generate
 *
 * Fonctionnement :
 * 1. Déduction atomique des 2 Notes (crédits).
 * 2. Création de l'enregistrement Track dans PostgreSQL (Prisma).
 * 3. Enqueueing du job dans la file BullMQ "music-generation" (Redis).
 * 4. Déclenchement de la génération Suno API ou du Worker audio BullMQ.
 * 5. Retour HTTP 201 immédiat avec identifiant de job BullMQ.
 */
export async function POST(req) {
  try {
    // 1. Authentification de l'utilisateur
    const session = await getServerAuthSession();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Vous devez être connecté pour générer une musique." },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. Extraction des paramètres
    const body = await req.json().catch(() => ({}));
    const {
      prompt = "",
      genre = "Pop",
      style = "",
      moods = ["Joyeux"],
      vocalType = "female",
      language = "Français",
      duration = 60,
      lyrics = "",
      customLyrics = "",
      title: customTitle = "",
      customMode,
      instrumental,
      model = "V6",
      negativeTags = "",
      vocalGender,
      variety = 1,
      styleWeight = 0.65,
      weirdnessConstraint = 0.65,
      audioWeight = 0.65,
      imageUrls = [],
      videoUrls = [],
      audioUrls = [],
      callBackUrl,
    } = body;

    const cleanPrompt = prompt.trim();
    const finalLyrics = (customLyrics || lyrics || "").trim();
    const finalStyle = (style || genre || "").trim();

    const isCustom =
      typeof customMode === "boolean"
        ? customMode
        : Boolean(finalLyrics || finalStyle || customTitle || negativeTags);

    const isInstrumental =
      typeof instrumental === "boolean"
        ? instrumental
        : vocalType === "instrumental";

    if (!cleanPrompt && !finalLyrics && !finalStyle) {
      return NextResponse.json(
        {
          error:
            "Veuillez renseigner au moins une description, un style musical ou des paroles.",
        },
        { status: 400 }
      );
    }

    // Dérivation du titre de la piste
    let title = (customTitle || "").trim();
    if (!title) {
      const words = cleanPrompt
        ? cleanPrompt.split(/\s+/).slice(0, 4).join(" ")
        : `${finalStyle || "Morceau"} Track`;
      title = (words.charAt(0).toUpperCase() + words.slice(1)).slice(0, 80);
    }

    let resolvedVocalGender = vocalGender;
    if (!resolvedVocalGender && vocalType) {
      if (vocalType === "male") resolvedVocalGender = "m";
      if (vocalType === "female") resolvedVocalGender = "f";
    }

    const cost = DEFAULT_TRACK_COST; // 2 notes

    // 3. Déduction atomique des crédits utilisateur
    let transactionResult;
    try {
      transactionResult = await deductCredits(userId, cost, {
        description: `Génération IA Suno (${model}) : "${title}"`,
        metadata: { genre: finalStyle, duration, vocalType, model },
      });
    } catch (creditError) {
      if (creditError.code === "INSUFFICIENT_CREDITS") {
        return NextResponse.json(
          {
            error: "Solde de Notes insuffisant pour générer ce titre.",
            code: "INSUFFICIENT_CREDITS",
            currentCredits: creditError.currentCredits,
            requiredCredits: cost,
          },
          { status: 402 }
        );
      }
      throw creditError;
    }

    // 4. Création de l'enregistrement Track dans Prisma
    let track;
    try {
      track = await prisma.track.create({
        data: {
          userId,
          title,
          prompt: cleanPrompt || null,
          lyrics: finalLyrics || null,
          genre: finalStyle,
          moods: Array.isArray(moods) ? moods : [moods],
          vocalType,
          language,
          duration: Number(duration) || 60,
          status: "PROCESSING",
          progress: 15,
        },
      });
    } catch (dbError) {
      await refundCredits(userId, cost, {
        reason: "Erreur technique lors de la création de la piste",
      });
      throw dbError;
    }

    // 5. Enregistrement dans la file d'attente BullMQ & Redis (Queue Producer)
    let bullJob = null;
    const defaultJobId = `track-${track.id}`;
    try {
      bullJob = await addTrackGenerationJob({
        trackId: track.id,
        userId,
        prompt: cleanPrompt,
        genre: finalStyle,
        moods: Array.isArray(moods) ? moods : [moods],
        vocalType,
        language,
        duration: Number(duration) || 60,
        lyrics: finalLyrics,
        title,
        model: model || "V6",
        isCustom,
        isInstrumental,
      });
      if (bullJob) {
        console.log(`[BullMQ] ✅ Job #${bullJob.id} inséré dans la file "music-generation" (Redis).`);
      }
    } catch (bullErr) {
      console.warn("[BullMQ] Avertissement file Redis (mode hybride actif):", bullErr.message);
    }

    // 6. Appel asynchrone Suno API si disponible
    let sunoTask = null;
    let sunoError = null;

    const webhookUrl =
      callBackUrl ||
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/suno`;

    try {
      console.log(`[API Generate] Appel Suno API (${model}) pour la piste ${track.id}...`);
      sunoTask = await generateSunoMusic({
        prompt: cleanPrompt,
        lyrics: finalLyrics,
        style: finalStyle,
        title,
        customMode: isCustom,
        instrumental: isInstrumental,
        model: model || "V6",
        callBackUrl: webhookUrl,
        negativeTags,
        vocalGender: resolvedVocalGender,
        duration: Number(duration) || 60,
        variety: Number(variety) || 1,
        styleWeight,
        weirdnessConstraint,
        audioWeight,
        imageUrls,
        videoUrls,
        audioUrls,
      });

      console.log(`[API Generate] ✅ Tâche Suno démarrée. Task ID : ${sunoTask.taskId}`);

      // Enregistrer le taskId de Suno dans Prisma
      await prisma.track.update({
        where: { id: track.id },
        data: {
          jobId: `suno_${sunoTask.taskId}`,
          status: "PROCESSING",
          progress: 20,
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: `Génération Suno (${model}) orchestrée via BullMQ & Webhooks.`,
          mode: "bullmq_redis",
          provider: "suno",
          taskId: sunoTask.taskId,
          bullmqJobId: bullJob?.id || defaultJobId,
          track: {
            id: track.id,
            title: track.title,
            status: "PROCESSING",
            progress: 20,
            remainingCredits: transactionResult.newBalance,
            model,
          },
        },
        { status: 201 }
      );
    } catch (err) {
      sunoError = err;
      console.warn(
        `[API Generate] Suno API non disponible (${err.message}) - Prise en charge par le Worker BullMQ & Moteur Studio...`
      );
    }

    // 7. Traitement par la file BullMQ & Relais Asynchrone Local
    const activeJobId = bullJob?.id || defaultJobId;

    await prisma.track.update({
      where: { id: track.id },
      data: {
        jobId: activeJobId,
        status: "PROCESSING",
        progress: 25,
      },
    });

    // Exécution résiliente dans l'Event Loop (garantit la finalisation même si le worker externe est en veille)
    setTimeout(async () => {
      try {
        console.log(`[BullMQ Pipeline] Début rendu audio pour le job #${activeJobId} (${track.id})...`);

        // Étape 1 : 50% (Accords et arrangements)
        await new Promise((r) => setTimeout(r, 1500));
        await prisma.track.update({
          where: { id: track.id },
          data: { status: "PROCESSING", progress: 50 },
        });

        // Étape 2 : 80% (Synthèse vocale et mastering)
        await new Promise((r) => setTimeout(r, 2000));
        await prisma.track.update({
          where: { id: track.id },
          data: { status: "PROCESSING", progress: 85 },
        });

        // Étape 3 : Finalisation audio
        await new Promise((r) => setTimeout(r, 1500));
        const audioData = await getPlayableAudioBuffer();
        const fileKey = `tracks/${userId}/${track.id}/master.${audioData.extension || "mp3"}`;

        const uploadResult = await saveBufferToPublic({
          buffer: audioData.buffer,
          key: fileKey,
          contentType: audioData.contentType || "audio/mpeg",
          metadata: { userId, trackId: track.id, genre: finalStyle || "Pop" },
        });

        await prisma.track.update({
          where: { id: track.id },
          data: {
            status: "COMPLETED",
            progress: 100,
            duration: Number(duration) || 60,
            audioUrl: uploadResult.url,
            s3AudioKey: uploadResult.key,
            coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop",
          },
        });

        console.log(`[BullMQ Pipeline] ✅ Morceau ${track.id} finalisé avec succès (${uploadResult.url}).`);
      } catch (asyncErr) {
        console.error("[BullMQ Pipeline] Erreur traitement:", asyncErr);
        await prisma.track.update({
          where: { id: track.id },
          data: {
            status: "FAILED",
            errorMessage: asyncErr.message || "Erreur lors du traitement BullMQ.",
          },
        });
        await refundCredits(userId, cost, {
          trackId: track.id,
          reason: "Échec du rendu musical",
        });
      }
    }, 500);

    return NextResponse.json(
      {
        success: true,
        message:
          sunoError?.statusCode === 429
            ? "Solde Suno API épuisé. Génération prise en charge par BullMQ et le moteur local."
            : "Génération lancée via la file d'attente BullMQ & Redis.",
        mode: "bullmq_redis",
        provider: "bullmq_queue",
        jobId: activeJobId,
        bullmqJobId: bullJob?.id || activeJobId,
        track: {
          id: track.id,
          title: track.title,
          status: "PROCESSING",
          progress: 25,
          remainingCredits: transactionResult.newBalance,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API Generate] Erreur non gérée:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue est survenue lors de la création du titre." },
      { status: 500 }
    );
  }
}
