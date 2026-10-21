import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/admin/users/[id]
 * Mise à jour administrative d'un utilisateur : rôle, statut actif/suspendu, ajustement manuel de crédits.
 */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const session = await getServerAuthSession();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès refusé. Privilèges administrateur requis." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { role, status, creditAdjustment, reason } = body;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    // Effectuer les mises à jour dans une transaction
    const result = await prisma.$transaction(async (tx) => {
      const updateData = {};
      if (role && ["USER", "ADMIN"].includes(role)) {
        updateData.role = role;
      }
      if (status && ["ACTIVE", "SUSPENDED"].includes(status)) {
        updateData.status = status;
      }

      // Si ajustement de crédits (positif ou négatif)
      if (typeof creditAdjustment === "number" && creditAdjustment !== 0) {
        const newCredits = Math.max(0, user.credits + creditAdjustment);
        updateData.credits = newCredits;

        await tx.creditTransaction.create({
          data: {
            userId: user.id,
            amount: creditAdjustment,
            balanceAfter: newCredits,
            type: creditAdjustment > 0 ? "BONUS" : "REFUND",
            description: reason || `Ajustement administratif (${creditAdjustment > 0 ? "+" : ""}${creditAdjustment} Notes)`,
            paymentMethod: "Admin",
          },
        });
      }

      const updatedUser = await tx.user.update({
        where: { id },
        data: updateData,
      });

      // Journal d'audit AdminLog
      await tx.adminLog.create({
        data: {
          adminId: session.user.id,
          action: "UPDATE_USER",
          target: user.email || user.id,
          details: {
            changes: updateData,
            reason: reason || "Action administrateur",
          },
        },
      });

      return updatedUser;
    });

    return NextResponse.json({
      success: true,
      message: "Utilisateur mis à jour avec succès.",
      user: {
        id: result.id,
        name: result.name,
        email: result.email,
        role: result.role,
        status: result.status,
        credits: result.credits,
      },
    });
  } catch (error) {
    console.error("[API Admin User PATCH] Erreur:", error);
    return NextResponse.json(
      { error: "Impossible de mettre à jour l'utilisateur." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Suppression définitive d'un compte utilisateur.
 */
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const session = await getServerAuthSession();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès refusé. Privilèges administrateur requis." },
        { status: 403 }
      );
    }

    if (session.user.id === id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas supprimer votre propre compte administrateur." },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });

    await prisma.adminLog.create({
      data: {
        adminId: session.user.id,
        action: "DELETE_USER",
        target: targetUser.email || id,
        details: { name: targetUser.name },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Utilisateur supprimé avec succès.",
    });
  } catch (error) {
    console.error("[API Admin User DELETE] Erreur:", error);
    return NextResponse.json(
      { error: "Impossible de supprimer l'utilisateur." },
      { status: 500 }
    );
  }
}
