import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Connexion à votre Espace Studio",
  description: "Connectez-vous à pretymelo pour accéder à vos créations musicales IA et composer vos chansons.",
  alternates: {
    canonical: "/connexion",
  },
};

export default function LoginPage() {
  return <LoginForm />;
}
