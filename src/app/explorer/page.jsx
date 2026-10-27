import ExplorerView from "@/components/explorer/ExplorerView";

export const metadata = {
  title: "Explorer la Musique IA & Découvrir des Chansons Créées en Ligne",
  description:
    "Écoutez les musiques générées par intelligence artificielle sur pretymelo. Rap, Pop, Lo-fi, Rock, Afrobeat avec paroles synchronisées. Inspirez-vous pour créer votre propre chanson gratuite.",
  alternates: {
    canonical: "/explorer",
  },
};

export default function ExplorerPage() {
  return <ExplorerView />;
}
