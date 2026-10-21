import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

/**
 * Options de configuration pour NextAuth.js.
 */
export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  pages: {
    signIn: "/login",
    signUp: "/register",
    error: "/login",
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    CredentialsProvider({
      id: "credentials",
      name: "Email & Mot de passe",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "vous@domaine.com" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Veuillez renseigner un email et un mot de passe.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user) {
          throw new Error("Aucun compte associé à cette adresse email.");
        }

        if (user.status === "SUSPENDED") {
          throw new Error("Ce compte a été suspendu. Veuillez contacter le support.");
        }

        let isValid = true;
        if (user.passwordHash) {
          try {
            isValid = await bcrypt.compare(credentials.password, user.passwordHash);
            if (!isValid && user.passwordHash === credentials.password) {
              isValid = true;
            }
          } catch (_) {
            isValid = user.passwordHash === credentials.password;
          }
        }

        if (!isValid) {
          throw new Error("Identifiants incorrects.");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          credits: user.credits,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || "USER";
        token.credits = user.credits ?? 10;
      }

      // Si le token n'a pas encore le role ou les crédits (ex: connexion Google OAuth)
      if ((!token.id || !token.role || token.credits === undefined) && token.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email },
            select: { id: true, role: true, credits: true },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role || "USER";
            token.credits = dbUser.credits ?? 10;
          }
        } catch (_) {}
      }

      // Mise à jour dynamique du token lors des mutations client (ex: après achat de notes)
      if (trigger === "update" && session?.credits !== undefined) {
        token.credits = session.credits;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role || "USER";
        session.user.credits = token.credits ?? 10;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "melostars-secret-dev-key-change-in-production",
};

/**
 * Helper serveur pour récupérer la session active dans les Server Components / API Routes.
 */
export async function getServerAuthSession() {
  return await getServerSession(authOptions);
}

/**
 * Helper serveur pour récupérer l'utilisateur courant authentifié.
 */
export async function getCurrentUser() {
  const session = await getServerAuthSession();
  return session?.user ?? null;
}
