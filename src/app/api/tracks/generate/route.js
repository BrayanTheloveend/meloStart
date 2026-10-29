import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deductCredits, refundCredits, DEFAULT_TRACK_COST } from "@/lib/credits";
import { generateSunoMusic } from "@/lib/sunoService";
import { addTrackGenerationJob } from "@/lib/queue";

/**
 * POST /api/tracks/generate
 * Approche simple, directe et 100% conforme à la documentation officielle Suno API.
 * https://docs.sunoapi.org/suno-api/generate-music
 *
 * Règles :
 * 1. Authentification requise.
 * 2. Vérification et déduction atomique des 2 Notes (DEFAULT_TRACK_COST).
 * 3. Création de la piste dans la base PostgreSQL (Prisma).
 * 4. Appel direct de l'API Suno avec les paramètres stricts du mode choisi :
 *    - Mode Non-Personnalisé (customMode: false) : prompt, style, lyrics, imageUrls, videoUrls, audioUrls, instrumental, model.
 *    - Mode Personnalisé (customMode: true) : title, lyrics, style, prompt, negativeTags, vocalGender, duration, instrumental, model.
 * 5. Si Suno réussit : enregistrement de suno_${taskId} et retour 201.
 * 6. Si Suno échoue : remboursement immédiat des 2 Notes et notification d'erreur réelle (aucune fausse musique).
 */
