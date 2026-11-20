import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata = {
  title: "Réinitialisation de mot de passe | pretymelo",
  description: "Choisissez un nouveau mot de passe sécurisé pour accéder à votre compte pretymelo Studio.",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}

