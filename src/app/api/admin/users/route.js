import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/users
 * Liste complète des utilisateurs pour la console d'administration.
 */
export async function GET(req) {
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

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
    const skip = (page - 1) * limit;

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role && role !== "ALL") {
      where.role = role;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          status: true,
          credits: true,
          createdAt: true,
          _count: {
            select: {
              tracks: true,
              creditTransactions: true,
            },
          },
          creditTransactions: {
            where: { type: "PURCHASE" },
            select: { amountMoney: true, currency: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Formatter les données pour l'interface Admin
    const formattedUsers = users.map((u) => {
      const totalSpentNumber = u.creditTransactions.reduce(
        (sum, tx) => sum + (tx.amountMoney || 0),
        0
      );

      return {
        id: u.id,
        name: u.name || "Utilisateur sans nom",
        email: u.email,
        role: u.role,
        status: u.status,
        credits: u.credits,
        totalTracks: u._count.tracks,
        totalSpent: `${totalSpentNumber.toLocaleString("fr-FR")} XAF`,
        joinedAt: new Date(u.createdAt).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        avatar: u.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
      };
    });

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[API Admin Users GET] Erreur:", error);
    return NextResponse.json(
      { error: "Impossible de charger la liste des utilisateurs." },
      { status: 500 }
    );
  }
}
