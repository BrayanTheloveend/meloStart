"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { Avatar, AvatarGroup, Badge, Box, Button, Container, Flex, Heading, HStack, Image, Stack, Text } from "@chakra-ui/react";
import { LuArrowRight, LuStar } from "react-icons/lu";
import GlowBackground from "@/components/common/GlowBackground";
import HeroPlayer from "./HeroPlayer";
import RotatingText from "./RotatingText";
import { accent } from "@/theme/system";
import { formatMetric, formatNumber } from "@/lib/formatters";

// Phrases qui défilent après « Créer une musique »
const heroPhrases = [
  "un anniversaire",
  "un mariage",
  "un baptême",
  "une réussite",
  "un moment spécial",
];

// Créateurs de démonstration par défaut si la base de données est vide
const fallbackCreators = [
  { id: "fb-1", name: "Camille", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop" },
  { id: "fb-2", name: "Idriss", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop" },
  { id: "fb-3", name: "Sofia", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop" },
  { id: "fb-4", name: "Marc", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop" },
];

export default function Hero({ initialUsers = null, initialTotalCount = null }) {
  const [users, setUsers] = useState(initialUsers || []);
  const [totalCount, setTotalCount] = useState(
    initialTotalCount !== null ? initialTotalCount : (initialUsers ? initialUsers.length : 0)
  );

  const colorPalette = ["red", "blue", "green", "yellow", "purple", "orange"]

  const pickPalette = (name) => {
    const index = name.charCodeAt(0) % colorPalette.length
    return colorPalette[index]
  }

  useEffect(() => {
    // Si des données initiales valides ont déjà été fournies par le serveur, on les prend
    if (initialUsers && initialUsers.length > 0) {
      setUsers(initialUsers);
      setTotalCount(initialTotalCount ?? initialUsers.length);
      return;
    }

    // Récupération dynamique côté client via l'API
    let isMounted = true;
    async function loadLatestUsers() {
      try {
        const res = await fetch("/api/users/latest");
        const json = await res.json();
        if (isMounted && json?.success && Array.isArray(json.users)) {
          setUsers(json.users);
          setTotalCount(json.totalCount ?? 0);
        }
      } catch (err) {
        console.error("Erreur chargement utilisateurs Hero:", err);
      }
    }

    loadLatestUsers();
    return () => {
      isMounted = false;
    };
  }, [initialUsers, initialTotalCount]);

  const hasDbUsers = users && users.length > 0;
  const displayUsers = hasDbUsers ? users.slice(0, 4) : fallbackCreators;
  const displayTotal = hasDbUsers ? totalCount : 40000;
  const remainingCount = Math.max(0, displayTotal - displayUsers.length);

  return (
    <Box as="section" position="relative" overflow="hidden" pt={{ base: "32", md: "40" }} pb={{ base: "20", md: "28" }} h={'115vh'}>
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

      <Container maxW="7xl" position="relative" centerContent textAlign="center">
        <Stack align="center" gap="7">

          <Heading as="h1" fontFamily="heading" fontWeight="800" fontSize={{ base: "4xl", sm: "5xl", md: "7xl" }} letterSpacing="-0.04em" lineHeight="1.02" maxW="3xl">
            Créez une musique unique pour célébrer 
            <br />
            <RotatingText phrases={heroPhrases} />
          </Heading>

          <Text fontSize={{ base: "md", md: "xl" }} color="ink.500" maxW="2xl">
            Votre histoire mérite d'être chantée, donnez une voix à vos plus beaux souvenirs en quelques secondes : style, paroles, voix réaliste et mélodie sur mesure.
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

            {/* Preuve sociale (derniers utilisateurs inscrits avec AvatarGroup Chakra UI v3) */}
            <HStack gap="3">
              <AvatarGroup size="sm">
                {displayUsers.map((user) => {
                  const displayName = user.name || "Créateur";
                  return (
                    <Avatar.Root
                      key={user.id}
                      size="sm"
                      borderWidth="2px"
                      borderColor="paper.0"
                      color={accent[pickPalette(displayName)]}
                    >
                      <Avatar.Fallback name={displayName} />
                      {user.image && (
                        <Avatar.Image src={user.image} alt={displayName} />
                      )}
                    </Avatar.Root>
                  );
                })}
                {remainingCount > 0 && (
                  <Avatar.Root
                    size="sm"
                    borderWidth="2px"
                    borderColor="paper.0"
                    bg="paper.200"
                  >
                    <Avatar.Fallback fontSize="xs" fontWeight="700" color="ink.700">
                      +{remainingCount > 999 ? formatMetric(remainingCount, { uppercaseK: false }) : remainingCount}
                    </Avatar.Fallback>
                  </Avatar.Root>
                )}
              </AvatarGroup>

              <Stack gap="0" textAlign="left">
                <HStack gap="0.5" color="#facc15">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <LuStar key={i} size={14} fill="currentColor" />
                  ))}
                </HStack>
                <Text fontSize="sm" color="ink.500">
                  {hasDbUsers
                    ? displayTotal >= 1000
                      ? `Adopté par ${formatMetric(displayTotal, { uppercaseK: false })}+ créateurs`
                      : `Adopté par ${formatNumber(displayTotal)} créateur${displayTotal > 1 ? "s" : ""}`
                    : "Adopté par 40 000+ créateurs"}
                </Text>
              </Stack>
            </HStack>
          </Flex>
        </Stack>

        <Image src={'/assets/mock13.png'} width={{md: "70%", base: '100%'}} mt={10} alt="mock" />

       
      </Container>
    </Box>
  );
}
