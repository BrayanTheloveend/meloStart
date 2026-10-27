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
  events: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const photo = profile?.picture || user?.image;
        if (photo && user?.id) {
          try {
            await prisma.user.update({
              where: { id: user.id },
              data: { image: photo },
            });
          } catch (_) {}
        }
      }
    },
  },
  callbacks: {
    async jwt({ token, user, account, profile, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || "USER";
        token.credits = user.credits ?? 10;
        if (user.image) {
          token.picture = user.image;
        }
      }

      // Synchronisation directe de la photo de profil Google OAuth
      if (account?.provider === "google") {
        const googlePhoto = profile?.picture || user?.image;
        if (googlePhoto) {
          token.picture = googlePhoto;
          if (token.email) {
            try {
              await prisma.user.update({
                where: { email: token.email },
                data: { image: googlePhoto },
              });
            } catch (_) {}
          }
        }
      }

      // Si le token n'a pas encore le role, l'image ou les crédits (ex: reconnexion ou session existante)
      if (token.email && (!token.id || !token.role || token.credits === undefined || !token.picture)) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email },
            select: { id: true, role: true, credits: true, image: true, name: true },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role || "USER";
            token.credits = dbUser.credits ?? 10;
            if (dbUser.image && !token.picture) {
              token.picture = dbUser.image;
            }
            if (dbUser.name && !token.name) {
              token.name = dbUser.name;
            }
          }
        } catch (_) {}
      }

      // Mise à jour dynamique du token lors des mutations client (ex: achat de notes, changement de nom/photo)
      if (trigger === "update") {
        if (session?.credits !== undefined) {
          token.credits = session.credits;
        }
        if (session?.image !== undefined) {
          token.picture = session.image;
        }
        if (session?.name !== undefined) {
          token.name = session.name;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role || "USER";
        session.user.credits = token.credits ?? 10;
        session.user.image = token.picture || token.image || session.user.image || null;
        if (token.name) session.user.name = token.name;
        if (token.email) session.user.email = token.email;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "pretymelo-secret-dev-key-change-in-production",
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
