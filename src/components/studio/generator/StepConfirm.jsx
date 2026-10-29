"use client";

import {
  Badge, Box, Button, Flex, HStack, Image, Input,
  SimpleGrid, Stack, Text,
} from "@chakra-ui/react";
import { LANGUAGES, flagUrl } from "./constants";
import { SUNO_MODELS } from "@/services/musicAiApi";

/**
 * Étape 6 : Récapitulatif & lancement de la génération
 * Design Light Mode sobre et éditorial.
 */
export default function StepConfirm({
  selectedOccasionData,
  selectedVoiceData,
  musicStyle,
  language,
  coverUrl,
  story,
  lyrics,
  customTitle, onCustomTitleChange,
  negativeTags, onNegativeTagsChange,
  model, onModelChange,
  vocalGender,
  instrumental,
  isPublicTrack, onTogglePublic,
  notes,
  notesPerSong,
  onLaunch,
  onOpenRecharge,
  customMode,
  isAdvancedOpen, onToggleAdvanced,
}) {
  const lang = LANGUAGES.find((l) => l.id === language);
  const isCustomModeActive = Boolean(customMode || lyrics.trim() || customTitle.trim() || negativeTags.trim());

  return (
    <Stack gap="5" textAlign="center" maxW="490px" mx="auto" w="full">
      <Stack gap="1">
        <Text fontFamily="heading" fontWeight="800" fontSize={{ base: "2xl", sm: "3xl" }} color="slate.900" letterSpacing="-0.03em">
          Prêt à composer votre musique ?
        </Text>
        <Text fontSize="sm" color="slate.500">
          Vérifiez vos choix avant de lancer la création avec Suno AI
        </Text>
      </Stack>

      {/* Récapitulatif blanc et bordé */}
      <Box
        p="5" rounded="2xl" bg="white"
        borderWidth="1px" borderColor="slate.200" w="full"
        textAlign="left" boxShadow="0 2px 10px rgba(0,0,0,0.03)"
      >
        <Stack gap="3">
          {/* Occasion */}
          <Flex justify="space-between" align="center" borderBottomWidth="1px" borderColor="slate.100" pb="2">
            <Text fontSize="xs" color="slate.500">Occasion</Text>
            <HStack gap="1.5">
              {selectedOccasionData?.icon && (
                <Image src={selectedOccasionData.icon} alt={selectedOccasionData.title} width="20px" height="20px" />
              )}
              <Text fontWeight="700" fontSize="xs" color="slate.900">{selectedOccasionData?.title}</Text>
            </HStack>
          </Flex>

          {/* Voix */}
          <Flex justify="space-between" align="center" borderBottomWidth="1px" borderColor="slate.100" pb="2">
            <Text fontSize="xs" color="slate.500">Voix</Text>
            <HStack gap="1.5">
              {selectedVoiceData?.icon && (
                <Image src={selectedVoiceData.icon} alt={selectedVoiceData.title} width="20px" height="20px" />
              )}
              <Text fontWeight="700" fontSize="xs" color="slate.900">
                {selectedVoiceData?.title}{vocalGender !== "auto" && !instrumental && ` (${vocalGender.toUpperCase()})`}
              </Text>
            </HStack>
          </Flex>

          {/* Style */}
          <Flex justify="space-between" align="center" borderBottomWidth="1px" borderColor="slate.100" pb="2">
            <Text fontSize="xs" color="slate.500">Style musical</Text>
            <Badge px="2.5" py="0.5" rounded="full" bg="purple.50" color="purple.700" fontSize="xs" fontWeight="700">
              {musicStyle}
            </Badge>
          </Flex>

          {/* Langue */}
          <Flex justify="space-between" align="center" borderBottomWidth="1px" borderColor="slate.100" pb="2">
            <Text fontSize="xs" color="slate.500">Langue</Text>
            <HStack gap="1.5">
              {lang && (
                <Box rounded="xs" overflow="hidden" boxShadow="0 1px 3px rgba(0,0,0,0.18)" lineHeight="0" flexShrink={0}>
                  <img
                    src={flagUrl(lang.code, "20x15")}
                    srcSet={`${flagUrl(lang.code, "40x30")} 2x`}
                    alt={lang.country} width={20} height={15} style={{ display: "block" }}
                  />
                </Box>
              )}
              <Text fontWeight="700" fontSize="xs" color="slate.900">
                {lang?.label || "Français"}
              </Text>
            </HStack>
          </Flex>

          {/* Pochette */}
          <Flex justify="space-between" align="center" borderBottomWidth="1px" borderColor="slate.100" pb="2">
            <Text fontSize="xs" color="slate.500">Pochette</Text>
            {coverUrl ? (
              <HStack gap="2">
                <Box boxSize="6" rounded="md" overflow="hidden" borderWidth="1px" borderColor="slate.300">
                  <Image src={coverUrl} alt="Cover" w="full" h="full" objectFit="cover" />
                </Box>
                <Text fontSize="xs" fontWeight="700" color="purple.700">Personnalisée</Text>
              </HStack>
            ) : (
              <Text fontSize="xs" color="slate.500">Générée par Suno</Text>
            )}
          </Flex>

          {/* Titre (si custom) */}
          {customTitle.trim() && (
            <Flex justify="space-between" align="center" borderBottomWidth="1px" borderColor="slate.100" pb="2">
              <Text fontSize="xs" color="slate.500">Titre personnalisé</Text>
              <Text fontWeight="700" fontSize="xs" color="slate.900">« {customTitle.trim()} »</Text>
            </Flex>
          )}

          {/* Histoire */}
          <Box pt="1">
            <Text fontSize="2xs" color="slate.400" mb="1">Votre histoire / consigne :</Text>
            <Text fontSize="xs" color="slate.700" noOfLines={3}>
              « {story || "Création musicale sur mesure pretymelo"} »
            </Text>
          </Box>

          {lyrics.trim() && (
            <Box pt="1">
              <Text fontSize="2xs" color="purple.700" fontWeight="700">
                Paroles personnalisées ({lyrics.split("\n").filter(Boolean).length} vers)
              </Text>
            </Box>
          )}
        </Stack>
      </Box>

      {/* Visibilité */}
      <Flex
        p="4" rounded="2xl" bg="white"
        borderWidth="1px" borderColor={isPublicTrack ? "emerald.300" : "slate.200"}
        justify="space-between" align="center" cursor="pointer"
        onClick={onTogglePublic}
        _hover={{ borderColor: "purple.500" }}
        transition="all 0.18s ease"
      >
        <Box textAlign="left">
          <Text fontSize="xs" fontWeight="700" color="slate.900">
            {isPublicTrack ? "Visibilité publique" : "Visibilité privée"}
          </Text>
          <Text fontSize="2xs" color="slate.500">
            {isPublicTrack ? "Partagé dans la galerie pretymelo" : "Réservé à votre bibliothèque personnelle"}
          </Text>
        </Box>
        <Badge
          px="2.5" py="1" rounded="full"
          bg={isPublicTrack ? "emerald.50" : "slate.100"}
          color={isPublicTrack ? "emerald.700" : "slate.600"}
          borderWidth="1px"
          borderColor={isPublicTrack ? "emerald.200" : "slate.200"}
          fontSize="2xs" fontWeight="700"
        >
          {isPublicTrack ? "Public" : "Privé"}
        </Badge>
      </Flex>

      {/* Options avancées */}
      <Box
        rounded="2xl" borderWidth="1px"
        display={'none'}
        borderColor={isAdvancedOpen ? "purple.400" : "slate.200"}
        bg="white" overflow="hidden" transition="all 0.18s ease"
      >
        <Flex
          p="3.5" align="center" justify="space-between" cursor="pointer"
          onClick={onToggleAdvanced}
          bg={isAdvancedOpen ? "purple.50" : "white"}
          _hover={{ bg: "slate.50" }}
        >
          <Box textAlign="left">
            <Text fontSize="xs" fontWeight="700" color="slate.900">Options avancées</Text>
            <Text fontSize="3xs" color="slate.500">Titre spécifique, exclusions, choix du modèle Suno</Text>
          </Box>
          <HStack gap="2">
            <Badge size="2xs" bg="slate.100" color="slate.600" rounded="full">
              {isCustomModeActive ? "Mode Personnalisé" : "Mode Simple"}
            </Badge>
            <Text fontSize="xs" color="slate.400">{isAdvancedOpen ? "▲" : "▼"}</Text>
          </HStack>
        </Flex>

        {isAdvancedOpen && (
          <Stack gap="3.5" p="4" textAlign="left" bg="white" borderTopWidth="1px" borderColor="slate.200">
            <Box>
              <Text fontSize="xs" fontWeight="700" color="slate.800" mb="1">Titre de la chanson (Optionnel)</Text>
              <Input
                value={customTitle}
                onChange={(e) => onCustomTitleChange(e.target.value.slice(0, 80))}
                placeholder="Ex: Fatou, 30 ans de lumière"
                rounded="xl" fontSize="xs" h="9" borderColor="slate.300" bg="slate.50"
              />
              <Text fontSize="3xs" color="slate.400" mt="1">{customTitle.length}/80 caractères</Text>
            </Box>

            <Box>
              <Text fontSize="xs" fontWeight="700" color="slate.800" mb="1">Éléments indésirables (Optionnel)</Text>
              <Input
                value={negativeTags}
                onChange={(e) => onNegativeTagsChange(e.target.value.slice(0, 500))}
                placeholder="Ex: pas de batterie agressive, pas de cris"
                rounded="xl" fontSize="xs" h="9" borderColor="slate.300" bg="slate.50"
              />
              <Text fontSize="3xs" color="slate.400" mt="1">{negativeTags.length}/500 · Styles ou sons à exclure</Text>
            </Box>

            <Box>
              <Text fontSize="xs" fontWeight="700" color="slate.800" mb="1.5">Version du moteur IA Suno</Text>
              <SimpleGrid columns={2} gap="2">
                {SUNO_MODELS.map((m) => {
                  const isSel = model === m.id;
                  return (
                    <Box
                      key={m.id} as="button" type="button" p="2.5" rounded="xl"
                      borderWidth={isSel ? "2px" : "1px"}
                      borderColor={isSel ? "purple.600" : "slate.200"}
                      bg={isSel ? "purple.50" : "slate.50"}
                      textAlign="left" onClick={() => onModelChange(m.id)}
                      cursor="pointer" transition="all 0.15s"
                    >
                      <Flex justify="space-between" align="center">
                        <Text fontSize="xs" fontWeight="700" color={isSel ? "purple.800" : "slate.900"}>{m.label}</Text>
                        {m.badge && (
                          <Badge size="2xs" bg={isSel ? "purple.200" : "slate.200"} color={isSel ? "purple.800" : "slate.700"}>
                            {m.badge}
                          </Badge>
                        )}
                      </Flex>
                      <Text fontSize="3xs" color="slate.500" mt="0.5" noOfLines={1}>{m.desc}</Text>
                    </Box>
                  );
                })}
              </SimpleGrid>
            </Box>
          </Stack>
        )}
      </Box>

      {/* Coût en Notes */}
      <HStack
        justify="center" gap="2" p="3" rounded="2xl"
        bg="purple.50" borderWidth="1px" borderColor="purple.200" w="full"
      >
        <Text fontWeight="700" fontSize="xs" color="purple.800">
          Coût de composition : <b>2 Notes</b> (Votre solde actuel : {notes} Notes)
        </Text>
      </HStack>

      {/* Bouton lancement */}
      <Box pt="2">
        {notes >= notesPerSong ? (
          <Button
            size="lg" rounded="full" color="white"
            bg="purple.600"
            onClick={onLaunch}
            _hover={{ bg: "purple.700", transform: "translateY(-1px)" }}
            _active={{ transform: "scale(0.98)" }}
            fontWeight="700" fontSize="sm" minW="260px" h="12"
            boxShadow="0 4px 14px rgba(124, 58, 237, 0.3)"
          >
            Lancer la composition (2 Notes)
          </Button>
        ) : (
          <Stack gap="2" align="center">
            <Text fontSize="xs" color="rose.600" fontWeight="600">
              Solde insuffisant pour créer cette chanson (2 Notes requises).
            </Text>
            <Button
              size="md" rounded="full" color="white" bg="rose.600" _hover={{ bg: "rose.700" }}
              onClick={onOpenRecharge} fontWeight="700"
            >
              Recharger mes Notes
            </Button>
          </Stack>
        )}
      </Box>
    </Stack>
  );
}
