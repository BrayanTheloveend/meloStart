// ─────────────────────────────────────────────────────────────
// CONSTANTES PARTAGÉES POUR TOUS LES STEPS DU GÉNÉRATEUR
// ─────────────────────────────────────────────────────────────

// Étape 1 : Types d'occasions
export const OCCASIONS = [
  { id: "birthday", title: "Anniversaire", icon: "/assets/1.png", sample: "Une chanson festive et entraînante pour les 30 ans de Fatou, elle adore danser et est toujours souriante." },
  { id: "wedding", title: "Mariage", icon: "/assets/2.png", sample: "Une ouverture de bal douce et romantique pour célébrer notre amour devant toute la famille." },
  { id: "romance", title: "Déclaration", icon: "/assets/3.png", sample: "Une douce déclaration d'amour sincère avec des mots tendres et émouvants." },
  { id: "success", title: "Réussite", icon: "/assets/8.png", sample: "Un morceau énergique et plein de fierté pour célébrer l'obtention d'un diplôme et un nouveau départ." },
  { id: "party", title: "Fête", icon: "/assets/5.png", sample: "Un hymne festif et dansant pour ambiancer notre soirée entre amis jusqu'au matin." },
  { id: "tribute", title: "Hommage", icon: "/assets/6.png", sample: "Un hommage doux et respectueux au piano pour honorer la mémoire d'un être cher." },
  { id: "cheer", title: "Encouragement", icon: "/assets/7.png", sample: "Une chanson inspirante et puissante pour redonner de la force et surmonter les épreuves." },
  { id: "other", title: "Autre", icon: "/assets/4.png", sample: "Une création musicale sur mesure pour une surprise pleine d'émotion et de sourires." },
];

// Étape 2 : Langues avec codes ISO pour Flagpedia CDN
export const LANGUAGES = [
  { id: "French",     label: "Français",  code: "fr", country: "France"   },
  { id: "English",    label: "English",   code: "gb", country: "UK"        },
  { id: "Spanish",    label: "Español",   code: "es", country: "España"    },
  { id: "Arabic",     label: "العربية",   code: "sa", country: "Arabia"    },
  { id: "Portuguese", label: "Português", code: "pt", country: "Portugal"  },
  { id: "German",     label: "Deutsch",   code: "de", country: "Germany"   },
  { id: "Italian",    label: "Italiano",  code: "it", country: "Italy"     },
  { id: "Lingala",    label: "Lingala",   code: "cd", country: "Congo"     },
  { id: "Wolof",      label: "Wolof",     code: "sn", country: "Sénégal"   },
];

// Étape 3 : Types de voix
export const VOICE_TYPES = [
  { id: "female",       title: "Femme",              icon: "/assets/11.png", gender: "f"    },
  { id: "male",         title: "Homme",              icon: "/assets/10.png", gender: "m"    },
  { id: "duo",          title: "Duo (Homme & Femme)", icon: "/assets/12.png", gender: "auto" },
  { id: "instrumental", title: "Instrumental", desc: "Sans voix ni paroles", icon: "/assets/9.png", isInstrumental: true },
];

// Étape 4 : Styles de musique reconnus officiellement par Suno AI
export const MUSIC_STYLES = [
  { id: "Pop",          title: "Pop",           icon: "/assets/genre/1.png"  },
  { id: "Afrobeat",     title: "Afrobeat",      icon: "/assets/genre/3.png"  },
  { id: "Amapiano",     title: "Amapiano",      icon: "/assets/genre/6.png"  },
  { id: "R&B",          title: "R&B",           icon: "/assets/genre/7.png"  },
  { id: "Rap / Hip-Hop",title: "Rap / Hip-Hop", icon: "/assets/genre/8.png"  },
  { id: "Rock",         title: "Rock",          icon: "/assets/genre/2.png"  },
  { id: "Acoustique",   title: "Acoustique / Piano", icon: "/assets/genre/9.png" },
  { id: "Gospel",       title: "Gospel",        icon: "/assets/genre/10.png" },
  { id: "Reggae",       title: "Reggae",        icon: "/assets/genre/11.png" },
  { id: "Jazz",         title: "Jazz / Blues",  icon: "/assets/genre/14.png" },
  { id: "Soul",         title: "Soul / Funk",   icon: "/assets/genre/12.png" },
  { id: "Lo-Fi",        title: "Lo-Fi / Chill", icon: "/assets/genre/18.png" },
  { id: "Classical",    title: "Classique",     icon: "/assets/genre/15.png" },
];

// Balises de structure pour les paroles
export const STRUCTURE_TAGS = [
  "[Intro]", "[Verse 1]", "[Verse 2]", "[Chorus]", "[Bridge]", "[Drop]", "[Outro]",
];

// Utilitaire : URL du drapeau via Flagpedia CDN
export const flagUrl = (code, size = "40x30") =>
  `https://flagcdn.com/${size}/${code}.png`;

// Utilitaire : parse paroles style Spotify
export function parseSpotifyLyrics(rawText) {
  if (!rawText || !rawText.trim()) return { parsed: [], totalLyricLines: 0 };
  const lines = rawText.split("\n");
  const parsed = [];
  let lineCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (!trimmed) {
      parsed.push({ type: "spacer", id: `sp-${i}` });
      continue;
    }

    const tagMatch =
      trimmed.match(/^\[(.*)\]$/) ||
      trimmed.match(/^(Verse|Couplet|Chorus|Refrain|Bridge|Pont|Intro|Outro|Drop|Pre-Chorus|Pre-Refrain)\s*(\d*):?$/i);

    if (tagMatch) {
      const tagContent = tagMatch[1] ? tagMatch[1].trim() : trimmed;
      parsed.push({ type: "section", id: `sec-${i}`, title: tagContent.replace(/[\[\]]/g, "") });
      continue;
    }

    parsed.push({ type: "lyric", id: `lyr-${i}`, text: trimmed, index: lineCounter++ });
  }

  return { parsed, totalLyricLines: lineCounter };
}

// Utilitaire : format mm:ss
export const fmt = (s) => {
  if (isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = String(Math.floor(s % 60)).padStart(2, "0");
  return `${m}:${sec}`;
};
