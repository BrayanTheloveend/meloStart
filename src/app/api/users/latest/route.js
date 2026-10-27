import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


/**
 * GET /api/users/latest
 * Retourne les 4 derniers utilisateurs inscrits et le nombre total d'inscrits
 * pour la preuve sociale sur la landing page.
 */
export async function GET() {
  try {
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        take: 4,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          image: true,
          createdAt: true,
        },
      }),
      prisma.user.count(),
    ]);

    const remainingCount = Math.max(0, totalCount - users.length);

    return NextResponse.json({
      success: true,
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        image: u.image,
      })),
      totalCount,
      remainingCount,
    });
  } catch (error) {
    console.error("[API users/latest] Erreur lors de la récupération:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Impossible de récupérer les utilisateurs",
        users: [],
        totalCount: 0,
        remainingCount: 0,
      },
      { status: 500 }
    );
  }
}
