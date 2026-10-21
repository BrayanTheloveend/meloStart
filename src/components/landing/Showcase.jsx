"use client";

import { useState } from "react";
import NextLink from "next/link";
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Image,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { LuArrowRight, LuPlay, LuPause } from "react-icons/lu";
import Reveal from "@/components/common/Reveal";
import Waveform from "@/components/common/Waveform";
import { sampleTracks } from "@/data/content";
import { accent } from "@/theme/system";

export default function Showcase() {
  // Piste sélectionnée par défaut (la première ou une piste spécifique)
  const [activeTrackId, setActiveTrackId] = useState(
    sampleTracks[2]?.id || sampleTracks[0]?.id
  );
  const [isPlaying, setIsPlaying] = useState(false);

  // Récupère l'objet piste active
  const activeTrack =
    sampleTracks.find((t) => t.id === activeTrackId) || sampleTracks[0];

  const togglePlay = (id) => {
    if (activeTrackId === id) {
      setIsPlaying(!isPlaying);
    } else {
      setActiveTrackId(id);
      setIsPlaying(true);
    }
  };

  return (
    <Box as="section" id="examples" py={{ base: "16", md: "24" }}>
      <Container maxW="7xl">
        <Reveal>
          <SimpleGrid
            columns={{ base: 1, lg: 12 }}
            gap={{ base: "10", lg: "12" }}
            alignItems="center"
          >
            {/* --- COLONNE GAUCHE : Textes, Sélection de pistes & CTA --- */}
            <Stack gap="6" gridColumn={{ lg: "span 6" }} align="flex-start">
              <Stack gap="3">
                <Heading
                  as="h2"
                  fontFamily="heading"
                  fontWeight="800"
                  fontSize={{ base: "3xl", md: "5xl" }}
                  letterSpacing="-0.035em"
                  lineHeight="1.1"
                >
                  Ils ont créé ça avec <br />
                  <Text as="span" color="brand.violet">
                    melostars
                  </Text>
                </Heading>
                <Text color="ink.500" fontSize="lg" maxW="md">
                  Écoutez des exemples de chansons personnalisées créées pour des
                  moments uniques.
                </Text>
              </Stack>

              {/* Sous-titre dynamique indicatif */}
              <Text
                fontFamily="ui"
                fontSize="xs"
                fontWeight="700"
                letterSpacing="0.1em"
                textTransform="uppercase"
                color="ink.400"
                mt="2"
              >
                {sampleTracks.length} chansons, multiples émotions
              </Text>

              {/* Liste interactives des morceaux */}
              <Stack gap="2.5" w="100%" maxW="lg">
                {sampleTracks.map((t) => {
                  const isActive = t.id === activeTrackId;
                  return (
                    <HStack
                      key={t.id}
                      gap="4"
                      p="3"
                      px="4"
                      rounded="2xl"
                      cursor="pointer"
                      transition="all 0.2s ease"
                      bg={isActive ? "paper.0" : "transparent"}
                      borderWidth="1px"
                      borderColor={isActive ? "brand.violet" : "transparent"}
                      boxShadow={
                        isActive
                          ? "0 10px 25px -5px rgba(0, 0, 0, 0.05)"
                          : "none"
                      }
                      _hover={{
                        bg: isActive ? "paper.0" : "paper.100",
                      }}
                      onClick={() => setActiveTrackId(t.id)}
                    >
                      {/* Vignette / Cover miniature */}
                      <Box
                        pos="relative"
                        boxSize="12"
                        rounded="xl"
                        overflow="hidden"
                        flexShrink={0}
                        bg="paper.200"
                      >
                        {t.cover ? (
                          <Image
                            src={t.cover}
                            alt={t.title}
                            boxSize="100%"
                            objectFit="cover"
                          />
                        ) : (
                          <Flex
                            boxSize="100%"
                            align="center"
                            justify="center"
                            bg={accent.primary}
                            color="white"
                          >
                            <LuPlay size={16} />
                          </Flex>
                        )}
                      </Box>

                      {/* Infos morceau */}
                      <Stack gap="0" flex="1" minW="0">
                        <Text
                          fontFamily="heading"
                          fontWeight={isActive ? "700" : "600"}
                          fontSize="md"
                          color={isActive ? "brand.violet" : "ink.900"}
                          truncate
                        >
                          {t.title}
                        </Text>
                        <Text fontSize="xs" color="ink.500" truncate>
                          {t.meta || t.style}
                        </Text>
                      </Stack>

                      {/* Durée */}
                      <Text
                        fontFamily="ui"
                        fontSize="xs"
                        fontWeight="500"
                        color="ink.400"
                      >
                        {t.length}
                      </Text>
                    </HStack>
                  );
                })}
              </Stack>

              {/* Bouton CTA principal */}
              <Button
                asChild
                size="lg"
                rounded="full"
                px="8"
                mt="2"
                fontFamily="ui"
                background={accent.primary}
                color="white"
                _hover={{ opacity: 0.9, transform: "translateY(-1px)" }}
                boxShadow="0 10px 20px -5px rgba(139, 92, 246, 0.3)"
              >
                <NextLink href="/studio">
                  Créer la mienne <LuArrowRight />
                </NextLink>
              </Button>
            </Stack>

            {/* --- COLONNE DROITE : Player Principal Grand Format --- */}
            <Box gridColumn={{ lg: "span 6" }}>
              <Box
                p={{ base: "6", md: "8" }}
                rounded="3xl"
                bg="paper.0"
                borderWidth="1px"
                borderColor="paper.300"
                boxShadow="0 20px 40px -15px rgba(0,0,0,0.07)"
                pos="relative"
              >
                {/* Simulation de la Pochette + Vinyle */}
                <Box pos="relative" w="100%" mb="6">
                  <Flex
                    justify="center"
                    align="center"
                    pos="relative"
                    mx="auto"
                    maxW="360px"
                  >
                    {/* Disque Vinyle arrière-plan */}
                    <Box
                      pos="absolute"
                      right="-15px"
                      boxSize="220px"
                      rounded="full"
                      bg="black"
                      borderWidth="4px"
                      borderColor="rgba(255,255,255,0.1)"
                      boxShadow="0 10px 30px rgba(0,0,0,0.3)"
                      display={{ base: "none", sm: "block" }}
                    >
                      <Flex
                        boxSize="100%"
                        align="center"
                        justify="center"
                        rounded="full"
                      >
                        <Box boxSize="80px" rounded="full" bg="paper.800" />
                      </Flex>
                    </Box>

                    {/* Pochette Principale */}
                    <Box
                      pos="relative"
                      zIndex={1}
                      w="100%"
                      h="260px"
                      rounded="2xl"
                      overflow="hidden"
                      bg="paper.200"
                      boxShadow="0 15px 30px rgba(0,0,0,0.15)"
                    >
                      {activeTrack?.cover ? (
                        <Image
                          src={activeTrack.cover}
                          alt={activeTrack.title}
                          boxSize="100%"
                          objectFit="cover"
                        />
                      ) : (
                        <Box
                          boxSize="100%"
                          background={accent.primary}
                          opacity={0.85}
                        />
                      )}

                      {/* Badges de Tags sur la pochette (ex: Hommage, Ambiance, etc.) */}
                      <HStack pos="absolute" bottom="4" left="4" gap="2">
                        {(activeTrack?.tags || ["SUR-MESURE", "ÉMOTION"]).map(
                          (tag, idx) => (
                            <Badge
                              key={idx}
                              px="3"
                              py="1"
                              rounded="full"
                              bg="rgba(0,0,0,0.65)"
                              backdropFilter="blur(8px)"
                              color="white"
                              fontSize="xs"
                              fontWeight="600"
                              borderWidth="1px"
                              borderColor="whiteAlpha.300"
                            >
                              {tag}
                            </Badge>
                          )
                        )}
                      </HStack>
                    </Box>
                  </Flex>
                </Box>

                {/* Status indicator */}
                <HStack gap="2" mb="1">
                  <Box
                    boxSize="2"
                    rounded="full"
                    bg={isPlaying ? "green.400" : "brand.violet"}
                  />
                  <Text
                    fontFamily="ui"
                    fontSize="xs"
                    fontWeight="700"
                    letterSpacing="0.08em"
                    textTransform="uppercase"
                    color="brand.violet"
                  >
                    {isPlaying ? "En cours de lecture" : "Prêt à écouter"}
                  </Text>
                </HStack>

                {/* Titre & Style du morceau actif */}
                <Heading
                  as="h3"
                  fontFamily="heading"
                  fontWeight="800"
                  fontSize="2xl"
                  lineHeight="1.2"
                  mb="1"
                >
                  {activeTrack?.title}
                </Heading>
                <Text fontSize="sm" color="ink.500" mb="6">
                  {activeTrack?.meta || activeTrack?.style || "Style personnalisé"}
                </Text>

                {/* Forme d'onde + Bouton Play/Pause */}
                <HStack gap="4" align="center">
                  <Flex
                    as="button"
                    onClick={() => togglePlay(activeTrackId)}
                    boxSize={{md: "14", base: '12'}}
                    flexShrink={0}
                    rounded="full"
                    align="center"
                    justify="center"
                    color="white"
                    background={accent.primary}
                    boxShadow="0 8px 20px -4px rgba(139, 92, 246, 0.5)"
                    transition="transform 0.2s ease"
                    _hover={{ transform: "scale(1.05)" }}
                    _active={{ transform: "scale(0.95)" }}
                  >
                    {isPlaying ? <LuPause size={24} /> : <LuPlay size={24} ml="1" />}
                  </Flex>

                  <Stack gap="1" flex="1">
                    <Waveform
                      bars={50} height={72}
                      progress={isPlaying ? 0.45 : 0.15}
                    />
                    <Flex justify="space-between" fontFamily="ui" fontSize="xs" color="ink.400">
                      <Text>{isPlaying ? "0:42" : "0:00"}</Text>
                      <Text>{activeTrack?.length || "2:50"}</Text>
                    </Flex>
                  </Stack>
                </HStack>
              </Box>
            </Box>
          </SimpleGrid>
        </Reveal>
      </Container>
    </Box>
  );
}