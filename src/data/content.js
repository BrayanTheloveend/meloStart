// Contenu centralisé : modifiez ici les textes sans toucher aux composants.

export const navLinks = [
  // { label: "Explorer", href: "/explorer" },
  { label: "Examples", href: "/#examples" },
  { label: "Comment ça marche", href: "/#comment-ca-marche" },
  { label: "Tarifs", href: "/#tarifs" },
  { label: "FAQ", href: "/#faq" },
];

export const genres = [
  "Pop", "Rap", "Afrobeat", "Électro", "Lo-fi", "Rock", "R&B", "Jazz", "Reggae", "Soul",
  "Amapiano", "House", "Folk", "Classique", "Trap", "Disco", "Synthwave", "Gospel", "Reggaeton", "Country",
];

export const moods = ["Joyeux", "Mélancolique", "Énergique", "Romantique", "Apaisant", "Épique", "Nostalgique", "Festif"];

export const durations = [
  { label: "30 s", value: 30 },
  { label: "1 min", value: 60 },
  { label: "2 min", value: 120 },
  { label: "3 min", value: 180 },
];

export const useCases = [
  { title: "Anniversaires", text: "Une chanson avec le prénom et les souvenirs de la personne fêtée." },
  { title: "Mariages", text: "Une musique d'entrée ou une chanson pour les mariés, sur mesure." },
  { title: "Vidéos et podcasts", text: "Des jingles et des fonds sonores libres de droits pour vos contenus." },
  { title: "Marques et publicités", text: "Une identité sonore cohérente pour vos spots et vos réseaux." },
  { title: "Jeux et applications", text: "Des ambiances et boucles musicales adaptées à chaque niveau." },
  { title: "Baptême", text: "Composez une chanson touchante pour célébrer cet événement." },
];

export const steps = [
  { title: "Décrivez votre idée", text: "Écrivez en quelques lignes l'histoire, l'ambiance ou l'occasion. Choisissez un style et une humeur." },
  { title: "On compose pour vous", text: "melostars écrit les paroles, crée la mélodie et ajoute la voix. Comptez environ 30 secondes." },
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
    description: "Pour essayer melostars sans carte bancaire.",
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
  { q: "Faut-il savoir faire de la musique ?", a: "Non. Vous décrivez ce que vous voulez avec vos mots, melostars s'occupe de la composition, des paroles et de la voix." },
  { q: "Puis-je utiliser les titres à des fins commerciales ?", a: "Oui, avec les plans Créateur et Studio. Le plan Découverte est réservé à un usage personnel." },
  { q: "Combien de temps faut-il pour générer un titre ?", a: "En général une trentaine de secondes. Les titres de 3 minutes peuvent prendre un peu plus de temps." },
  { q: "Puis-je modifier un titre après sa création ?", a: "Vous pouvez relancer une variante, changer l'humeur ou le tempo, et modifier les paroles avant de régénérer." },
  { q: "Dans quelles langues puis-je écrire les paroles ?", a: "Français, anglais, espagnol, portugais et plusieurs autres langues sont disponibles." },
  { q: "Puis-je annuler mon abonnement ?", a: "Oui, à tout moment depuis votre compte. Vous gardez l'accès jusqu'à la fin de la période payée." },
];

export const footerColumns = [
  { title: "Produit", links: ["Fonctionnalités", "Tarifs", "Studio", "Nouveautés"] },
  { title: "Ressources", links: ["Centre d'aide", "Blog", "Guides de prompts", "Statut"] },
  { title: "Société", links: ["À propos", "Carrières", "Presse", "Contact"] },
  { title: "Légal", links: ["Mentions légales", "Confidentialité", "Conditions d'utilisation", "Cookies"] },
];

export const sampleTracks = [
  { id: 1, title: "Lumières de juillet", meta: "Afrobeat · Joyeux · 108 BPM", length: "2:14" },
  { id: 2, title: "Le dernier train", meta: "Lo-fi · Nostalgique · 82 BPM", length: "1:48" },
  { id: 3, title: "Neon Horizons", meta: "Synthwave · Épique · 124 BPM", length: "3:02" },
];
