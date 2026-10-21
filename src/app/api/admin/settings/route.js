import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/settings
 * Récupère tous les paramètres globaux de la plateforme.
 */
export async function GET() {
  try {
    const session = await getServerAuthSession();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès refusé. Privilèges administrateur requis." },
        { status: 403 }
      );
    }

    const settings = await prisma.systemSetting.findMany();
    const settingsMap = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    return NextResponse.json({
      success: true,
      settings: settingsMap,
      raw: settings,
    });
  } catch (error) {
    console.error("[API Admin Settings GET] Erreur:", error);
    return NextResponse.json(
      { error: "Impossible de charger les paramètres." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings
 * Met à jour un ou plusieurs paramètres de configuration plateforme.
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

    const body = await req.json(); // { key: value, ... }

    const operations = Object.entries(body).map(([key, value]) => {
      return prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    });

    await Promise.all(operations);

    await prisma.adminLog.create({
      data: {
        adminId: session.user.id,
        action: "UPDATE_SETTINGS",
        target: Object.keys(body).join(", "),
        details: body,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Paramètres mis à jour avec succès.",
    });
  } catch (error) {
    console.error("[API Admin Settings POST] Erreur:", error);
    return NextResponse.json(
      { error: "Impossible de sauvegarder les paramètres." },
      { status: 500 }
    );
  }
}
