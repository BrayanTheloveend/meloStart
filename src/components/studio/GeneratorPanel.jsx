"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Center,
  Flex,
  Grid,
  HStack,
  IconButton,
  Image,
  Input,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import {
  LuArrowLeft,
  LuCheck,
  LuCopy,
  LuDownload,
  LuFileText,
  LuHeart,
  LuHouse,
  LuLightbulb,
  LuPause,
  LuPlay,
  LuPlus,
  LuRotateCcw,
  LuShare2,
  LuShieldAlert,
  LuSparkles,
  LuWandSparkles,
  LuZap,
} from "react-icons/lu";

import Waveform from "@/components/common/Waveform";
import { generateMusicWithAI, NOTES_PER_SONG } from "@/services/musicAiApi";
import { accent } from "@/theme/system";
import { downloadTrackAudio } from "@/lib/downloadTrack";

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

// 1. Étape 1 : Types d'occasions (exactement comme dans la capture)
const OCCASIONS = [
  { id: "birthday", title: "Anniversaire", icon: "/assets/1.png", sample: "Une chanson festive et entraînante pour les 30 ans de Fatou, elle adore danser et est toujours souriante." },
  { id: "wedding", title: "Mariage", icon: "/assets/2.png", sample: "Une ouverture de bal douce et romantique pour célébrer notre amour devant toute la famille." },
  { id: "romance", title: "Déclaration", icon: "/assets/3.png", sample: "Une douce déclaration d'amour sincère avec des mots tendres et émouvants." },
  { id: "success", title: "Réussite", icon: "/assets/8.png", sample: "Un morceau énergique et plein de fierté pour célébrer l'obtention d'un diplôme et un nouveau départ." },
  { id: "party", title: "Fête", icon: "/assets/5.png", sample: "Un hymne festif et dansant pour ambiancer notre soirée entre amis jusqu'au matin." },
  { id: "tribute", title: "Hommage", icon: "/assets/6.png", sample: "Un hommage doux et respectueux au piano pour honorer la mémoire d'un être cher." },
  { id: "cheer", title: "Encouragement", icon: "/assets/7.png", sample: "Une chanson inspirante et puissante pour redonner de la force et surmonter les épreuves." },
  { id: "other", title: "Autre", icon: "/assets/4.png", sample: "Une création musicale sur mesure pour une surprise pleine d'émotion et de sourires." },
];

// 2. Étape 3 : Types de voix (exactement comme dans la capture)
const VOICE_TYPES = [
  { id: "male", title: "Homme", icon: "/assets/10.png" },
  { id: "female", title: "Femme", icon: "/assets/11.png" },
  { id: "duo", title: "Duo (Homme & Femme)", icon: "/assets/12.png" },
  { id: "instrumental", title: "Instrumental", desc: "Sans voix ni paroles", icon: "/assets/9.png" },
];

// 3. Étape 4 : Styles de musique (exactement comme dans la capture)
const MUSIC_STYLES = [
  { id: "other_custom", title: "Autre Style", icon: "/assets/genre/19.png", isCustom: true },
  { id: "Izimelo Style", title: "Izimelo Style", icon: "/assets/genre/2.png" },
  { id: "Afrobeat", title: "Afrobeat", icon: "/assets/genre/3.png" },
  { id: "Afro", title: "Afro", icon: "/assets/genre/4.png" },
  { id: "Coupé-Décalé", title: "Coupé-Décalé", icon: "/assets/genre/5.png" },
  { id: "Amapiano", title: "Amapiano", icon: "/assets/genre/6.png" },
  { id: "R&B", title: "R&B", icon: "/assets/genre/7.png" },
  { id: "Rap / Hip-Hop", title: "Rap / Hip-Hop", icon: "/assets/genre/8.png" },
  { id: "Acoustique", title: "Acoustique", icon: "/assets/genre/9.png" },
  { id: "Gospel", title: "Gospel", icon: "/assets/genre/10.png" },
  { id: "Reggae", title: "Reggae", icon: "/assets/genre/11.png" },
  { id: "Kompa", title: "Kompa", icon: "/assets/genre/12.png" },
  { id: "Salsa", title: "Salsa", icon: "/assets/genre/13.png" },
  { id: "Zouk", title: "Zouk", icon: "/assets/genre/14.png" },
  { id: "Zouglou", title: "Zouglou", icon: "/assets/genre/1.png" },
  { id: "Nigerian Music", title: "Nigerian Music", icon: "/assets/genre/15.png" },
  { id: "Arabic", title: "Arabic", icon: "/assets/genre/16.png" },
  { id: "Slam", title: "Slam", icon: "/assets/genre/17.png" },
  { id: "Pop / Variété", title: "Pop / Variété", icon: "/assets/genre/1.png" },
];

