"use client";

import { useState } from "react";
import {
  Badge, Box, Button, Flex, HStack,
  Image,
  SimpleGrid, Stack, Text, Textarea,
} from "@chakra-ui/react";
import { LuChevronDown, LuGlobe, LuFileText } from "react-icons/lu";
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
  const [showLanguage, setShowLanguage] = useState(false);

  const insertTag = (tag) => {
    onLyricsChange((prev) => (prev ? `${prev}\n\n${tag}\n` : `${tag}\n`));
    if (!showCustomLyrics) onToggleCustomLyrics(true);
  };

  const selectedLangObj = LANGUAGES.find((l) => l.id === language) || LANGUAGES[0];

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
        {/* <Button
          position="absolute" top="3" right="3" size="xs" rounded="full"
          color="purple.700" bg="purple.50" borderWidth="1px" borderColor="purple.200"
          _hover={{ bg: "purple.600", color: "white" }}
          onClick={onFillSample} fontWeight="700"
        >
          Exemple
        </Button> */}
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

      {/* Accordéons superposés (sans bg white) */}
      <Box
        w="full"
        rounded="2xl"
        borderWidth="1px"
        borderColor="ink.200"
        overflow="hidden"
        textAlign="left"
        transition="all 0.25s ease"
      >
        {/* ACCORDÉON 1 : Sélecteur de langue */}
        <Box
          bg={showLanguage ? "slate.50/60" : "transparent"}
          transition="background-color 0.2s ease"
        >
          <Flex
            as="button"
            type="button"
            w="full"
            p="3.5"
            justify="space-between"
            align="center"
            cursor="pointer"
            onClick={() => setShowLanguage(!showLanguage)}
            aria-expanded={showLanguage}
            _hover={{ bg: "slate.100/50" }}
            transition="background-color 0.15s ease"
          >
            <HStack gap="2.5">
              
              <Text fontSize="sm"  color="slate.900">
                Sélecteur de langue
              </Text>
                <Image
                  src={`https://flagcdn.com/w320/${selectedLangObj.code}.png`}
                  srcSet={`https://flagcdn.com/w320/${selectedLangObj.code}.png`}
                  alt={selectedLangObj.country}
                  rounded={'full'}
                  w={5}
                  h={5}
                />
            </HStack>

            <Box
              boxSize="26px"
              rounded="full"
              bg={showLanguage ? "purple.50" : "slate.100"}
              color={showLanguage ? "purple.700" : "slate.500"}
              display="flex"
              alignItems="center"
              justifyContent="center"
              transition="all 0.2s ease"
              flexShrink={0}
            >
              <LuChevronDown
                size={15}
                style={{
                  transform: showLanguage ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              />
            </Box>
          </Flex>

          {showLanguage && (
            <Box p="4" pt="3" >
              <SimpleGrid columns={3} gap="2.5" w="full">
                {LANGUAGES.map((lang) => {
                  const isLangSelected = language === lang.id;
                  const langCode = lang.code.toLowerCase();
                  return (
                    <Box
                      key={lang.id}
                      as="button"
                      type="button"
                      onClick={() => onLanguageChange(lang.id)}
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      gap="2"
                      p="2.5"
                      rounded="2xl"
                      borderWidth="1.5px"
                      borderColor={isLangSelected ? "purple.600" : "transparent"}
                      bg={isLangSelected ? "purple.50" : "transparent"}
                      cursor="pointer"
                      transition="all 0.18s ease"
                      _hover={{
                        bg: isLangSelected ? "purple.100/70" : "slate.100/60",
                      }}
                    >
                      {/* Cercle avec le drapeau flagcdn à l'intérieur */}
                      
                        <Image
                          src={`https://flagcdn.com/w320/${langCode}.png`}
                          srcSet={`https://flagcdn.com/w320/${langCode}.png`}
                          alt={lang.country}
                          rounded={'full'}
                          w={30}
                          h={30}
                        />
                    
                      {/* Nom de la langue en dessous */}
                      <Text
                        fontSize="xs"
                        color={isLangSelected ? "purple.900" : "slate.700"}
                        lineHeight="1.2"
                        textAlign="center"
                        noOfLines={1}
                      >
                        {lang.label}
                      </Text>
                    </Box>
                  );
                })}
              </SimpleGrid>
            </Box>
          )}
        </Box>

        {/* ACCORDÉON 2 : Paroles personnalisées (superposé) */}
        <Box
          borderTopWidth="1px"
          borderColor="slate.200"
          bg={showCustomLyrics ? "slate.50/60" : "transparent"}
          transition="background-color 0.2s ease"
        >
          <Flex
            as="button"
            type="button"
            w="full"
            p="3.5"
            justify="space-between"
            align="center"
            cursor="pointer"
            onClick={() => onToggleCustomLyrics(!showCustomLyrics)}
            aria-expanded={showCustomLyrics}
            _hover={{ bg: "slate.100/50" }}
            transition="background-color 0.15s ease"
          >
            <HStack gap="2.5">
   
              <HStack gap="1.5">
                <Text fontSize="sm"  color="slate.900">
                  Paroles personnalisées
                </Text>
                <Text fontSize="2xs" color="slate.400" fontWeight="normal">
                  (optionnel)
                </Text>
              </HStack>
              {lyrics.trim() && (
                <Badge size="xs" bg="purple.50" color="purple.700" rounded="full" px="2" py="0.5" borderWidth="1px" borderColor="purple.200">
                  {lyrics.split("\n").filter(Boolean).length} vers
                </Badge>
              )}
            </HStack>

            <Box
              boxSize="26px"
              rounded="full"
              bg={showCustomLyrics ? "purple.50" : "slate.100"}
              color={showCustomLyrics ? "purple.700" : "slate.500"}
              display="flex"
              alignItems="center"
              justifyContent="center"
              transition="all 0.2s ease"
              flexShrink={0}
            >
              <LuChevronDown
                size={15}
                style={{
                  transform: showCustomLyrics ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              />
            </Box>
          </Flex>

          {showCustomLyrics && (
            <Box p="4" pt="3">
              <Stack gap="3">
                <Text fontSize="2xs" color="slate.500">
                  Saisis tes couplets et refrains. Tu peux insérer des repères de structure :
                </Text>
                <Flex wrap="wrap" gap="1.5">
                  {STRUCTURE_TAGS.map((tag) => (
                    <Button
                      key={tag} size="xs" variant="outline" rounded="lg" fontSize="2xs" h="6" px="2"
                      borderColor="slate.300" color="slate.700" bg="white"
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
                  p="3" rounded="xl" borderColor="slate.250" bg="white" resize="vertical"
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
            </Box>
          )}
        </Box>
      </Box>

      <Box pt="1">
        <Button
          size="md" rounded="full" color="white"
          bg="purple.600"
          onClick={onNext}
          disabled={story.trim().length < 5 && lyrics.trim().length < 5}
          _hover={{ bg: "purple.700", transform: "translateY(-1px)" }}
          _active={{ transform: "scale(0.98)" }}
           fontSize="sm" minW="220px" h="12"
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
