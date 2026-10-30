"use client";

import { useEffect } from "react";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  LuCompass,
  LuHouse,
  LuLibrary,
  LuLogOut,
  LuPlus,
  LuUser,
  LuWandSparkles,
  LuZap,
} from "react-icons/lu";

import Logo from "@/components/common/Logo";
import GlowBackground from "@/components/common/GlowBackground";
import StudioPlayerBar from "@/components/studio/StudioPlayerBar";
import { StudioProvider, useStudio } from "@/context/StudioContext";
import { accent } from "@/theme/system";

const NAV_ITEMS = [
  { id: "home", href: "/studio", icon: LuHouse, label: "Accueil", desktopLabel: "Accueil", match: (p) => p === "/studio" },
  { id: "explorer", href: "/explorer", icon: LuCompass, label: "Explorer", desktopLabel: "Explorer", match: (p) => p.startsWith("/explorer") },
  { id: "create", href: "/studio/create", icon: LuWandSparkles, label: "Créer", desktopLabel: "Créer (2 Notes)", isCenterAction: true, match: (p) => p.startsWith("/studio/create") },
  { id: "library", href: "/studio/library", icon: LuLibrary, label: "Bibliothèque", desktopLabel: "Bibliothèque", match: (p) => p.startsWith("/studio/library") },
  { id: "profile", href: "/studio/profil", icon: LuUser, label: "Profil", desktopLabel: "Profil", match: (p) => p.startsWith("/studio/profil") },
];

