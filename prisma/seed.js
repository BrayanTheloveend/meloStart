const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

// Détection de l'environnement si non chargé par le shell
if (!process.env.NODE_ENV) {
  try {
    const envPath = path.join(__dirname, "..", ".env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      const match = envContent.match(/^\s*NODE_ENV\s*=\s*["']?([^"'\r\n]+)["']?/m);
      if (match) process.env.NODE_ENV = match[1].trim();
    }
  } catch (_) {}
}

// Sécurité critique : interdire catégoriquement le seed en production
if (process.env.NODE_ENV === "production") {
  console.error("🛑 [Prisma Seed] ERREUR CRITIQUE : Le script de seed est strictement interdit en environnement de production (NODE_ENV=production).");
  console.error("🛑 Annulation immédiate pour protéger l'intégrité de la base de données.");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.error("🛑 [Prisma Seed] Interdit en production.");
    process.exit(1);
  }
  console.log("🌱 Début de l'initialisation propre de la base de données melostars...");

  // Nettoyage préalable complet pour garantir un état sain
  await prisma.creditTransaction.deleteMany();
  await prisma.track.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.adminLog.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("password123", 10);

  // 1. Création du compte Administrateur
  const admin = await prisma.user.create({
    data: {
      name: "Admin melostars",
      email: "admin@melostars.com",
      passwordHash: hashedPassword,
      role: "ADMIN",
      status: "ACTIVE",
      credits: 100,
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop",
    },
  });

  // 2. Création du compte Utilisateur Test
  const testUser = await prisma.user.create({
    data: {
      name: "Utilisateur Test",
      email: "test@melostars.com",
      passwordHash: hashedPassword,
      role: "USER",
      status: "ACTIVE",
      credits: 20,
      image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop",
    },
  });

  console.log("✅ 2 utilisateurs créés :");
  console.log("   - Administrateur : admin@melostars.com (mot de passe: password123)");
  console.log("   - Utilisateur    : test@melostars.com  (mot de passe: password123)");

  // 3. Paramètres Système réels et essentiels
  const defaultSettings = [
    { key: "cost_per_track", value: "2", description: "Coût en notes pour générer 1 morceau" },
    { key: "initial_signup_credits", value: "10", description: "Notes offertes à l'inscription" },
    { key: "maintenance_mode", value: "false", description: "Mode maintenance de la plateforme" },
    { key: "ai_provider", value: "suno-v6", description: "Moteur IA de synthèse sonore" },
    { key: "max_track_duration", value: "120", description: "Durée maximale d'un morceau en secondes" },
  ];

  for (const setting of defaultSettings) {
    await prisma.systemSetting.create({ data: setting });
  }
  console.log(`✅ ${defaultSettings.length} paramètres système configurés.`);

  // 4. Dotations de bienvenue initiales (cohérence du solde de crédits)
  await prisma.creditTransaction.createMany({
    data: [
      {
        userId: admin.id,
        amount: 100,
        balanceAfter: 100,
        type: "BONUS",
        description: "Dotation initiale Administrateur",
      },
      {
        userId: testUser.id,
        amount: 20,
        balanceAfter: 20,
        type: "BONUS",
        description: "Notes de bienvenue Utilisateur Test",
      },
    ],
  });
  console.log("✅ Dotations initiales enregistrées.");

  console.log("🎉 Base de données initialisée proprement sans données parasites ni fausses musiques !");
}

main()
  .catch((e) => {
    console.error("Erreur lors du seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
