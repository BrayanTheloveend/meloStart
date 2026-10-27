// Contenu centralisé : modifiez ici les textes sans toucher aux composants.

export const navLinks = [
  // { label: "Explorer", href: "/explorer" },
  { label: "Examples", href: "/#examples" },
  { label: "Comment ça marche", href: "/#comment-ca-marche" },
  { label: "Tarifs", href: "/#tarifs" },
  { label: "FAQ", href: "/#faq" },
];

export const genres = [
  "Pop", "Rap", "Afrobeat", "R&B", "Jazz", "Gospel",
  "Amapiano"
];

export const moods = ["Joyeux", "Mélancolique", "Énergique", "Romantique", "Apaisant", "Épique", "Nostalgique", "Festif"];

export const durations = [
  { label: "30 s", value: 30 },
  { label: "1 min", value: 60 },
  { label: "2 min", value: 120 },
  { label: "3 min", value: 180 },
];

export const useCases = [
  {
    title: "Anniversaires",
    text: "Une chanson festive avec le prénom, les anecdotes et les plus beaux souvenirs de la personne fêtée.",
    tag: "Célébration",
    genre: "Pop · Festif",
    image: "/assets/events/6.jpeg",
    alt: "Gâteau d'anniversaire avec bougies allumées",
  },
  {
    title: "Mariages",
    text: "Une musique d'entrée inoubliable ou une déclaration chantée sur mesure pour les mariés.",
    tag: "Union & Amour",
    genre: "Ballade · Émotion",
    image: "/assets/events/5.jpeg",
    alt: "Couple de mariés souriant lors de la cérémonie",
  },
  {
    title: "Vidéos et podcasts",
    text: "Des jingles mémorables et des fonds sonores libres de droits pour sublimer vos créations audiovisuelles.",
    tag: "Créateurs & Médias",
    genre: "Lo-fi · Groove",
    image: "/assets/events/2.jpeg",
    alt: "Microphone de studio et casque audio pour podcast",
  },
  {
    title: "Marques et publicités",
    text: "Une signature sonore moderne et percutante pour renforcer l'identité de vos spots et réseaux sociaux.",
    tag: "Business & Ads",
    genre: "Électro · Percutant",
    image: "/assets/events/3.jpeg",
    alt: "Tournage publicitaire et équipe créative",
  },
  {
    title: "Jeux et applications",
    text: "Des ambiances captivantes et des boucles musicales immersives calibrées pour chaque univers interactif.",
    tag: "Jeux & Apps",
    genre: "Synthwave · Épique",
    image: "/assets/events/1.jpeg",
    alt: "Setup gaming moderne avec lumières néon",
  },
  {
    title: "Baptême & Famille",
    text: "Composez une mélodie pleine de tendresse et d'émotion pour marquer les grandes étapes familiales.",
    tag: "Douceur & Famille",
    genre: "Acoustique · Douceur",
    image: "/assets/events/4.jpeg",
    alt: "Bébé apaisé dans une couverture douce",
  },
];

export const steps = [
  { title: "Décrivez votre idée", text: "Écrivez en quelques lignes l'histoire, l'ambiance ou l'occasion. Choisissez un style et une humeur." },
  { title: "On compose pour vous", text: "pretymelo écrit les paroles, crée la mélodie et ajoute la voix. Comptez environ 30 secondes." },
  { title: "Écoutez et exportez", text: "Réécoutez, relancez une variante, puis téléchargez en MP3 ou WAV." },
];

export const stats = [
  { value: "100", label: "titres générés" },
  { value: "20", label: "styles musicaux" },
  { value: "30 s", label: "pour une chanson complète" },
  { value: "4,9/5", label: "note moyenne des créateurs" },
];

