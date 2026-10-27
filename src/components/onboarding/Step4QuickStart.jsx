"use client";

import { useRouter } from "next/navigation";
import { Badge, Box, Button, Flex, Grid, Heading, HStack, Stack, Text } from "@chakra-ui/react";

import { onboardingGenres, onboardingGoals, onboardingLanguages, onboardingVocalTypes } from "@/data/onboardingData";
import { accent } from "@/theme/system";
import { LucideCheckCircle2, LucideWandSparkles } from "lucide-react";
import { LuArrowRight, LuCompass } from "react-icons/lu";

export default function Step4QuickStart({ data, onFinish }) {
  const router = useRouter();

  // Trouver les labels lisibles pour le récapitulatif
  const selectedGenres = onboardingGenres
    .filter((g) => (data.genres || []).includes(g.id))
    .map((g) => g.label);

  const selectedLanguages = onboardingLanguages
    .filter((l) => (data.languages || []).includes(l.id))
    .map((l) => `${l.flag} ${l.label}`);

  const selectedVoice = onboardingVocalTypes.find((v) => v.id === data.vocalType)?.label || "Polyvalent";
  const selectedGoalObj = onboardingGoals.find((g) => g.id === data.goal);

  const handleLaunchStudio = () => {
    onFinish();
    // Le premier genre choisi ou Afrobeat par défaut
    const firstGenre = onboardingGenres.find((g) => (data.genres || []).includes(g.id))?.studioGenre || "Pop";
    const prompt = selectedGoalObj?.promptSample || "";
    const params = new URLSearchParams();
    params.set("genre", firstGenre);
    if (prompt) params.set("prompt", prompt);
    router.push(`/studio?${params.toString()}`);
  };

  const handleExploreDemos = () => {
    onFinish();
    router.push("/explorer");
  };

  return (
    <Stack gap="8">
      {/* En-tête de célébration */}
      <Stack gap="3" textAlign="center" align="center">
        <HStack
          px="3.5"
          py="1.5"
          rounded="full"
          bg="brand.violetTint"
          color="brand.violetDeep"
          fontFamily="ui"
          fontWeight="600"
          fontSize="xs"
          gap="2"
        >
          <LucideCheckCircle2 size={16} />
          Profil configuré avec succès !
        </HStack>
        <Heading as="h2" fontFamily="heading" fontWeight="800" fontSize={{ base: "3xl", md: "4xl" }} letterSpacing="-0.03em">
          Prêt à donner vie à votre musique ?
        </Heading>
        <Text fontSize={{ base: "sm", md: "md" }} color="ink.500" maxW="xl">
          Votre compte est configuré selon vos préférences. Ne perdez pas une seconde et lancez-vous dès maintenant !
        </Text>
      </Stack>

      {/* Résumé synthétique de la personnalisation */}
      <Box p="5" rounded="2xl" bg="paper.100" borderWidth="1px" borderColor="paper.300">
        <Flex justify="space-between" align="center" mb="3">
          <Text fontFamily="ui" fontWeight="700" fontSize="xs" color="ink.500" textTransform="uppercase" letterSpacing="wider">
            Votre profil musical sur mesure
          </Text>
          <Badge bg="paper.200" color="ink.700" size="sm" rounded="full">
            Prêt pour le Studio
          </Badge>
        </Flex>
        <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }} gap="3" fontSize="sm">
          <Box p="3" rounded="xl" bg="paper.0" borderWidth="1px" borderColor="paper.200">
            <Text fontSize="xs" color="ink.400" mb="0.5">Genres favoris</Text>
            <Text fontWeight="600" color="ink.900" noOfLines={1}>
              {selectedGenres.length ? selectedGenres.join(", ") : "Pop / Variété"}
            </Text>
          </Box>
          <Box p="3" rounded="xl" bg="paper.0" borderWidth="1px" borderColor="paper.200">
            <Text fontSize="xs" color="ink.400" mb="0.5">Langue(s)</Text>
            <Text fontWeight="600" color="ink.900" noOfLines={1}>
              {selectedLanguages.length ? selectedLanguages.join(", ") : "🇫🇷 Français"}
            </Text>
          </Box>
          <Box p="3" rounded="xl" bg="paper.0" borderWidth="1px" borderColor="paper.200">
            <Text fontSize="xs" color="ink.400" mb="0.5">Type de voix</Text>
            <Text fontWeight="600" color="ink.900" noOfLines={1}>
              {selectedVoice}
            </Text>
          </Box>
          <Box p="3" rounded="xl" bg="paper.0" borderWidth="1px" borderColor="paper.200">
            <Text fontSize="xs" color="ink.400" mb="0.5">Objectif</Text>
            <Text fontWeight="600" color="ink.900" noOfLines={1}>
              {selectedGoalObj ? selectedGoalObj.title : "Création libre"}
            </Text>
          </Box>
        </Grid>
      </Box>

      {/* Deux choix clairs d'activation immédiate */}
      <Stack gap="4">
        <Text fontFamily="ui" fontWeight="700" fontSize="md" color="ink.900" textAlign="center">
          Choisissez comment vous souhaitez commencer :
        </Text>

        <Grid templateColumns={{ base: "1fr", md: "1.2fr 1fr" }} gap="4">
          {/* Option 1 : Créer immédiatement (Option recommandée) */}
          <Box
            p="6"
            rounded="3xl"
            bg="paper.0"
            borderWidth="2px"
            borderColor="brand.violetDeep"
            boxShadow="0 10px 30px rgba(124, 58, 237, 0.14)"
            position="relative"
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
            gap="5"
          >
            <Box position="absolute" top="-3" right="6">
              <Badge px="3" py="1" rounded="full" bg={accent.primary} color="white" fontWeight="700" fontSize="xs">
                Recommandé
              </Badge>
            </Box>

            <Stack gap="3">
              <HStack gap="3">
                <Box boxSize="12" rounded="2xl" bg="brand.violetTint" display="flex" alignItems="center" justifyContent="center" color="brand.violetDeep" fontSize="2xl">
                  🎵
                </Box>
                <Box>
                  <Text fontFamily="heading" fontWeight="800" fontSize="lg" color="ink.900" lineHeight="tight">
                    Créer ma première chanson maintenant
                  </Text>
                  <Text fontSize="xs" color="brand.violetDeep" fontWeight="600">
                    Studio pré-rempli avec vos préférences
                  </Text>
                </Box>
              </HStack>
              <Text fontSize="sm" color="ink.500">
                Accédez immédiatement à l&apos;interface de création avec votre genre favori présélectionné et une suggestion de prompt adaptée à votre objectif.
              </Text>
            </Stack>

            <Button
              size={{md: "xl", base: 'md'}}
              rounded="full"
              fontFamily="ui"
              fontWeight="600"
              color="white"
              background={accent.primary}
              _hover={{ transform: "translateY(-2px)", boxShadow: "0 6px 20px rgba(124, 58, 237, 0.3)" }}
              transition="all 0.25s"
              onClick={handleLaunchStudio}
              w="full"
            >
              <LucideWandSparkles /> Ouvrir mon Studio personnalisé <LuArrowRight />
            </Button>
          </Box>

          {/* Option 2 : Explorer les démos et exemples */}
          <Box
            p="6"
            rounded="3xl"
            bg="paper.50"
            borderWidth="2px"
            borderColor="paper.300"
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
            gap="5"
            _hover={{ borderColor: "paper.400" }}
            transition="all 0.2s"
          >
            <Stack gap="3">
              <HStack gap="3">
                <Box boxSize="12" rounded="2xl" bg="paper.200" display="flex" alignItems="center" justifyContent="center" color="ink.700" fontSize="2xl">
                  🎧
                </Box>
                <Box>
                  <Text fontFamily="heading" fontWeight="800" fontSize="lg" color="ink.900" lineHeight="tight">
                    Explorer les démos et exemples
                  </Text>
                  <Text fontSize="xs" color="ink.400" fontWeight="500">
                    Galerie d&apos;inspiration
                  </Text>
                </Box>
              </HStack>
              <Text fontSize="sm" color="ink.500">
                Écoutez des titres créés par la communauté pretymelo pour découvrir la qualité audio et puiser des idées avant de vous lancer.
              </Text>
            </Stack>

            <Button
              size={{md: "xl", base: 'md'}}
              variant="outline"
              rounded="full"
              fontFamily="ui"
              fontWeight="600"
              color="ink.900"
              borderColor="paper.400"
              bg="paper.0"
              _hover={{ bg: "paper.100", transform: "translateY(-1px)" }}
              transition="all 0.2s"
              onClick={handleExploreDemos}
              w="full"
            >
              <LuCompass /> Découvrir la galerie d&apos;inspiration
            </Button>
          </Box>
        </Grid>
      </Stack>
    </Stack>
  );
}
