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

export const metadata = {
  title: "melostars — Créez votre musique personnalisée par IA",
  description:
    "Décrivez la musique dont vous rêvez : melostars compose le style, les paroles et la voix en quelques secondes.",
  verification: {
    google: "1HOYllF5TrmwmrbBYiY4o6kiwcB_9LntH5JOypo6p_o",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${jakarta.variable} ${outfit.variable} ${instrument.variable}`}
    >
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
