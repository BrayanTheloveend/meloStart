import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/emailService";

/**
 * POST /api/auth/forgot-password
 * Demande de réinitialisation de mot de passe par email.
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email } = body;

    const trimmedEmail = email?.trim().toLowerCase();

    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      return NextResponse.json(
        { error: "Veuillez renseigner une adresse email valide." },
        { status: 400 }
      );
    }

    // Recherche de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    // Note de sécurité : Même si l'utilisateur n'existe pas, on répond positivement
    // pour éviter la fuite d'informations (user enumeration).
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "Si un compte est associé à cette adresse, un email de réinitialisation a été envoyé.",
      });
    }

    // Génération d'un token cryptographiquement sécurisé
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 heure de validité

    // Nettoyer d'anciens tokens pour cette adresse
    await prisma.verificationToken.deleteMany({
      where: { identifier: trimmedEmail },
    }).catch(() => {});

    // Enregistrer le token de vérification dans Prisma
    await prisma.verificationToken.create({
      data: {
        identifier: trimmedEmail,
        token,
        expires,
      },
    });

    // Détermination de l'URL de base
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      (req.headers.get("origin") || "http://localhost:3000");

    const resetUrl = `${baseUrl.replace(/\/$/, "")}/reset-password?token=${token}&email=${encodeURIComponent(trimmedEmail)}`;

    // Envoi de l'email
    const emailResult = await sendPasswordResetEmail({
      to: trimmedEmail,
      name: user.name || "Créateur",
      resetUrl,
    });

    const isDev = process.env.NODE_ENV !== "production";

    return NextResponse.json({
      success: true,
      message: "Un email contenant votre lien de réinitialisation sécurisé vous a été envoyé.",
      ...(isDev ? { debugResetUrl: resetUrl } : {}),
    });
  } catch (error) {
    console.error("[ForgotPassword] Erreur :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors du traitement de votre demande." },
      { status: 500 }
    );
  }
}

