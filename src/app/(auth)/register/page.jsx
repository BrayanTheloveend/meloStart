import SignupForm from "@/components/auth/SignupForm";

export const metadata = {
  title: "Inscription | pretymelo",
  description: "Créez votre compte pretymelo et commencez à générer votre musique par IA.",
};

export default function RegisterPage() {
  return <SignupForm />;
}
