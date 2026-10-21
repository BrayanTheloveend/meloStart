"use client";

import { useState } from "react";
import { Badge, Box, Button, Flex, Grid, HStack, IconButton, Stack, Text } from "@chakra-ui/react";
import { LuCheck, LuMic, LuPause, LuPlay, LuSparkles } from "react-icons/lu";
import { accent } from "@/theme/system";

const voicesList = [
  { id: "claire_pop", name: "Claire (Pop & Douceur)", type: "Féminine", style: "Pop, Variété, Acoustique", desc: "Timbre cristallin et chaleureux, idéal pour les chansons émotionnelles et refrains pop." },
  { id: "marc_soul", name: "Marc (Soul & R&B)", type: "Masculine", style: "R&B, Soul, Amapiano", desc: "Voix profonde avec du groove et un grain velouté pour les mélodies sensuelles." },
  { id: "amina_afro", name: "Amina (Afrobeat & Énergie)", type: "Féminine", style: "Afrobeat, Dancehall, Amapiano", desc: "Voix solaire et dynamique pleine d'ambiance et d'énergie festive." },
  { id: "kevin_rap", name: "Kevin (Rap & Flow)", type: "Masculine", style: "Rap, Trap, Hip-Hop", desc: "Flow percutant, articulation nette et présence vocale affirmée." },
  { id: "duo_harmony", name: "Duo Éclipse (Harmonies)", type: "Duo", style: "Pop, Ballade, Cinématique", desc: "Combinaison polyphonique voix masculine et féminine pour des montées grandioses." },
];

export default function StudioVoices({ activeVoice = "claire_pop", onSelectVoice }) {
  const [playingVoice, setPlayingVoice] = useState(null);

  const togglePreview = (id) => {
    setPlayingVoice((prev) => (prev === id ? null : id));
  };

  return (
    <Stack gap="8" p={{ base: "5", md: "8" }} maxW="6xl" mx="auto">
      {/* En-tête */}
      <Flex justify="space-between" align={{ base: "flex-start", sm: "center" }} direction={{ base: "column", sm: "row" }} gap="4">
        <Box>
          <HStack gap="2">
            <Text fontFamily="heading" fontWeight="800" fontSize={{ base: "2xl", md: "3xl" }} color="ink.900" letterSpacing="-0.03em">
              Voix & Personnalisation Vocale
            </Text>
            <Badge rounded="full" bg="brand.violetTint" color="brand.violetDeep" px="2.5" py="0.5" fontFamily="ui" fontWeight="600">
              Modèles IA
            </Badge>
          </HStack>
          <Text fontSize="sm" color="ink.500" mt="1">
            Sélectionnez la voix IA qui interprétera votre prochaine chanson dans le Studio.
          </Text>
        </Box>
      </Flex>

      {/* Carte Cloner sa propre voix (Feature Créateur / Studio) */}
      <Box p="6" rounded="3xl" bg="paper.0" borderWidth="2px" borderColor="brand.violet" boxShadow="0 8px 24px rgba(124, 58, 237, 0.1)">
        <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "flex-start", md: "center" }} gap="5">
          <HStack gap="4">
            <Box boxSize="12" rounded="2xl" bg="brand.violetTint" display="flex" alignItems="center" justifyContent="center" color="brand.violetDeep" fontSize="2xl">
              🎙️
            </Box>
            <Box>
              <HStack gap="2">
                <Text fontFamily="heading" fontWeight="700" fontSize="lg" color="ink.900">
                  Cloner votre propre voix
                </Text>
                <Badge bg={accent.primary} color="white" rounded="full" fontSize="2xs">
                  Plan Studio
                </Badge>
              </HStack>
              <Text fontSize="xs" color="ink.500" mt="1">
                Enregistrez 30 secondes d&apos;échantillon audio pour créer votre avatar vocal IA personnalisé.
              </Text>
            </Box>
          </HStack>
          <Button size="md" rounded="full" color="white" background={accent.primary} onClick={() => alert("Le clonage vocal nécessite le plan Studio ou Créateur.")}>
            <LuSparkles /> Activer le clonage vocal
          </Button>
        </Flex>
      </Box>

      {/* Catalogue des voix prédéfinies */}
      <Stack gap="4">
        <Text fontFamily="ui" fontWeight="700" fontSize="md" color="ink.900">
          Voix professionnelles disponibles
        </Text>

        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap="4">
          {voicesList.map((v) => {
            const isSelected = activeVoice === v.id;
            const isAuditioning = playingVoice === v.id;

            return (
              <Box
                key={v.id}
                p="5"
                rounded="2xl"
                bg={isSelected ? "brand.violetTint" : "paper.50"}
                borderWidth="2px"
                borderColor={isSelected ? "brand.violetDeep" : "paper.200"}
                boxShadow={isSelected ? "0 4px 16px rgba(124, 58, 237, 0.12)" : "none"}
                transition="all 0.2s"
              >
                <Flex justify="space-between" align="flex-start" mb="3">
                  <HStack gap="3">
                    <IconButton
                      size="sm"
                      rounded="full"
                      color="white"
                      background={accent.primary}
                      onClick={() => togglePreview(v.id)}
                      aria-label="Écouter extrait"
                    >
                      {isAuditioning ? <LuPause size={14} /> : <LuPlay size={14} />}
                    </IconButton>
                    <Box>
                      <Text fontFamily="ui" fontWeight="700" fontSize="sm" color="ink.900">
                        {v.name}
                      </Text>
                      <HStack gap="2" mt="0.5">
                        <Badge size="2xs" rounded="full" bg="paper.200" color="ink.700">
                          {v.type}
                        </Badge>
                        <Text fontSize="2xs" color="ink.400">
                          {v.style}
                        </Text>
                      </HStack>
                    </Box>
                  </HStack>

                  <Button
                    size="xs"
                    rounded="full"
                    fontFamily="ui"
                    fontWeight="600"
                    color={isSelected ? "white" : "brand.violetDeep"}
                    bg={isSelected ? accent.primary : "white"}
                    borderWidth="1px"
                    borderColor="brand.violetDeep"
                    onClick={() => onSelectVoice && onSelectVoice(v.id)}
                  >
                    {isSelected ? <><LuCheck size={12} /> Sélectionnée</> : "Choisir"}
                  </Button>
                </Flex>

                <Text fontSize="xs" color="ink.500" lineHeight="short">
                  {v.desc}
                </Text>
              </Box>
            );
          })}
        </Grid>
      </Stack>
    </Stack>
  );
}
