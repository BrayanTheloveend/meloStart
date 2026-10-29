import React from 'react';

// Charte Violette Sonara:
// Primary: #8B5CF6 (Violet Vif)
// Dark: #4C1D95 (Violet Sombre)
// Light: #DDD6FE (Violet Clair/Néon)
// Accent: #C084FC (Rose-Violet)

export const VectorAnniversaire = (props) => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" {...props}>
    <circle cx="60" cy="60" r="50" fill="url(#purple_grad_1)" opacity="0.15" />
    {/* Gâteau & Bougie */}
    <rect x="35" y="65" width="50" height="25" rx="4" fill="#6D28D9" />
    <rect x="42" y="50" width="36" height="15" rx="3" fill="#8B5CF6" />
    <path d="M42 65C42 65 46 69 50 65C54 61 58 65 62 65C66 65 70 61 74 65C78 69 82 65 82 65" stroke="#DDD6FE" strokeWidth="2.5" strokeLinecap="round" />
    <rect x="58" y="38" width="4" height="12" rx="2" fill="#C084FC" />
    {/* Flamme & Étincelles */}
    <path d="M60 28C60 28 64 33 60 38C56 33 60 28 60 28Z" fill="#F43F5E" />
    <circle cx="32" cy="40" r="3" fill="#A855F7" />
    <circle cx="88" cy="45" r="2" fill="#DDD6FE" />
    <path d="M80 30L84 34M84 30L80 34" stroke="#C084FC" strokeWidth="2" strokeLinecap="round" />
    <defs>
      <radialGradient id="purple_grad_1" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(60 60) rotate(90) scale(50)">
        <stop stopColor="#8B5CF6" />
        <stop offset="1" stopColor="#4C1D95" stopOpacity="0" />
      </radialGradient>
    </defs>
  </svg>
);

export const VectorMariage = (props) => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" {...props}>
    <circle cx="60" cy="60" r="50" fill="url(#purple_grad_2)" opacity="0.15" />
    {/* Cœurs entrelacés & Alliances */}
    <path d="M48 42C41.3726 42 36 47.3726 36 54C36 66 54 78 54 78C54 78 62 72.6667 67 65.5C62 65.5 56 61 56 54C56 47.3726 50.6274 42 44 42" fill="#8B5CF6" />
    <path d="M66 38C59.3726 38 54 43.3726 54 50C54 62 72 74 72 74C72 74 90 62 90 50C90 43.3726 84.6274 38 78 38C73.5 38 69.5 40.5 66 44.5C62.5 40.5 58.5 38 54 38" fill="#C084FC" opacity="0.85" />
    {/* Étoiles brillantes */}
    <path d="M35 32L37 36L41 38L37 40L35 44L33 40L29 38L33 36L35 32Z" fill="#DDD6FE" />
    <circle cx="85" cy="80" r="3" fill="#8B5CF6" />
    <defs>
      <radialGradient id="purple_grad_2" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(60 60) rotate(90) scale(50)">
        <stop stopColor="#C084FC" />
        <stop offset="1" stopColor="#3B0764" stopOpacity="0" />
      </radialGradient>
    </defs>
  </svg>
);

export const VectorVideosPodcasts = (props) => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" {...props}>
    <circle cx="60" cy="60" r="50" fill="url(#purple_grad_3)" opacity="0.15" />
    {/* Micro Studio & Casque */}
    <rect x="52" y="35" width="16" height="30" rx="8" fill="#8B5CF6" />
    <path d="M42 52C42 61.9411 50.0589 70 60 70C69.9411 70 78 61.9411 78 52" stroke="#DDD6FE" strokeWidth="3" strokeLinecap="round" />
    <path d="M60 70V82M50 82H70" stroke="#DDD6FE" strokeWidth="3" strokeLinecap="round" />
    {/* Ondes sonores */}
    <path d="M28 60C28 42.3269 42.3269 28 60 28C77.6731 28 92 42.3269 92 60" stroke="#C084FC" strokeWidth="2.5" strokeDasharray="4 4" strokeLinecap="round" />
    <defs>
      <radialGradient id="purple_grad_3" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(60 60) rotate(90) scale(50)">
        <stop stopColor="#A855F7" />
        <stop offset="1" stopColor="#4C1D95" stopOpacity="0" />
      </radialGradient>
    </defs>
  </svg>
);

export const VectorMarquesPublicites = (props) => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" {...props}>
    <circle cx="60" cy="60" r="50" fill="url(#purple_grad_4)" opacity="0.15" />
    {/* Mégaphone / Croissance */}
    <path d="M35 50L55 40V70L35 60V50Z" fill="#6D28D9" />
    <rect x="25" y="48" width="10" height="14" rx="2" fill="#8B5CF6" />
    <path d="M55 40L85 28V82L55 70V40Z" fill="#8B5CF6" />
    {/* Ondes d'impact / Soundwave */}
    <path d="M92 42C96 48 96 62 92 68" stroke="#C084FC" strokeWidth="3" strokeLinecap="round" />
    <path d="M99 35C106 45 106 65 99 75" stroke="#DDD6FE" strokeWidth="3" strokeLinecap="round" />
    <defs>
      <radialGradient id="purple_grad_4" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(60 60) rotate(90) scale(50)">
        <stop stopColor="#7C3AED" />
        <stop offset="1" stopColor="#2E1065" stopOpacity="0" />
      </radialGradient>
    </defs>
  </svg>
);

export const VectorJeuxApplications = (props) => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" {...props}>
    <circle cx="60" cy="60" r="50" fill="url(#purple_grad_5)" opacity="0.15" />
    {/* Gamepad Néon */}
    <rect x="26" y="42" width="68" height="38" rx="19" fill="#5B21B6" />
    <path d="M38 53V69M30 61H46" stroke="#DDD6FE" strokeWidth="3" strokeLinecap="round" />
    <circle cx="74" cy="55" r="3.5" fill="#C084FC" />
    <circle cx="82" cy="63" r="3.5" fill="#F43F5E" />
    <circle cx="66" cy="63" r="3.5" fill="#8B5CF6" />
    <circle cx="74" cy="71" r="3.5" fill="#10B981" />
    <defs>
      <radialGradient id="purple_grad_5" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(60 60) rotate(90) scale(50)">
        <stop stopColor="#A855F7" />
        <stop offset="1" stopColor="#3B0764" stopOpacity="0" />
      </radialGradient>
    </defs>
  </svg>
);

export const VectorBaptemeFamille = (props) => (
  <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" {...props}>
    <circle cx="60" cy="60" r="50" fill="url(#purple_grad_6)" opacity="0.15" />
    {/* Berceau / Protection familiale */}
    <path d="M35 65C35 50 45 42 60 42C75 42 85 50 85 65" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" />
    <path d="M30 65H90V72C90 78 85 82 78 82H42C35 82 30 78 30 72V65Z" fill="#7C3AED" />
    <circle cx="50" cy="58" r="6" fill="#DDD6FE" />
    {/* Étoile de douceur */}
    <path d="M60 25L62 29L66 31L62 33L60 37L58 33L54 31L58 29L60 25Z" fill="#C084FC" />
    <defs>
      <radialGradient id="purple_grad_6" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(60 60) rotate(90) scale(50)">
        <stop stopColor="#C084FC" />
        <stop offset="1" stopColor="#4C1D95" stopOpacity="0" />
      </radialGradient>
    </defs>
  </svg>
);