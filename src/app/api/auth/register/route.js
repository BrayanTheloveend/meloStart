import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/auth/register
 * Inscription d'un nouvel utilisateur avec email et mot de passe.
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    const trimmedEmail = email?.trim().toLowerCase();
    const trimmedName = name?.trim() || trimmedEmail?.split("@")[0] || "Créateur";

    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      return NextResponse.json(
        { error: "Veuillez fournir une adresse email valide." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères." },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cette adresse email." },
        { status: 409 }
      );
    }

    // Récupérer les crédits d'accueil configurés dans system_settings
    let initialCredits = 10;
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: "initial_signup_credits" },
      });
      if (setting && !isNaN(parseInt(setting.value, 10))) {
        initialCredits = parseInt(setting.value, 10);
      }
    } catch (_) {}

    // Hachage sécurisé du mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    // Création atomique de l'utilisateur et de la transaction de bienvenue
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: trimmedName,
          email: trimmedEmail,
          passwordHash,
          role: "USER",
          status: "ACTIVE",
          credits: initialCredits,
        },
      });

      if (initialCredits > 0) {
        await tx.creditTransaction.create({
          data: {
            userId: user.id,
            amount: initialCredits,
            balanceAfter: initialCredits,
            type: "BONUS",
            description: "Cadeau de bienvenue melostars (Notes offertes)",
          },
        });
      }

      return user;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Compte créé avec succès.",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          credits: newUser.credits,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API Register] Erreur:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'inscription." },
      { status: 500 }
    );
  }
}
