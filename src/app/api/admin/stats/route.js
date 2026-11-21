import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCampayBalance } from "@/lib/campayService";

/**
 * GET /api/admin/stats
 * Tableau de bord d'administration : indicateurs clés, métriques financières et répartition par genre.
 */
export async function GET() {
  try {
    const session = await getServerAuthSession();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Accès refusé. Privilèges administrateur requis." },
          { status: 403 }
        );
      }
    }

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      usersTotal,
      usersNewThisWeek,
      tracksTotal,
      tracksToday,
      tracksCompleted,
      tracksFailed,
      tracksQueued,
      genreAggregates,
      purchaseTransactions,
      allNegativeTransactions,
      campayBalanceResult,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: oneWeekAgo } } }),
      prisma.track.count(),
      prisma.track.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.track.count({ where: { status: "COMPLETED" } }),
      prisma.track.count({ where: { status: "FAILED" } }),
      prisma.track.count({ where: { status: { in: ["QUEUED", "PROCESSING", "PENDING"] } } }),
      prisma.track.groupBy({
        by: ["genre"],
        _count: { id: true },
        where: { genre: { not: null } },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
      prisma.creditTransaction.findMany({
        where: { type: "PURCHASE" },
        select: { amount: true, amountMoney: true, currency: true },
      }),
      prisma.creditTransaction.aggregate({
        _sum: { amount: true },
        where: { amount: { lt: 0 } },
      }),
      getCampayBalance().catch((err) => {
        console.warn("[Admin Stats] Échec récupération balance CamPay:", err.message);
        return { totalBalance: 0, mtnBalance: 0, orangeBalance: 0, currency: "XAF", isLive: false };
      }),
    ]);

    const campayBalance = campayBalanceResult || { totalBalance: 0, mtnBalance: 0, orangeBalance: 0, currency: "XAF", isLive: false };

    // Calcul du chiffre d'affaires : priorité au montant exact collecté par CamPay
    const dbRevenueCfa = purchaseTransactions.reduce((acc, tx) => {
      return acc + (tx.amountMoney || 0);
    }, 0);
    const finalRevenue = campayBalance.totalBalance > 0 ? campayBalance.totalBalance : dbRevenueCfa;

    const notesPurchased = purchaseTransactions.reduce((acc, tx) => acc + tx.amount, 0);
    const notesBurned = Math.abs(allNegativeTransactions._sum.amount || 0);

    const successRate =
      tracksTotal > 0
        ? `${((tracksCompleted / tracksTotal) * 100).toFixed(1)}%`
        : "100%";

    // Distribution des genres
    const genreColors = ["#7c3aed", "#06b6d4", "#ec4899", "#f59e0b", "#10b981"];
    const popularGenres = genreAggregates.map((g, index) => {
      const count = g._count.id;
      const percent = tracksTotal > 0 ? Math.round((count / tracksTotal) * 100) : 0;
      return {
        genre: g.genre || "Autre",
        percent,
        color: genreColors[index % genreColors.length],
        tracksCount: count,
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        revenueTotal: `${finalRevenue.toLocaleString("fr-FR")} XAF`,
        campayBalance,
        usersTotal,
        usersNewThisWeek: `+${usersNewThisWeek}`,
        tracksGenerated: tracksTotal,
        tracksToday,
        tracksSuccessRate: successRate,
        notesBurned,
        notesPurchased,
        queuedJobs: tracksQueued,
        failedJobsCount: tracksFailed,
        activeWorkers: 2,
      },
      popularGenres,
    });
  } catch (error) {
    console.error("[API Admin Stats] Erreur:", error);
    return NextResponse.json(
      { error: "Impossible de calculer les statistiques administratives." },
      { status: 500 }
    );
  }
}
