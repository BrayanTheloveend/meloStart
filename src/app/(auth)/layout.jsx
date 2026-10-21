import AuthShell from "@/components/auth/AuthShell";

export const metadata = {
  title: "Authentification | melostars",
  description: "Connectez-vous ou créez votre compte melostars pour générer des morceaux uniques par IA.",
};

export default function AuthLayout({ children }) {
  return (
    <AuthShell backHref="/" backLabel="Retour à l'accueil">
      {children}
    </AuthShell>
  );
}
