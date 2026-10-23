import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/tracks
 * Récupère les pistes :
 * - Si `public=true` : liste des pistes publiques de la communauté
 * - Si connecté : liste des pistes personnelles de l'utilisateur connecté
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const isPublic = searchParams.get("public") === "true";
    const status = searchParams.get("status");
    const genre = searchParams.get("genre");
    const search = searchParams.get("search");
    const favorite = searchParams.get("favorite");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const session = await getServerAuthSession();

    // Condition WHERE
    const where = {};

    if (isPublic) {
      where.status = "COMPLETED";
      where.AND = [
        {
          OR: [
            { isPublic: true },
            { user: { role: "ADMIN" } },
          ],
        },
      ];
    } else {
      if (!session?.user?.id) {
        // Utilisateur non connecté demandant ses pistes -> fallback sur pistes publiques
        where.status = "COMPLETED";
        where.AND = [
          {
            OR: [
              { isPublic: true },
              { user: { role: "ADMIN" } },
            ],
          },
        ];
      } else {
        where.userId = session.user.id;
      }
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (genre && genre !== "ALL") {
      where.genre = { contains: genre, mode: "insensitive" };
    }

    if (favorite === "true") {
      where.isFavorite = true;
    }

    if (search) {
      const searchFilter = {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { prompt: { contains: search, mode: "insensitive" } },
          { genre: { contains: search, mode: "insensitive" } },
        ],
      };
      if (where.AND) {
        where.AND.push(searchFilter);
      } else {
        where.OR = searchFilter.OR;
      }
    }

    const [tracks, total] = await Promise.all([
      prisma.track.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
        },
      }),
      prisma.track.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: tracks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[API Tracks GET] Erreur:", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les morceaux." },
      { status: 500 }
    );
  }
}