function StudioLayoutContent({ children }) {
  const pathname = usePathname() || "/studio";
  const router = useRouter();
  const { data: session, status } = useSession();
  const {
    notes,
    activePlayerTrack,
    isPlaying,
    togglePlay,
    closePlayer,
    toggleFavorite,
    updateProgress,
    seekTime,
  } = useStudio();

  const handleSignOut = async () => {
    try {
      localStorage.removeItem("pretymelo_user");
      localStorage.removeItem("pretymelo_username");
      localStorage.removeItem("melostars_user");
      localStorage.removeItem("melostars_username");
      sessionStorage.clear();
    } catch (_) {}
    await signOut({ callbackUrl: "/login" });
  };

  // Redirection immédiate si non connecté
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [status, pathname, router]);

  // Écran de chargement fluide
  if (status === "loading" || status === "unauthenticated") {
    return (
      <Flex minH="100dvh" bg="paper.50" align="center" justify="center" direction="column" gap="4">
        <Spinner size="xl" color="brand.violetDeep" />
        <Text fontSize="sm" color="ink.600" fontFamily="ui" fontWeight="600">
          Chargement de votre espace studio...
        </Text>
      </Flex>
    );
  }

  const isCreationWorkflow = pathname.startsWith("/studio/create");
  const isRechargeWorkflow = pathname === "/studio/recharge";
  const userName = session?.user?.name || "Créateur pretymelo";
  const userImage = session?.user?.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop";

  // Masquer la sidebar web et la navigation mobile sur le workflow de création pour une concentration totale
  if (isCreationWorkflow) {
    return (
      <Box minH="100dvh" bg="paper.50" color="ink.900" position="relative" overflowX="hidden">
        {children}
      </Box>
    );
  }

  if (isRechargeWorkflow) {
    return (
      <Box minH="100dvh" bg="paper.50" color="ink.900" position="relative" overflowX="hidden">
        {children}
        <StudioPlayerBar
          track={activePlayerTrack}
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          onClose={closePlayer}
          onToggleFavorite={toggleFavorite}
        />
      </Box>
    );
  }

  return (
    <Flex minH="100dvh" bg="paper.50" color="ink.900" position="relative" overflow="hidden">
      {/* 1. BARRE LATÉRALE FIXE (DESKTOP >= 1024px) */}
      <Box
        as="aside"
        w={{ base: "full", lg: "72" }}
        h="100dvh"
        maxH="100dvh"
        position="sticky"
        top="0"
        alignSelf="flex-start"
        bg="paper.0"
        borderRightWidth="1px"
        borderColor="paper.200"
        display={{ base: "none", lg: "flex" }}
        flexDirection="column"
        flexShrink={0}
        zIndex="30"
        overflow="hidden"
      >
        {/* En-tête : Logo pretymelo */}
        <Box px="6" pt="6" pb="5" borderBottomWidth="1px" borderColor="paper.200" flexShrink={0}>
          <Logo />
        </Box>

        {/* Corps central scrollable si la hauteur d'écran est réduite */}
        <Box
          flex="1"
          minH="0"
          overflowY="auto"
          overscrollBehavior="contain"
          px="6"
          py="5"
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
          gap="6"
          css={{
            scrollbarWidth: "thin",
            scrollbarColor: "var(--chakra-colors-paper-300, #e2e8f0) transparent",
            "&::-webkit-scrollbar": { width: "4px" },
            "&::-webkit-scrollbar-thumb": {
              background: "rgba(0, 0, 0, 0.12)",
              borderRadius: "10px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: "rgba(0, 0, 0, 0.2)",
            },
          }}
        >
          {/* Navigation principale avec liens App Router réels */}
          <Stack as="nav" gap="1.5">
            {NAV_ITEMS.map((item) => {
              const { id, href, icon: Icon, desktopLabel, match } = item;
              const isActive = match(pathname);
              return (
                <NextLink key={id} href={href}>
                  <HStack
                    gap="3"
                    px="3.5"
                    py="3"
                    rounded="2xl"
                    fontFamily="ui"
                    fontWeight={isActive ? "700" : "500"}
                    fontSize="sm"
                    cursor="pointer"
                    color={isActive ? "white" : "ink.700"}
                    bg={isActive ? accent.primary : "transparent"}
                    _hover={{ bg: isActive ? accent.primary : "paper.200", color: isActive ? "white" : "ink.900" }}
                    transition="all .2s"
                  >
                    <Icon size={18} />
                    <Text flex="1">{desktopLabel}</Text>
                  </HStack>
                </NextLink>
              );
            })}
          </Stack>

          {/* Widget Solde de Notes dans la sidebar */}
          <Stack gap="3" p="4" rounded="2xl" bg="paper.0" borderWidth="1.5px" borderColor="brand.violetDeep" flexShrink={0}>
            <Flex justify="space-between" align="center" fontFamily="ui">
              <HStack gap="1.5">
                <Text fontSize="md">🎵</Text>
                <Text fontWeight="700" fontSize="sm" color="ink.900">
                  Solde Notes
                </Text>
              </HStack>
              <Badge rounded="full" bg="brand.violetTint" color="brand.violetDeep" px="2" fontWeight="700">
                {notes}
              </Badge>
            </Flex>

            <Text fontSize="2xs" color="ink.500">
              Il faut <b>2 notes</b> pour créer 1 musique complète.
            </Text>

            <Button
              asChild
              size="sm"
              rounded="full"
              color="white"
              background={accent.primary}
              _hover={{ transform: "translateY(-1px)", boxShadow: "0 4px 14px rgba(124, 58, 237, 0.3)" }}
              transition="all 0.2s"
            >
              <NextLink href="/studio/recharge">
                <LuZap size={14} /> Recharger mes Notes
              </NextLink>
            </Button>
          </Stack>
        </Box>

        {/* Pied de sidebar : Carte utilisateur & Déconnexion */}
        <Box px="4" py="3" borderTopWidth="1px" borderColor="paper.200" flexShrink={0}>
          <NextLink href="/studio/profil" title="Voir mon profil">
            <HStack
              gap="2.5"
              px="2.5"
              py="2"
              mb="1"
              rounded="xl"
              _hover={{ bg: "paper.150" }}
              transition="background 0.2s"
            >
              <Avatar.Root size="sm" rounded="full">
                <Avatar.Fallback name={userName} />
                <Avatar.Image
                  src={userImage}
                  alt={userName}
                  referrerPolicy="no-referrer"
                />
              </Avatar.Root>
              <Box minW="0" flex="1">
                <Text fontSize="xs" fontWeight="700" color="ink.900" truncate lineHeight="1.2">
                  {userName}
                </Text>
                <Text fontSize="10px" color="ink.400" truncate lineHeight="1.1">
                  {session?.user?.email || "Créateur"}
                </Text>
              </Box>
            </HStack>
          </NextLink>

          <Button
            variant="ghost"
            size="sm"
            w="full"
            rounded="xl"
            color="red.600"
            _hover={{ bg: "red.50", color: "red.700" }}
            onClick={handleSignOut}
            fontFamily="ui"
            fontSize="xs"
            fontWeight="600"
            justifyContent="flex-start"
            px="2.5"
            py="2"
          >
            <HStack gap="2.5">
              <LuLogOut size={15} />
              <Text>Déconnexion</Text>
            </HStack>
          </Button>
        </Box>
      </Box>

      {/* 2. ZONE DE CONTENU PRINCIPAL */}
      <Box flex="1" minW="0" position="relative" overflow="hidden" display="flex" flexDirection="column">
        <GlowBackground intensity={0.35} />

        {/* Barre supérieure */}
        <Flex
          position="relative"
          align="center"
          justify="space-between"
          px={{ base: "4", md: "8" }}
          h="16"
          borderBottomWidth="1px"
          borderColor="paper.200"
          backdropFilter="blur(14px)"
          bg="rgba(255, 255, 255, 0.85)"
          zIndex="20"
        >
          {/* Logo en mobile */}
          <Box display={{ base: "block", lg: "none" }}>
            <Logo size="sm" />
          </Box>

          {/* Onglets rapides Desktop */}
          <Text display={{md: 'flex', base: 'none'}}>{' '}</Text>
          <HStack gap="1" display={{ base: "none", sm: "none" }}>
            {NAV_ITEMS.map((item) => {
              const { id, href, desktopLabel, match } = item;
              const isActive = match(pathname);
              return (
                <Button
                  key={id}
                  asChild
                  size="sm"
                  rounded="full"
                  variant={isActive ? "solid" : "ghost"}
                  bg={isActive ? "paper.200" : "transparent"}
                  color={isActive ? "ink.900" : "ink.500"}
                  fontWeight={isActive ? "700" : "500"}
                >
                  <NextLink href={href}>{desktopLabel}</NextLink>
                </Button>
              );
            })}
          </HStack>

          {/* Actions à droite */}
          <HStack gap={{ base: "1.5", sm: "2.5" }}>
            {/* Bouton rapide recharger -> Page dédiée /studio/recharge */}
            <Button
              asChild
              size="sm"
              rounded="full"
              variant="outline"
              borderColor="brand.violet"
              color="brand.violetDeep"
              bg="brand.violetTint"
              fontFamily="ui"
              fontSize="xs"
              fontWeight="600"
            >
              <NextLink href="/studio/recharge">
                {notes} Notes <LuPlus size={14} />
              </NextLink>
            </Button>

            {/* Avatar Profil utilisateur (Chakra UI v3) */}
            <Box
              asChild
              rounded="full"
              // p="0.5"
              borderWidth="2px"
              borderColor={pathname.startsWith("/studio/profil") ? "brand.violetDeep" : "paper.200"}
              boxShadow={pathname.startsWith("/studio/profil") ? "0 0 0 2px rgba(124, 58, 237, 0.3)" : "none"}
              _hover={{ borderColor: "brand.violetDeep", transform: "scale(1.05)" }}
              _active={{ transform: "scale(0.95)" }}
              transition="all 0.2s"
              cursor="pointer"
              title="Mon profil"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <NextLink href="/studio/profil" aria-label="Profil utilisateur">
                <Avatar.Root size="sm">
                  <Avatar.Image
                    src={userImage}
                    alt={userName}
                    referrerPolicy="no-referrer"
                  />
                  <Avatar.Fallback name={userName} />
                </Avatar.Root>
              </NextLink>
            </Box>

            {/* Bouton Déconnexion rapide Topbar */}
            <Button
              size="sm"
              rounded="full"
              variant="outline"
              borderColor="paper.300"
              color="red.600"
              _hover={{ bg: "red.50", borderColor: "red.200" }}
              onClick={handleSignOut}
              fontFamily="ui"
              fontSize="xs"
              fontWeight="600"
              px={{ base: "2.5", sm: "3" }}
              title="Déconnexion"
              aria-label="Déconnexion"
            >
              <HStack gap="1.5">
                <LuLogOut size={14} />
                <Text display={{ base: "none", sm: "inline" }}>Déconnexion</Text>
              </HStack>
            </Button>
          </HStack>
        </Flex>

        {/* 3. CONTENU DE LA ROUTE ACTUELLE (APP ROUTER) avec marge de défilement pour le dock iOS */}
        <Box flex="1" overflowY="auto" pb={{ base: "28", sm: "32", lg: "8" }}>
          {children}
        </Box>
      </Box>

      {/* 4. BARRE DE NAVIGATION MOBILE FLOTTANTE TYPE APPLICATION IOS (GLASSMORPHISM) */}
      <Box
        display={{ base: "block", lg: "none" }}
        position="fixed"
        bottom="0"
      
        // transform="translateX(-50%)"
        w="100%"
        maxW="420px"
        zIndex="50"
        pointerEvents="auto"
      >
        <Flex
          h="64px"
          rounded="none"
          bg="rgba(255, 255, 255, 0.76)"
          backdropFilter="blur(24px) saturate(190%)"
          borderWidth="1px"
          borderColor="rgba(255, 255, 255, 0.7)"
          boxShadow="0 12px 35px -5px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(124, 58, 237, 0.08), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9)"
          align="center"
          justify="space-around"
          px="2"
        >
          {NAV_ITEMS.map((item) => {
            const { id, href, icon: Icon, label, match, isCenterAction } = item;
            const isActive = match(pathname);

            if (isCenterAction) {
              return (
                <NextLink key={id} href={href} style={{ outline: "none" }} aria-label={label}>
                  <Flex
                    direction="column"
                    align="center"
                    justify="center"
                    boxSize="12"
                    rounded="full"
                    bg="linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)"
                    color="white"
                    boxShadow="0 4px 16px rgba(124, 58, 237, 0.45)"
                    transition="transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                    _active={{ transform: "scale(0.88)" }}
                  >
                    <Icon size={22} />
                  </Flex>
                </NextLink>
              );
            }

            return (
              <NextLink key={id} href={href} style={{ outline: "none", flex: "1" }} aria-label={label}>
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  gap="0.5"
                  py="1"
                  color={isActive ? "brand.violetDeep" : "rgba(30, 27, 46, 0.55)"}
                  transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                  _active={{ transform: "scale(0.9)" }}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <Text
                    fontSize="10px"
                    fontFamily="ui"
                    fontWeight={isActive ? "700" : "500"}
                    lineHeight="1"
                    letterSpacing="-0.01em"
                  >
                    {label}
                  </Text>
                  <Box
                    boxSize="1.5"
                    rounded="full"
                    bg={isActive ? "brand.violetDeep" : "transparent"}
                    transition="background 0.2s"
                    mt="0.5"
                  />
                </Flex>
              </NextLink>
            );
          })}
        </Flex>
      </Box>

      {/* 5. LECTEUR AUDIO PERSISTANT GLOBAL */}
      <StudioPlayerBar
        track={activePlayerTrack}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onClose={closePlayer}
        onToggleFavorite={toggleFavorite}
        onProgress={updateProgress}
        seekRequest={seekTime}
      />
    </Flex>
  );
}

export default function StudioLayout({ children }) {
  return (
    <StudioProvider>
      <StudioLayoutContent>{children}</StudioLayoutContent>
    </StudioProvider>
  );
}
