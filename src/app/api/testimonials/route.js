import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/testimonials
 * Récupère les témoignages approuvés pour la landing page et les avis publics.
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 6, 1), 30);

    const testimonials = await prisma.testimonial.findMany({
      where: { isApproved: true },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        name: true,
        role: true,
        text: true,
        rating: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, testimonials });
  } catch (error) {
    console.error("[GET /api/testimonials] Erreur :", error);
    return NextResponse.json(
      { error: "Impossible de charger les avis." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/testimonials
 * Création d'un avis utilisateur (laissé après génération d'une musique ou spontanément).
 */
export async function POST(req) {
  try {
    const session = await getServerAuthSession();
    const body = await req.json().catch(() => ({}));

    const {
      text = "",
      rating = 5,
      name = "",
      role = "",
      trackId = null,
    } = body;

    const cleanText = typeof text === "string" ? text.trim() : "";
    if (!cleanText || cleanText.length < 5) {
      return NextResponse.json(
        { error: "Votre avis doit comporter au moins 5 caractères." },
        { status: 400 }
      );
    }

    const cleanRating = Math.min(Math.max(Number(rating) || 5, 1), 5);

    // Détermination de l'auteur
    const authorName =
      (typeof name === "string" && name.trim()) ||
      session?.user?.name ||
      "Créateur pretymelo";

    const authorRole =
      (typeof role === "string" && role.trim()) ||
      "Créateur pretymelo";

    const avatarUrl = session?.user?.image || null;
    const userId = session?.user?.id || null;

    const newTestimonial = await prisma.testimonial.create({
      data: {
        userId,
        name: authorName,
        role: authorRole,
        avatarUrl,
        rating: cleanRating,
        text: cleanText.slice(0, 1000),
        trackId: typeof trackId === "string" ? trackId.trim() : null,
        isApproved: true, // Approuvé par défaut pour affichage immédiat
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Merci infiniment pour votre retour !",
        testimonial: newTestimonial,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/testimonials] Erreur :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'enregistrement de votre avis." },
      { status: 500 }
    );
  }
}

