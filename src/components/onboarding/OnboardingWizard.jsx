"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Box, Button, Container, Flex, HStack, Spinner, Text } from "@chakra-ui/react";
import { LuArrowLeft, LuArrowRight } from "react-icons/lu";
import GlowBackground from "@/components/common/GlowBackground";
import OnboardingHeader from "./OnboardingHeader";
import Step1MusicPreferences from "./Step1MusicPreferences";
import Step2UsageGoals from "./Step2UsageGoals";
import Step3Attribution from "./Step3Attribution";
import Step4QuickStart from "./Step4QuickStart";
import { accent } from "@/theme/system";

const STORAGE_KEY = "melostars_onboarding";

const defaultData = {
  genres: ["pop_variete"],
  languages: ["fr"],
  vocalType: "female",
  goal: "gifts_events",
  frequency: "occasional",
  attribution: "tiktok_insta",
  customAttribution: "",
};

export default function OnboardingWizard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [step, setStep] = useState(1);
  const [data, setData] = useState(defaultData);

  // Protection d'accès : redirection vers login si non connecté, ou vers dashboard si ADMIN
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/onboarding");
    } else if (status === "authenticated" && session?.user?.role === "ADMIN") {
      router.replace("/dashboard");
    }
  }, [status, session, router]);

  // Charger les préférences déjà enregistrées si existantes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setData((prev) => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch {
      // Ignore les erreurs d'accès à localStorage (ex: SSR / private mode)
    }
  }, []);

  if (status === "loading" || status === "unauthenticated" || session?.user?.role === "ADMIN") {
    return (
      <Flex minH="100vh" bg="paper.0" align="center" justify="center" direction="column" gap="4">
        <Spinner size="xl" color="brand.violetDeep" />
        <Text fontSize="sm" color="ink.600" fontFamily="ui" fontWeight="600">
          {session?.user?.role === "ADMIN"
            ? "Redirection vers la console administrateur..."
            : "Chargement de votre configuration personnalisée..."}
        </Text>
      </Flex>
    );
  }

  const handleChange = (patch) => {
    setData((prev) => {
      const updated = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleFinish = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, completed: true }));
    } catch {}
  };

  const handleSkip = () => {
    handleFinish();
    router.push("/studio");
  };

  const nextStep = () => {
    setStep((s) => Math.min(4, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const prevStep = () => {
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Validation minimale par étape pour activer le bouton Continuer
  const isStepValid = () => {
    if (step === 1) {
      return (data.genres || []).length > 0 && (data.languages || []).length > 0 && !!data.vocalType;
    }
    if (step === 2) {
      return !!data.goal && !!data.frequency;
    }
    if (step === 3) {
      return !!data.attribution;
    }
    return true;
  };

  return (
    <Box minH="100vh" bg="paper.0" position="relative" overflow="hidden" display="flex" flexDirection="column">
      <GlowBackground intensity={0.8} />

      {/* En-tête avec progression */}
      <OnboardingHeader currentStep={step} totalSteps={4} onSkip={handleSkip} />

      {/* Corps du formulaire */}
      <Box flex="1" py={{ base: "8", md: "12" }}>
        <Container maxW="4xl">

          {/* Stepper centré avec barre de progression fine */}
          {/* <Flex direction="column" align="center" gap="1.5" flex="1" maxW="320px" mx="auto">
            <Flex justify="space-between" w="full" fontSize="xs" fontFamily="ui" fontWeight="600" color="ink.500">
              <Text>Configuration du studio</Text>
              <Text color="brand.violetDeep">
                Étape {step} / {4}
              </Text>
            </Flex>
            <Box w="full" h="2" bg="paper.200" rounded="full" overflow="hidden">
              <Box
                h="full"
                w={`${(step / 4) * 100}%`}
                bg={accent.primary}
                rounded="full"
                transition="width 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
              />
            </Box>
          </Flex> */}

          <Box
            p={{ base: "6", sm: "8", md: "10" }}
            rounded="3xl"
            bg="paper.0"
            borderWidth="1px"
            borderColor="paper.200"
            boxShadow="0 20px 40px -15px rgba(24, 24, 27, 0.05)"
          >
            {step === 1 && <Step1MusicPreferences data={data} onChange={handleChange} />}
            {step === 2 && <Step2UsageGoals data={data} onChange={handleChange} />}
            {step === 3 && <Step3Attribution data={data} onChange={handleChange} />}
            {step === 4 && <Step4QuickStart data={data} onFinish={handleFinish} />}

            {/* Barre de navigation entre étapes (sauf étape 4 où les boutons d'action sont intégrés) */}
            {step < 4 && (
              <Flex
                mt="10"
                pt="6"
                borderTopWidth="1px"
                borderColor="paper.200"
                justify="space-between"
                align="center"
              >
                {step > 1 ? (
                  <Button
                    variant="ghost"
                    rounded="full"
                    fontFamily="ui"
                    fontWeight="500"
                    color="ink.500"
                    _hover={{ bg: "paper.100", color: "ink.900" }}
                    onClick={prevStep}
                  >
                    <LuArrowLeft /> Retour
                  </Button>
                ) : (
                  <Box />
                )}

                <HStack gap="3">
                  <Button
                    size="lg"
                    rounded="full"
                    px="7"
                    fontFamily="ui"
                    fontWeight="600"
                    color="white"
                    background={accent.primary}
                    disabled={!isStepValid()}
                    opacity={isStepValid() ? 1 : 0.4}
                    _hover={{ transform: isStepValid() ? "translateY(-1px)" : "none" }}
                    transition="all 0.2s"
                    onClick={nextStep}
                  >
                    Continuer <LuArrowRight />
                  </Button>
                </HStack>
              </Flex>
            )}
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
