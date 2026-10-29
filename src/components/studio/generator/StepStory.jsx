"use client";

import {
  Badge, Box, Button, Flex, HStack,
  SimpleGrid, Stack, Text, Textarea,
} from "@chakra-ui/react";
import { LANGUAGES, STRUCTURE_TAGS, flagUrl } from "./constants";

/**
 * Étape 2 : Histoire, Langue & Paroles optionnelles
 * Design Light Mode épuré.
 */
export default function StepStory({
  story, onStoryChange,
  language, onLanguageChange,
  lyrics, onLyricsChange,
  showCustomLyrics, onToggleCustomLyrics,
  customMode, onCustomModeChange,
  occasion, onFillSample,
  onNext,
}) {
  const insertTag = (tag) => {
    onLyricsChange((prev) => (prev ? `${prev}\n\n${tag}\n` : `${tag}\n`));
    if (!showCustomLyrics) onToggleCustomLyrics(true);
  };

  return (
    <Stack gap={{ base: "5", md: "6" }} textAlign="center" maxW="520px" mx="auto" w="full">
      <Stack gap="1">
        <Text fontFamily="heading" fontWeight="800" fontSize={{ base: "2xl", sm: "3xl" }} color="slate.900" letterSpacing="-0.03em">
          Raconte ton histoire
        </Text>
        <Text fontSize="sm" color="slate.500">
          Décris ce que tu veux célébrer dans ta chanson
        </Text>
      </Stack>

      {/* Textarea histoire */}
      <Box
        w="full" rounded="2xl" bg="white"
        borderWidth="1.5px" borderColor="slate.200" p="4"
        position="relative" boxShadow="0 2px 12px rgba(0,0,0,0.03)"
      >
        <Button
          position="absolute" top="3" right="3" size="xs" rounded="full"
          color="purple.700" bg="purple.50" borderWidth="1px" borderColor="purple.200"
          _hover={{ bg: "purple.600", color: "white" }}
          onClick={onFillSample} fontWeight="700"
        >
          Exemple
        </Button>
        <Textarea
          value={story}
          onChange={(e) => onStoryChange(e.target.value)}
          placeholder="Ex: Une chanson pour les 50 ans de ma mère Fatou, elle adore danser, est toujours joyeuse et rassemble toute la famille..."
          border="none" _focusVisible={{ outline: "none", boxShadow: "none" }}
          minH="130px" fontSize="sm" lineHeight="tall" color="slate.900"
          p="1" pr="16" resize="none"
        />
      </Box>
      <Text fontSize="xs" color="slate.400" mt="-2">
        Minimum 10 caractères ({story.trim().length}/10)
      </Text>

      {/* Sélecteur de langue */}
      <Box
        w="full" rounded="2xl" bg="white"
        borderWidth="1px" borderColor="slate.200" p="4" textAlign="left"
        boxShadow="0 2px 8px rgba(0,0,0,0.02)"
      >
        <Flex justify="space-between" align="center" mb="3">
          <Text fontSize="xs" fontWeight="700" color="slate.900">
            Langue du chant
          </Text>
          <Badge bg="purple.50" color="purple.700" rounded="full" fontSize="2xs" px="2.5" py="0.5" borderWidth="1px" borderColor="purple.200">
            Par défaut : Français
          </Badge>
        </Flex>
        <SimpleGrid columns={3} gap="2.5" w="full">
          {LANGUAGES.map((lang) => {
            const isLangSelected = language === lang.id;
            return (
              <Box
                key={lang.id} as="button" type="button"
                onClick={() => onLanguageChange(lang.id)}
                position="relative" rounded="xl" overflow="hidden"
                borderWidth="2px"
                borderColor={isLangSelected ? "purple.600" : "slate.200"}
                bg={isLangSelected ? "purple.50" : "slate.50"}
                p="2.5" display="flex" flexDirection="column" alignItems="center" gap="1.5"
                cursor="pointer"
                transition="all 0.18s ease"
                _hover={{ borderColor: "purple.500", transform: "translateY(-1px)" }}
              >
                <Box rounded="sm" overflow="hidden" boxShadow="0 1px 3px rgba(0,0,0,0.12)" lineHeight="0" flexShrink={0} w="40px" h="30px">
                  <img
                    src={flagUrl(lang.code, "40x30")}
                    srcSet={`${flagUrl(lang.code, "80x60")} 2x`}
                    alt={lang.country} width={40} height={30}
                    style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
                    loading="lazy"
                  />
                </Box>
                <Text
                  fontSize="2xs" fontWeight={isLangSelected ? "800" : "600"}
                  color={isLangSelected ? "purple.800" : "slate.700"}
                  lineHeight="1.2" textAlign="center" noOfLines={1}
                >
                  {lang.label}
                </Text>
              </Box>
            );
          })}
        </SimpleGrid>
      </Box>

      {/* Paroles personnalisées (optionnel) */}
      <Box
        w="full" rounded="2xl" borderWidth="1px"
        borderColor={showCustomLyrics ? "purple.400" : "slate.200"}
        bg="white" p="4" textAlign="left" transition="all 0.18s ease"
      >
        <Flex
          justify="space-between" align="center" cursor="pointer"
          onClick={() => onToggleCustomLyrics(!showCustomLyrics)}
        >
          <Text fontSize="xs" fontWeight="700" color="slate.900">
            Paroles personnalisées (Optionnel)
          </Text>
          <HStack gap="2">
            {lyrics.trim() && (
              <Badge size="xs" bg="purple.50" color="purple.700" rounded="full">
                {lyrics.split("\n").filter(Boolean).length} vers
              </Badge>
            )}
            <Text fontSize="xs" color="slate.500" fontWeight="700">
              {showCustomLyrics ? "Masquer ▲" : "Écrire ▼"}
            </Text>
          </HStack>
        </Flex>

        {showCustomLyrics && (
          <Stack gap="3" pt="3">
            <Text fontSize="2xs" color="slate.500">
              Saisis tes couplets et refrains. Tu peux insérer des repères de structure :
            </Text>
            <Flex wrap="wrap" gap="1.5">
              {STRUCTURE_TAGS.map((tag) => (
                <Button
                  key={tag} size="xs" variant="outline" rounded="lg" fontSize="2xs" h="6" px="2"
                  borderColor="slate.300" color="slate.700"
                  _hover={{ bg: "purple.50", borderColor: "purple.600", color: "purple.700" }}
                  onClick={() => insertTag(tag)}
                >
                  + {tag}
                </Button>
              ))}
            </Flex>
            <Textarea
              value={lyrics}
              onChange={(e) => {
                onLyricsChange(e.target.value);
                if (e.target.value.trim()) onCustomModeChange(true);
              }}
              placeholder={`[Intro]\nUn matin plein d'espoir...\n\n[Chorus]\nFatou, fête tes 30 ans dans la joie !`}
              minH="120px" fontSize="xs" lineHeight="relaxed"
              p="3" rounded="xl" borderColor="slate.250" bg="slate.50" resize="vertical"
            />
            <Flex justify="space-between" align="center" pt="1">
              <Text fontSize="2xs" color="slate.500">Mode Paroles Suno Custom</Text>
              <Button
                size="xs"
                variant={customMode ? "solid" : "outline"}
                bg={customMode ? "purple.600" : "white"}
                color={customMode ? "white" : "slate.700"}
                borderColor="slate.300"
                rounded="full"
                onClick={() => onCustomModeChange(!customMode)}
              >
                {customMode ? "Activé" : "Automatique"}
              </Button>
            </Flex>
          </Stack>
        )}
      </Box>

      <Box pt="1">
        <Button
          size="md" rounded="full" color="white"
          bg="purple.600"
          onClick={onNext}
          disabled={story.trim().length < 5 && lyrics.trim().length < 5}
          _hover={{ bg: "purple.700", transform: "translateY(-1px)" }}
          _active={{ transform: "scale(0.98)" }}
          fontWeight="700" fontSize="sm" minW="220px" h="12"
          boxShadow="0 4px 14px rgba(124, 58, 237, 0.25)"
        >
          Continuer
        </Button>
      </Box>

      <Box
        w="full" p="3.5" rounded="2xl" bg="purple.50"
        borderWidth="1px" borderColor="purple.200" textAlign="left"
      >
        <Text fontSize="xs" color="slate.700" lineHeight="tall">
          <b>Astuce créative :</b> Plus vous mentionnez de détails personnels (prénoms, souvenirs, ville, passions), plus la chanson sera touchante.
        </Text>
      </Box>
    </Stack>
  );
}
