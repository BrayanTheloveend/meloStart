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
  console.log("🌱 Début de l'initialisation propre de la base de données pretymelo...");

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
      name: "Admin pretymelo",
      email: "admin@pretymelo.com",
      passwordHash: hashedPassword,
      role: "ADMIN",
      status: "ACTIVE",
      credits: 100,
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop",
    },
  });

  // 2. Création de comptes Créateurs de test avec avatars réalistes
  const sampleUsers = [
    {
      name: "Camille Laurent",
      email: "camille@pretymelo.com",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    },
    {
      name: "Idriss Diop",
      email: "idriss@pretymelo.com",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    },
    {
      name: "Sofia Benali",
      email: "sofia@pretymelo.com",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
    },
    {
      name: "Marc Dubois",
      email: "marc@pretymelo.com",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    },
    {
      name: "Thomas Morel",
      email: "thomas@pretymelo.com",
      image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    },
    {
      name: "Clara Martin",
      email: "clara@pretymelo.com",
      image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
    },
    {
      name: "Alex Rivera",
      email: "alex@pretymelo.com",
      image: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&h=150&fit=crop",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
    },
    {
      name: "Utilisateur Test",
      email: "test@pretymelo.com",
      image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop",
      createdAt: new Date(),
    },
  ];

  const createdUsers = [];
  for (const u of sampleUsers) {
    const created = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        passwordHash: hashedPassword,
        role: "USER",
        status: "ACTIVE",
        credits: 20,
        image: u.image,
        createdAt: u.createdAt,
      },
    });
    createdUsers.push(created);
  }

  const testUser = createdUsers[createdUsers.length - 1];

  console.log(`✅ ${createdUsers.length + 1} utilisateurs créés :`);
  console.log("   - Administrateur : admin@pretymelo.com (mot de passe: password123)");
  console.log("   - Utilisateur    : test@pretymelo.com  (mot de passe: password123)");

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
