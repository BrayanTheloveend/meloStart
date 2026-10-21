import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { getPricingPlansFromDb, savePricingPlansToDb } from "@/lib/pricingService";

/**
 * GET /api/admin/pricing
 * Récupère tous les plans tarifaires (actifs et inactifs) pour l'administration.
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

    const plans = await getPricingPlansFromDb();
    const sorted = [...plans].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    return NextResponse.json({
      success: true,
      plans: sorted,
    });
  } catch (error) {
    console.error("[API Admin Pricing GET] Erreur:", error);
    return NextResponse.json(
      { error: "Impossible de charger les plans de tarification." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/pricing
 * Crée un nouveau plan tarifaire ou remplace la liste complète (ex: réordonnancement).
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

    const body = await req.json();
    let currentPlans = await getPricingPlansFromDb();

    // Cas 1 : Remplacement complet / Réordonnancement global
    if (Array.isArray(body.plans)) {
      const saved = await savePricingPlansToDb(body.plans);
      return NextResponse.json({
        success: true,
        message: "Plans tarifaires synchronisés avec succès.",
        plans: saved,
      });
    }

    // Cas 2 : Création d'un plan unique
    const planData = body.plan || body;
    if (!planData.name || planData.price === undefined) {
      return NextResponse.json(
        { error: "Le nom et le tarif du pack sont obligatoires." },
        { status: 400 }
      );
    }

    const newId =
      planData.id?.trim() ||
      `pack_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Vérifier si l'ID existe déjà
    if (currentPlans.some((p) => p.id === newId)) {
      return NextResponse.json(
        { error: `Un plan avec l'identifiant '${newId}' existe déjà.` },
        { status: 409 }
      );
    }

    const newPlan = {
      id: newId,
      name: planData.name.trim(),
      description: planData.description?.trim() || "",
      price: Number(planData.price) || 0,
      currency: planData.currency || "XAF",
      notes: Number(planData.notes ?? planData.note ?? 4),
      note: Number(planData.notes ?? planData.note ?? 4),
      songs: Math.floor(Number(planData.notes ?? planData.note ?? 4) / 2),
      popular: Boolean(planData.popular),
      badge: planData.badge?.trim() || null,
      cta: planData.cta?.trim() || "Choisir ce pack",
      features: Array.isArray(planData.features)
        ? planData.features.filter(Boolean)
        : typeof planData.features === "string"
        ? planData.features.split("\n").map((f) => f.trim()).filter(Boolean)
        : [],
      isActive: planData.isActive !== false,
      sortOrder: planData.sortOrder !== undefined ? Number(planData.sortOrder) : currentPlans.length + 1,
    };

    const updatedList = [...currentPlans, newPlan];
    const saved = await savePricingPlansToDb(updatedList);

    return NextResponse.json({
      success: true,
      message: `Pack '${newPlan.name}' créé avec succès.`,
      plan: newPlan,
      plans: saved,
    });
  } catch (error) {
    console.error("[API Admin Pricing POST] Erreur:", error);
    return NextResponse.json(
      { error: error?.message || "Impossible de créer le plan de tarification." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/pricing
 * Met à jour un plan tarifaire existant par son ID.
 */
export async function PUT(req) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès refusé. Privilèges administrateur requis." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const planData = body.plan || body;
    const planId = planData.id;

    if (!planId) {
      return NextResponse.json(
        { error: "L'identifiant du plan à mettre à jour est requis." },
        { status: 400 }
      );
    }

    const currentPlans = await getPricingPlansFromDb();
    const index = currentPlans.findIndex((p) => p.id === planId);

    if (index === -1) {
      return NextResponse.json(
        { error: `Pack avec l'identifiant '${planId}' introuvable.` },
        { status: 404 }
      );
    }

    const existing = currentPlans[index];
    const notesCount = Number(planData.notes ?? planData.note ?? existing.notes ?? 4);

    const updatedPlan = {
      ...existing,
      name: planData.name !== undefined ? planData.name.trim() : existing.name,
      description: planData.description !== undefined ? planData.description.trim() : existing.description,
      price: planData.price !== undefined ? Number(planData.price) : existing.price,
      currency: planData.currency || existing.currency || "XAF",
      notes: notesCount,
      note: notesCount,
      songs: Math.floor(notesCount / 2),
      popular: planData.popular !== undefined ? Boolean(planData.popular) : existing.popular,
      badge: planData.badge !== undefined ? (planData.badge?.trim() || null) : existing.badge,
      cta: planData.cta !== undefined ? planData.cta.trim() : existing.cta,
      features: Array.isArray(planData.features)
        ? planData.features.filter(Boolean)
        : typeof planData.features === "string"
        ? planData.features.split("\n").map((f) => f.trim()).filter(Boolean)
        : existing.features,
      isActive: planData.isActive !== undefined ? Boolean(planData.isActive) : existing.isActive,
      sortOrder: planData.sortOrder !== undefined ? Number(planData.sortOrder) : existing.sortOrder,
    };

    currentPlans[index] = updatedPlan;
    const saved = await savePricingPlansToDb(currentPlans);

    return NextResponse.json({
      success: true,
      message: `Pack '${updatedPlan.name}' mis à jour avec succès.`,
      plan: updatedPlan,
      plans: saved,
    });
  } catch (error) {
    console.error("[API Admin Pricing PUT] Erreur:", error);
    return NextResponse.json(
      { error: error?.message || "Impossible de mettre à jour le plan tarifaire." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/pricing
 * Supprime un plan tarifaire par son ID.
 */
export async function DELETE(req) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès refusé. Privilèges administrateur requis." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    let planId = searchParams.get("id");

    if (!planId) {
      try {
        const body = await req.json();
        planId = body?.id;
      } catch (_) {}
    }

    if (!planId) {
      return NextResponse.json(
        { error: "L'identifiant du plan à supprimer est requis." },
        { status: 400 }
      );
    }

    const currentPlans = await getPricingPlansFromDb();
    const toDelete = currentPlans.find((p) => p.id === planId);

    if (!toDelete) {
      return NextResponse.json(
        { error: `Pack avec l'identifiant '${planId}' introuvable.` },
        { status: 404 }
      );
    }

    // Empêcher la suppression si c'est le tout dernier plan actif
    if (currentPlans.length <= 1) {
      return NextResponse.json(
        { error: "Impossible de supprimer le dernier pack tarifaire de la plateforme." },
        { status: 400 }
      );
    }

    const remaining = currentPlans.filter((p) => p.id !== planId);
    const saved = await savePricingPlansToDb(remaining);

    return NextResponse.json({
      success: true,
      message: `Pack '${toDelete.name}' supprimé avec succès.`,
      plans: saved,
    });
  } catch (error) {
    console.error("[API Admin Pricing DELETE] Erreur:", error);
    return NextResponse.json(
      { error: error?.message || "Impossible de supprimer le plan tarifaire." },
      { status: 500 }
    );
  }
}
