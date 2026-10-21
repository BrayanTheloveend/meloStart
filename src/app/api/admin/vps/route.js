import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { getCompleteVpsMetrics, executeVpsAction } from "@/lib/vpsService";

/**
 * GET /api/admin/vps
 * Récupère l'ensemble des métriques d'infrastructure du VPS Hostinger (CPU, RAM, Disque, Réseau, Services, Processus, Logs).
 */
export async function GET() {
  try {
    const session = await getServerAuthSession();

    // Contrôle d'accès administrateur
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Accès refusé. Privilèges administrateur requis." },
          { status: 403 }
        );
      }
    }

    const data = await getCompleteVpsMetrics();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API Admin VPS GET] Erreur:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Impossible de récupérer les métriques du VPS Hostinger.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/vps
 * Exécute une commande de contrôle ou modifie la configuration du VPS Hostinger.
 */
export async function POST(req) {
  try {
    const session = await getServerAuthSession();

    // Contrôle d'accès administrateur
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Accès refusé. Privilèges administrateur requis." },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const { action, payload } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: "Action requise." },
        { status: 400 }
      );
    }

    const result = await executeVpsAction(action, payload, session?.user);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API Admin VPS POST] Erreur action:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erreur lors de l'exécution de l'action sur le VPS.",
      },
      { status: 500 }
    );
  }
}
