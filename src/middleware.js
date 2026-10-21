import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Middleware Next.js de protection des routes frontend.
 * - /dashboard/* et /admin/* : Réservés aux utilisateurs connectés avec le rôle ADMIN.
 * - /studio/* et /onboarding/* : Réservés aux utilisateurs connectés.
 * - /login, /register, etc. : Redirigent automatiquement vers /studio si déjà connecté.
 */
export async function middleware(req) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || "melostars-secret-dev-key-change-in-production",
  });

  const { pathname, search } = req.nextUrl;
  const normalizedPath = pathname.toLowerCase();

  const isAuthPage =
    normalizedPath === "/login" ||
    normalizedPath === "/register" ||
    normalizedPath === "/signup" ||
    normalizedPath === "/connexion" ||
    normalizedPath === "/inscription";

  // 1. Redirection si l'utilisateur est déjà connecté et visite une page d'authentification
  if (isAuthPage) {
    if (token) {
      // Un administrateur est automatiquement dirigé vers son Dashboard, un utilisateur vers le Studio
      const dest = token.role === "ADMIN" ? "/dashboard" : "/studio";
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  // 2. Si l'utilisateur n'est pas connecté
  if (!token) {
    // Si c'est une API admin, retourner un 401 direct
    if (normalizedPath.startsWith("/api/admin")) {
      return NextResponse.json(
        { error: "Authentification requise." },
        { status: 401 }
      );
    }

    const loginUrl = new URL("/login", req.url);
    const callback = `${pathname}${search}`;
    loginUrl.searchParams.set("callbackUrl", callback);
    return NextResponse.redirect(loginUrl);
  }

  // 3. L'administrateur n'a pas besoin de faire l'onboarding : redirection vers le dashboard admin
  if (normalizedPath.startsWith("/onboarding") && token.role === "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 4. Protection du Dashboard & des APIs Administrateur (Strictement réservé au rôle ADMIN vérifié par le serveur)
  if (
    normalizedPath.startsWith("/dashboard") ||
    normalizedPath.startsWith("/admin") ||
    normalizedPath.startsWith("/api/admin")
  ) {
    // Le rôle provient du JWT signé cryptographiquement par le serveur (inviolable côté client)
    if (token.role !== "ADMIN") {
      if (normalizedPath.startsWith("/api/admin")) {
        return NextResponse.json(
          { error: "Accès refusé. Privilèges administrateur requis." },
          { status: 403 }
        );
      }

      // Redirection sécurisée des utilisateurs non autorisés vers le Studio
      const studioUrl = new URL("/studio", req.url);
      studioUrl.searchParams.set("denied", "admin_required");
      return NextResponse.redirect(studioUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/studio/:path*",
    "/onboarding/:path*",
    "/login",
    "/register",
    "/signup",
    "/connexion",
    "/inscription",
  ],
};
