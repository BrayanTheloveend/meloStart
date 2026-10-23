"use client";

import { useCallback, useEffect, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Avatar, Badge, Box, Button, Flex, Grid, HStack, IconButton, Stack, Text } from "@chakra-ui/react";
import {
  LuAudioLines,
  LuCompass,
  LuHouse,
  LuLibrary,
  LuMicVocal,
  LuPlus,
  LuSettings,
  LuSparkles,
  LuUser,
  LuWandSparkles,
  LuX,
  LuZap,
} from "react-icons/lu";

import Logo from "@/components/common/Logo";
import GlowBackground from "@/components/common/GlowBackground";
import GeneratorPanel from "./GeneratorPanel";
import StudioHome from "./StudioHome";
import StudioLibrary from "./StudioLibrary";
import StudioVoices from "./StudioVoices";
import StudioProfile from "./StudioProfile";
import StudioPlayerBar from "./StudioPlayerBar";

import { sampleTracks } from "@/data/content";
import { onboardingGenres, onboardingGoals } from "@/data/onboardingData";
import { generateMusicWithAI, NOTES_PER_SONG } from "@/services/musicAiApi";
import { accent } from "@/theme/system";

const NAV_ITEMS = [
  { id: "home", icon: LuHouse, label: "Accueil", desktopLabel: "Accueil", href: "/studio" },
  { id: "explorer", icon: LuCompass, label: "Explorer", desktopLabel: "Explorer", href: "/explorer" },
  { id: "create", icon: LuWandSparkles, label: "Créer", desktopLabel: "Créer (2 Notes)", isCenterAction: true, href: "/studio/create" },
  { id: "library", icon: LuLibrary, label: "Bibliothèque", desktopLabel: "Bibliothèque", href: "/studio/library" },
  { id: "profile", icon: LuUser, label: "Profil", desktopLabel: "Profil", href: "/studio/profil" },
];

const initialConfig = {
  description: "",
  customLyrics: "",
  genre: "Afrobeat",
  moods: ["Joyeux"],
  tempo: 108,
  duration: 60,
  lyrics: true,
  vocals: true,
  vocalType: "female",
};

