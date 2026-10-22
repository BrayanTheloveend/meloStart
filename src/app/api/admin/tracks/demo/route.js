import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveBufferToPublic } from "@/lib/storage";
import { generateSunoMusic } from "@/lib/sunoService";

/**
 * POST /api/admin/tracks/demo
 * Endpoint permettant à l'administrateur de créer une musique de démonstration
 * directement audible sur la page d'accueil.
 *
 * Supporte :
 * 1. Création avec fichier audio uploadé (MP3/WAV direct sans consommer de crédits)
 * 2. Création avec génération IA Suno V6
 * 3. Création avec URL audio externe
 */
export async function POST(req) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès refusé. Privilèges administrateur requis." },
        { status: 403 }
      );
    }

    const adminId = session.user.id;
    const contentType = req.headers.get("content-type") || "";

    let title = "";
    let genre = "Afrobeat";
    let prompt = "";
    let lyrics = "";
    let moods = ["Joyeux", "Solaire"];
    let vocalType = "female";
    let language = "Français";
    let isPublic = true;
    let coverUrl = "";
    let generateWithAI = false;
    let audioBuffer = null;
    let audioMimeType = "audio/mpeg";
    let audioExtension = "mp3";
    let audioUrlDirect = "";

    // 1. Extraction selon le type de requête (Multipart FormData ou JSON)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      title = (formData.get("title") || "").toString().trim();
      genre = (formData.get("genre") || "Afrobeat").toString().trim();
      prompt = (formData.get("prompt") || "").toString().trim();
      lyrics = (formData.get("lyrics") || "").toString().trim();
      vocalType = (formData.get("vocalType") || "female").toString().trim();
      language = (formData.get("language") || "Français").toString().trim();
      coverUrl = (formData.get("coverUrl") || "").toString().trim();
      generateWithAI = formData.get("generateWithAI") === "true";
      isPublic = formData.get("isPublic") !== "false";

      const rawMoods = formData.get("moods");
      if (rawMoods) {
        try {
          moods = JSON.parse(rawMoods);
        } catch (_) {
          moods = rawMoods.toString().split(",").map((m) => m.trim()).filter(Boolean);
        }
      }

      const file = formData.get("audioFile");
      if (file && typeof file.arrayBuffer === "function") {
        const bytes = await file.arrayBuffer();
        if (bytes.byteLength > 0) {
          audioBuffer = Buffer.from(bytes);
          audioMimeType = file.type || "audio/mpeg";
          if (file.name?.endsWith(".wav")) audioExtension = "wav";
          else if (file.name?.endsWith(".ogg")) audioExtension = "ogg";
          else audioExtension = "mp3";
        }
      }
    } else {
      const body = await req.json().catch(() => ({}));
      title = (body.title || "").trim();
      genre = (body.genre || "Afrobeat").trim();
      prompt = (body.prompt || "").trim();
      lyrics = (body.lyrics || "").trim();
      vocalType = (body.vocalType || "female").trim();
      language = (body.language || "Français").trim();
      coverUrl = (body.coverUrl || "").trim();
      generateWithAI = Boolean(body.generateWithAI);
      isPublic = body.isPublic !== false;
      audioUrlDirect = (body.audioUrl || "").trim();

      if (Array.isArray(body.moods)) moods = body.moods;
      else if (typeof body.moods === "string") moods = body.moods.split(",").map((m) => m.trim());
    }

    if (!title) {
      title = `Démo ${genre} - ${new Date().toLocaleDateString("fr-FR")}`;
    }

    // Image de couverture thématique par défaut si non renseignée
    if (!coverUrl) {
      const defaultCovers = {
        Afrobeat: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&h=500&fit=crop",
        Pop: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&h=500&fit=crop",
        "Lo-fi": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&h=500&fit=crop",
        Rap: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&h=500&fit=crop",
        Électro: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&h=500&fit=crop",
      };
      coverUrl = defaultCovers[genre] || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&h=500&fit=crop";
    }

    // 2. Création de la piste en base de données
    const track = await prisma.track.create({
      data: {
        userId: adminId,
        title,
        prompt: prompt || `Morceau de démonstration ${genre} pour l'accueil`,
        lyrics: lyrics || null,
        genre,
        moods,
        vocalType,
        language,
        duration: 75,
        status: generateWithAI ? "PROCESSING" : "COMPLETED",
        progress: generateWithAI ? 20 : 100,
        isPublic,
        coverUrl,
        audioUrl: audioUrlDirect || null,
      },
    });

    // 3. Option A : Sauvegarde du fichier audio local uploadé
    if (audioBuffer) {
      const fileKey = `tracks/${adminId}/${track.id}/master.${audioExtension}`;
      const saved = await saveBufferToPublic({
        buffer: audioBuffer,
        key: fileKey,
        contentType: audioMimeType,
        metadata: { trackId: track.id, type: "demo_admin" },
      });

      const updated = await prisma.track.update({
        where: { id: track.id },
        data: {
          audioUrl: saved.url,
          s3AudioKey: saved.key,
          status: "COMPLETED",
          progress: 100,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Musique démo créée avec fichier audio et publiée à l'accueil !",
        track: updated,
      }, { status: 201 });
    }

    // 4. Option B : Génération via Suno AI
    if (generateWithAI) {
      const isCustomMode = Boolean(lyrics && lyrics.trim());
      const isInstrumental = vocalType === "instrumental";

      try {
        const sunoTask = await generateSunoMusic({
          prompt: prompt?.trim() || `Chanson ${genre} solaire et entraînante pour l'accueil`,
          lyrics: lyrics?.trim() || undefined,
          style: genre,
          title: title?.trim() || `${genre} Demo`,
          customMode: isCustomMode,
          instrumental: isInstrumental,
          model: "V6",
          callBackUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/suno`,
        });

        const updated = await prisma.track.update({
          where: { id: track.id },
          data: {
            jobId: `suno_${sunoTask.taskId}`,
            status: "PROCESSING",
            progress: 25,
          },
        });

        return NextResponse.json({
          success: true,
          message: "Génération IA Suno V6 lancée pour la démo d'accueil !",
          taskId: sunoTask.taskId,
          track: updated,
        }, { status: 201 });
      } catch (aiErr) {
        console.warn("[Admin Demo] Erreur Suno AI:", aiErr.message);
        await prisma.track.update({
          where: { id: track.id },
          data: {
            status: "FAILED",
            errorMessage: aiErr.message || "Erreur de connexion Suno AI",
          },
        });
        return NextResponse.json(
          { error: `Échec du lancement Suno AI : ${aiErr.message}` },
          { status: 502 }
        );
      }
    }

    // 5. Option C : Morceau avec audio direct ou prêt à l'emploi
    return NextResponse.json({
      success: true,
      message: "Morceau de démonstration créé pour l'accueil !",
      track,
    }, { status: 201 });
  } catch (error) {
    console.error("[API Admin Demo Track] Erreur :", error);
    return NextResponse.json(
      { error: "Impossible de créer la musique de démonstration." },
      { status: 500 }
    );
  }
}
