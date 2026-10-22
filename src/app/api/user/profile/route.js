import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/user/profile
 * Récupère le profil complet de l'utilisateur connecté avec information sur les comptes OAuth (Google).
 */
export async function GET() {
  try {
    const session = await getServerAuthSession();

    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }

    const whereClause = session.user.id
      ? { id: session.user.id }
      : { email: session.user.email };

    const user = await prisma.user.findUnique({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        credits: true,
        createdAt: true,
        accounts: {
          select: {
            provider: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    const isGoogleLinked =
      user.accounts?.some((acc) => acc.provider === "google") ||
      Boolean(user.image && user.image.includes("googleusercontent.com"));

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        isGoogleLinked,
      },
    });
  } catch (error) {
    console.error("[API User Profile GET] Erreur:", error);
    return NextResponse.json(
      { error: "Impossible de récupérer le profil utilisateur." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/profile
 * Met à jour les informations du profil utilisateur (nom d'artiste, avatar).
 */
export async function PATCH(request) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    }

    const body = await request.json();
    const { name, image } = body;

    const dataToUpdate = {};
    if (typeof name === "string" && name.trim().length > 0) {
      dataToUpdate.name = name.trim();
    }
    if (typeof image === "string") {
      dataToUpdate.image = image.trim();
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        { error: "Aucun champ valide à mettre à jour." },
        { status: 400 }
      );
    }

    const whereClause = session.user.id
      ? { id: session.user.id }
      : { email: session.user.email };

    const updatedUser = await prisma.user.update({
      where: whereClause,
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        credits: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: "Profil mis à jour avec succès.",
    });
  } catch (error) {
    console.error("[API User Profile PATCH] Erreur:", error);
    return NextResponse.json(
      { error: "Impossible de mettre à jour le profil." },
      { status: 500 }
    );
  }
}
