"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  HStack,
  IconButton,
  Image,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  LuArrowRight,
  LuCheck,
  LuCoins,
  LuFolderHeart,
  LuHeadphones,
  LuHeart,
  LuLogOut,
  LuMail,
  LuMicVocal,
  LuMusic,
  LuPause,
  LuPencil,
  LuPlay,
  LuPlus,
  LuShieldCheck,
  LuSparkles,
  LuDownload,
  LuWandSparkles,
  LuZap,
  LuSlidersHorizontal,
} from "react-icons/lu";

import { accent } from "@/theme/system";
import { GoogleIcon } from "@/components/auth/GoogleButton";
import { downloadTrackAudio } from "@/lib/downloadTrack";
import { useStudio } from "@/context/StudioContext";

// Mini histogramme décoratif inspiré du design
function MiniBarChart({ color = "#7c3aed", heights = [30, 55, 45, 75, 100] }) {
  return (
    <HStack gap="1.5" align="flex-end" h="36px" opacity={0.9} flexShrink={0}>
      {heights.map((h, i) => (
        <Box
          key={i}
          w="5px"
          h={`${h}%`}
          rounded="full"
          bg={i === heights.length - 1 ? color : "paper.300"}
          transition="all 0.2s"
        />
      ))}
    </HStack>
  );
}

// Formatage de date propre pour le bloc de date (ex: 22 OCT)
const parseTrackDate = (dateStr) => {
  if (!dateStr) {
    const now = new Date();
    return {
      day: String(now.getDate()).padStart(2, "0"),
      month: now.toLocaleDateString("fr-FR", { month: "short" }).toUpperCase().replace(".", ""),
    };
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return { day: "22", month: "OCT" };
  }
  return {
    day: String(d.getDate()).padStart(2, "0"),
    month: d.toLocaleDateString("fr-FR", { month: "short" }).toUpperCase().replace(".", ""),
  };
};

