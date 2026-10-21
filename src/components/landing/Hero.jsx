"use client";

import NextLink from "next/link";
import { Avatar, Badge, Box, Button, Container, Flex, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import { LuArrowRight, LuStar } from "react-icons/lu";
import GlowBackground from "@/components/common/GlowBackground";
import HeroPlayer from "./HeroPlayer";
import RotatingText from "./RotatingText";
import { accent } from "@/theme/system";

// Phrases qui défilent après « Créer une musique »
const heroPhrases = [
  "pour un anniversaire",
  "en moins d'une minute",
  "pour un mariage",
  "pour votre vidéo",
  "à votre image",
];

export default function Hero() {
  return (
    <Box as="section" position="relative" overflow="hidden" pt={{ base: "32", md: "40" }} pb={{ base: "20", md: "28" }}>
      <GlowBackground />
      {/* Grille discrète en fond, masquée vers le bas */}
      <Box
        position="absolute"
        inset="0"
        opacity="0.5"
        pointerEvents="none"
        backgroundImage="linear-gradient(rgba(24,24,27,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(24,24,27,0.05) 1px, transparent 1px)"
        backgroundSize="56px 56px"
        style={{ maskImage: "linear-gradient(to bottom, black 0%, transparent 75%)", WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 75%)" }}
      />

      <Container maxW="7xl" position="relative" textAlign="center">
        <Stack align="center" gap="7">
          {/* Badge de nouveauté */}
          <Badge
            px="3.5"
            py="1.5"
            rounded="full"
            bg="paper.200"
            borderWidth="1px"
            borderColor="paper.300"
            color="ink.700"
            fontFamily="ui"
            fontSize="sm"
            fontWeight="500"
            gap="2"
          >
            <Box as="span" px="2" rounded="full" background={accent.pink} color="white" fontSize="xs" fontWeight="700">
              Nouveau
            </Box>
            Voix personnalisées disponibles
          </Badge>

          <Heading as="h1" fontFamily="heading" fontWeight="800" fontSize={{ base: "4xl", sm: "5xl", md: "7xl" }} letterSpacing="-0.04em" lineHeight="1.02" maxW="4xl">
            Créer une musique
            <br />
            <RotatingText phrases={heroPhrases} />
          </Heading>

          <Text fontSize={{ base: "md", md: "xl" }} color="ink.500" maxW="2xl">
            Style, paroles, voix et mélodie : tout est créé sur mesure en environ 30 secondes, prêt à écouter et à télécharger.
          </Text>

          <Flex gap="4" direction={{ base: "column", sm: "row" }} align="center">
            <Button
              asChild
              size="xl"
              rounded="full"
              px="8"
              fontFamily="ui"
              fontWeight="600"
              color="white"
              background={accent.primary}
              _hover={{ transform: "translateY(-2px)" }}
              transition="all .25s"
            >
              <NextLink href="/studio">
                Créer ma chanson <LuArrowRight />
              </NextLink>
            </Button>

            {/* Preuve sociale (idée Paynance) */}
            <HStack gap="3">
              <HStack gap="0">
                {["Camille", "Idriss", "Sofia", "Marc"].map((n, i) => (
                  <Avatar.Root key={n} size="sm" ml={i ? "-2.5" : 0} borderWidth="2px" borderColor="paper.0">
                    <Avatar.Fallback name={n} />
                  </Avatar.Root>
                ))}
              </HStack>
              <Stack gap="0" textAlign="left">
                <HStack gap="0.5" color="#facc15">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <LuStar key={i} size={14} fill="currentColor" />
                  ))}
                </HStack>
                <Text fontSize="sm" color="ink.500">
                  Adopté par 40 000+ créateurs
                </Text>
              </Stack>
            </HStack>
          </Flex>
        </Stack>

        <HeroPlayer />
      </Container>
    </Box>
  );
}