export async function POST(req) {
  let userId = null;
  let track = null;
  const cost = DEFAULT_TRACK_COST; // 2 Notes

  try {
    // 1. Authentification
    const session = await getServerAuthSession();
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Vous devez être connecté pour générer une musique." },
        { status: 401 }
      );
    }

    userId = session.user.id;

    // 2. Récupération des données du formulaire
    const body = await req.json().catch(() => ({}));
    const {
      customMode = false,
      instrumental = false,
      model = "V6",
      // Mode Non-Personnalisé
      prompt = "",
      style = "",
      lyrics = "",
      imageUrls = [],
      videoUrls = [],
      audioUrls = [],
      // Cover uploadée par l'utilisateur
      coverUrl = null,
      // Mode Personnalisé
      title = "",
      negativeTags = "",
      vocalGender = null,
      duration = null,
      callBackUrl = null,
      isPublic: reqIsPublic,
    } = body;

    const isCustom = Boolean(customMode);
    const isInstrumental = Boolean(instrumental);
    const isAdmin = session.user?.role === "ADMIN";
    const trackIsPublic = reqIsPublic !== undefined ? Boolean(reqIsPublic) : Boolean(isAdmin);

    // Validation des entrées selon la documentation Suno
    if (isCustom) {
      if (!lyrics?.trim() && !prompt?.trim() && !style?.trim()) {
        return NextResponse.json(
          { error: "En mode personnalisé, veuillez renseigner les paroles, une description ou un style de musique." },
          { status: 400 }
        );
      }
    } else {
      if (!prompt?.trim() && !style?.trim() && !lyrics?.trim() && !imageUrls?.length && !videoUrls?.length && !audioUrls?.length) {
        return NextResponse.json(
          { error: "Veuillez renseigner une description de chanson ou un style musical." },
          { status: 400 }
        );
      }
    }

    // 3. Déduction atomique des 2 Notes
    let transactionResult;
    try {
      transactionResult = await deductCredits(userId, cost, {
        description: `Génération IA Suno (${model}) : ${isCustom ? title || "Mode Personnalisé" : prompt.slice(0, 30) || style || "Mode Simple"}`,
        metadata: {
          model,
          customMode: isCustom,
          instrumental: isInstrumental,
        },
      });
    } catch (creditError) {
      if (creditError.code === "INSUFFICIENT_CREDITS") {
        return NextResponse.json(
          {
            error: "Solde de Notes insuffisant. Chaque génération nécessite 2 Notes.",
            code: "INSUFFICIENT_CREDITS",
            currentCredits: creditError.currentCredits,
            requiredCredits: cost,
          },
          { status: 402 }
        );
      }
      throw creditError;
    }

    // 4. Détermination du titre et informations de la piste
    let derivedTitle = "";
    if (isCustom && title?.trim()) {
      derivedTitle = title.trim().slice(0, 80);
    } else if (prompt?.trim()) {
      const words = prompt.trim().split(/\s+/).slice(0, 5).join(" ");
      derivedTitle = words.charAt(0).toUpperCase() + words.slice(1);
    } else if (style?.trim()) {
      derivedTitle = `${style.trim().split(",")[0]} Pretymelo`;
    } else {
      derivedTitle = "Nouvelle Création IA";
    }

    const vocalTypeValue = isInstrumental
      ? "instrumental"
      : vocalGender === "m"
      ? "male"
      : vocalGender === "f"
      ? "female"
      : "female";

    // 5. Création de la piste dans Prisma
    track = await prisma.track.create({
      data: {
        userId,
        title: derivedTitle,
        prompt: prompt?.trim() || style?.trim() || "Génération musicale IA",
        lyrics: lyrics?.trim() || null,
        genre: style?.trim() || "Pop",
        moods: [],
        vocalType: vocalTypeValue,
        language: "Français",
        duration: Number(duration) || 180,
        status: "PROCESSING",
        progress: 15,
        isPublic: trackIsPublic,
        ...(coverUrl ? { coverUrl } : {}),
      },
    });

    // 6. Appel direct à l'API Suno selon la documentation officielle
    let sunoResult;
    try {
      console.log(`[API Generate] Lancement Suno (${model}) - Mode ${isCustom ? "Custom" : "Standard"}`);

      sunoResult = await generateSunoMusic({
        customMode: isCustom,
        instrumental: isInstrumental,
        model,
        // Paramètres standard
        prompt: prompt?.trim(),
        style: style?.trim(),
        lyrics: lyrics?.trim(),
        imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
        videoUrls: Array.isArray(videoUrls) ? videoUrls : [],
        audioUrls: Array.isArray(audioUrls) ? audioUrls : [],
        // Paramètres personnalisés
        title: derivedTitle,
        negativeTags: negativeTags?.trim(),
        vocalGender: vocalGender === "m" || vocalGender === "f" ? vocalGender : null,
        duration: typeof duration === "number" ? duration : undefined,
        callBackUrl:
          callBackUrl ||
          process.env.SUNO_WEBHOOK_URL ||
          (process.env.NEXT_PUBLIC_APP_URL
            ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/api/webhooks/suno`
            : null),
      });

      console.log(`[API Generate] ✅ Tâche Suno créée ! Task ID: ${sunoResult.taskId}`);

      // Enregistrement du taskId Suno dans la base de données
      const updatedTrack = await prisma.track.update({
        where: { id: track.id },
        data: {
          jobId: `suno_${sunoResult.taskId}`,
          status: "PROCESSING",
          progress: 20,
        },
      });

      // Enregistrement non-bloquant du job dans la file BullMQ
      await addTrackGenerationJob({
        trackId: track.id,
        userId,
        title: derivedTitle,
        prompt: prompt?.trim() || style?.trim(),
        genre: style?.trim() || "Pop",
        lyrics: lyrics?.trim(),
        duration: Number(duration) || 180,
        model,
        sunoTaskId: sunoResult.taskId,
        coverUrl: coverUrl?.trim() || null,
      }).catch((queueErr) => {
        console.warn("[BullMQ] Enregistrement job queue ignoré :", queueErr.message);
      });

      return NextResponse.json(
        {
          success: true,
          taskId: sunoResult.taskId,
          track: {
            id: updatedTrack.id,
            title: updatedTrack.title,
            status: "PROCESSING",
            progress: 20,
            remainingCredits: transactionResult.newBalance,
            model: sunoResult.model,
          },
        },
        { status: 201 }
      );
    } catch (sunoError) {
      console.error(`[API Generate] ❌ Erreur Suno API :`, sunoError.message);

      // Remboursement immédiat des crédits
      await refundCredits(userId, cost, {
        trackId: track?.id,
        reason: `Échec Suno API: ${sunoError.message}`,
      }).catch((refundErr) => {
        console.error("[API Generate] Erreur lors du remboursement:", refundErr);
      });

      // Mise à jour de la piste comme échouée
      if (track?.id) {
        await prisma.track.update({
          where: { id: track.id },
          data: {
            status: "FAILED",
            progress: 0,
            errorMessage: sunoError.message || "Erreur lors de la génération Suno API",
          },
        }).catch(() => {});
      }

      return NextResponse.json(
        {
          error: sunoError.message || "Impossible de démarrer la génération musicale Suno. Vos 2 Notes ont été remboursées.",
          refunded: true,
          code: "SUNO_API_ERROR",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("[API Generate] Erreur serveur critique:", error);

    // En cas d'exception inattendue, rembourser si nécessaire
    if (userId && track?.id) {
      await refundCredits(userId, cost, {
        trackId: track.id,
        reason: "Erreur serveur inattendue",
      }).catch(() => {});

      await prisma.track.update({
        where: { id: track.id },
        data: {
          status: "FAILED",
          errorMessage: error.message,
        },
      }).catch(() => {});
    }

    return NextResponse.json(
      {
        error: error.message || "Une erreur inattendue est survenue lors de la création du morceau.",
      },
      { status: 500 }
    );
  }
}