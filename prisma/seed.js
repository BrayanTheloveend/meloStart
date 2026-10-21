const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Début du peuplement de la base de données locale melostars...");

  // Nettoyage préalable (optionnel pour seed idempotent)
  await prisma.creditTransaction.deleteMany();
  await prisma.track.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.adminLog.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("password123", 10);

  // 1. Création des Utilisateurs
  const adminUser = await prisma.user.create({
    data: {
      name: "Admin melostars",
      email: "admin@melostars.com",
      passwordHash: hashedPassword,
      role: "ADMIN",
      status: "ACTIVE",
      credits: 0,
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop",
    },
  });

  const brayan = await prisma.user.create({
    data: {
      name: "Brayan Nkouka",
      email: "brayan@melostars.com",
      passwordHash: hashedPassword,
      role: "ADMIN",
      status: "ACTIVE",
      credits: 0,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
    },
  });

  const aminata = await prisma.user.create({
    data: {
      name: "Aminata Diallo",
      email: "aminata.diallo@gmail.com",
      passwordHash: hashedPassword,
      role: "USER",
      status: "ACTIVE",
      credits: 0,
      image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&h=150&fit=crop",
    },
  });

  const samuel = await prisma.user.create({
    data: {
      name: "Samuel Eto",
      email: "samuel.prod@studio.ci",
      passwordHash: hashedPassword,
      role: "USER",
      status: "ACTIVE",
      credits: 0,
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
    },
  });

  console.log(`✅ 4 utilisateurs créés (mot de passe: 'password123').`);

  // 2. Création des Paramètres Système (SystemSettings)
  const defaultSettings = [
    { key: "cost_per_track", value: "2", description: "Coût en notes pour générer 1 morceau" },
    { key: "initial_signup_credits", value: "10", description: "Notes offertes à l'inscription" },
    { key: "maintenance_mode", value: "false", description: "Mode maintenance de la plateforme" },
    { key: "ai_provider", value: "internal-v2", description: "Moteur IA de synthèse sonore" },
    { key: "max_track_duration", value: "120", description: "Durée maximale d'un morceau en secondes" },
  ];

  for (const setting of defaultSettings) {
    await prisma.systemSetting.create({ data: setting });
  }
  console.log(`✅ ${defaultSettings.length} paramètres système configurés.`);

  // 3. Création des Morceaux (Tracks)
  const tracksData = [
    {
      userId: brayan.id,
      title: "Congo Vibrations",
      prompt: "Afrobeat festif et énergique avec guitare soukous et cuivres cuivrés",
      lyrics: "[Couplet 1]\nSur le fleuve majestueux\nNos rêves brillent dans les yeux\n\n[Refrain]\nCongo vibre, Congo danse\nC'est la voix de l'espérance",
      genre: "Afrobeat",
      moods: ["Festif", "Énergique", "Dansant"],
      vocalType: "female",
      language: "Français",
      duration: 75,
      status: "COMPLETED",
      progress: 100,
      isFavorite: true,
      isPublic: true,
      playCount: 142,
      likesCount: 38,
      audioUrl: "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg",
      coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop",
    },
    {
      userId: aminata.id,
      title: "Dakar Sunset Chill",
      prompt: "Lo-fi afro-soul doux au coucher du soleil à Dakar avec guitare acoustique",
      lyrics: "[Refrain]\nLe soleil descend sur l'océan\nLa brise emporte les peines d'antan",
      genre: "Lo-fi & Soul",
      moods: ["Relaxant", "Nostalgique", "Doux"],
      vocalType: "female",
      language: "Français",
      duration: 60,
      status: "COMPLETED",
      progress: 100,
      isFavorite: true,
      isPublic: true,
      playCount: 89,
      likesCount: 22,
      audioUrl: "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg",
      coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
    },
    {
      userId: samuel.id,
      title: "Abidjan Nuit Rap",
      prompt: "Trap percutant avec 808 lourde et flow rapide urbain",
      lyrics: "[Couplet]\nRue Princesse minuit sonne\nLe flow est lourd le beat résonne",
      genre: "Rap & Trap",
      moods: ["Sombre", "Puissant"],
      vocalType: "male",
      language: "Français",
      duration: 90,
      status: "COMPLETED",
      progress: 100,
      isFavorite: false,
      isPublic: true,
      playCount: 65,
      likesCount: 12,
      audioUrl: "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg",
      coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop",
    },
    {
      userId: brayan.id,
      title: "Kinshasa Nights",
      prompt: "Rumba congolaise moderne avec guitare solo enivrante et basse ronde",
      genre: "Afrobeat",
      moods: ["Romantique", "Chaleureux"],
      vocalType: "male",
      duration: 80,
      status: "QUEUED",
      progress: 25,
      isFavorite: false,
      isPublic: false,
    },
    {
      userId: aminata.id,
      title: "Sahel Symphony",
      prompt: "Fusion kora et violons cinématiques d'Afrique de l'Ouest",
      genre: "Pop",
      moods: ["Épique", "Inspirant"],
      vocalType: "instrumental",
      duration: 60,
      status: "FAILED",
      errorMessage: "Dépassement du délai de réponse du moteur de synthèse IA",
      progress: 40,
      isFavorite: false,
      isPublic: false,
    },
  ];

  for (const track of tracksData) {
    await prisma.track.create({ data: track });
  }
  console.log(`✅ ${tracksData.length} morceaux insérés.`);

  // 4. Création des Transactions de Crédits
  const transactions = [
    {
      userId: brayan.id,
      amount: 30,
      balanceAfter: 140,
      type: "PURCHASE",
      description: "Achat Pack Studio Pro (30 Notes)",
      amountMoney: 10000,
      currency: "xaf",
      paymentMethod: "Stripe",
      stripePaymentId: "pi_seed_001",
    },
    {
      userId: brayan.id,
      amount: -2,
      balanceAfter: 138,
      type: "GENERATION",
      description: "Génération IA : 'Congo Vibrations'",
    },
    {
      userId: aminata.id,
      amount: 12,
      balanceAfter: 20,
      type: "PURCHASE",
      description: "Achat Pack Créateur (12 Notes)",
      amountMoney: 5000,
      currency: "xaf",
      paymentMethod: "Stripe",
      stripePaymentId: "pi_seed_002",
    },
    {
      userId: aminata.id,
      amount: -2,
      balanceAfter: 18,
      type: "GENERATION",
      description: "Génération IA : 'Dakar Sunset Chill'",
    },
    {
      userId: aminata.id,
      amount: 2,
      balanceAfter: 20,
      type: "REFUND",
      description: "Remboursement automatique : échec de 'Sahel Symphony'",
    },
  ];

  for (const tx of transactions) {
    await prisma.creditTransaction.create({ data: tx });
  }
  console.log(`✅ ${transactions.length} transactions de crédits insérées.`);

  // 5. Création des Logs Admin
  await prisma.adminLog.create({
    data: {
      adminId: brayan.id,
      action: "PLATFORM_INITIALIZED",
      target: "System",
      details: { environment: "local", timestamp: new Date().toISOString() },
    },
  });

  console.log("🎉 Initialisation et peuplement terminés avec succès !");
}

main()
  .catch((e) => {
    console.error("Erreur lors du seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
