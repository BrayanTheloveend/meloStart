import SignupForm from "@/components/auth/SignupForm";

export const metadata = {
  title: "Inscription | melostars",
  description: "Créez votre compte melostars et commencez à générer votre musique par IA.",
};

export default function RegisterPage() {
  return <SignupForm />;
}
