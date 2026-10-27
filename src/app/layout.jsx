import { Plus_Jakarta_Sans, Outfit, Instrument_Sans } from "next/font/google";
import Provider from "@/components/providers/Provider";

// Polices Google Fonts, exposées en variables CSS (utilisées dans theme/system.js)
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});
const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pretymelo.com";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "pretymelo — Générateur de Musique IA | Créer une Chanson Gratuite en Ligne",
    template: "%s | pretymelo",
  },
  description:
    "Générez de la musique par IA et créez une chanson gratuite en 30 secondes. Paroles, voix réaliste et mélodie sur mesure dans tous les styles (Rap, Pop, Lo-fi, Rock, Afrobeat). Essayez pretymelo gratuitement !",
  keywords: [
    "générer de la musique",
    "créer une chanson gratuite",
    "générateur de musique ia",
    "faire une musique avec ia",
    "musique ia gratuit",
    "créer musique en ligne",
    "composer une chanson avec ia",
    "générateur de chansons gratuit",
    "créer une musique personnalisée",
    "voix ia musique",
    "intelligence artificielle musique",
    "pretymelo",
  ],
  authors: [{ name: "pretymelo" }],
  creator: "pretymelo",
  publisher: "pretymelo",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: siteUrl,
    siteName: "pretymelo",
    title: "pretymelo — Générateur de Musique IA | Créer une Chanson Gratuite",
    description:
      "Générez de la musique par IA et créez votre chanson gratuite avec paroles et voix en 30 secondes. Sans compétences musicales requises.",
    images: [
      {
        url: "/assets/logo.png",
        width: 512,
        height: 512,
        alt: "pretymelo - Générateur de Musique IA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "pretymelo — Générateur de Musique IA | Créer une Chanson Gratuite",
    description:
      "Générez de la musique par IA et créez votre chanson gratuite en 30 secondes. Essayez pretymelo gratuitement !",
    images: ["/assets/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "1HOYllF5TrmwmrbBYiY4o6kiwcB_9LntH5JOypo6p_o",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "pretymelo",
      description: "Générateur de musique IA & création de chanson gratuite en ligne",
      inLanguage: "fr-FR",
    },
    {
      "@type": "WebApplication",
      "@id": `${siteUrl}/#webapp`,
      name: "pretymelo",
      url: siteUrl,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "All",
      description:
        "Plateforme d'intelligence artificielle pour générer de la musique et créer des chansons gratuites en ligne avec voix, paroles et mélodie.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EUR",
        priceValidUntil: "2030-12-31",
        availability: "https://schema.org/InStock",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        reviewCount: "40000",
        bestRating: "5",
        worstRating: "1",
      },
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${jakarta.variable} ${outfit.variable} ${instrument.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}

