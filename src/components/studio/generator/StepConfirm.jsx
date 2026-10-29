"use client";
import {
  Badge, Box, Button, Flex, HStack, Image, Input,
  SimpleGrid, Stack, Text,
} from "@chakra-ui/react";
import { LuGlobe, LuLock, LuWandSparkles, LuZap } from "react-icons/lu";
import { LANGUAGES, flagUrl } from "./constants";
import { SUNO_MODELS } from "@/services/musicAiApi";

/**
 * Étape 6 : Récapitulatif & lancement de la génération
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
        <Text fontFamily="heading" fontWeight="800" fontSize={{ base: "2xl", sm: "3xl" }} color="ink.900" letterSpacing="-0.03em">
          Prêt à composer votre musique ?
        </Text>
        <Text fontSize="sm" color="ink.500">
          Vérifiez vos choix avant de lancer la création avec Suno AI
        </Text>
      </Stack>

      {/* Récapitulatif */}
      <Box p="5" rounded="2xl" bg="paper.0" borderWidth="1.5px" borderColor="paper.200" w="full"
        textAlign="left" boxShadow="0 4px 20px rgba(0,0,0,0.03)">
        <Stack gap="3">
          {/* Occasion */}
          <Flex justify="space-between" align="center" borderBottomWidth="1px" borderColor="paper.150" pb="2">
            <Text fontSize="xs" color="ink.500">Occasion</Text>
            <HStack gap="1.5">
              <Image src={selectedOccasionData.icon} alt={selectedOccasionData.title} width="20px" height="20px" />
              <Text fontFamily="ui" fontWeight="700" fontSize="xs" color="ink.900">{selectedOccasionData.title}</Text>
            </HStack>
          </Flex>

          {/* Voix */}
          <Flex justify="space-between" align="center" borderBottomWidth="1px" borderColor="paper.150" pb="2">
            <Text fontSize="xs" color="ink.500">Voix</Text>
            <HStack gap="1.5">
              <Image src={selectedVoiceData.icon} alt={selectedVoiceData.title} width="20px" height="20px" />
              <Text fontFamily="ui" fontWeight="700" fontSize="xs" color="ink.900">
                {selectedVoiceData.title}{vocalGender !== "auto" && !instrumental && ` (${vocalGender.toUpperCase()})`}
              </Text>
            </HStack>
          </Flex>

          {/* Style */}
          <Flex justify="space-between" align="center" borderBottomWidth="1px" borderColor="paper.150" pb="2">
            <Text fontSize="xs" color="ink.500">Style musical</Text>
            <Badge px="2.5" py="0.5" rounded="full" bg="brand.violetTint" color="brand.violetDeep" fontSize="xs" fontWeight="700">
              {musicStyle}
            </Badge>
          </Flex>

          {/* Langue */}
          <Flex justify="space-between" align="center" borderBottomWidth="1px" borderColor="paper.150" pb="2">
            <Text fontSize="xs" color="ink.500">Langue</Text>
            <HStack gap="1.5">
              {lang && (
                <Box rounded="xs" overflow="hidden" boxShadow="0 1px 3px rgba(0,0,0,0.18)" lineHeight="0" flexShrink={0}>
                  <img src={flagUrl(lang.code, "20x15")} srcSet={`${flagUrl(lang.code, "40x30")} 2x`}
                    alt={lang.country} width={20} height={15} style={{ display: "block" }} />
                </Box>
              )}
              <Text fontFamily="ui" fontWeight="700" fontSize="xs" color="ink.900">
                {lang?.label || "Français"}
              </Text>
            </HStack>
          </Flex>

          {/* Pochette */}
          <Flex justify="space-between" align="center" borderBottomWidth="1px" borderColor="paper.150" pb="2">
            <Text fontSize="xs" color="ink.500">Pochette</Text>
            {coverUrl ? (
              <HStack gap="2">
                <Box boxSize="6" rounded="md" overflow="hidden" borderWidth="1px" borderColor="paper.300">
                  <Image src={coverUrl} alt="Cover" w="full" h="full" objectFit="cover" />
                </Box>
                <Text fontSize="xs" fontWeight="700" color="brand.violetDeep">Personnalisée</Text>
              </HStack>
            ) : (
              <Text fontSize="xs" color="ink.500" fontStyle="italic">Générée automatiquement</Text>
            )}
          </Flex>

          {/* Titre (si custom) */}
          {customTitle.trim() && (
            <Flex justify="space-between" align="center" borderBottomWidth="1px" borderColor="paper.150" pb="2">
              <Text fontSize="xs" color="ink.500">Titre personnalisé</Text>
              <Text fontFamily="ui" fontWeight="700" fontSize="xs" color="ink.900">« {customTitle.trim()} »</Text>
            </Flex>
          )}

          {/* Histoire */}
          <Box pt="1">
            <Text fontSize="2xs" color="ink.400" mb="1">Votre histoire / prompt :</Text>
            <Text fontSize="xs" color="ink.700" fontStyle="italic" noOfLines={3}>
              « {story || "Création musicale sur mesure pretymelo"} »
            </Text>
          </Box>

          {lyrics.trim() && (
            <Box pt="1">
              <Text fontSize="2xs" color="brand.violetDeep" fontWeight="700">
                ✍️ Paroles personnalisées ({lyrics.split("\n").filter(Boolean).length} lignes)
              </Text>
            </Box>
          )}
        </Stack>
      </Box>

      {/* Visibilité */}
      <Flex p="3.5" rounded="2xl" bg="paper.50"
        borderWidth="1.5px" borderColor={isPublicTrack ? "green.300" : "paper.200"}
        justify="space-between" align="center" cursor="pointer"
        onClick={onTogglePublic}
        _hover={{ borderColor: isPublicTrack ? "green.400" : "brand.violet" }}
        transition="all 0.2s">
        <HStack gap="3" align="center">
          <Flex boxSize="9" rounded="full" align="center" justify="center"
            bg={isPublicTrack ? "green.100" : "paper.200"}
            color={isPublicTrack ? "green.600" : "ink.400"}>
            {isPublicTrack ? <LuGlobe size={18} /> : <LuLock size={18} />}
          </Flex>
          <Box textAlign="left">
            <Text fontSize="xs" fontWeight="700" color="ink.900">
              {isPublicTrack ? "🌐 Public (visible sur l'accueil)" : "🔒 Privé (bibliothèque personnelle)"}
            </Text>
            <Text fontSize="2xs" color="ink.500">
              {isPublicTrack ? "Ce morceau sera partagé dans la vitrine publique du site" : "Ce morceau reste privé dans votre espace personnel"}
            </Text>
          </Box>
        </HStack>
        <Badge size="sm" colorPalette={isPublicTrack ? "green" : "gray"}
          variant={isPublicTrack ? "solid" : "subtle"} rounded="full" px="2.5">
          {isPublicTrack ? "Public" : "Privé"}
        </Badge>
      </Flex>

      {/* Options avancées */}
      <Box rounded="2xl" borderWidth="1.5px"
        borderColor={isAdvancedOpen ? "brand.violet" : "paper.200"}
        bg="paper.0" overflow="hidden" transition="all 0.2s">
        <Flex p="3.5" align="center" justify="space-between" cursor="pointer"
          onClick={onToggleAdvanced}
          bg={isAdvancedOpen ? "brand.violetTint" : "paper.50"}
          _hover={{ bg: "brand.violetTint" }}>
          <Box textAlign="left">
            <Text fontSize="xs" fontWeight="700" color="ink.900">Options avancées</Text>
            <Text fontSize="3xs" color="ink.500">Titre sur mesure, tags à exclure, modèle Suno</Text>
          </Box>
          <HStack gap="1.5">
            <Badge size="2xs" colorPalette={isCustomModeActive ? "purple" : "gray"} rounded="full">
              {isCustomModeActive ? "Mode Personnalisé" : "Mode Simple"}
            </Badge>
            <Text fontSize="xs" color="ink.400">{isAdvancedOpen ? "▲" : "▼"}</Text>
          </HStack>
        </Flex>

        {isAdvancedOpen && (
          <Stack gap="3.5" p="4" textAlign="left" bg="paper.0" borderTopWidth="1px" borderColor="paper.200">
            <Box>
              <Text fontSize="xs" fontWeight="700" color="ink.800" mb="1">Titre personnalisé (Optionnel)</Text>
              <Input
                value={customTitle}
                onChange={(e) => onCustomTitleChange(e.target.value.slice(0, 80))}
                placeholder="Ex: Fatou, 30 ans de lumière"
                rounded="xl" fontSize="xs" h="9" borderColor="paper.300" bg="paper.50"
              />
              <Text fontSize="3xs" color="ink.400" mt="1">{customTitle.length}/80 caractères</Text>
            </Box>

            <Box>
              <Text fontSize="xs" fontWeight="700" color="ink.800" mb="1">Éléments indésirables (Optionnel)</Text>
              <Input
                value={negativeTags}
                onChange={(e) => onNegativeTagsChange(e.target.value.slice(0, 500))}
                placeholder="Ex: pas de batterie agressive, pas de cris"
                rounded="xl" fontSize="xs" h="9" borderColor="paper.300" bg="paper.50"
              />
              <Text fontSize="3xs" color="ink.400" mt="1">{negativeTags.length}/500 · Styles ou sons à exclure</Text>
            </Box>

            <Box>
              <Text fontSize="xs" fontWeight="700" color="ink.800" mb="1.5">Version du moteur IA Suno</Text>
              <SimpleGrid columns={2} gap="2">
                {SUNO_MODELS.map((m) => {
                  const isSel = model === m.id;
                  return (
                    <Box key={m.id} as="button" type="button" p="2.5" rounded="xl"
                      borderWidth={isSel ? "2px" : "1px"}
                      borderColor={isSel ? "brand.violetDeep" : "paper.250"}
                      bg={isSel ? "brand.violetTint" : "paper.50"}
                      textAlign="left" onClick={() => onModelChange(m.id)}
                      cursor="pointer" transition="all 0.15s">
                      <Flex justify="space-between" align="center">
                        <Text fontSize="xs" fontWeight="700" color="ink.900">{m.label}</Text>
                        {m.badge && <Badge size="2xs" colorPalette={isSel ? "purple" : "gray"}>{m.badge}</Badge>}
                      </Flex>
                      <Text fontSize="3xs" color="ink.500" mt="0.5" noOfLines={1}>{m.desc}</Text>
                    </Box>
                  );
                })}
              </SimpleGrid>
            </Box>
          </Stack>
        )}
      </Box>

      {/* Coût en Notes */}
      <HStack justify="center" gap="2" p="3" rounded="2xl"
        bg="brand.violetTint" borderWidth="1.5px" borderColor="rgba(124, 58, 237, 0.3)" w="full">
        <Text fontFamily="ui" fontWeight="700" fontSize="xs" color="brand.violetDeep">
          Coût de composition : <b>2 Notes</b> (Votre solde : {notes} Notes)
        </Text>
      </HStack>

      {/* Bouton lancement */}
      <Box pt="2">
        {notes >= notesPerSong ? (
          <Button
            size="lg" rounded="full" color="white"
            bg="linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)"
            onClick={onLaunch}
            _hover={{ transform: "translateY(-1px)", boxShadow: "0 8px 25px rgba(124, 58, 237, 0.45)" }}
            _active={{ transform: "scale(0.98)" }}
            fontFamily="ui" fontWeight="700" fontSize="sm" minW="260px" h="12" gap="2"
            boxShadow="0 4px 18px rgba(124, 58, 237, 0.35)"
          >
            <LuWandSparkles size={16} /> Lancer la composition (2 Notes)
          </Button>
        ) : (
          <Stack gap="2" align="center">
            <Text fontSize="xs" color="red.500" fontWeight="600">
              Solde insuffisant pour créer cette chanson (2 Notes requises).
            </Text>
            <Button size="md" rounded="full" color="white" bg="red.600" _hover={{ bg: "red.700" }}
              onClick={onOpenRecharge} fontFamily="ui" fontWeight="700" gap="1.5">
              <LuZap size={14} /> Recharger mes Notes
            </Button>
          </Stack>
        )}
      </Box>
    </Stack>
  );
}