export default function GeneratorPanel({
  notes = 6,
  onOpenRecharge,
  onTrackCreated,
  onDeductNotes,
  initialData = {},
  onToggleFavorite,
  onPlayTrack,
}) {
  const router = useRouter();

  // Stepper d'étapes : 1 (Occasion) -> 2 (Histoire) -> 3 (Voix) -> 4 (Style) -> 5 (Vérification 2 Notes & Lancement)
  const [currentStep, setCurrentStep] = useState(1);

  // Valeurs du formulaire
  const [occasion, setOccasion] = useState(initialData.occasion || "birthday");
  const [story, setStory] = useState(initialData.story || "");
  const [vocalType, setVocalType] = useState(initialData.vocalType || "female");
  const [musicStyle, setMusicStyle] = useState(initialData.musicStyle || "Afrobeat");
  const [customStyleInput, setCustomStyleInput] = useState("");
  const [isCustomStyleSelected, setIsCustomStyleSelected] = useState(false);

  // État de génération IA
  const [status, setStatus] = useState("idle"); // "idle" | "generating" | "completed"
  const [progress, setProgress] = useState(0);
  const [stepLabel, setStepLabel] = useState("");
  const [generatedTrack, setGeneratedTrack] = useState(null);

  // Lecteur audio local pour le résultat
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showLyrics, setShowLyrics] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState("");
  const [generationError, setGenerationError] = useState("");
  const playTimer = useRef(null);

  // Synchronisation avec initialData
  useEffect(() => {
    if (initialData.story) setStory(initialData.story);
    if (initialData.musicStyle) setMusicStyle(initialData.musicStyle);
    if (initialData.occasion) setOccasion(initialData.occasion);
    if (initialData.vocalType) setVocalType(initialData.vocalType);
  }, [initialData.story, initialData.musicStyle, initialData.occasion, initialData.vocalType]);

  // Simulation timer audio en lecture
  useEffect(() => {
    if (!isPlaying) {
      clearInterval(playTimer.current);
      return;
    }
    playTimer.current = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= (generatedTrack?.seconds || 135)) {
          setIsPlaying(false);
          return 0;
        }
        return prev + 0.5;
      });
    }, 500);
    return () => clearInterval(playTimer.current);
  }, [isPlaying, generatedTrack]);

  // Navigation dans le Stepper
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      router.push("/studio");
    }
  };

  const handleNextStep = () => {
    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  // Pré-remplir un exemple inspirant pour l'histoire
  const handleFillSampleStory = () => {
    const selectedOcc = OCCASIONS.find((o) => o.id === occasion) || OCCASIONS[0];
    setStory(selectedOcc.sample);
  };

  // Sélection d'un style musical
  const handleSelectStyle = (s) => {
    if (s.isCustom) {
      setIsCustomStyleSelected(true);
      setMusicStyle(customStyleInput || "Style Personnalisé");
    } else {
      setIsCustomStyleSelected(false);
      setMusicStyle(s.id);
    }
  };

  // Lancement de la génération IA
  const handleStartGeneration = async () => {
    setGenerationError("");

    if (notes < NOTES_PER_SONG) {
      if (onOpenRecharge) onOpenRecharge();
      else router.push("/studio/recharge");
      return;
    }

    setStatus("generating");
    setProgress(0);
    setStepLabel("Transmission des consignes créatives à l'IA...");

    const finalStyle = isCustomStyleSelected ? (customStyleInput.trim() || "Afrobeat") : musicStyle;

    const payload = {
      genre: finalStyle,
      description: story,
      vocalType,
      occasion,
    };

    try {
      const result = await generateMusicWithAI(payload, (p, label) => {
        setProgress(p);
        setStepLabel(label);
      });

      // Déduction des 2 Notes confirmée
      if (onDeductNotes) onDeductNotes(NOTES_PER_SONG);
      setGeneratedTrack(result);
      setStatus("completed");
      setIsPlaying(true);

      if (onTrackCreated) onTrackCreated(result);
    } catch (err) {
      console.error("[GeneratorPanel] Erreur génération:", err);
      setStatus("idle");
      if (err?.status === 402) {
        setGenerationError("Solde insuffisant : 2 Notes sont nécessaires pour générer ce morceau.");
        if (onOpenRecharge) onOpenRecharge();
      } else if (err?.status === 401) {
        setGenerationError("Vous devez être connecté pour composer une musique.");
      } else {
        setGenerationError(err?.message || "Une erreur est survenue lors de la composition. Vos crédits n'ont pas été débités.");
      }
    }
  };

  // Recommencer une nouvelle composition
  const handleResetWizard = () => {
    setStatus("idle");
    setCurrentStep(1);
    setGeneratedTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const selectedOccasionData = OCCASIONS.find((o) => o.id === occasion) || OCCASIONS[0];
  const selectedVoiceData = VOICE_TYPES.find((v) => v.id === vocalType) || VOICE_TYPES[1];

  return (
    <Box
      minH="100dvh"
      bg="paper.50"
      color="ink.900"
      display="flex"
      flexDirection="column"
      position="relative"
      style={{
        background: "radial-gradient(ellipse 90% 50% at 50% 0%, rgba(124, 58, 237, 0.05) 0%, #fafafa 75%)",
      }}
    >
      {/* 1. EN-TÊTE ÉPURÉ & CONCENTRÉ (EXACTEMENT COMME DANS LES 4 CAPTURES) */}
      <Box
        as="header"
        h={{ base: "14", md: "16" }}
        px={{ base: "4", md: "8" }}
        borderBottomWidth="1px"
        borderColor="paper.200"
        bg="rgba(255, 255, 255, 0.9)"
        backdropFilter="blur(16px)"
        position="sticky"
        top="0"
        zIndex="30"
      >
        <Flex h="full" align="center" justify="space-between">
          {/* Gauche : Bouton Retour + Bouton Accueil */}
          <HStack gap="1.5">
            <IconButton
              size="sm"
              variant="ghost"
              rounded="full"
              color="ink.600"
              _hover={{ bg: "paper.200", color: "ink.900" }}
              onClick={handlePrevStep}
              aria-label="Retour étape précédente"
            >
              <LuArrowLeft size={18} />
            </IconButton>

            <IconButton
              size="sm"
              variant="ghost"
              rounded="full"
              color="ink.600"
              _hover={{ bg: "paper.200", color: "ink.900" }}
              onClick={() => router.push("/studio")}
              aria-label="Retour à l'accueil du studio"
            >
              <LuHouse size={18} />
            </IconButton>
          </HStack>

          {/* Centre : Indicateur Stepper (4 pilules/points comme dans la capture) */}
          <HStack gap="2">
            {[1, 2, 3, 4].map((stepNumber) => {
              const isActive = currentStep === stepNumber;
              const isPast = currentStep > stepNumber;
              return (
                <Box
                  key={stepNumber}
                  h={isActive ? "4px" : "5px"}
                  w={isActive ? "28px" : "5px"}
                  rounded="full"
                  bg={isActive ? "brand.violetDeep" : isPast ? "brand.violetDeep" : "paper.300"}
                  boxShadow={isActive ? "0 0 10px rgba(124, 58, 237, 0.4)" : "none"}
                  transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                />
              );
            })}
          </HStack>

          {/* Droite : Solde Notes et Avatar utilisateur */}
          <HStack gap="2.5">
            <Button
              size="xs"
              rounded="full"
              variant="outline"
              borderColor="brand.violet"
              color="brand.violetDeep"
              bg="brand.violetTint"
              onClick={onOpenRecharge || (() => router.push("/studio/recharge"))}
              fontFamily="ui"
              fontWeight="700"
              fontSize="2xs"
              px="2.5"
            >
              🎵 {notes} Notes <LuPlus size={11} style={{ marginLeft: "2px" }} />
            </Button>

            {/* Avatar Profil utilisateur (Chakra UI v3) */}
            <Box
              as="button"
              type="button"
              onClick={() => router.push("/studio/profil")}
              rounded="full"
              p="0.5"
              borderWidth="1.5px"
              borderColor="paper.200"
              boxShadow="0 2px 8px rgba(0,0,0,0.06)"
              _hover={{ borderColor: "brand.violetDeep", transform: "scale(1.05)" }}
              _active={{ transform: "scale(0.95)" }}
              transition="all 0.2s"
              cursor="pointer"
              title="Mon profil"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Avatar.Root size="xs">
                <Avatar.Image
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
                  alt="Profil utilisateur"
                />
                <Avatar.Fallback name="Créateur melostars" />
              </Avatar.Root>
            </Box>
          </HStack>
        </Flex>
      </Box>

      {/* 2. ZONE DE CONTENU PRINCIPALE DU WORKFLOW */}
      <Flex flex="1" align="center" justify="center" p={{ base: "4", sm: "6", md: "8" }}>
        <Box w="full" maxW="580px" my="auto">
          {/* ========================================================
              ÉTAPE 1 : POUR QUELLE OCCASION ? (CAPTURE 3)
             ======================================================== */}
          {status === "idle" && currentStep === 1 && (
            <Stack gap={{ base: "5", md: "6" }} textAlign="center">
              <Stack gap="1">
                <Text fontFamily="heading" fontWeight="800" fontSize={{ base: "2xl", sm: "3xl" }} color="ink.900" letterSpacing="-0.03em">
                  Pour quelle occasion ?
                </Text>
                <Text fontSize="sm" color="ink.500">
                  Choisis le moment que tu veux célébrer
                </Text>
              </Stack>

              {/* Grille de 8 cartes (2 colonnes comme dans la capture) */}
              <Grid templateColumns="repeat(2, 1fr)" gap="3.5" maxW="440px" mx="auto" w="full">
                {OCCASIONS.map((o) => {
                  const isSelected = occasion === o.id;
                  return (
                    <Box
                      key={o.id}
                      as="button"
                      type="button"
                      display={'flex'}
                      flexDir={'column'}
                      alignItems={'center'}
                      justifyContent={'center'}
                      onClick={() => setOccasion(o.id)}
                      p={{ base: "4", sm: "5" }}
                      rounded="2xl"
                      bg={isSelected ? "brand.violetTint" : "paper.0"}
                      borderWidth="1.5px"
                      borderColor={isSelected ? "brand.violetDeep" : "paper.200"}
                      boxShadow={isSelected ? "0 4px 18px rgba(124, 58, 237, 0.12)" : "0 2px 6px rgba(0, 0, 0, 0.02)"}
                      _hover={{ borderColor: isSelected ? "brand.violetDeep" : "paper.350", transform: "translateY(-1px)" }}
                      transition="all 0.2s"
                      cursor="pointer"
                      textAlign="center"
                    >
                      <Image src={o.icon} alt={o.title} width={'55px'} height={'55px'} />
                      <Text fontFamily="ui" fontWeight="700" fontSize="sm" color="ink.900">
                        {o.title}
                      </Text>
                    </Box>
                  );
                })}
              </Grid>

              {/* Bouton Continuer */}
              <Box pt="2">
                <Button
                  size="md"
                  rounded="full"
                  color="white"
                  bg="linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)"
                  onClick={handleNextStep}
                  _hover={{ transform: "translateY(-1px)", boxShadow: "0 8px 25px rgba(124, 58, 237, 0.4)" }}
                  _active={{ transform: "scale(0.98)" }}
                  fontFamily="ui"
                  fontWeight="700"
                  fontSize="sm"
                  minW="220px"
                  h="12"
                  boxShadow="0 4px 18px rgba(124, 58, 237, 0.3)"
                >
                  Continuer
                </Button>
              </Box>
            </Stack>
          )}

          {/* ========================================================
              ÉTAPE 2 : RACONTE TON HISTOIRE (CAPTURE 1)
             ======================================================== */}
          {status === "idle" && currentStep === 2 && (
            <Stack gap={{ base: "5", md: "6" }} textAlign="center" maxW="500px" mx="auto" w="full">
              <Stack gap="1">
                <Text fontFamily="heading" fontWeight="800" fontSize={{ base: "2xl", sm: "3xl" }} color="ink.900" letterSpacing="-0.03em">
                  Raconte ton histoire
                </Text>
                <Text fontSize="sm" color="ink.500">
                  Décris ce que tu veux dans ta chanson
                </Text>
              </Stack>

              {/* Carte Textarea épurée avec icône d'inspiration en haut à droite */}
              <Box
                w="full"
                rounded="2xl"
                bg="paper.0"
                borderWidth="1.5px"
                borderColor="paper.200"
                p="4"
                position="relative"
                boxShadow="0 4px 20px rgba(0,0,0,0.03)"
              >
                {/* Bouton inspiration en haut à droite */}
                <IconButton
                  position="absolute"
                  top="3.5"
                  right="3.5"
                  size="sm"
                  rounded="xl"
                  variant="ghost"
                  color="brand.violetDeep"
                  bg="brand.violetTint"
                  borderWidth="1px"
                  borderColor="rgba(124, 58, 237, 0.2)"
                  _hover={{ bg: "brand.violetDeep", color: "white" }}
                  onClick={handleFillSampleStory}
                  aria-label="Inspiration exemple"
                  title="Remplir avec un exemple créatif"
                >
                  <LuSparkles size={16} />
                </IconButton>

                <Textarea
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="Ex: Une chanson pour les 50 ans de ma mère Fatou, elle adore danser et est toujours joyeuse..."
                  border="none"
                  _focusVisible={{ outline: "none", boxShadow: "none" }}
                  minH="150px"
                  fontSize="sm"
                  lineHeight="tall"
                  color="ink.900"
                  p="1"
                  pr="10"
                  resize="none"
                />
              </Box>

              {/* Bouton Continuer > */}
              <Box>
                <Button
                  size="md"
                  rounded="full"
                  color="white"
                  bg="linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)"
                  onClick={handleNextStep}
                  disabled={story.trim().length < 5}
                  _hover={{ transform: "translateY(-1px)", boxShadow: "0 8px 25px rgba(124, 58, 237, 0.4)" }}
                  _active={{ transform: "scale(0.98)" }}
                  fontFamily="ui"
                  fontWeight="700"
                  fontSize="sm"
                  minW="220px"
                  h="12"
                  boxShadow="0 4px 18px rgba(124, 58, 237, 0.3)"
                >
                  Continuer &gt;
                </Button>
              </Box>

              {/* Compteur de caractères directement sous le bouton comme sur la capture */}
              <Text fontSize="xs" color="ink.400" fontFamily="ui" mt="-2">
                Minimum 10 caractères ({story.trim().length}/10)
              </Text>

              {/* Boîte d'astuce en bas (exactement comme dans la capture) */}
              <Box
                w="full"
                p="3.5"
                rounded="2xl"
                bg="brand.violetTint"
                borderWidth="1px"
                borderColor="rgba(124, 58, 237, 0.15)"
                textAlign="left"
              >
                <Text fontSize="xs" color="ink.600" lineHeight="tall">
                  💡 <b>Astuce :</b> Plus tu donnes de détails, plus la chanson sera personnalisée ! Mentionne les prénoms, les souvenirs, les traits de caractère...
                </Text>
              </Box>
            </Stack>
          )}

          {/* ========================================================
              ÉTAPE 3 : QUEL TYPE DE VOIX ? (CAPTURE 2)
             ======================================================== */}
          {status === "idle" && currentStep === 3 && (
            <Stack gap={{ base: "5", md: "6" }} textAlign="center" maxW="460px" mx="auto" w="full">
              <Stack gap="1">
                <Text fontFamily="heading" fontWeight="800" fontSize={{ base: "2xl", sm: "3xl" }} color="ink.900" letterSpacing="-0.03em">
                  Quel type de voix ?
                </Text>
                <Text fontSize="sm" color="ink.500">
                  Homme, femme, duo... ou instrumental ?
                </Text>
              </Stack>

              {/* Liste de 4 cartes radio horizontales épurées */}
              <Stack gap="3" w="full">
                {VOICE_TYPES.map((v) => {
                  const isSelected = vocalType === v.id;
                  return (
                    <Box
                      key={v.id}
                      as="button"
                      type="button"
                      onClick={() => setVocalType(v.id)}
                      p="4"
                      rounded="2xl"
                      bg={isSelected ? "brand.violetTint" : "paper.0"}
                      borderWidth="1.5px"
                      borderColor={isSelected ? "brand.violetDeep" : "paper.200"}
                      boxShadow={isSelected ? "0 4px 18px rgba(124, 58, 237, 0.12)" : "0 2px 6px rgba(0,0,0,0.02)"}
                      _hover={{ borderColor: isSelected ? "brand.violetDeep" : "paper.350", transform: "translateY(-1px)" }}
                      transition="all 0.2s"
                      cursor="pointer"
                      textAlign="left"
                    >
                      <Flex align="center" justify="space-between">
                        <HStack gap="3.5">
                          <Image src={v.icon} alt={v.title} width={'35px'} height={'35px'} />
                          <Box>
                            <Text fontFamily="ui" fontWeight="700" fontSize="sm" color="ink.900">
                              {v.title}
                            </Text>
                            {v.desc && (
                              <Text fontSize="2xs" color="ink.500" mt="0.5">
                                {v.desc}
                              </Text>
                            )}
                          </Box>
                        </HStack>

                        {/* Cercle radio personnalisé sur la droite */}
                        <Box
                          boxSize="5"
                          rounded="full"
                          borderWidth="2px"
                          borderColor={isSelected ? "brand.violetDeep" : "paper.300"}
                          bg={isSelected ? "brand.violetDeep" : "transparent"}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          color="white"
                          flexShrink={0}
                          transition="all 0.2s"
                        >
                          {isSelected && <Box boxSize="2" rounded="full" bg="white" />}
                        </Box>
                      </Flex>
                    </Box>
                  );
                })}
              </Stack>

              {/* Bouton Continuer */}
              <Box pt="2">
                <Button
                  size="md"
                  rounded="full"
                  color="white"
                  bg="linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)"
                  onClick={handleNextStep}
                  _hover={{ transform: "translateY(-1px)", boxShadow: "0 8px 25px rgba(124, 58, 237, 0.4)" }}
                  _active={{ transform: "scale(0.98)" }}
                  fontFamily="ui"
                  fontWeight="700"
                  fontSize="sm"
                  minW="220px"
                  h="12"
                  boxShadow="0 4px 18px rgba(124, 58, 237, 0.3)"
                >
                  Continuer
                </Button>
              </Box>
            </Stack>
          )}

          {/* ========================================================
              ÉTAPE 4 : QUEL STYLE DE MUSIQUE ? (CAPTURE 4)
             ======================================================== */}
          {status === "idle" && currentStep === 4 && (
            <Stack gap={{ base: "4", md: "5" }} textAlign="center">
              <Stack gap="1">
                <Text fontFamily="heading" fontWeight="800" fontSize={{ base: "2xl", sm: "3xl" }} color="ink.900" letterSpacing="-0.03em">
                  Quel style de musique ?
                </Text>
                <Text fontSize="sm" color="ink.500">
                  Choisis l&apos;ambiance de ta chanson
                </Text>
              </Stack>

              {/* Grille de styles musicaux (exactement comme dans la capture 4) */}
              <Grid
                templateColumns={{ base: "repeat(3, 1fr)", sm: "repeat(4, 1fr)" }}
                gap="2.5"
                maxW="520px"
                mx="auto"
                w="full"
              >
                {MUSIC_STYLES.map((s) => {
                  const isSelected = isCustomStyleSelected ? s.isCustom : musicStyle === s.id;
                  return (
                    <Box
                      key={s.id}
                      as="button"
                      type="button"
                      onClick={() => handleSelectStyle(s)}
                      py="3"
                      px="2"
                      display='flex'
                      gap={4}
                      flexDirection='column'
                      alignItems='center'
                      rounded="2xl"
                      bg={isSelected ? "brand.violetTint" : "paper.0"}
                      borderWidth={isSelected ? "2px" : "1.5px"}
                      borderColor={isSelected ? "brand.violetDeep" : s.isCustom ? "paper.300" : "paper.200"}
                      borderStyle={s.isCustom && !isSelected ? "dashed" : "solid"}
                      boxShadow={isSelected ? "0 4px 16px rgba(124, 58, 237, 0.16)" : "none"}
                      _hover={{ borderColor: isSelected ? "brand.violetDeep" : "paper.400", transform: "translateY(-1px)" }}
                      transition="all 0.2s"
                      cursor="pointer"
                      textAlign="center"
                    >
                      {/* <Text fontSize="2xl" mb="1">
                        {s.icon}
                      </Text> */}
                      <Image src={s.icon} alt={s.title} w={'35px'} h={'35px'} mx="auto" />
                      <Text
                        fontFamily="ui"
                        fontWeight="700"
                        fontSize="2xs"
                        color={isSelected ? "brand.violetDeep" : "ink.800"}
                        truncate
                      >
                        {s.title}
                      </Text>
                    </Box>
                  );
                })}
              </Grid>

              {/* Champ personnalisé si "+ Autre Style" est sélectionné */}
              {isCustomStyleSelected && (
                <Box maxW="520px" mx="auto" w="full" pt="1">
                  <Input
                    placeholder="Tapez le nom de votre style (ex: Salsa Cubaine, Drill Afro...)"
                    value={customStyleInput}
                    onChange={(e) => {
                      setCustomStyleInput(e.target.value);
                      setMusicStyle(e.target.value || "Autre");
                    }}
                    rounded="xl"
                    borderColor="brand.violetDeep"
                    bg="paper.0"
                    fontSize="xs"
                    h="10"
                    autoFocus
                  />
                </Box>
              )}

              {/* Bouton Continuer */}
              <Box pt="2">
                <Button
                  size="md"
                  rounded="full"
                  color="white"
                  bg="linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)"
                  onClick={handleNextStep}
                  _hover={{ transform: "translateY(-1px)", boxShadow: "0 8px 25px rgba(124, 58, 237, 0.4)" }}
                  _active={{ transform: "scale(0.98)" }}
                  fontFamily="ui"
                  fontWeight="700"
                  fontSize="sm"
                  minW="220px"
                  h="12"
                  boxShadow="0 4px 18px rgba(124, 58, 237, 0.3)"
                >
                  Continuer
                </Button>
              </Box>
            </Stack>
          )}

          {/* ========================================================
              ÉTAPE 5 : VÉRIFICATION (2 NOTES) & LANCEMENT
             ======================================================== */}
          {status === "idle" && currentStep === 5 && (
            <Stack gap="5" textAlign="center" maxW="480px" mx="auto" w="full">
              <Stack gap="1">
                <Text fontFamily="heading" fontWeight="800" fontSize={{ base: "2xl", sm: "3xl" }} color="ink.900" letterSpacing="-0.03em">
                  Prêt à composer votre musique ?
                </Text>
                <Text fontSize="sm" color="ink.500">
                  Vérifiez vos préférences avant le lancement
                </Text>
              </Stack>

              {/* Récapitulatif épuré */}
              <Box
                p="5"
                rounded="2xl"
                bg="paper.0"
                borderWidth="1.5px"
                borderColor="paper.200"
                w="full"
                textAlign="left"
                boxShadow="0 4px 20px rgba(0,0,0,0.03)"
              >
                <Stack gap="3">
                  <Flex justify="space-between" align="center" borderBottomWidth="1px" borderColor="paper.150" pb="2">
                    <Text fontSize="xs" color="ink.500">Occasion</Text>
                    <HStack gap="1.5">
                      <Image src={selectedOccasionData.icon} alt={selectedOccasionData.title} width="20px" height="20px" />
                      <Text fontFamily="ui" fontWeight="700" fontSize="xs" color="ink.900">{selectedOccasionData.title}</Text>
                    </HStack>
                  </Flex>

                  <Flex justify="space-between" align="center" borderBottomWidth="1px" borderColor="paper.150" pb="2">
                    <Text fontSize="xs" color="ink.500">Voix</Text>
                    <HStack gap="1.5">
                       <Image src={selectedVoiceData.icon} alt={selectedVoiceData.title} width="20px" height="20px" />
                      <Text fontFamily="ui" fontWeight="700" fontSize="xs" color="ink.900">{selectedVoiceData.title}</Text>
                    </HStack>
                  </Flex>

                  <Flex justify="space-between" align="center" borderBottomWidth="1px" borderColor="paper.150" pb="2">
                    <Text fontSize="xs" color="ink.500">Style musical</Text>
                    <Badge px="2.5" py="0.5" rounded="full" bg="brand.violetTint" color="brand.violetDeep" fontSize="xs" fontWeight="700">
                      {isCustomStyleSelected ? (customStyleInput || "Personnalisé") : musicStyle}
                    </Badge>
                  </Flex>

                  <Box pt="1">
                    <Text fontSize="2xs" color="ink.400" mb="1">Votre histoire :</Text>
                    <Text fontSize="xs" color="ink.700" fontStyle="italic" noOfLines={3}>
                      « {story} »
                    </Text>
                  </Box>
                </Stack>
              </Box>

              {/* Bloc de coût en Notes */}
              <HStack justify="center" gap="2" p="3" rounded="2xl" bg="brand.violetTint" borderWidth="1.5px" borderColor="rgba(124, 58, 237, 0.3)" w="full">
                <Text fontFamily="ui" fontWeight="700" fontSize="xs" color="brand.violetDeep">
                  Coût de composition : <b>2 Notes</b> (Votre solde : {notes} Notes)
                </Text>
              </HStack>

              {/* Bouton de confirmation */}
              <Box pt="2">
                {notes >= NOTES_PER_SONG ? (
                  <Button
                    size="lg"
                    rounded="full"
                    color="white"
                    bg="linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)"
                    onClick={handleStartGeneration}
                    _hover={{ transform: "translateY(-1px)", boxShadow: "0 8px 25px rgba(124, 58, 237, 0.45)" }}
                    _active={{ transform: "scale(0.98)" }}
                    fontFamily="ui"
                    fontWeight="700"
                    fontSize="sm"
                    minW="260px"
                    h="12"
                    gap="2"
                    boxShadow="0 4px 18px rgba(124, 58, 237, 0.35)"
                  >
                    <LuWandSparkles size={16} /> Lancer la composition (2 Notes)
                  </Button>
                ) : (
                  <Stack gap="2" align="center">
                    <Text fontSize="xs" color="red.500" fontWeight="600">
                      Solde insuffisant pour créer cette chanson.
                    </Text>
                    <Button
                      size="md"
                      rounded="full"
                      color="white"
                      bg="red.600"
                      _hover={{ bg: "red.700" }}
                      onClick={onOpenRecharge || (() => router.push("/studio/recharge"))}
                      fontFamily="ui"
                      fontWeight="700"
                      gap="1.5"
                    >
                      <LuZap size={14} /> Recharger mes Notes
                    </Button>
                  </Stack>
                )}
              </Box>
            </Stack>
          )}

          {/* ========================================================
              ÉTAPE : GÉNÉRATION IA EN COURS (PIPELINE AUDIO)
             ======================================================== */}
          {status === "generating" && (
            <Stack gap="6" textAlign="center" py="8" maxW="440px" mx="auto">
              <Box
                boxSize="24"
                rounded="full"
                bg="brand.violetTint"
                display="flex"
                alignItems="center"
                justifyContent="center"
                mx="auto"
                position="relative"
              >
                <HStack gap="1.5" align="flex-end" h="28px">
                  {[14, 24, 18, 28, 16].map((h, i) => (
                    <Box
                      key={i}
                      w="3.5px"
                      h={`${h}px`}
                      rounded="full"
                      bg="brand.violetDeep"
                      style={{
                        animation: `wave ${0.6 + i * 0.15}s ease-in-out infinite alternate`,
                        transformOrigin: "bottom",
                      }}
                    />
                  ))}
                </HStack>
              </Box>

              <Stack gap="1.5">
                <Text fontFamily="heading" fontWeight="900" fontSize="2xl" color="ink.900">
                  melostars compose votre titre...
                </Text>
                <Text fontSize="xs" color="ink.500">
                  {stepLabel}
                </Text>
              </Stack>

              {/* Barre de progression avec pourcentage */}
              <Box w="full">
                <Box h="2.5" rounded="full" bg="paper.200" overflow="hidden">
                  <Box
                    h="full"
                    w={`${progress}%`}
                    bg={accent.primary}
                    rounded="full"
                    transition="width 0.4s ease"
                  />
                </Box>
                <Flex justify="space-between" mt="1.5" fontSize="2xs" color="ink.400" fontFamily="ui">
                  <Text>Studio IA</Text>
                  <Text fontWeight="700">{progress}%</Text>
                </Flex>
              </Box>
            </Stack>
          )}

          {/* ========================================================
              ÉTAPE : TITRE GÉNÉRÉ AVEC SUCCÈS (LECTEUR & EXPORT)
             ======================================================== */}
          {status === "completed" && generatedTrack && (
            <Stack gap="6" textAlign="center" maxW="480px" mx="auto">
              <Box
                p="6"
                rounded="3xl"
                bg="paper.0"
                borderWidth="1.5px"
                borderColor="brand.violetDeep"
                boxShadow="0 15px 40px -10px rgba(124, 58, 237, 0.2)"
              >
                {/* En-tête du lecteur */}
                <Flex justify="space-between" align="center" mb="4">
                  <Badge px="2.5" py="1" rounded="full" bg="brand.violetTint" color="brand.violetDeep" fontSize="2xs" fontWeight="700">
                    ✨ Morceau créé avec succès
                  </Badge>
                  <IconButton
                    size="xs"
                    variant="ghost"
                    rounded="full"
                    color={generatedTrack.isFavorite ? "red.500" : "ink.400"}
                    onClick={() => {
                      if (onToggleFavorite) onToggleFavorite(generatedTrack.id);
                    }}
                    aria-label="Favori"
                  >
                    <LuHeart size={16} fill={generatedTrack.isFavorite ? "currentColor" : "none"} />
                  </IconButton>
                </Flex>

                {/* Titre et Style */}
                <Stack gap="1" mb="4">
                  <Text fontFamily="heading" fontWeight="900" fontSize="xl" color="ink.900">
                    {generatedTrack.title}
                  </Text>
                  <Text fontSize="xs" color="ink.500">
                    {generatedTrack.genre} • Voix {selectedVoiceData.title}
                  </Text>
                </Stack>

                {/* Waveform et Lecteur Audio */}
                <Box mb="4">
                  <Waveform
                    bars={38}
                    height={46}
                    color="brand.violetDeep"
                    progress={(currentTime / (generatedTrack.seconds || 135)) * 100}
                  />

                  <Flex justify="space-between" mt="2" fontSize="2xs" fontFamily="ui" color="ink.400">
                    <Text>{fmt(currentTime)}</Text>
                    <Text>{fmt(generatedTrack.seconds || 135)}</Text>
                  </Flex>
                </Box>

                {/* Bouton Play/Pause Principal */}
                <HStack justify="center" gap="4" mb="4">
                  <IconButton
                    size="lg"
                    rounded="full"
                    bg={accent.primary}
                    color="white"
                    onClick={() => setIsPlaying(!isPlaying)}
                    boxShadow="0 6px 20px rgba(124, 58, 237, 0.4)"
                    aria-label={isPlaying ? "Pause" : "Lecture"}
                  >
                    {isPlaying ? <LuPause size={22} /> : <LuPlay size={22} style={{ marginLeft: "2px" }} />}
                  </IconButton>
                </HStack>

                {/* Actions : Télécharger MP3, Paroles */}
                <HStack gap="2.5" justify="center" wrap="wrap">
                  <Button
                    size="xs"
                    rounded="full"
                    variant="outline"
                    borderColor="paper.300"
                    color="ink.700"
                    onClick={() => downloadTrackAudio(generatedTrack)}
                    gap="1.5"
                  >
                    <LuDownload size={13} /> Télécharger MP3
                  </Button>

                  <Button
                    size="xs"
                    rounded="full"
                    variant={showLyrics ? "solid" : "outline"}
                    bg={showLyrics ? "brand.violetTint" : "transparent"}
                    color={showLyrics ? "brand.violetDeep" : "ink.700"}
                    borderColor={showLyrics ? "brand.violetDeep" : "paper.300"}
                    onClick={() => setShowLyrics(!showLyrics)}
                    gap="1.5"
                  >
                    <LuFileText size={13} /> Paroles
                  </Button>
                </HStack>

                {/* Tiroir de Paroles */}
                {showLyrics && (
                  <Box mt="4" p="3.5" rounded="2xl" bg="paper.50" borderWidth="1px" borderColor="paper.200" textAlign="left">
                    <Text fontFamily="heading" fontWeight="700" fontSize="xs" color="ink.900" mb="2">
                      Paroles générées :
                    </Text>
                    <Text fontSize="xs" color="ink.700" whiteSpace="pre-line" lineHeight="tall">
                      {generatedTrack.lyrics || "É-é-é-écoutez bien !\nLa fête commence ce matin.\nTrois ans d'amour et de sourires,\nQue du bonheur à construire !"}
                    </Text>
                  </Box>
                )}
              </Box>

              {/* Bouton Créer une autre musique */}
              <Button
                size="md"
                rounded="full"
                variant="outline"
                borderColor="brand.violet"
                color="brand.violetDeep"
                bg="paper.0"
                onClick={handleResetWizard}
                fontFamily="ui"
                fontWeight="700"
                gap="2"
                mx="auto"
              >
                <LuRotateCcw size={15} /> Composer une autre chanson
              </Button>
            </Stack>
          )}
        </Box>
      </Flex>

      {/* Alerte Erreur de Génération */}
      {generationError && (
        <Box
          position="fixed"
          bottom="6"
          right="6"
          zIndex="70"
          bg="red.600"
          color="white"
          px="4"
          py="3"
          rounded="2xl"
          boxShadow="2xl"
          display="flex"
          alignItems="center"
          gap="3"
          maxW="420px"
        >
          <LuShieldAlert size={20} />
          <Text fontSize="xs" fontWeight="600" flex="1">
            {generationError}
          </Text>
          <IconButton
            size="xs"
            variant="ghost"
            color="white"
            _hover={{ bg: "whiteAlpha.200" }}
            onClick={() => setGenerationError("")}
            aria-label="Fermer l'alerte"
          >
            <LuCheck size={14} />
          </IconButton>
        </Box>
      )}
    </Box>
  );
}
