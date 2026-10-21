import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/user/credits
 * Récupère le solde de Notes et l'historique des transactions de l'utilisateur connecté.
 */
export async function GET() {
  try {
    const session = await getServerAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }

    const userId = session.user.id;

    const [user, transactions, tracksCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          credits: true,
          image: true,
        },
      }),
      prisma.creditTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.track.count({
        where: { userId },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      credits: user.credits,
      user,
      totalTracks: tracksCount,
      transactions,
    });
  } catch (error) {
    console.error("[API User Credits GET] Erreur:", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les crédits." },
      { status: 500 }
    );
  }
}
