import AuthShell from "@/components/auth/AuthShell";
import SignupForm from "@/components/auth/SignupForm";

export const metadata = {
  title: "Créer une Chanson Gratuite — Inscription Rapide",
  description:
    "Inscrivez-vous gratuitement sur pretymelo et commencez à générer de la musique avec l'IA immédiatement, sans carte bancaire requise.",
  alternates: {
    canonical: "/inscription",
  },
};

export default function SignupPage() {
  return (
    <AuthShell backHref="/" backLabel="Accueil pretymelo">
      <SignupForm />
    </AuthShell>
  );
}
