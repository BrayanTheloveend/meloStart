import AuthShell from "@/components/auth/AuthShell";
import SignupForm from "@/components/auth/SignupForm";

export const metadata = {
  title: "Inscription rapide | melostars",
  description: "Créez votre compte melostars en 10 secondes et commencez à composer de la musique par IA.",
};

export default function SignupPage() {
  return (
    <AuthShell backHref="/" backLabel="Accueil melostars">
      <SignupForm />
    </AuthShell>
  );
}
