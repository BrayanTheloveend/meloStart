"use client";
import {
  Badge, Box, Button, Flex, HStack, IconButton,
  SimpleGrid, Stack, Text, Textarea,
} from "@chakra-ui/react";
import {
  LuChevronDown, LuChevronUp, LuCheck, LuFileText, LuLanguages, LuSparkles,
} from "react-icons/lu";
import { LANGUAGES, STRUCTURE_TAGS, flagUrl } from "./constants";

/**
 * Étape 2 : Histoire, Langue & Paroles optionnelles
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
        <Text fontFamily="heading" fontWeight="800" fontSize={{ base: "2xl", sm: "3xl" }} color="ink.900" letterSpacing="-0.03em">
          Raconte ton histoire
        </Text>
        <Text fontSize="sm" color="ink.500">
          Décris ce que tu veux dans ta chanson
        </Text>
      </Stack>

      {/* Textarea histoire */}
      <Box w="full" rounded="2xl" bg="paper.0" borderWidth="1.5px" borderColor="paper.200" p="4" position="relative" boxShadow="0 4px 20px rgba(0,0,0,0.03)">
        <IconButton
          position="absolute" top="3.5" right="3.5" size="sm" rounded="xl" variant="ghost"
          color="brand.violetDeep" bg="brand.violetTint"
          borderWidth="1px" borderColor="rgba(124, 58, 237, 0.2)"
          _hover={{ bg: "brand.violetDeep", color: "white" }}
          onClick={onFillSample} aria-label="Inspiration exemple"
        >
          <LuSparkles size={16} />
        </IconButton>
        <Textarea
          value={story}
          onChange={(e) => onStoryChange(e.target.value)}
          placeholder="Ex: Une chanson pour les 50 ans de ma mère Fatou, elle adore danser et est toujours joyeuse..."
          border="none" _focusVisible={{ outline: "none", boxShadow: "none" }}
          minH="130px" fontSize="sm" lineHeight="tall" color="ink.900"
          p="1" pr="10" resize="none"
        />
      </Box>
      <Text fontSize="xs" color="ink.400" fontFamily="ui" mt="-2">
        Minimum 10 caractères ({story.trim().length}/10)
      </Text>

      {/* Sélecteur de langue */}
      <Box w="full" rounded="2xl" bg="paper.0" borderWidth="1.5px" borderColor="paper.200" p="3.5" textAlign="left" boxShadow="0 2px 10px rgba(0,0,0,0.02)">
        <Flex justify="space-between" align="center" mb="2.5">
          <HStack gap="2">
            <LuLanguages size={16} color="#7c3aed" />
            <Text fontSize="xs" fontWeight="700" color="ink.900">Langue du chant</Text>
          </HStack>
          <Badge colorPalette="purple" rounded="full" fontSize="2xs" px="2.5" py="0.5">
            Par défaut : Français
          </Badge>
        </Flex>
        <SimpleGrid columns={3} gap="2" w="full">
          {LANGUAGES.map((lang) => {
            const isLangSelected = language === lang.id;
            return (
              <Box
                key={lang.id} as="button" type="button"
                onClick={() => onLanguageChange(lang.id)}
                position="relative" rounded="xl" overflow="hidden"
                borderWidth="2px"
                borderColor={isLangSelected ? "brand.violetDeep" : "paper.200"}
                bg={isLangSelected ? "brand.violetTint" : "paper.50"}
                p="2" display="flex" flexDirection="column" alignItems="center" gap="1.5"
                cursor="pointer"
                transition="all 0.18s cubic-bezier(.4,0,.2,1)"
                _hover={{ borderColor: "brand.violetDeep", transform: "translateY(-1px)", boxShadow: "0 4px 14px rgba(124,58,237,0.13)" }}
                boxShadow={isLangSelected ? "0 0 0 3px rgba(124,58,237,0.18)" : "none"}
              >
                <Box rounded="sm" overflow="hidden" boxShadow="0 1px 4px rgba(0,0,0,0.18)" lineHeight="0" flexShrink={0} w="40px" h="30px">
                  <img
                    src={flagUrl(lang.code, "40x30")}
                    srcSet={`${flagUrl(lang.code, "80x60")} 2x`}
                    alt={lang.country} width={40} height={30}
                    style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
                    loading="lazy"
                  />
                </Box>
                <Text fontSize="2xs" fontWeight={isLangSelected ? "700" : "600"}
                  color={isLangSelected ? "brand.violetDeep" : "ink.700"}
                  lineHeight="1.2" textAlign="center" noOfLines={1}>
                  {lang.label}
                </Text>
                {isLangSelected && (
                  <Box position="absolute" top="1" right="1" boxSize="4" rounded="full"
                    bg="brand.violetDeep" display="flex" alignItems="center" justifyContent="center">
                    <LuCheck size={9} color="white" />
                  </Box>
                )}
              </Box>
            );
          })}
        </SimpleGrid>
      </Box>

      {/* Paroles personnalisées (optionnel) */}
      <Box w="full" rounded="2xl" borderWidth="1px"
        borderColor={showCustomLyrics ? "brand.violet" : "paper.200"}
        bg={showCustomLyrics ? "paper.0" : "paper.100"}
        p="3.5" textAlign="left" transition="all 0.2s">
        <Flex justify="space-between" align="center" cursor="pointer" onClick={() => onToggleCustomLyrics(!showCustomLyrics)}>
          <HStack gap="2">
            <LuFileText size={16} color="#7c3aed" />
            <Text fontSize="xs" fontWeight="700" color="ink.900">
              Ajouter mes propres paroles (Optionnel)
            </Text>
          </HStack>
          <HStack gap="1.5">
            {lyrics.trim() && (
              <Badge size="xs" colorPalette="purple" rounded="full">
                {lyrics.split("\n").filter(Boolean).length} lignes
              </Badge>
            )}
            <IconButton size="xs" variant="ghost" aria-label="Afficher paroles">
              {showCustomLyrics ? <LuChevronUp size={16} /> : <LuChevronDown size={16} />}
            </IconButton>
          </HStack>
        </Flex>

        {showCustomLyrics && (
          <Stack gap="3" pt="3">
            <Text fontSize="2xs" color="ink.500">
              Saisis tes couplets et refrains. Tu peux insérer des balises de structure :
            </Text>
            <Flex wrap="wrap" gap="1.5">
              {STRUCTURE_TAGS.map((tag) => (
                <Button
                  key={tag} size="xs" variant="outline" rounded="lg" fontSize="2xs" h="6" px="2"
                  borderColor="paper.300" color="ink.700"
                  _hover={{ bg: "brand.violetTint", borderColor: "brand.violetDeep", color: "brand.violetDeep" }}
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
              p="2.5" rounded="xl" borderColor="paper.250" bg="paper.50" resize="vertical"
            />
            <Flex justify="space-between" align="center" pt="1">
              <Text fontSize="2xs" color="ink.500">Mode Paroles Personnalisées (Suno Custom Mode)</Text>
              <Button
                size="xs"
                variant={customMode ? "solid" : "outline"}
                bg={customMode ? "brand.violetDeep" : "transparent"}
                color={customMode ? "white" : "ink.600"}
                borderColor="brand.violet"
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
          bg="linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)"
          onClick={onNext}
          disabled={story.trim().length < 5 && lyrics.trim().length < 5}
          _hover={{ transform: "translateY(-1px)", boxShadow: "0 8px 25px rgba(124, 58, 237, 0.4)" }}
          _active={{ transform: "scale(0.98)" }}
          fontFamily="ui" fontWeight="700" fontSize="sm" minW="220px" h="12"
          boxShadow="0 4px 18px rgba(124, 58, 237, 0.3)"
        >
          Continuer &gt;
        </Button>
      </Box>

      <Box w="full" p="3.5" rounded="2xl" bg="brand.violetTint"
        borderWidth="1px" borderColor="rgba(124, 58, 237, 0.15)" textAlign="left">
        <Text fontSize="xs" color="ink.600" lineHeight="tall">
          💡 <b>Astuce :</b> Plus tu donnes de détails (prénoms, anecdotes, souvenirs), plus la chanson sera unique et émouvante !
        </Text>
      </Box>
    </Stack>
  );
}
