import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Route handler NextAuth.js pour l'App Router de Next.js.
 * Gère automatiquement les routes d'authentification (connexion, déconnexion, session, providers, callbacks).
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