export default function StudioShell({ initialTab = "home" }) {
  const router = useRouter();
  const { data: session } = useSession();
  const userName = session?.user?.name || "Créateur melostars";
  const userImage = session?.user?.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop";

  const [activeTab, setActiveTab] = useState(initialTab); // "home" | "create" | "library" | "profile" | "voices"
  const [notes, setNotes] = useState(6); // Solde initial de Notes (3 morceaux complets)
  const [config, setConfig] = useState(initialConfig);
  const [status, setStatus] = useState("idle"); // "idle" | "generating" | "done"
  const [progress, setProgress] = useState(0);
  const [stepLabel, setStepLabel] = useState("");
  const [track, setTrack] = useState(null);
  const [library, setLibrary] = useState(sampleTracks);
  const [onboardingBanner, setOnboardingBanner] = useState(null);

  // Lecteur audio persistant
  const [activePlayerTrack, setActivePlayerTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerCurrentTime, setPlayerCurrentTime] = useState(0);
  const [playerDuration, setPlayerDuration] = useState(0);
  const [seekRequest, setSeekRequest] = useState(null);

  const handleSeekTrack = (targetTime) => {
    setSeekRequest(targetTime);
    setPlayerCurrentTime(targetTime);
  };

  // Synchronisation de l'onglet actif avec initialTab et query params URL
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get("tab");
      if (tabParam && ["home", "create", "library", "profile"].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    } catch {}
  }, [initialTab]);

  // Navigation fluide entre onglets et pages studio
  const handleNavigate = (item) => {
    if (item.id === "explorer") {
      router.push("/explorer");
      return;
    }
    setActiveTab(item.id);
    if (item.href && typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      if (item.id === "profile" && currentPath !== "/studio/profil") {
        router.push("/studio/profil");
      } else if (item.id === "home" && currentPath !== "/studio") {
        router.push("/studio");
      }
    }
  };

  // Charger le solde de Notes et la bibliothèque depuis le localStorage
  useEffect(() => {
    try {
      const savedNotes = localStorage.getItem("melostars_notes");
      if (savedNotes !== null) {
        setNotes(parseInt(savedNotes, 10));
      } else {
        localStorage.setItem("melostars_notes", "6");
      }

      const savedLibrary = localStorage.getItem("melostars_library");
      if (savedLibrary) {
        setLibrary(JSON.parse(savedLibrary));
      }
    } catch {}
  }, []);

  // Détecter les préférences d'onboarding ou query params d'URL
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const urlGenre = searchParams.get("genre");
      const urlPrompt = searchParams.get("prompt");

      const saved = localStorage.getItem("melostars_onboarding");
      const onboardingData = saved ? JSON.parse(saved) : null;

      let appliedGenre = urlGenre;
      let appliedPrompt = urlPrompt;

      if (!appliedGenre && onboardingData?.genres?.length) {
        const found = onboardingGenres.find((g) => g.id === onboardingData.genres[0]);
        if (found) appliedGenre = found.studioGenre;
      }

      if (!appliedPrompt && onboardingData?.goal) {
        const foundGoal = onboardingGoals.find((g) => g.id === onboardingData.goal);
        if (foundGoal) appliedPrompt = foundGoal.promptSample;
      }

      if (appliedGenre || appliedPrompt) {
        setConfig((prev) => ({
          ...prev,
          ...(appliedGenre ? { genre: appliedGenre } : {}),
          ...(appliedPrompt ? { description: appliedPrompt } : {}),
        }));

        setOnboardingBanner({
          genre: appliedGenre || "Personnalisé",
          goal: onboardingData?.goal ? onboardingGoals.find((g) => g.id === onboardingData.goal)?.title : null,
        });

        // Si l'utilisateur arrive avec des paramètres précis, on l'ouvre sur Créer
        if (urlGenre || urlPrompt) {
          setActiveTab("create");
        }
      }
    } catch {}
  }, []);

  // Sauvegarder les notes quand elles changent
  const updateNotes = (newBalance) => {
    setNotes(newBalance);
    try {
      localStorage.setItem("melostars_notes", String(newBalance));
    } catch {}
  };

  // Lancer la création IA avec l'API externe (consomme 2 notes)
  const handleGenerate = async () => {
    if (status === "generating") return;

    if (notes < NOTES_PER_SONG) {
      router.push("/studio/recharge");
      return;
    }

    // Débit des 2 Notes
    updateNotes(notes - NOTES_PER_SONG);
    setStatus("generating");
    setProgress(0);
    setStepLabel("Transmission de la demande à l'API IA…");

    try {
      const created = await generateMusicWithAI(config, (p, label) => {
        setProgress(p);
        setStepLabel(label);
      });

      setTrack(created);
      setActivePlayerTrack(created);
      setIsPlaying(true);

      const nextLib = [created, ...library];
      setLibrary(nextLib);
      try {
        localStorage.setItem("melostars_library", JSON.stringify(nextLib));
      } catch {}

      setStatus("done");
    } catch (err) {
      console.error("Erreur de génération :", err);
      // Restitution des notes en cas d'échec
      updateNotes(notes);
      setStatus("idle");
      alert("Une erreur est survenue lors de la communication avec l'API IA.");
    }
  };

  // Gestion des favoris
  const handleToggleFavorite = (trackId) => {
    const updated = library.map((t) => (t.id === trackId ? { ...t, isFavorite: !t.isFavorite } : t));
    setLibrary(updated);
    try {
      localStorage.setItem("melostars_library", JSON.stringify(updated));
    } catch {}

    if (activePlayerTrack?.id === trackId) {
      setActivePlayerTrack((prev) => ({ ...prev, isFavorite: !prev.isFavorite }));
    }
  };

  // Suppression d'un morceau
  const handleDeleteTrack = (trackId) => {
    const updated = library.filter((t) => t.id !== trackId);
    setLibrary(updated);
    try {
      localStorage.setItem("melostars_library", JSON.stringify(updated));
    } catch {}
    if (activePlayerTrack?.id === trackId) {
      setActivePlayerTrack(null);
      setIsPlaying(false);
    }
  };

  // Lancer l'écoute d'un morceau
  const handlePlayTrack = (selectedTrack) => {
    if (activePlayerTrack?.id === selectedTrack.id) {
      setIsPlaying((prev) => !prev);
    } else {
      setActivePlayerTrack(selectedTrack);
      setIsPlaying(true);
    }
  };

  // Pré-remplir un prompt depuis l'accueil et basculer sur Créer
  const handlePreloadPrompt = (item) => {
    setConfig((prev) => ({
      ...prev,
      genre: item.genre,
      description: item.prompt,
    }));
    setActiveTab("create");
  };

  // En mode création : masquer la sidebar (web) et le bottom navigation (mobile) pour une concentration maximale
  if (activeTab === "create") {
    return (
      <Box minH="100dvh" bg="paper.50" color="ink.900" position="relative" overflowX="hidden">
        <GeneratorPanel
          notes={notes}
          onOpenRecharge={() => router.push("/studio/recharge")}
          onDeductNotes={(cost) => updateNotes(notes - cost)}
          onTrackCreated={(createdTrack) => {
            const nextLib = [createdTrack, ...library];
            setLibrary(nextLib);
            try {
              localStorage.setItem("melostars_library", JSON.stringify(nextLib));
            } catch {}
          }}
          initialData={{
            musicStyle: config.genre,
            story: config.description,
            vocalType: config.vocalType || "female",
          }}
          onToggleFavorite={handleToggleFavorite}
          onPlayTrack={handlePlayTrack}
        />
      </Box>
    );
  }

  return (
    <Flex minH="100vh" bg="paper.0" position="relative" pb={activePlayerTrack ? "20" : "0"}>
      {/* 1. Barre latérale de navigation Desktop */}
      <Box
        as="aside"
        display={{ base: "none", lg: "flex" }}
        w="260px"
        flexShrink={0}
        h="100dvh"
        maxH="100dvh"
        position="sticky"
        top="0"
        alignSelf="flex-start"
        bg="paper.50"
        borderRightWidth="1px"
        borderColor="paper.200"
        flexDirection="column"
        overflow="hidden"
        zIndex="30"
      >
        <Box p="6" pb="4" flexShrink={0}>
          <Logo />
        </Box>

        <Box
          flex="1"
          minH="0"
          overflowY="auto"
          overscrollBehavior="contain"
          px="6"
          py="4"
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
          <Stack as="nav" gap="1.5">
            {NAV_ITEMS.map((item) => {
              const { id, icon: Icon, label } = item;
              const isActive = activeTab === id;
              return (
                <HStack
                  key={id}
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
                  onClick={() => handleNavigate(item)}
                >
                  <Icon size={18} />
                  <Text flex="1">{label}</Text>
                </HStack>
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
              Il faut <b>2 notes</b> pour créer 1 musique complète par IA.
            </Text>

            <Button
              size="sm"
              rounded="full"
              color="white"
              background={accent.primary}
              onClick={() => router.push("/studio/recharge")}
              _hover={{ transform: "translateY(-1px)", boxShadow: "0 4px 14px rgba(124, 58, 237, 0.3)" }}
              transition="all 0.2s"
            >
              <LuZap size={14} /> Recharger mes Notes
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* 2. Zone de contenu principal */}
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

          {/* Onglets de navigation rapides en haut */}
          <HStack gap="1" display={{ base: "none", sm: "flex" }}>
            {NAV_ITEMS.map((item) => {
              const { id, label } = item;
              return (
                <Button
                  key={id}
                  size="sm"
                  rounded="full"
                  variant={activeTab === id ? "solid" : "ghost"}
                  bg={activeTab === id ? "paper.200" : "transparent"}
                  color={activeTab === id ? "ink.900" : "ink.500"}
                  fontWeight={activeTab === id ? "700" : "500"}
                  onClick={() => handleNavigate(item)}
                >
                  {label}
                </Button>
              );
            })}
          </HStack>

          {/* Actions à droite */}
          <HStack gap={{ base: "1.5", sm: "2.5" }}>
            {/* Bouton rapide recharger -> Page dédiée */}
            <Button
              size="sm"
              rounded="full"
              variant="outline"
              borderColor="brand.violet"
              color="brand.violetDeep"
              bg="brand.violetTint"
              onClick={() => router.push("/studio/recharge")}
              fontFamily="ui"
              fontSize="xs"
              fontWeight="600"
            >
              {notes} Notes <LuPlus size={14} />
            </Button>

            {/* Avatar Profil utilisateur (Chakra UI v3) */}
            <Box
              as="button"
              type="button"
              onClick={() => handleNavigate({ id: "profile", href: "/studio/profil" })}
              rounded="full"
              p="0.5"
              borderWidth="2px"
              borderColor={activeTab === "profile" ? "brand.violetDeep" : "paper.200"}
              boxShadow={activeTab === "profile" ? "0 0 0 2px rgba(124, 58, 237, 0.3)" : "none"}
              _hover={{ borderColor: "brand.violetDeep", transform: "scale(1.05)" }}
              _active={{ transform: "scale(0.95)" }}
              transition="all 0.2s"
              cursor="pointer"
              aria-label="Profil utilisateur"
              title="Mon profil"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Avatar.Root size="sm">
                <Avatar.Image
                  src={userImage}
                  alt={userName}
                  referrerPolicy="no-referrer"
                />
                <Avatar.Fallback name={userName} />
              </Avatar.Root>
            </Box>

            {/* Bouton Accueil site */}
            <Button display={{md: 'none', base: 'inherit'}} asChild size="sm" variant="ghost" rounded="full" color="ink.500" fontFamily="ui" px={{ base: "2", sm: "2.5" }}>
              <NextLink href="/" aria-label="Accueil du site">
                <LuHouse size={16} />
                <Text display={{ base: "none", md: "inline" }}>Site</Text>
              </NextLink>
            </Button>
          </HStack>
        </Flex>

        {/* Bannière de confirmation onboarding si présente */}
        {onboardingBanner && (
          <Box mx={{ base: "4", md: "8" }} mt="4" p="3.5" rounded="2xl" bg="brand.violetTint" borderWidth="1px" borderColor="brand.violetDeep">
            <Flex justify="space-between" align="center" gap="3" wrap="wrap">
              <HStack gap="2.5">
                <Text fontSize="md">✨</Text>
                <Text fontSize="xs" color="ink.700">
                  Studio pré-configuré : <b>{onboardingBanner.genre}</b>
                  {onboardingBanner.goal ? ` • Objectif : ${onboardingBanner.goal}` : ""}
                </Text>
              </HStack>
              <HStack gap="2">
                <Button asChild size="2xs" variant="outline" rounded="full" borderColor="brand.violetDeep" color="brand.violetDeep" bg="white">
                  <NextLink href="/onboarding">Modifier</NextLink>
                </Button>
                <IconButton size="2xs" variant="ghost" rounded="full" color="ink.400" onClick={() => setOnboardingBanner(null)} aria-label="Fermer">
                  <LuX size={12} />
                </IconButton>
              </HStack>
            </Flex>
          </Box>
        )}

        {/* 3. Vues selon l'onglet actif avec marge de défilement pour le dock iOS */}
        <Box flex="1" py={{ base: "4", md: "6" }} pb={{ base: "28", sm: "32", md: "8" }} overflowY="auto">
          {/* ONGLET 1 : ACCUEIL DU STUDIO */}
          {activeTab === "home" && (
            <StudioHome
              notes={notes}
              library={library}
              onOpenCreate={() => setActiveTab("create")}
              onOpenRecharge={() => router.push("/studio/recharge")}
              activeTrack={activePlayerTrack}
              isPlaying={isPlaying}
              currentTime={playerCurrentTime}
              duration={playerDuration}
              onSeekTrack={handleSeekTrack}
              onPlayTrack={handlePlayTrack}
              onToggleFavorite={handleToggleFavorite}
              onPreloadPrompt={handlePreloadPrompt}
            />
          )}

          {/* ONGLET 2 : WORKFLOW DE CRÉATION IA (STEPPER ÉTAPE PAR ÉTAPE) */}
          {activeTab === "create" && (
            <Box maxW="5xl" mx="auto" px={{ base: "4", md: "8" }}>
              <GeneratorPanel
                notes={notes}
                onOpenRecharge={() => router.push("/studio/recharge")}
                onDeductNotes={(cost) => updateNotes(notes - cost)}
                onTrackCreated={(newTrack) => {
                  const nextLib = [newTrack, ...library];
                  setLibrary(nextLib);
                  setActivePlayerTrack(newTrack);
                  setIsPlaying(true);
                  try {
                    localStorage.setItem("melostars_library", JSON.stringify(nextLib));
                  } catch {}
                }}
                initialData={{
                  musicStyle: config.genre,
                  story: config.description,
                  vocalType: config.vocalType || "female",
                }}
                onToggleFavorite={handleToggleFavorite}
                onPlayTrack={handlePlayTrack}
              />
            </Box>
          )}

          {/* ONGLET 3 : BIBLIOTHÈQUE */}
          {activeTab === "library" && (
            <StudioLibrary
              library={library}
              activeTrack={activePlayerTrack}
              isPlaying={isPlaying}
              currentTime={playerCurrentTime}
              duration={playerDuration}
              onSeekTrack={handleSeekTrack}
              onPlayTrack={handlePlayTrack}
              onToggleFavorite={handleToggleFavorite}
              onDeleteTrack={handleDeleteTrack}
              onOpenCreate={() => setActiveTab("create")}
            />
          )}

          {/* ONGLET 4 : PROFIL & GESTION DU COMPTE */}
          {activeTab === "profile" && (
            <StudioProfile
              notes={notes}
              library={library}
              onOpenRecharge={() => router.push("/studio/recharge")}
              onUpdateNotes={updateNotes}
            />
          )}

          {/* ONGLET 5 : VOIX */}
          {activeTab === "voices" && (
            <StudioVoices
              activeVoice={config.vocalType}
              onSelectVoice={(voiceId) => {
                setConfig((prev) => ({ ...prev, vocalType: voiceId }));
                setActiveTab("create");
              }}
            />
          )}
        </Box>
      </Box>

      {/* Barre de navigation mobile flottante type application iOS (Glassmorphism) */}
      <Box
        display={{ base: "block", lg: "none" }}
        position="fixed"
        bottom="3"
        left="50%"
        transform="translateX(-50%)"
        w="calc(100% - 24px)"
        maxW="420px"
        zIndex="50"
        pointerEvents="auto"
      >
        <Flex
          h="64px"
          rounded="full"
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
            const { id, icon: Icon, label, isCenterAction } = item;
            const isActive = activeTab === id;

            if (isCenterAction) {
              return (
                <Box
                  key={id}
                  as="button"
                  type="button"
                  onClick={() => handleNavigate(item)}
                  style={{ outline: "none" }}
                  aria-label={label}
                >
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
                </Box>
              );
            }

            return (
              <Box
                key={id}
                as="button"
                type="button"
                onClick={() => handleNavigate(item)}
                style={{ outline: "none", flex: "1" }}
                aria-label={label}
              >
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
              </Box>
            );
          })}
        </Flex>
      </Box>

      {/* 4. Barre de lecture audio flottante globale */}
      <StudioPlayerBar
        track={activePlayerTrack}
        isPlaying={isPlaying}
        onTogglePlay={(forceState) => setIsPlaying(typeof forceState === "boolean" ? forceState : !isPlaying)}
        onClose={() => {
          setActivePlayerTrack(null);
          setIsPlaying(false);
          setPlayerCurrentTime(0);
        }}
        onToggleFavorite={handleToggleFavorite}
        onProgress={(cur, dur) => {
          setPlayerCurrentTime(cur);
          if (dur && !isNaN(dur) && dur > 0) setPlayerDuration(dur);
        }}
        seekRequest={seekRequest}
      />
    </Flex>
  );
}
