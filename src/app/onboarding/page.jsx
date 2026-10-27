import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

export const metadata = {
  title: "Bienvenue sur pretymelo — Personnalisez votre expérience",
  description: "Configurez vos préférences musicales et vos objectifs pour une expérience studio sur mesure.",
};

export default function OnboardingPage() {
  return <OnboardingWizard />;
}
