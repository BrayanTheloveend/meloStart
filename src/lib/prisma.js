import { PrismaClient } from "@prisma/client";

/**
 * Client Singleton Prisma pour Next.js.
 * Évite d'instancier de multiples connexions en mode développement lors des rechargements à chaud (HMR).
 */
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