export default function StudioProfile({
  notes = 6,
  library = [],
  onOpenRecharge,
  onUpdateNotes,
  onPlayTrack,
  activeTrack: activeTrackProp,
  isPlaying: isPlayingProp,
}) {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();

  // Récupération facultative depuis StudioContext si disponible
  let studioCtx = null;
  try {
    studioCtx = useStudio();
  } catch (_) {}

  const activeTrack = activeTrackProp || studioCtx?.activePlayerTrack;
  const isPlaying = isPlayingProp ?? studioCtx?.isPlaying;
  const playTrack = onPlayTrack || studioCtx?.playTrack;

  // Données utilisateur
  const [profile, setProfile] = useState({
    name: "Créateur melostars",
    email: "creator@melostars.com",
    avatar: "🎵",
    image: null,
    tier: "Plan Découverte",
    joinedDate: "Octobre 2026",
    role: "USER",
    isGoogleLinked: false,
  });

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);
  const [savedPreferences, setSavedPreferences] = useState({
    genres: ["Afrobeat", "Pop"],
    voice: "Voix féminine",
    goal: "Usage Personnel",
  });
  const [toastMessage, setToastMessage] = useState("");
  const [activeTab, setActiveTab] = useState("tracks"); // "tracks" | "preferences" | "security"

  // Synchronisation avec la session NextAuth
  useEffect(() => {
    if (session?.user) {
      const isGoogle = Boolean(
        session.user.image && session.user.image.includes("googleusercontent.com")
      );
      setProfile((prev) => ({
        ...prev,
        name: session.user.name || prev.name,
        email: session.user.email || prev.email,
        image: session.user.image || prev.image,
        role: session.user.role || prev.role,
        tier: session.user.role === "ADMIN" ? "Administrateur" : "Plan Découverte",
        isGoogleLinked: isGoogle || prev.isGoogleLinked,
      }));
      setNameInput(session.user.name || profile.name);
    }
  }, [session]);

  // Synchronisation avec l'API PostgreSQL
  useEffect(() => {
    let active = true;
    fetch("/api/user/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data?.user) return;
        setProfile((prev) => ({
          ...prev,
          name: data.user.name || prev.name,
          email: data.user.email || prev.email,
          image: data.user.image || prev.image,
          role: data.user.role || prev.role,
          isGoogleLinked: data.user.isGoogleLinked || prev.isGoogleLinked,
        }));
        if (data.user.name) setNameInput(data.user.name);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Charger profil et préférences depuis localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("melostars_user");
      if (storedUser) {
        const u = JSON.parse(storedUser);
        setProfile((prev) => ({
          ...prev,
          name: u.name || prev.name,
          email: u.email || prev.email,
        }));
        if (u.name) setNameInput(u.name);
      }

      const storedName = localStorage.getItem("melostars_username");
      if (storedName) {
        setProfile((prev) => ({ ...prev, name: storedName }));
        setNameInput(storedName);
      }

      const storedPrefs = localStorage.getItem("melostars_onboarding");
      if (storedPrefs) {
        const parsed = JSON.parse(storedPrefs);
        setSavedPreferences({
          genres: parsed.genres?.length > 0 ? parsed.genres : ["Afrobeat", "Pop"],
          voice: parsed.voiceType || "Voix féminine",
          goal: parsed.primaryGoal || "Usage Personnel",
        });
      }
    } catch (_) {}
  }, []);

  const handleSaveName = async () => {
    if (nameInput.trim()) {
      const newName = nameInput.trim();
      setProfile((prev) => ({ ...prev, name: newName }));
      try {
        localStorage.setItem("melostars_username", newName);
      } catch (_) {}
      setIsEditingName(false);
      showToast("Nom d'artiste mis à jour !");

      try {
        await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName }),
        });
        if (updateSession) {
          await updateSession({ name: newName });
        }
      } catch (_) {}
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2200);
  };

  const handleResetCredits = () => {
    if (onUpdateNotes) {
      onUpdateNotes(10);
      showToast("Solde réinitialisé à 10 Notes !");
    }
  };

  const totalSongs = library.length;
  const favoriteSongs = library.filter((t) => t.isFavorite).length;
  const estimatedSeconds = totalSongs * 110;
  const estimatedMinutes = Math.round(estimatedSeconds / 60);

  return (
    <Box maxW="6xl" mx="auto" px={{ base: "4", md: "8" }} pb="12">
      {/* Toast de notification */}
      {toastMessage && (
        <Box
          position="fixed"
          top="20"
          left="50%"
          transform="translateX(-50%)"
          bg="brand.violetDeep"
          color="white"
          px="4"
          py="2"
          rounded="full"
          fontSize="xs"
          fontFamily="ui"
          fontWeight="600"
          boxShadow="0 8px 24px rgba(124, 58, 237, 0.45)"
          zIndex="70"
        >
          ✨ {toastMessage}
        </Box>
      )}

      {/* Dispositif principal en 2 colonnes (Profil à gauche, Métriques & Contenu à droite) */}
      <Flex direction={{ base: "column", lg: "row" }} gap="6" align="flex-start">
        {/* ==================================================== */}
        {/* 1. COLONNE GAUCHE : CARTE PROFIL UTILISATEUR         */}
        {/* ==================================================== */}
        <Box
          w={{ base: "full", lg: "340px" }}
          flexShrink={0}
          bg="paper.0"
          rounded="3xl"
          p={{ base: "5", md: "6" }}
          borderWidth="1px"
          borderColor="paper.200"
          boxShadow="0 4px 20px rgba(0, 0, 0, 0.03)"
        >
          {/* Avatar avec bouton d'édition flottant */}
          <Flex direction="column" align="center" textAlign="center" mb="5">
            <Box position="relative" mb="3">
              <Box
                boxSize="24"
                rounded="full"
                borderWidth="3px"
                borderColor="paper.100"
                overflow="hidden"
                boxShadow="0 6px 18px rgba(0, 0, 0, 0.08)"
                bg="brand.violetTint"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {profile.image ? (
                  <Box
                    as="img"
                    src={profile.image}
                    alt={profile.name}
                    w="full"
                    h="full"
                    objectFit="cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Text fontSize="3xl" color="brand.violetDeep">
                    {profile.avatar || "🎵"}
                  </Text>
                )}
              </Box>

              {/* Bouton d'édition flottant (exactement comme sur l'image) */}
              <IconButton
                position="absolute"
                top="0"
                right="-1"
                boxSize="7"
                minW="7"
                rounded="full"
                bg="paper.0"
                borderWidth="1px"
                borderColor="paper.300"
                color="ink.600"
                boxShadow="0 2px 6px rgba(0, 0, 0, 0.12)"
                _hover={{ bg: "brand.violetTint", color: "brand.violetDeep", borderColor: "brand.violetDeep" }}
                onClick={() => setIsEditingName(true)}
                aria-label="Modifier le nom d'artiste"
              >
                <LuPencil size={12} />
              </IconButton>
            </Box>

            {/* Nom d'artiste ou champ d'édition rapide */}
            {isEditingName ? (
              <HStack gap="2" mb="2" justify="center">
                <Input
                  size="sm"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  autoFocus
                  rounded="xl"
                  borderColor="brand.violetDeep"
                  maxW="180px"
                  textAlign="center"
                  fontSize="sm"
                  fontWeight="700"
                />
                <IconButton
                  size="xs"
                  rounded="full"
                  color="white"
                  bg={accent.primary}
                  onClick={handleSaveName}
                  aria-label="Valider"
                >
                  <LuCheck size={14} />
                </IconButton>
              </HStack>
            ) : (
              <Text
                fontFamily="heading"
                fontWeight="800"
                fontSize="xl"
                color="ink.900"
                letterSpacing="-0.02em"
                mb="1.5"
              >
                {profile.name}
              </Text>
            )}

            {/* Badges de statut */}
            <HStack gap="1.5" justify="center" wrap="wrap">
              <Badge
                rounded="full"
                px="3"
                py="0.5"
                bg="green.50"
                color="green.700"
                borderWidth="1px"
                borderColor="green.200"
                fontSize="2xs"
                fontWeight="700"
                fontFamily="ui"
              >
                ● Compte Actif
              </Badge>
              {profile.tier && (
                <Badge
                  rounded="full"
                  px="2.5"
                  py="0.5"
                  bg="brand.violetTint"
                  color="brand.violetDeep"
                  fontSize="2xs"
                  fontWeight="600"
                  fontFamily="ui"
                >
                  {profile.tier}
                </Badge>
              )}
            </HStack>
          </Flex>

          {/* Bouton d'action principal */}
          <Button
            w="full"
            size="md"
            rounded="2xl"
            color="white"
            background={accent.primary}
            onClick={() => onOpenRecharge ? onOpenRecharge() : router.push("/studio/recharge")}
            _hover={{ opacity: 0.92, transform: "translateY(-1px)" }}
            transition="all 0.2s"
            fontFamily="ui"
            fontWeight="700"
            mb="5"
          >
            <LuZap size={16} /> Recharger des Notes
          </Button>

          {/* Capsules d'informations (style pills inspiré de l'image) */}
          <Stack gap="2.5">
            <Box
              p="3"
              px="4"
              rounded="2xl"
              bg="paper.50"
              borderWidth="1px"
              borderColor="paper.200"
            >
              <Text fontSize="2xs" fontFamily="ui" fontWeight="600" color="ink.400" textTransform="uppercase" letterSpacing="wider">
                Email
              </Text>
              <Text fontSize="xs" fontWeight="700" color="ink.800" truncate mt="0.5">
                {profile.email}
              </Text>
            </Box>

            <Box
              p="3"
              px="4"
              rounded="2xl"
              bg="paper.50"
              borderWidth="1px"
              borderColor="paper.200"
            >
              <Text fontSize="2xs" fontFamily="ui" fontWeight="600" color="ink.400" textTransform="uppercase" letterSpacing="wider">
                Genres favoris
              </Text>
              <Text fontSize="xs" fontWeight="700" color="ink.800" truncate mt="0.5">
                {savedPreferences.genres.join(", ") || "Afrobeat, Pop"}
              </Text>
            </Box>

            <Box
              p="3"
              px="4"
              rounded="2xl"
              bg="paper.50"
              borderWidth="1px"
              borderColor="paper.200"
            >
              <Text fontSize="2xs" fontFamily="ui" fontWeight="600" color="ink.400" textTransform="uppercase" letterSpacing="wider">
                Voix par défaut
              </Text>
              <Text fontSize="xs" fontWeight="700" color="ink.800" truncate mt="0.5">
                {savedPreferences.voice || "Voix féminine"}
              </Text>
            </Box>

            <Box
              p="3"
              px="4"
              rounded="2xl"
              bg="paper.50"
              borderWidth="1px"
              borderColor="paper.200"
            >
              <Text fontSize="2xs" fontFamily="ui" fontWeight="600" color="ink.400" textTransform="uppercase" letterSpacing="wider">
                Authentification
              </Text>
              <HStack gap="1.5" mt="0.5">
                <GoogleIcon size={13} />
                <Text fontSize="xs" fontWeight="700" color="ink.800">
                  {profile.isGoogleLinked || Boolean(profile.image && profile.image.includes("googleusercontent.com"))
                    ? "Compte Google lié"
                    : "Identifiant Melostars"}
                </Text>
              </HStack>
            </Box>
          </Stack>
        </Box>

        {/* ==================================================== */}
        {/* 2. COLONNE DROITE : STATS & WORKSPACE               */}
        {/* ==================================================== */}
        <Box flex="1" minW="0" w="full">
          {/* Ligne des 3 Cartes Métriques (Inspirée du mockup avec mini-graphiques) */}
          <Grid templateColumns={{ base: "1fr", sm: "repeat(3, 1fr)" }} gap="4" mb="5">
            {/* Carte 1 : Titres créés */}
            <Box
              p="4.5"
              bg="paper.0"
              rounded="2xl"
              borderWidth="1px"
              borderColor="paper.200"
              boxShadow="0 2px 10px rgba(0, 0, 0, 0.02)"
            >
              <Flex justify="space-between" align="flex-start" mb="2">
                <Text fontFamily="heading" fontWeight="900" fontSize="3xl" color="brand.violetDeep" lineHeight="1">
                  {totalSongs}
                </Text>
                <MiniBarChart color="#7c3aed" heights={[30, 55, 45, 75, 100]} />
              </Flex>
              <Text fontFamily="ui" fontWeight="700" fontSize="xs" color="ink.900">
                Titres créés
              </Text>
              <HStack gap="1" mt="1" color="ink.400" fontSize="2xs">
                <LuMusic size={12} />
                <Text>{estimatedMinutes} min au total</Text>
              </HStack>
            </Box>

            {/* Carte 2 : Coups de cœur */}
            <Box
              p="4.5"
              bg="paper.0"
              rounded="2xl"
              borderWidth="1px"
              borderColor="paper.200"
              boxShadow="0 2px 10px rgba(0, 0, 0, 0.02)"
            >
              <Flex justify="space-between" align="flex-start" mb="2">
                <Text fontFamily="heading" fontWeight="900" fontSize="3xl" color="pink.600" lineHeight="1">
                  {favoriteSongs}
                </Text>
                <MiniBarChart color="#ec4899" heights={[25, 45, 65, 40, 85]} />
              </Flex>
              <Text fontFamily="ui" fontWeight="700" fontSize="xs" color="ink.900">
                Coups de cœur
              </Text>
              <HStack gap="1" mt="1" color="ink.400" fontSize="2xs">
                <LuFolderHeart size={12} />
                <Text>{favoriteSongs > 0 ? "Morceaux favoris" : "Aucun favori"}</Text>
              </HStack>
            </Box>

            {/* Carte 3 : Notes restantes */}
            <Box
              p="4.5"
              bg="paper.0"
              rounded="2xl"
              borderWidth="1px"
              borderColor="paper.200"
              boxShadow="0 2px 10px rgba(0, 0, 0, 0.02)"
            >
              <Flex justify="space-between" align="flex-start" mb="2">
                <Text fontFamily="heading" fontWeight="900" fontSize="3xl" color="brand.cyanDeep" lineHeight="1">
                  {notes}
                </Text>
                <MiniBarChart color="#06b6d4" heights={[40, 35, 70, 55, 95]} />
              </Flex>
              <Text fontFamily="ui" fontWeight="700" fontSize="xs" color="ink.900">
                Notes disponibles
              </Text>
              <HStack gap="1" mt="1" color="ink.400" fontSize="2xs">
                <LuZap size={12} />
                <Text>{Math.floor(notes / 2)} titres possibles</Text>
              </HStack>
            </Box>
          </Grid>

          {/* Panneau Principal à Onglets */}
          <Box
            bg="paper.0"
            rounded="3xl"
            p={{ base: "4", sm: "6" }}
            borderWidth="1px"
            borderColor="paper.200"
            boxShadow="0 4px 20px rgba(0, 0, 0, 0.03)"
          >
            {/* Barre de navigation des onglets (style souligné comme Appointments | Invoices) */}
            <Flex
              align="center"
              gap="6"
              borderBottomWidth="1px"
              borderColor="paper.200"
              mb="5"
              pb="2"
            >
              <Box
                as="button"
                onClick={() => setActiveTab("tracks")}
                pb="2"
                mb="-2.5"
                borderBottomWidth={activeTab === "tracks" ? "2.5px" : "0"}
                borderColor="brand.violetDeep"
                color={activeTab === "tracks" ? "ink.900" : "ink.400"}
                fontFamily="heading"
                fontWeight="700"
                fontSize="sm"
                cursor="pointer"
                transition="all 0.2s"
              >
                Compositions ({totalSongs})
              </Box>

              <Box
                as="button"
                onClick={() => setActiveTab("preferences")}
                pb="2"
                mb="-2.5"
                borderBottomWidth={activeTab === "preferences" ? "2.5px" : "0"}
                borderColor="brand.violetDeep"
                color={activeTab === "preferences" ? "ink.900" : "ink.400"}
                fontFamily="heading"
                fontWeight="700"
                fontSize="sm"
                cursor="pointer"
                transition="all 0.2s"
              >
                Préférences IA
              </Box>

              <Box
                as="button"
                onClick={() => setActiveTab("security")}
                pb="2"
                mb="-2.5"
                borderBottomWidth={activeTab === "security" ? "2.5px" : "0"}
                borderColor="brand.violetDeep"
                color={activeTab === "security" ? "ink.900" : "ink.400"}
                fontFamily="heading"
                fontWeight="700"
                fontSize="sm"
                cursor="pointer"
                transition="all 0.2s"
              >
                Compte & Sécurité
              </Box>
            </Flex>

            {/* ============================================== */}
            {/* ONGLET 1 : COMPOSITIONS (LISTE STYLE TABLEAU)   */}
            {/* ============================================== */}
            {activeTab === "tracks" && (
              <Box>
                {/* Ligne d'en-tête filtre & action rapide */}
                <Flex justify="space-between" align="center" mb="3">
                  <Badge
                    rounded="full"
                    px="3"
                    py="1"
                    bg="paper.100"
                    color="ink.600"
                    borderWidth="1px"
                    borderColor="paper.300"
                    fontSize="xs"
                    fontFamily="ui"
                  >
                    Toutes les créations ({totalSongs})
                  </Badge>

                  <Button
                    size="2xs"
                    rounded="full"
                    variant="outline"
                    borderColor="paper.300"
                    color="ink.600"
                    onClick={handleResetCredits}
                    fontFamily="ui"
                    fontSize="2xs"
                  >
                    🎁 +10 Notes Démo
                  </Button>
                </Flex>

                {library.length === 0 ? (
                  <Box
                    p="8"
                    textAlign="center"
                    rounded="2xl"
                    bg="paper.50"
                    borderWidth="1px"
                    borderColor="paper.200"
                    borderStyle="dashed"
                  >
                    <Text fontSize="3xl" mb="2">🎼</Text>
                    <Text fontFamily="heading" fontWeight="700" fontSize="sm" color="ink.900" mb="1">
                      Aucun titre créé pour l&apos;instant
                    </Text>
                    <Text fontSize="xs" color="ink.500" maxW="xs" mx="auto" mb="4">
                      Utilisez vos 2 notes de création pour composer votre premier morceau.
                    </Text>
                    <Button
                      asChild
                      size="xs"
                      rounded="full"
                      color="white"
                      bg={accent.primary}
                      fontFamily="ui"
                    >
                      <NextLink href="/studio/create">
                        <LuPlus size={14} /> Créer un morceau
                      </NextLink>
                    </Button>
                  </Box>
                ) : (
                  <Stack gap="2">
                    {library.map((track) => {
                      const { day, month } = parseTrackDate(track.createdAt);
                      const isCurrent = activeTrack?.id === track.id;
                      const trackPlaying = isCurrent && isPlaying;

                      return (
                        <Box
                          key={track.id}
                          p="2.5"
                          px={{ base: "3", sm: "4" }}
                          rounded="2xl"
                          bg={isCurrent ? "brand.violetTint" : "paper.50"}
                          borderWidth="1px"
                          borderColor={isCurrent ? "brand.violetDeep" : "paper.200"}
                          _hover={{ borderColor: isCurrent ? "brand.violetDeep" : "paper.400", bg: isCurrent ? "brand.violetTint" : "paper.0" }}
                          transition="all 0.2s"
                        >
                          <Flex align="center" justify="space-between" gap="3">
                            {/* Bloc Date (style 29 Sep du mockup) */}
                            <Flex direction="column" align="center" justify="center" minW="40px" textAlign="center" flexShrink={0}>
                              <Text fontFamily="heading" fontWeight="800" fontSize="md" color="ink.900" lineHeight="1">
                                {day}
                              </Text>
                              <Text fontFamily="ui" fontWeight="700" fontSize="2xs" color="ink.400" textTransform="uppercase" letterSpacing="wider" mt="0.5">
                                {month}
                              </Text>
                            </Flex>

                            {/* Vignette couverture */}
                            <Image
                              src={track.coverUrl || "/assets/13.png"}
                              alt={track.title}
                              boxSize="10"
                              rounded="xl"
                              objectFit="cover"
                              flexShrink={0}
                            />

                            {/* Titre & Informations */}
                            <Stack gap="0" flex="1" minW="0">
                              <HStack gap="2">
                                <Text fontFamily="heading" fontWeight="700" fontSize="sm" color="ink.900" truncate>
                                  {track.title}
                                </Text>
                                {track.isFavorite && <Text color="red.500" fontSize="xs">❤️</Text>}
                              </HStack>
                              <Text fontSize="2xs" color="ink.500" truncate>
                                {track.meta || `${track.genre || "Pop"} • ${track.length || "1:00"}`}
                              </Text>
                            </Stack>

                            {/* Badge de statut doux */}
                            <Box display={{ base: "none", sm: "block" }}>
                              {track.isFavorite ? (
                                <Badge
                                  rounded="full"
                                  px="2.5"
                                  py="0.5"
                                  bg="pink.50"
                                  color="pink.700"
                                  borderWidth="1px"
                                  borderColor="pink.200"
                                  fontSize="2xs"
                                  fontWeight="700"
                                >
                                  Coup de cœur
                                </Badge>
                              ) : (
                                <Badge
                                  rounded="full"
                                  px="2.5"
                                  py="0.5"
                                  bg="green.50"
                                  color="green.700"
                                  borderWidth="1px"
                                  borderColor="green.200"
                                  fontSize="2xs"
                                  fontWeight="700"
                                >
                                  <LuCheck size={11} style={{ display: "inline", marginRight: "3px" }} />
                                  Prêt
                                </Badge>
                              )}
                            </Box>

                            {/* Durée ou coût */}
                            <Text fontSize="xs" fontWeight="700" color="ink.700" display={{ base: "none", md: "block" }}>
                              {track.length || "1:00"}
                            </Text>

                            {/* Actions : Lecture et Téléchargement */}
                            <HStack gap="1.5" flexShrink={0}>
                              {playTrack && (
                                <IconButton
                                  aria-label={trackPlaying ? "Pause" : "Écouter"}
                                  size="xs"
                                  variant="surface"
                                  rounded="full"
                                  colorPalette="purple"
                                  onClick={() => playTrack(track)}
                                  boxShadow={trackPlaying ? "0 0 0 3px #c4b5fd" : "none"}
                                >
                                  {trackPlaying ? <LuPause size={14} /> : <LuPlay size={14} />}
                                </IconButton>
                              )}

                              <IconButton
                                size="xs"
                                rounded="full"
                                variant="ghost"
                                color="ink.500"
                                _hover={{ color: "brand.violetDeep", bg: "brand.violetTint" }}
                                onClick={() => downloadTrackAudio(track)}
                                aria-label="Télécharger MP3"
                              >
                                <LuDownload size={14} />
                              </IconButton>
                            </HStack>
                          </Flex>
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </Box>
            )}

            {/* ============================================== */}
            {/* ONGLET 2 : PRÉFÉRENCES IA                       */}
            {/* ============================================== */}
            {activeTab === "preferences" && (
              <Stack gap="4">
                <Box p="4" rounded="2xl" bg="paper.50" borderWidth="1px" borderColor="paper.200">
                  <Text fontSize="2xs" fontFamily="ui" fontWeight="700" color="ink.500" textTransform="uppercase" mb="2">
                    Styles musicaux configurés
                  </Text>
                  <HStack gap="1.5" wrap="wrap">
                    {savedPreferences.genres.map((g) => (
                      <Badge
                        key={g}
                        px="3"
                        py="1"
                        rounded="full"
                        bg="paper.0"
                        color="ink.800"
                        borderWidth="1px"
                        borderColor="paper.300"
                        fontSize="xs"
                        fontFamily="ui"
                      >
                        🎵 {g}
                      </Badge>
                    ))}
                  </HStack>
                </Box>

                <Box p="4" rounded="2xl" bg="paper.50" borderWidth="1px" borderColor="paper.200">
                  <Text fontSize="2xs" fontFamily="ui" fontWeight="700" color="ink.500" textTransform="uppercase" mb="1.5">
                    Typologie vocale
                  </Text>
                  <HStack gap="2">
                    <Badge
                      px="3"
                      py="1"
                      rounded="full"
                      bg="brand.violetTint"
                      color="brand.violetDeep"
                      fontSize="xs"
                      fontFamily="ui"
                      fontWeight="600"
                    >
                      <LuMicVocal size={13} style={{ display: "inline", marginRight: "4px" }} />
                      {savedPreferences.voice}
                    </Badge>
                  </HStack>
                </Box>

                <Box p="4" rounded="2xl" bg="paper.50" borderWidth="1px" borderColor="paper.200">
                  <Text fontSize="2xs" fontFamily="ui" fontWeight="700" color="ink.500" textTransform="uppercase" mb="1">
                    Objectif principal
                  </Text>
                  <Text fontSize="xs" color="ink.800" fontWeight="700">
                    ✨ {savedPreferences.goal}
                  </Text>
                </Box>

                <Button
                  asChild
                  size="sm"
                  rounded="full"
                  variant="outline"
                  borderColor="paper.300"
                  color="ink.800"
                  alignSelf="flex-start"
                  fontFamily="ui"
                >
                  <NextLink href="/onboarding">
                    <LuSlidersHorizontal size={14} /> Relancer la personnalisation IA
                  </NextLink>
                </Button>
              </Stack>
            )}

            {/* ============================================== */}
            {/* ONGLET 3 : COMPTE & SÉCURITÉ                    */}
            {/* ============================================== */}
            {activeTab === "security" && (
              <Stack gap="4">
                <Box p="4" rounded="2xl" bg="paper.50" borderWidth="1px" borderColor="paper.200">
                  <Text fontSize="2xs" fontFamily="ui" fontWeight="700" color="ink.500" textTransform="uppercase" mb="1">
                    Identifiant de session
                  </Text>
                  <Text fontSize="xs" color="ink.800" fontWeight="700">
                    {profile.email}
                  </Text>
                  <Text fontSize="2xs" color="ink.400" mt="1">
                    Rôle attribué : {profile.role}
                  </Text>
                </Box>

                <HStack justify="space-between" wrap="wrap" gap="3" pt="2">
                  <HStack gap="3">
                    {profile.role === "ADMIN" && (
                      <Button asChild size="sm" rounded="full" color="white" bg="purple.600" _hover={{ bg: "purple.700" }} fontFamily="ui">
                        <NextLink href="/dashboard">Console Administrateur</NextLink>
                      </Button>
                    )}
                  </HStack>

                  <Button
                    size="sm"
                    variant="outline"
                    rounded="full"
                    color="red.600"
                    borderColor="red.200"
                    _hover={{ bg: "red.50" }}
                    onClick={async () => {
                      try {
                        localStorage.removeItem("melostars_user");
                        localStorage.removeItem("melostars_username");
                        sessionStorage.clear();
                      } catch (_) {}
                      await signOut({ callbackUrl: "/login" });
                    }}
                    fontFamily="ui"
                    gap="2"
                  >
                    <LuLogOut size={14} /> Déconnexion
                  </Button>
                </HStack>
              </Stack>
            )}
          </Box>
        </Box>
      </Flex>
    </Box>
  );
}
