"use client";

import NextLink from "next/link";
import { Badge, Box, Container, Flex, Heading, HStack, Image, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { LuArrowRight, LuArrowUpRight, LuMusic } from "react-icons/lu";
import SectionHead from "@/components/common/SectionHead";
import Reveal from "@/components/common/Reveal";
import { useCases } from "@/data/content";
import { accent } from "@/theme/system";

/**
 * Grille d'usages et occasions (Anniversaires, Mariages, Podcasts, etc.)
 * avec photographies immersives et cartes interactives.
 */
export default function UseCases() {
  return (
    <Box as="section" id="occasions" pb={{ base: "20", md: "28" }} pt={{ base: "4", md: "8" }}>
      <Container maxW="7xl">
        <Reveal>
          <SectionHead
            pill="Occasions"
            title="Une musique pour chaque occasion"
            text="Des cadeaux émouvants aux contenus professionnels, pretymelo donne vie à vos histoires en quelques secondes."
          />
        </Reveal>

        <SimpleGrid mt="12" columns={{ base: 1, md: 2, lg: 3 }} gap="6">
          {useCases.map((u, i) => (
            <Reveal key={u.title} delay={i * 80}>
              <Box
                as={NextLink}
                href="/studio"
                role="group"
                display="flex"
                flexDirection="column"
                h="100%"
                bg="white"
                rounded="3xl"
                borderWidth="1px"
                borderColor="paper.200"
                overflow="hidden"
                boxShadow="0 4px 20px -2px rgba(24, 24, 27, 0.04)"
                transition="all 0.35s cubic-bezier(0.16, 1, 0.3, 1)"
                _hover={{
                  transform: "translateY(-5px)",
                  borderColor: "brand.violet",
                  boxShadow: "0 20px 40px -15px rgba(124, 58, 237, 0.15)",
                }}
                textDecoration="none"
              >
                {/* Conteneur Image avec zoom au survol et badges */}
                <Box
                  position="relative"
                  w="100%"
                  h={{ base: "200px", sm: "220px" }}
                  overflow="hidden"
                  bg="paper.100"
                >
                  <Image
                    src={u.image}
                    alt={u.alt || u.title}
                    w="100%"
                    h="100%"
                    objectFit="cover"
                    loading="lazy"
                    transition="transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)"
                    _groupHover={{ transform: "scale(1.07)" }}
                  />

                  {/* Dégradé d'ambiance sur l'image */}
                  <Box
                    position="absolute"
                    inset="0"
                    bg="linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.7) 100%)"
                    pointerEvents="none"
                  />

                  

                  {/* Bouton flèche interactive en haut à droite */}
                  <Flex
                    position="absolute"
                    top="3.5"
                    right="3.5"
                    boxSize="8"
                    rounded="full"
                    bg="rgba(255, 255, 255, 0.92)"
                    backdropFilter="blur(8px)"
                    color="ink.900"
                    align="center"
                    justify="center"
                    boxShadow="0 2px 8px rgba(0,0,0,0.1)"
                    transition="all 0.25s ease"
                    _groupHover={{
                      bg: accent.primary,
                      color: "white",
                      transform: "scale(1.08)",
                    }}
                  >
                    <LuArrowUpRight size={16} />
                  </Flex>

                  {/* Style musical suggéré en bas à gauche */}
                  <HStack
                    position="absolute"
                    bottom="3.5"
                    left="3.5"
                    gap="1.5"
                    px="2.5"
                    py="1"
                    rounded="full"
                    bg="rgba(0, 0, 0, 0.6)"
                    backdropFilter="blur(8px)"
                    borderWidth="1px"
                    borderColor="whiteAlpha.300"
                    color="white"
                    fontSize="xs"
                    fontWeight="600"
                  >
                    <LuMusic size={12} color="#ec4899" />
                    <Text as="span">{u.genre}</Text>
                  </HStack>
                </Box>

                {/* Corps de la carte */}
                <Stack gap="2.5" p="6" flex="1" justify="space-between">
                  <Stack gap="2">
                    <Heading
                      as="h3"
                      fontFamily="heading"
                      fontWeight="700"
                      fontSize="xl"
                      color="ink.900"
                      transition="color 0.25s"
                      _groupHover={{ color: "brand.violetDeep" }}
                    >
                      {u.title}
                    </Heading>
                    <Text color="ink.500" fontSize="sm" lineHeight="tall">
                      {u.text}
                    </Text>
                  </Stack>

                  {/* Lien CTA d'action */}
                  <HStack
                    pt="3"
                    gap="1.5"
                    color="brand.violetDeep"
                    fontFamily="ui"
                    fontWeight="600"
                    fontSize="sm"
                    transition="all 0.25s ease"
                    _groupHover={{ color: accent.primary }}
                  >
                    <Text as="span">Créer ma chanson</Text>
                    <Box
                      as="span"
                      display="inline-flex"
                      transition="transform 0.25s ease"
                      _groupHover={{ transform: "translateX(4px)" }}
                    >
                      <LuArrowRight size={15} />
                    </Box>
                  </HStack>
                </Stack>
              </Box>
            </Reveal>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}
