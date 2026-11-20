import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/auth/reset-password
 * Réinitialisation effective du mot de passe avec le token de vérification.
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { token, email, password } = body;

    const trimmedEmail = email?.trim().toLowerCase();
    const cleanToken = token?.trim();

    if (!cleanToken || !trimmedEmail) {
      return NextResponse.json(
        { error: "Paramètres de réinitialisation invalides ou manquants." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit comporter au moins 6 caractères." },
        { status: 400 }
      );
    }

    // Vérifier l'existence et la validité du token
    const tokenRecord = await prisma.verificationToken.findFirst({
      where: {
        identifier: trimmedEmail,
        token: cleanToken,
      },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { error: "Le lien de réinitialisation est invalide ou a déjà été utilisé." },
        { status: 400 }
      );
    }

    // Vérifier l'expiration (1 heure)
    if (new Date() > new Date(tokenRecord.expires)) {
      await prisma.verificationToken.deleteMany({
        where: { identifier: trimmedEmail, token: cleanToken },
      }).catch(() => {});

      return NextResponse.json(
        { error: "Ce lien de réinitialisation a expiré. Veuillez refaire une demande." },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Aucun compte correspondant trouvé." },
        { status: 404 }
      );
    }

    // Hachage du nouveau mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    // Mise à jour du mot de passe et suppression du token dans une transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { email: trimmedEmail },
        data: { passwordHash },
      }),
      prisma.verificationToken.deleteMany({
        where: { identifier: trimmedEmail },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Votre mot de passe a été réinitialisé avec succès.",
    });
  } catch (error) {
    console.error("[ResetPassword] Erreur :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la mise à jour du mot de passe." },
      { status: 500 }
    );
  }
}

