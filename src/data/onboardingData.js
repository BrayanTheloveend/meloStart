// Configuration et données pour le workflow d'onboarding pretymelo

import { FaBullhorn, FaGoogle, FaNewspaper, FaPlus, FaTiktok, FaUser, FaYoutube } from "react-icons/fa6";

export const onboardingGenres = [
  {
    id: "afrobeat_amapiano",
    label: "Afrobeat / Amapiano",
    desc: "Rythmes chauds, percussions entraînantes et vibes solaires",
    icon: "",
    studioGenre: "Afrobeat",
    defaultBpm: 112,
  },
  {
    id: "pop_variete",
    label: "Pop / Variété",
    desc: "Refrains accrocheurs, mélodies entraînantes et univers grand public",
    icon: "",
    studioGenre: "Pop",
    defaultBpm: 118,
  },
  {
    id: "rap_hiphop_rnb",
    label: "Rap / Hip-Hop / R&B",
    desc: "Beats percutants, flows cadencés et harmonies feutrées",
    icon: "",
    studioGenre: "Rap",
    defaultBpm: 92,
  },
  {
    id: "acoustique_piano",
    label: "Acoustique / Guitare-Voix / Piano",
    desc: "Émotion brute, textures intimes et douceur instrumentale",
    icon: "",
    studioGenre: "Folk",
    defaultBpm: 84,
  },
  {
    id: "electro_dance",
    label: "Électro / Dance",
    desc: "Basses dynamiques, synthés énergiques et rythmes club",
    icon: "",
    studioGenre: "Électro",
    defaultBpm: 126,
  },
  {
    id: "film_cinematique",
    label: "Musique de Film / Cinématique",
    desc: "Ambiances immersives, montées épiques et arrangements orchestraux",
    icon: "",
    studioGenre: "Classique",
    defaultBpm: 95,
  },
];

export const onboardingLanguages = [
  { id: "fr", label: "Français", flag: "🇫🇷" },
  { id: "en", label: "Anglais", flag: "🇬🇧" },
  { id: "es", label: "Espagnol", flag: "🇪🇸" },
  { id: "other", label: "Autre / Mélange", flag: "🌍" },
];

export const onboardingVocalTypes = [
  {
    id: "male",
    label: "Voix masculine",
    desc: "Timbre chaud, grave ou dynamique pour donner du relief",
    icon: "🎙️",
  },
  {
    id: "female",
    label: "Voix féminine",
    desc: "Timbre clair, doux ou puissant adapté à tous les styles",
    icon: "🎙️",
  },
  {
    id: "duo",
    label: "Duo / Polyvalent",
    desc: "Harmonies riches, dialogue vocal ou alternance masculine/féminine",
    icon: "👥",
  },
];

export const onboardingGoals = [
  {
    id: "birthday",
    title: "Anniversaire & Célébrations",
    subtitle: "Fêter une bougie de plus, soirée surprise, cap des 30/50 ans",
    icon: "🎂",
    recommendedPlan: "Découverte",
    promptSample: "Une chanson festive et entraînante pour célébrer l'anniversaire d'un proche avec des anecdotes complices.",
  },
  {
    id: "wedding",
    title: "Mariage & Fiançailles",
    subtitle: "Ouverture de bal, vœux, discours chanté, Enterrement de vie de célibataire",
    icon: "💍",
    recommendedPlan: "Créateur",
    promptSample: "Un morceau romantique et émouvant pour accompagner l'ouverture de bal ou surprendre les mariés.",
  },
  {
    id: "baptism_birth",
    title: "Baptême & Naissance",
    subtitle: "Arrivée d'un bébé, fête de baptême, berceuse sur-mesure",
    icon: "👶",
    recommendedPlan: "Découverte",
    promptSample: "Une mélodie douce et lumineuse célébrant la naissance ou le baptême d'un enfant.",
  },
  {
    id: "tribute_funeral",
    title: "Hommage & Décès",
    subtitle: "Mémoire d'un proche, cérémonie d'adieu, soutien et recueillement",
    icon: "🕊️",
    recommendedPlan: "Créateur",
    promptSample: "Un hommage doux et poignant au piano et cordes pour honorer la mémoire d'un être cher.",
  },
  {
    id: "love_romance",
    title: "Déclaration & Amour",
    subtitle: "Saint-Valentin, anniversaire de rencontre, demande en mariage",
    icon: "❤️",
    recommendedPlan: "Découverte",
    promptSample: "Une chanson passionnée et douce exprimant des sentiments profonds pour sa moitié.",
  },
  {
    id: "content_pro",
    title: "Création de contenu & Pro",
    subtitle: "TikTok, YouTube, jingle d'entreprise, publicité, marques",
    icon: "💼",
    recommendedPlan: "Studio",
    promptSample: "Un morceau moderne et percutant avec licence commerciale pour dynamiser vos vidéos ou projets pro.",
  },
  {
    id: "personal_pleasure",
    title: "Plaisir personnel & Écoute",
    subtitle: "Créer de la musique pour soi, expérimenter de nouveaux styles",
    icon: "🎧",
    recommendedPlan: "Découverte",
    promptSample: "Un morceau lo-fi relaxant avec une mélodie douce pour travailler ou se détendre le soir.",
  },
];

export const onboardingFrequencies = [
  {
    id: "occasional",
    label: "De temps en temps",
    desc: "Pour des occasions spéciales, fêtes ou cadeaux",
    badge: "Occasionnel",
  },
  {
    id: "regular",
    label: "Plusieurs fois par mois",
    desc: "Créateur régulier ou projets vidéo récurrents",
    badge: "Régulier",
  },
  {
    id: "intensive",
    label: "Tous les jours / Usage intensif",
    desc: "Studio, agence ou production soutenue",
    badge: "Intensif",
  },
];

export const onboardingAttributions = [
  { id: "tiktok_insta", label: "TikTok / Instagram / Reels", icon: <FaTiktok/> },
  { id: "youtube", label: "YouTube", icon: <FaYoutube/> },
  { id: "friend", label: "Recommandation d'un ami ou d'un proche", icon: <FaUser/> },
  { id: "google", label: "Recherche Google", icon: <FaGoogle/> },
  { id: "press", label: "Article de presse / Blog", icon: <FaNewspaper/> },
  { id: "ads", label: "Publicité en ligne", icon: <FaBullhorn/> },
  { id: "other", label: "Autre", icon: <FaPlus/> },
];
