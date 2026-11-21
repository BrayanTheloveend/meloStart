import { NextResponse } from "next/server";
import { getPricingPlansFromDb, getPaymentFeeSettingsFromDb } from "@/lib/pricingService";

/**
 * GET /api/pricing
 * Récupère les plans de tarification actifs et la politique de frais CamPay pour l'affichage public.
 */
export async function GET() {
  try {
    const plans = await getPricingPlansFromDb();
    const feeSettings = await getPaymentFeeSettingsFromDb();

    const activePlans = plans
      .filter((p) => p.isActive !== false)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    return NextResponse.json({
      success: true,
      plans: activePlans,
      feeSettings,
      allPlansCount: plans.length,
    });
  } catch (error) {
    console.error("[API Public Pricing GET] Erreur:", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les plans de tarification." },
      { status: 500 }
    );
  }
}
