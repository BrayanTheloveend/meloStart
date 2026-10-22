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
  LuLogOut,
  LuMail,
  LuMicVocal,
  LuMusic,
  LuPencil,
  LuShieldCheck,
  LuSparkles,
  LuUser,
  LuWandSparkles,
  LuZap,
} from "react-icons/lu";

import { onboardingGenres, onboardingGoals } from "@/data/onboardingData";
import { accent } from "@/theme/system";
import { GoogleIcon } from "@/components/auth/GoogleButton";

export default function StudioProfile({
  notes = 6,
  library = [],
  onOpenRecharge,
  onUpdateNotes,
}) {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();

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
    genres: ["Afrobeat", "Pop / Variété"],
    voice: "Voix féminine",
    goal: "Usage Personnel",
  });
  const [toastMessage, setToastMessage] = useState("");

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
          genres: parsed.genres?.length > 0 ? parsed.genres : ["Afrobeat", "Pop / Variété"],
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

      // Synchronisation base de données et session
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
    <Box maxW="5xl" mx="auto" px={{ base: "4", md: "8" }} pb="12">
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

      {/* 1. EN-TÊTE DU PROFIL UTILISATEUR */}
      <Box
        p={{ base: "5", md: "7" }}
        rounded="3xl"
        bg="paper.0"
        borderWidth="1px"
        borderColor="paper.200"
        boxShadow="0 10px 30px rgba(0, 0, 0, 0.04)"
        mb="6"
        position="relative"
        overflow="hidden"
      >
        <Flex
          direction={{ base: "column", sm: "row" }}
          align={{ base: "flex-start", sm: "center" }}
          justify="space-between"
          gap="4"
        >
          {/* Avatar et informations principales */}
          <HStack gap={{ base: "3.5", md: "5" }} align="center">
            {/* Avatar stylisé avec photo Google */}
            <Box
              position="relative"
              boxSize={{ base: "16", md: "20" }}
              rounded="2xl"
              bg="gradient(to-br, #7c3aed, #a855f7)"
              boxShadow="0 10px 25px rgba(124, 58, 237, 0.35)"
              borderWidth="3px"
              borderColor="white"
              flexShrink={0}
              overflow="hidden"
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
                <Text fontSize={{ base: "2xl", md: "3xl" }} color="white">
                  {profile.avatar || "🎵"}
                </Text>
              )}

              {/* Indicateur de compte actif */}
              <Box
                position="absolute"
                bottom="1"
                right="1"
                boxSize="4"
                rounded="full"
                bg="green.500"
                borderWidth="2px"
                borderColor="white"
                boxShadow="0 2px 6px rgba(0,0,0,0.2)"
              />
            </Box>

            <Stack gap="1">
              {/* Nom modifiable */}
              {isEditingName ? (
                <HStack gap="2">
                  <Input
                    size="sm"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    autoFocus
                    rounded="xl"
                    borderColor="brand.violetDeep"
                    maxW="200px"
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
                <HStack gap="2" align="center">
                  <Text
                    fontFamily="heading"
                    fontWeight="800"
                    fontSize={{ base: "lg", md: "2xl" }}
                    color="ink.900"
                    letterSpacing="-0.02em"
                  >
                    {profile.name}
                  </Text>
                  <IconButton
                    size="2xs"
                    variant="ghost"
                    rounded="full"
                    color="ink.400"
                    _hover={{ color: "brand.violetDeep", bg: "brand.violetTint" }}
                    onClick={() => setIsEditingName(true)}
                    aria-label="Modifier nom"
                  >
                    <LuPencil size={13} />
                  </IconButton>
                </HStack>
              )}

              <HStack gap="2" color="ink.500" fontSize="xs">
                <HStack gap="1">
                  <LuMail size={13} />
                  <Text>{profile.email}</Text>
                </HStack>
                <Text>•</Text>
                <Text>Membre depuis {profile.joinedDate}</Text>
              </HStack>

              <HStack gap="2" mt="1" wrap="wrap">
                <Badge
                  px="2.5"
                  py="0.5"
                  rounded="full"
                  bg="brand.violetTint"
                  color="brand.violetDeep"
                  fontSize="2xs"
                  fontFamily="ui"
                  fontWeight="700"
                >
                  <LuSparkles size={11} style={{ display: "inline", marginRight: "4px" }} />
                  {profile.tier}
                </Badge>
                <Badge
                  px="2"
                  py="0.5"
                  rounded="full"
                  bg="green.50"
                  color="green.700"
                  fontSize="2xs"
                  fontFamily="ui"
                >
                  <LuShieldCheck size={11} style={{ display: "inline", marginRight: "3px" }} />
                  Compte Actif
                </Badge>
                {(profile.isGoogleLinked || Boolean(profile.image && profile.image.includes("googleusercontent.com"))) && (
                  <Badge
                    px="2.5"
                    py="0.5"
                    rounded="full"
                    bg="blue.50"
                    color="blue.700"
                    borderWidth="1px"
                    borderColor="blue.200"
                    fontSize="2xs"
                    fontFamily="ui"
                    fontWeight="600"
                  >
                    <HStack gap="1" display="inline-flex" align="center">
                      <Box as="span" display="inline-flex" transform="translateY(0.5px)">
                        <GoogleIcon size={12} />
                      </Box>
                      <Text as="span">Compte Google</Text>
                    </HStack>
                  </Badge>
                )}
              </HStack>
            </Stack>
          </HStack>

          {/* Bouton Recharger les crédits (page à part entière) */}
          <Button
            size={{ base: "sm", md: "md" }}
            rounded="full"
            color="white"
            background={accent.primary}
            onClick={() => router.push("/studio/recharge")}
            _hover={{ transform: "translateY(-1px)", boxShadow: "0 6px 20px rgba(124, 58, 237, 0.4)" }}
            fontFamily="ui"
            fontWeight="700"
            gap="2"
            w={{ base: "full", sm: "auto" }}
          >
            <LuZap size={16} /> Recharger mes Crédits
          </Button>
        </Flex>
      </Box>

      {/* 2. CARTE SOLDE DE NOTES / CRÉDITS (MISE EN AVANT) */}
      <Box
        p={{ base: "5", md: "7" }}
        rounded="3xl"
        bg="linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(168, 85, 247, 0.04) 100%)"
        borderWidth="1.5px"
        borderColor="brand.violetDeep"
        boxShadow="0 8px 24px rgba(124, 58, 237, 0.08)"
        mb="6"
      >
        <Flex
          direction={{ base: "column", md: "row" }}
          align={{ base: "flex-start", md: "center" }}
          justify="space-between"
          gap="4"
        >
          <HStack gap="4">
            <Box
              boxSize="14"
              rounded="2xl"
              bg="brand.violetDeep"
              color="white"
              display="flex"
              alignItems="center"
              justifyContent="center"
              boxShadow="0 4px 14px rgba(124, 58, 237, 0.35)"
              flexShrink={0}
            >
              <LuCoins size={28} />
            </Box>

            <Stack gap="0.5">
              <Text fontSize="xs" fontFamily="ui" fontWeight="700" color="brand.violetDeep" textTransform="uppercase">
                Solde de Création
              </Text>
              <HStack gap="2" align="baseline">
                <Text fontFamily="heading" fontWeight="900" fontSize={{ base: "3xl", md: "4xl" }} color="ink.900" lineHeight="none">
                  {notes}
                </Text>
                <Text fontFamily="ui" fontWeight="700" fontSize="lg" color="ink.700">
                  Notes musicales
                </Text>
              </HStack>
              <Text fontSize="xs" color="ink.500">
                1 chanson = <b>2 Notes</b> • Vous pouvez composer encore{" "}
                <b style={{ color: "#7c3aed" }}>{Math.floor(notes / 2)} morceau{Math.floor(notes / 2) > 1 ? "x" : ""}</b> avec l&apos;IA.
              </Text>
            </Stack>
          </HStack>

          <HStack gap="2.5" w={{ base: "full", md: "auto" }}>
            <Button
              size="sm"
              rounded="full"
              variant="outline"
              borderColor="paper.300"
              color="ink.600"
              onClick={handleResetCredits}
              fontFamily="ui"
              fontSize="xs"
              display={{ base: "none", sm: "inline-flex" }}
            >
              🎁 +10 Notes Démo
            </Button>
            <Button
              asChild
              size="sm"
              rounded="full"
              color="white"
              background={accent.primary}
              fontFamily="ui"
              fontWeight="700"
              flex={{ base: "1", md: "initial" }}
            >
              <NextLink href="/studio/recharge">
                Acheter des Notes <LuArrowRight size={14} />
              </NextLink>
            </Button>
          </HStack>
        </Flex>
      </Box>

      {/* 3. GRILLE : PRÉFÉRENCES MUSICALES & STATISTIQUES */}
      <Grid templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} gap="6" mb="6">
        {/* Colonne Gauche : Préférences Musicales configurées */}
        <Box
          p={{ base: "5", md: "6" }}
          rounded="3xl"
          bg="paper.0"
          borderWidth="1px"
          borderColor="paper.200"
        >
          <Flex justify="space-between" align="center" mb="4">
            <HStack gap="2">
              <Box boxSize="8" rounded="xl" bg="brand.violetTint" color="brand.violetDeep" display="flex" alignItems="center" justifyContent="center">
                <LuMusic size={16} />
              </Box>
              <Text fontFamily="heading" fontWeight="800" fontSize="md" color="ink.900">
                Préférences de Création
              </Text>
            </HStack>
            <Button
              asChild
              size="2xs"
              variant="ghost"
              rounded="full"
              color="brand.violetDeep"
              fontFamily="ui"
              fontWeight="700"
            >
              <NextLink href="/onboarding">
                <LuPencil size={11} /> Modifier
              </NextLink>
            </Button>
          </Flex>

          <Stack gap="3.5">
            {/* Genres favoris */}
            <Box>
              <Text fontSize="2xs" fontFamily="ui" fontWeight="700" color="ink.500" textTransform="uppercase" mb="1.5">
                Genres musicaux favoris
              </Text>
              <HStack gap="1.5" wrap="wrap">
                {savedPreferences.genres.map((g) => (
                  <Badge
                    key={g}
                    px="2.5"
                    py="1"
                    rounded="full"
                    bg="paper.100"
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

            {/* Type de voix */}
            <Box>
              <Text fontSize="2xs" fontFamily="ui" fontWeight="700" color="ink.500" textTransform="uppercase" mb="1.5">
                Voix par défaut
              </Text>
              <HStack gap="2">
                <Badge
                  px="2.5"
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

            {/* Objectif */}
            <Box>
              <Text fontSize="2xs" fontFamily="ui" fontWeight="700" color="ink.500" textTransform="uppercase" mb="1.5">
                Objectif d&apos;utilisation
              </Text>
              <Text fontSize="xs" color="ink.700" fontWeight="600">
                ✨ {savedPreferences.goal}
              </Text>
            </Box>
          </Stack>
        </Box>

        {/* Colonne Droite : Statistiques d'activité du Studio */}
        <Box
          p={{ base: "5", md: "6" }}
          rounded="3xl"
          bg="paper.0"
          borderWidth="1px"
          borderColor="paper.200"
        >
          <HStack gap="2" mb="4">
            <Box boxSize="8" rounded="xl" bg="paper.100" color="ink.800" display="flex" alignItems="center" justifyContent="center">
              <LuWandSparkles size={16} />
            </Box>
            <Text fontFamily="heading" fontWeight="800" fontSize="md" color="ink.900">
              Statistiques Studio
            </Text>
          </HStack>

          <Grid templateColumns="repeat(2, 1fr)" gap="3.5">
            <Box p="3.5" rounded="2xl" bg="paper.50" borderWidth="1px" borderColor="paper.200">
              <HStack gap="1.5" color="ink.500" fontSize="xs" mb="1">
                <LuMusic size={14} />
                <Text>Titres créés</Text>
              </HStack>
              <Text fontFamily="heading" fontWeight="900" fontSize="2xl" color="ink.900">
                {totalSongs}
              </Text>
              <Text fontSize="2xs" color="ink.400">
                dans votre bibliothèque
              </Text>
            </Box>

            <Box p="3.5" rounded="2xl" bg="paper.50" borderWidth="1px" borderColor="paper.200">
              <HStack gap="1.5" color="ink.500" fontSize="xs" mb="1">
                <LuFolderHeart size={14} />
                <Text>Favoris</Text>
              </HStack>
              <Text fontFamily="heading" fontWeight="900" fontSize="2xl" color="red.500">
                {favoriteSongs}
              </Text>
              <Text fontSize="2xs" color="ink.400">
                morceaux coup de cœur
              </Text>
            </Box>

            <Box p="3.5" rounded="2xl" bg="paper.50" borderWidth="1px" borderColor="paper.200">
              <HStack gap="1.5" color="ink.500" fontSize="xs" mb="1">
                <LuHeadphones size={14} />
                <Text>Temps composé</Text>
              </HStack>
              <Text fontFamily="heading" fontWeight="900" fontSize="2xl" color="brand.violetDeep">
                {estimatedMinutes} min
              </Text>
              <Text fontSize="2xs" color="ink.400">
                de contenu musical
              </Text>
            </Box>

            <Box p="3.5" rounded="2xl" bg="paper.50" borderWidth="1px" borderColor="paper.200">
              <HStack gap="1.5" color="ink.500" fontSize="xs" mb="1">
                <LuZap size={14} />
                <Text>Notes restantes</Text>
              </HStack>
              <Text fontFamily="heading" fontWeight="900" fontSize="2xl" color="green.600">
                {notes}
              </Text>
              <Text fontSize="2xs" color="ink.400">
                crédits disponibles
              </Text>
            </Box>
          </Grid>
        </Box>
      </Grid>

      {/* 4. LIENS RAPIDES ET DÉCONNEXION */}
      <Flex
        direction={{ base: "column", sm: "row" }}
        justify="space-between"
        align="center"
        gap="3"
        pt="3"
        borderTopWidth="1px"
        borderColor="paper.200"
      >
        <HStack gap="3">
          <Button asChild size="sm" variant="ghost" rounded="full" color="ink.700" fontFamily="ui">
            <NextLink href="/studio">Retour au Studio</NextLink>
          </Button>
          <Button asChild size="sm" variant="ghost" rounded="full" color="ink.700" fontFamily="ui">
            <NextLink href="/explorer">Explorer les musiques</NextLink>
          </Button>
          {profile.role === "ADMIN" && (
            <Button asChild size="sm" rounded="full" color="white" bg="purple.600" _hover={{ bg: "purple.700" }} fontFamily="ui">
              <NextLink href="/dashboard">Console Admin</NextLink>
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
      </Flex>
    </Box>
  );
}