export const plans = [
  {
    name: "Découverte",
    description: "Pour essayer pretymelo sans carte bancaire.",
    monthly: 0,
    price: 2000,
    yearly: 0,
    cta: "Pour Démarrer",
    note: 4,
    popular: false,
    features: [
      "Création de musique à la demande",
      "Durée jusqu'à 1 minute par titre",
      "Génération de styles et d'ambiances",
      "Export au format MP3",
      "Usage personnel"
    ],
  },
  {
    name: "Créateur",
    description: "Pour les créateurs de contenu réguliers.",
    monthly: 15,
    price: 2900,
    note: 10,
    yearly: 12,
    popular: true,
    cta: "Choisir Créateur",
    features: [
      "Création & déclinaisons illimitées à la demande",
      "Durée jusqu'à 3 minutes par titre",
      "Génération de paroles et voix personnalisées",
      "Export Haute Qualité (MP3 & WAV)",
      "Licence commerciale incluse"
    ],
  },
  {
    name: "Studio",
    description: "Pour les équipes, agences et marques.",
    monthly: 39,
    price: 5000,
    note: 24,
    yearly: 31,
    popular: false,
    cta: "Choisir Studio",
    features: [
      "Création prioritaire ultra-rapide",
      "Clonage et personnalisation de voix",
      "Exportation des pistes séparées (Stems)",
      "Accès collaboratif pour 5 membres",
      "Support prioritaire 7j/7", 
      "Licence commerciale incluse"
    ],
  },
];

export const testimonials = [
  { name: "Camille R.", role: "Vidéaste", text: "J'ai trouvé la bande-son de mon dernier court-métrage en dix minutes. Le résultat sonne vraiment pro." },
  { name: "Idriss M.", role: "Fondateur d'une agence", text: "Nous livrons des jingles à nos clients le jour même. Le gain de temps est énorme." },
  { name: "Sofia L.", role: "Organisatrice de mariages", text: "La chanson offerte aux mariés a fait pleurer toute la salle. Les paroles étaient parfaites." },
];

export const faqs = [
  {
    q: "Comment générer de la musique avec l'IA sur pretymelo ?",
    a: "Il vous suffit de décrire votre idée (genre musical, thème, paroles ou émotions) : notre générateur de musique par IA compose la mélodie, écrit les paroles et interprète le morceau avec une voix réaliste en moins de 30 secondes.",
  },
  {
    q: "Peut-on créer une chanson gratuite sans carte bancaire ?",
    a: "Oui ! pretymelo propose une formule Découverte gratuite sans carte bancaire requise afin de vous permettre de créer votre chanson gratuite et tester notre intelligence artificielle musicale.",
  },
  {
    q: "Faut-il savoir faire de la musique ?",
    a: "Non, aucune compétence musicale n'est nécessaire. Vous décrivez ce que vous souhaitez avec vos mots, et pretymelo s'occupe de toute la composition, du mixage et du chant.",
  },
  {
    q: "Puis-je utiliser les titres générés à des fins commerciales ?",
    a: "Oui, avec les plans Créateur et Studio, vous bénéficiez d'une licence commerciale complète pour diffuser vos titres sur YouTube, TikTok, podcasts ou publicités.",
  },
  {
    q: "Combien de temps faut-il pour générer un titre ?",
    a: "En général une trentaine de secondes suffisent pour obtenir un morceau complet de haute qualité studio.",
  },
  {
    q: "Puis-je modifier un titre après sa création ?",
    a: "Vous pouvez relancer une variante, changer l'humeur ou le tempo, et modifier les paroles avant de régénérer.",
  },
  {
    q: "Dans quelles langues puis-je créer les paroles ?",
    a: "Le français, l'anglais, l'espagnol, le portugais et plusieurs autres langues sont parfaitement interprétés par l'IA vocale.",
  },
  {
    q: "Puis-je annuler mon abonnement à tout moment ?",
    a: "Oui, à tout moment depuis votre compte en un clic. Vous gardez l'accès jusqu'à la fin de la période payée.",
  },
];

export const footerColumns = [
  { title: "Produit", links: ["Fonctionnalités", "Tarifs", "Studio", "Nouveautés"] },
  { title: "Ressources", links: ["Centre d'aide", "Blog", "Guides de prompts", "Statut"] },
  { title: "Société", links: ["À propos", "Carrières", "Presse", "Contact"] },
  { title: "Légal", links: ["Mentions légales", "Confidentialité", "Conditions d'utilisation", "Cookies"] },
];

export const sampleTracks = [
  {
    id: 1,
    title: "Lumières de juillet",
    meta: "Afrobeat · Joyeux · 108 BPM",
    length: "2:14",
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop",
  },
  {
    id: 2,
    title: "Le dernier train",
    meta: "Lo-fi · Nostalgique · 82 BPM",
    length: "1:48",
    coverUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop",
  },
  {
    id: 3,
    title: "Neon Horizons",
    meta: "Synthwave · Épique · 124 BPM",
    length: "3:02",
    coverUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
  },
];
