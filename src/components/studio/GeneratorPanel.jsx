"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import {
  LuArrowLeft,
  LuCheck,
  LuChevronDown,
  LuChevronUp,
  LuCopy,
  LuDownload,
  LuFileText,
  LuGlobe,
  LuHeart,
  LuHouse,
  LuImage,
  LuLock,
  LuMic,
  LuMusic,
  LuPause,
  LuPlay,
  LuPlus,
  LuRotateCcw,
  LuShieldAlert,
  LuSparkles,
  LuTrash2,
  LuUploadCloud,
  LuVideo,
  LuWandSparkles,
  LuX,
  LuZap,
} from "react-icons/lu";

import Waveform from "@/components/common/Waveform";
import { generateMusicWithAI, NOTES_PER_SONG, SUNO_MODELS } from "@/services/musicAiApi";
import { accent } from "@/theme/system";
import { downloadTrackAudio } from "@/lib/downloadTrack";

const fmt = (s) => {
  if (isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = String(Math.floor(s % 60)).padStart(2, "0");
  return `${m}:${sec}`;
};

// 1. Étape 1 : Types d'occasions (visuels officiels melostars)
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

// 2. Étape 3 : Types de voix
const VOICE_TYPES = [
  { id: "male", title: "Homme", icon: "/assets/10.png", gender: "m" },
  { id: "female", title: "Femme", icon: "/assets/11.png", gender: "f" },
  { id: "duo", title: "Duo (Homme & Femme)", icon: "/assets/12.png", gender: "auto" },
  { id: "instrumental", title: "Instrumental", desc: "Sans voix ni paroles", icon: "/assets/9.png", isInstrumental: true },
];

// 3. Étape 4 : Styles de musique
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

// Puces de styles rapides suggérés
const SUGGESTED_STYLES = [
  "Afrobeat",
  "Amapiano",
  "Coupé-Décalé",
  "Zouglou",
  "R&B",
  "Pop / Variété",
  "Rap / Hip-Hop",
  "Gospel",
  "Reggae",
  "Kompa",
  "Acoustique Piano",
  "Salsa",
];

// Tags de structure pour les paroles
const STRUCTURE_TAGS = [
  "[Intro]",
  "[Verse 1]",
  "[Verse 2]",
  "[Chorus]",
  "[Bridge]",
  "[Drop]",
  "[Outro]",
];

export default function GeneratorPanel({
  notes = 6,
  onBack,
  onOpenRecharge,
  onTrackCreated,
  onDeductNotes,
  initialData = {},
  onToggleFavorite,
  onTogglePublic,
  onPlayTrack,
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isPublicTrack, setIsPublicTrack] = useState(session?.user?.role === "ADMIN");

  // Stepper d'étapes :
  // 1 (Occasion) -> 2 (Histoire & Paroles) -> 3 (Voix) -> 4 (Style & Modèle) -> 5 (Vérification & Lancement)
  // (Note : L'étape Options avancées & Références est conservée masquée dans le code pour réactivation si besoin)
  const [currentStep, setCurrentStep] = useState(1);
  const TOTAL_STEPS = 5;

  // 1. Occasion
  const [occasion, setOccasion] = useState(initialData.occasion || "birthday");

  // 2. Histoire & Paroles
  const [story, setStory] = useState(initialData.story || "");
  const [lyrics, setLyrics] = useState(initialData.customLyrics || initialData.lyrics || "");
  const [showCustomLyrics, setShowCustomLyrics] = useState(false);
  const [customMode, setCustomMode] = useState(false);

  // 3. Voix & Timbre
  const [vocalType, setVocalType] = useState(initialData.vocalType || "female");
  const [vocalGender, setVocalGender] = useState("auto"); // "auto" | "f" | "m"
  const [instrumental, setInstrumental] = useState(false);

  // 4. Style musical & Modèle IA Suno
  const [musicStyle, setMusicStyle] = useState(initialData.musicStyle || "Afrobeat");
  const [customStyleInput, setCustomStyleInput] = useState("");
  const [isCustomStyleSelected, setIsCustomStyleSelected] = useState(false);
  const [model, setModel] = useState("V6");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  // 5. Options avancées & Références (Optionnel)
  const [customTitle, setCustomTitle] = useState("");
  const [negativeTags, setNegativeTags] = useState("");
  const [duration, setDuration] = useState(165); // 10 à 360 secondes
  const [imageUrls, setImageUrls] = useState([]);
  const [videoUrls, setVideoUrls] = useState([]);
  const [audioUrls, setAudioUrls] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const audioInputRef = useRef(null);

  // Calcul du nombre de références utilisées (Max 10 selon Suno API)
  const attachmentsUsed =
    (musicStyle.trim() ? 1 : 0) +
    (lyrics.trim() ? 1 : 0) +
    imageUrls.length +
    videoUrls.length +
    audioUrls.length;

  // États de génération IA
  const [status, setStatus] = useState("idle"); // "idle" | "generating" | "completed" | "error"
  const [progress, setProgress] = useState(0);
  const [stepLabel, setStepLabel] = useState("");
  const [generatedTrack, setGeneratedTrack] = useState(null);
  const [generationError, setGenerationError] = useState("");
  const [wasRefunded, setWasRefunded] = useState(false);

  // Lecteur audio local
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [showLyrics, setShowLyrics] = useState(false);

  // Synchronisation de la durée et réinitialisation de la lecture à la génération d'un morceau
  useEffect(() => {
    if (generatedTrack) {
      setCurrentTime(0);
      const initialDur = Number(generatedTrack.seconds || generatedTrack.duration) || 180;
      setTotalDuration(initialDur);
    }
  }, [generatedTrack]);

  // Synchronisation avec initialData
  useEffect(() => {
    if (initialData.story) setStory(initialData.story);
    if (initialData.musicStyle) setMusicStyle(initialData.musicStyle);
    if (initialData.occasion) setOccasion(initialData.occasion);
    if (initialData.vocalType) {
      setVocalType(initialData.vocalType);
      if (initialData.vocalType === "instrumental") setInstrumental(true);
    }
  }, [initialData.story, initialData.musicStyle, initialData.occasion, initialData.vocalType]);

  // Navigation dans le Stepper
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else if (onBack) {
      onBack();
    } else {
      router.push("/studio");
    }
  };

  const handleNextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  // Pré-remplir un exemple inspirant pour l'histoire
  const handleFillSampleStory = () => {
    const selectedOcc = OCCASIONS.find((o) => o.id === occasion) || OCCASIONS[0];
    setStory(selectedOcc.sample);
  };

  // Insertion d'un tag de structure dans les paroles
  const insertStructureTag = (tag) => {
    setLyrics((prev) => (prev ? `${prev}\n\n${tag}\n` : `${tag}\n`));
    setShowCustomLyrics(true);
  };

  // Ajout / bascule d'un tag de style suggéré
  const toggleStyleTag = (tag) => {
    if (!musicStyle) {
      setMusicStyle(tag);
      return;
    }
    const tags = musicStyle.split(",").map((t) => t.trim());
    if (tags.includes(tag)) {
      const remaining = tags.filter((t) => t !== tag).join(", ");
      setMusicStyle(remaining || "Afrobeat");
    } else {
      setMusicStyle(`${musicStyle}, ${tag}`);
    }
  };

  // Sélection d'un style musical dans la grille
  const handleSelectStyle = (s) => {
    if (s.isCustom) {
      setIsCustomStyleSelected(true);
      setMusicStyle(customStyleInput || "Style Personnalisé");
    } else {
      setIsCustomStyleSelected(false);
      setMusicStyle(s.id);
    }
  };

  // Sélection du type de voix
  const handleSelectVoice = (v) => {
    setVocalType(v.id);
    if (v.isInstrumental) {
      setInstrumental(true);
      setVocalGender("auto");
    } else {
      setInstrumental(false);
      setVocalGender(v.gender || "auto");
    }
  };

  // Téléversement de fichiers de référence via /api/upload
  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Échec du téléversement");
      }

      const fileUrl = data.url;

      if (type === "image") {
        if (imageUrls.length >= 5) throw new Error("Maximum 5 images de référence.");
        setImageUrls((prev) => [...prev, fileUrl]);
      } else if (type === "video") {
        if (videoUrls.length >= 1) throw new Error("Maximum 1 vidéo de référence.");
        setVideoUrls([fileUrl]);
      } else if (type === "audio") {
        if (audioUrls.length >= 10) throw new Error("Maximum 10 fichiers audio de référence.");
        setAudioUrls((prev) => [...prev, fileUrl]);
      }
    } catch (err) {
      setUploadError(err.message || "Erreur de téléversement");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (index) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    setVideoUrls([]);
  };

  const removeAudio = (index) => {
    setAudioUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Contrôles du lecteur audio
  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  // Lancement de la génération Suno
  const handleStartGeneration = async () => {
    setGenerationError("");
    setWasRefunded(false);

    // Vérification de session
    if (!session?.user?.id) {
      router.push("/auth/signin");
      return;
    }

    // Vérification des notes
    if (notes < NOTES_PER_SONG) {
      if (onOpenRecharge) onOpenRecharge();
      else router.push("/studio/recharge");
      return;
    }

    setStatus("generating");
    setProgress(15);
    setStepLabel("Transmission des consignes créatives à Suno AI...");

    const finalStyle = isCustomStyleSelected
      ? (customStyleInput.trim() || "Afrobeat")
      : (musicStyle || "Afrobeat");

    const isInst = instrumental || vocalType === "instrumental";
    const finalLyrics = lyrics.trim();
    const isCustom = customMode || Boolean(finalLyrics);

    const payload = {
      customMode: isCustom,
      instrumental: isInst,
      model,
      genre: finalStyle,
      style: finalStyle,
      description: story.trim(),
      story: story.trim(),
      prompt: story.trim(),
      lyrics: finalLyrics,
      customLyrics: finalLyrics,
      vocalType,
      occasion,
      vocalGender: isInst ? null : (vocalGender !== "auto" ? vocalGender : null),
      title: customTitle.trim(),
      negativeTags: negativeTags.trim(),
      duration: Number(duration) || 180,
      imageUrls: isCustom ? [] : imageUrls,
      videoUrls: isCustom ? [] : videoUrls,
      audioUrls: isCustom ? [] : audioUrls,
      isPublic: isPublicTrack,
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
      console.error("[GeneratorPanel] Erreur de génération :", err);
      setStatus("error");
      setWasRefunded(true);

      if (err?.status === 402) {
        setGenerationError("Solde insuffisant : 2 Notes sont nécessaires pour composer ce morceau.");
        if (onOpenRecharge) onOpenRecharge();
      } else if (err?.status === 401) {
        setGenerationError("Votre session a expiré. Veuillez vous reconnecter.");
      } else {
        setGenerationError(err?.message || "La composition audio n'a pas pu aboutir. Vos 2 Notes vous ont été remboursées.");
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
    setGenerationError("");
  };

  const selectedOccasionData = OCCASIONS.find((o) => o.id === occasion) || OCCASIONS[0];
  const selectedVoiceData = VOICE_TYPES.find((v) => v.id === vocalType) || VOICE_TYPES[1];
  const currentModelData = SUNO_MODELS.find((m) => m.id === model) || SUNO_MODELS[0];

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
      {/* 1. EN-TÊTE DU WORKFLOW AVEC STEPPER PILULES */}
      <Box
        as="header"
        h={{ base: "14", md: "16" }}
        px={{ base: "4", md: "8" }}
        borderBottomWidth="1px"
        borderColor="paper.200"
        bg="rgba(255, 255, 255, 0.92)"
        backdropFilter="blur(16px)"
        position="sticky"
        top="0"
        zIndex="30"
      >
        <Flex h="full" align="center" justify="space-between">
          {/* Gauche : Retour étape + Accueil studio */}
          <HStack gap="1.5">
            <IconButton
              size="sm"
              variant="ghost"
              rounded="full"
              color="ink.600"
              _hover={{ bg: "paper.200", color: "ink.900" }}
              onClick={handlePrevStep}
              aria-label="Retour étape précédente"
              title="Étape précédente"
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
              title="Accueil du studio"
            >
              <LuHouse size={18} />
            </IconButton>
          </HStack>

          {/* Centre : Indicateur Stepper (5 pilules cliquables) */}
          <HStack gap="2">
            {[1, 2, 3, 4, 5].map((stepNumber) => {
              const isActive = currentStep === stepNumber;
              const isPast = currentStep > stepNumber;
              return (
                <Box
                  key={stepNumber}
                  as="button"
                  type="button"
                  h={isActive ? "5px" : "5px"}
                  w={isActive ? "28px" : "6px"}
                  rounded="full"
                  bg={isActive ? "brand.violetDeep" : isPast ? "brand.violetDeep" : "paper.300"}
                  boxShadow={isActive ? "0 0 10px rgba(124, 58, 237, 0.4)" : "none"}
                  transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  cursor={stepNumber <= currentStep ? "pointer" : "default"}
                  onClick={() => {
                    if (status === "idle" && stepNumber < currentStep) {
                      setCurrentStep(stepNumber);
                    }
                  }}
                  title={`Étape ${stepNumber}`}
                  aria-label={`Étape ${stepNumber}`}
                />
              );
            })}
          </HStack>

          {/* Droite : Solde Notes & Avatar Profil */}
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
                  src={session?.user?.image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"}
                  alt={session?.user?.name || "Profil utilisateur"}
                  referrerPolicy="no-referrer"
                />
                <Avatar.Fallback name={session?.user?.name || "Créateur melostars"} />
              </Avatar.Root>
            </Box>
          </HStack>
        </Flex>
      </Box>

      {/* 2. ZONE DE CONTENU PRINCIPALE */}
      <Flex flex="1" align="center" justify="center" p={{ base: "4", sm: "6", md: "8" }}>
        <Box w="full" maxW="580px" my="auto">
          {/* ========================================================
              ÉTAPE 1 : OCCASION
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

              {/* Grille de 8 cartes occasions */}
              <Grid templateColumns="repeat(2, 1fr)" gap="3.5" maxW="440px" mx="auto" w="full">
                {OCCASIONS.map((o) => {
                  const isSelected = occasion === o.id;
                  return (
                    <Box
                      key={o.id}
                      as="button"
                      type="button"
                      display="flex"
                      flexDir="column"
                      alignItems="center"
                      justifyContent="center"
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
                      <Image src={o.icon} alt={o.title} width="55px" height="55px" />
                      <Text fontFamily="ui" fontWeight="700" fontSize="sm" color="ink.900" mt="1">
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
              ÉTAPE 2 : HISTOIRE & PAROLES
             ======================================================== */}
          {status === "idle" && currentStep === 2 && (
            <Stack gap={{ base: "5", md: "6" }} textAlign="center" maxW="520px" mx="auto" w="full">
              <Stack gap="1">
                <Text fontFamily="heading" fontWeight="800" fontSize={{ base: "2xl", sm: "3xl" }} color="ink.900" letterSpacing="-0.03em">
                  Raconte ton histoire
                </Text>
                <Text fontSize="sm" color="ink.500">
                  Décris ce que tu veux dans ta chanson
                </Text>
              </Stack>

              {/* Carte Textarea épurée avec bouton d'inspiration */}
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
                  minH="130px"
                  fontSize="sm"
                  lineHeight="tall"
                  color="ink.900"
                  p="1"
                  pr="10"
                  resize="none"
                />
              </Box>

              {/* Compteur de caractères */}
              <Text fontSize="xs" color="ink.400" fontFamily="ui" mt="-2">
                Minimum 10 caractères ({story.trim().length}/10)
              </Text>

              {/* SECTION OPTIONNELLE : PAROLES PERSONNALISÉES & STRUCTURE */}
              <Box
                w="full"
                rounded="2xl"
                borderWidth="1px"
                borderColor={showCustomLyrics ? "brand.violet" : "paper.200"}
                bg={showCustomLyrics ? "paper.0" : "paper.100"}
                p="3.5"
                textAlign="left"
                transition="all 0.2s"
              >
                <Flex
                  justify="space-between"
                  align="center"
                  cursor="pointer"
                  onClick={() => setShowCustomLyrics(!showCustomLyrics)}
                >
                  <HStack gap="2">
                    <LuFileText size={16} color="#7c3aed" />
                    <Text fontSize="xs" fontWeight="700" color="ink.900">
                      Ajouter mes propres paroles ou un refrain (Optionnel)
                    </Text>
                  </HStack>
                  <HStack gap="1.5">
                    {lyrics.trim() && (
                      <Badge size="xs" colorPalette="purple" rounded="full">
                        {lyrics.split("\n").filter(Boolean).length} lignes
                      </Badge>
                    )}
                    <IconButton
                      size="xs"
                      variant="ghost"
                      aria-label="Afficher les paroles"
                    >
                      {showCustomLyrics ? <LuChevronUp size={16} /> : <LuChevronDown size={16} />}
                    </IconButton>
                  </HStack>
                </Flex>

                {showCustomLyrics && (
                  <Stack gap="3" pt="3">
                    <Text fontSize="2xs" color="ink.500">
                      Saisis tes couplets et refrains. Tu peux insérer des balises de structure pour guider le chant :
                    </Text>

                    {/* Boutons d'insertion rapide de tags */}
                    <Flex wrap="wrap" gap="1.5">
                      {STRUCTURE_TAGS.map((tag) => (
                        <Button
                          key={tag}
                          size="xs"
                          variant="outline"
                          rounded="lg"
                          fontSize="2xs"
                          h="6"
                          px="2"
                          borderColor="paper.300"
                          color="ink.700"
                          _hover={{ bg: "brand.violetTint", borderColor: "brand.violetDeep", color: "brand.violetDeep" }}
                          onClick={() => insertStructureTag(tag)}
                        >
                          + {tag}
                        </Button>
                      ))}
                    </Flex>

                    {/* Zone de saisie des paroles */}
                    <Textarea
                      value={lyrics}
                      onChange={(e) => {
                        setLyrics(e.target.value);
                        if (e.target.value.trim()) setCustomMode(true);
                      }}
                      placeholder={`[Intro]\nUn matin plein d'espoir...\n\n[Chorus]\nFatou, fête tes 30 ans dans la joie !`}
                      minH="120px"
                      fontSize="xs"
                      lineHeight="relaxed"
                      p="2.5"
                      rounded="xl"
                      borderColor="paper.250"
                      bg="paper.50"
                      resize="vertical"
                    />

                    {/* Bascule Mode Personnalisé */}
                    <Flex justify="space-between" align="center" pt="1">
                      <Text fontSize="2xs" color="ink.500">
                        Mode Paroles Personnalisées (Suno Custom Mode)
                      </Text>
                      <Button
                        size="xs"
                        variant={customMode ? "solid" : "outline"}
                        bg={customMode ? "brand.violetDeep" : "transparent"}
                        color={customMode ? "white" : "ink.600"}
                        borderColor="brand.violet"
                        rounded="full"
                        onClick={() => setCustomMode(!customMode)}
                      >
                        {customMode ? "Activé" : "Automatique"}
                      </Button>
                    </Flex>
                  </Stack>
                )}
              </Box>

              {/* Bouton Continuer */}
              <Box pt="1">
                <Button
                  size="md"
                  rounded="full"
                  color="white"
                  bg="linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)"
                  onClick={handleNextStep}
                  disabled={story.trim().length < 5 && lyrics.trim().length < 5}
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

              {/* Boîte d'astuce en bas */}
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
                  💡 <b>Astuce :</b> Plus tu donnes de détails (prénoms, anecdotes, souvenirs), plus la chanson sera unique et émouvante !
                </Text>
              </Box>
            </Stack>
          )}

          {/* ========================================================
              ÉTAPE 3 : TYPE DE VOIX
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

              {/* Liste de 4 cartes radio */}
              <Stack gap="3" w="full">
                {VOICE_TYPES.map((v) => {
                  const isSelected = vocalType === v.id;
                  return (
                    <Box
                      key={v.id}
                      as="button"
                      type="button"
                      onClick={() => handleSelectVoice(v)}
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
                          <Image src={v.icon} alt={v.title} width="35px" height="35px" />
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
              ÉTAPE 4 : STYLE DE MUSIQUE & MODÈLE IA
             ======================================================== */}
          {status === "idle" && currentStep === 4 && (
            <Stack gap={{ base: "4", md: "5" }} textAlign="center">
              <Stack gap="1">
                <Text fontFamily="heading" fontWeight="800" fontSize={{ base: "2xl", sm: "3xl" }} color="ink.900" letterSpacing="-0.03em">
                  Quel style de musique ?
                </Text>
                <Text fontSize="sm" color="ink.500">
                  Choisis l&apos;ambiance et le moteur d&apos;intelligence artificielle
                </Text>
              </Stack>

              {/* SÉLECTEUR DE MODÈLE SUNO IA */}
              <Box
                p="3.5"
                rounded="2xl"
                bg="paper.0"
                display={'none'}
                borderWidth="1.5px"
                borderColor="paper.200"
                textAlign="left"
              >
                <Flex
                  justify="space-between"
                  align="center"
                
                  cursor="pointer"
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                >
                  <HStack gap="2">
                    <LuSparkles size={16} color="#7c3aed" />
                    <Box>
                      <HStack gap="1.5">
                        <Text fontSize="xs" fontWeight="700" color="ink.900">
                          Modèle IA Suno : {currentModelData.label}
                        </Text>
                        {currentModelData.badge && (
                          <Badge size="xs" colorPalette="purple" rounded="full">
                            {currentModelData.badge}
                          </Badge>
                        )}
                      </HStack>
                      <Text fontSize="2xs" color="ink.500">
                        {currentModelData.desc}
                      </Text>
                    </Box>
                  </HStack>
                  <IconButton size="xs" variant="ghost" aria-label="Choisir le modèle">
                    {isModelDropdownOpen ? <LuChevronUp size={16} /> : <LuChevronDown size={16} />}
                  </IconButton>
                </Flex>

                {isModelDropdownOpen && (
                  <SimpleGrid columns={{ base: 2, sm: 3 }} gap="2" pt="3" mt="2" borderTopWidth="1px" borderColor="paper.150">
                    {SUNO_MODELS.map((m) => (
                      <Box
                        key={m.id}
                        as="button"
                        type="button"
                        p="2"
                        rounded="xl"
                        borderWidth="1px"
                        borderColor={model === m.id ? "brand.violetDeep" : "paper.200"}
                        bg={model === m.id ? "brand.violetTint" : "paper.50"}
                        onClick={() => {
                          setModel(m.id);
                          setIsModelDropdownOpen(false);
                        }}
                        textAlign="left"
                        _hover={{ borderColor: "brand.violet" }}
                      >
                        <Text fontSize="xs" fontWeight="700" color={model === m.id ? "brand.violetDeep" : "ink.800"}>
                          {m.label}
                        </Text>
                        <Text fontSize="3xs" color="ink.400" truncate>
                          {m.desc}
                        </Text>
                      </Box>
                    ))}
                  </SimpleGrid>
                )}
              </Box>

              {/* Grille de 19 styles musicaux */}
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
                      display="flex"
                      gap={3}
                      flexDirection="column"
                      alignItems="center"
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
                      <Image src={s.icon} alt={s.title} w="35px" h="35px" mx="auto" />
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

              {/* Suggestions de tags rapides à combiner */}
              <Box maxW="520px" mx="auto" w="full" textAlign="left" pt="1">
                <Text fontSize="2xs" color="ink.500" mb="1.5">
                  Combinaisons suggérées :
                </Text>
                <Flex wrap="wrap" gap="1.5">
                  {SUGGESTED_STYLES.slice(0, 8).map((st) => {
                    const isIncluded = musicStyle.toLowerCase().includes(st.toLowerCase());
                    return (
                      <Button
                        key={st}
                        size="xs"
                        variant={isIncluded ? "solid" : "outline"}
                        bg={isIncluded ? "brand.violetDeep" : "transparent"}
                        color={isIncluded ? "white" : "ink.700"}
                        borderColor={isIncluded ? "brand.violetDeep" : "paper.250"}
                        rounded="full"
                        fontSize="2xs"
                        h="6"
                        px="2.5"
                        onClick={() => toggleStyleTag(st)}
                      >
                        {st}
                      </Button>
                    );
                  })}
                </Flex>
              </Box>

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
              ÉTAPE : OPTIONS AVANCÉES & RÉFÉRENCES (MASQUÉE / CONSERVÉE)
              Code conservé pour réactivation future : remplacer false par (status === "idle" && currentStep === 5)
             ======================================================== */}
          {false && (
            <Stack gap={{ base: "4", md: "5" }} textAlign="center" maxW="520px" mx="auto" w="full">
              <Stack gap="1">
                <HStack justify="center" gap="1.5">
                  <Text fontFamily="heading" fontWeight="800" fontSize={{ base: "2xl", sm: "3xl" }} color="ink.900" letterSpacing="-0.03em">
                    Personnalisation avancée
                  </Text>
                  <Badge colorPalette="purple" rounded="full" fontSize="2xs" px="2">
                    Optionnel
                  </Badge>
                </HStack>
                <Text fontSize="sm" color="ink.500">
                  Téléverse tes références, ajuste la durée ou donne un titre à ta musique
                </Text>
              </Stack>

              {/* 1. Titre personnalisé */}
              <Box
                p="4"
                rounded="2xl"
                bg="paper.0"
                borderWidth="1.5px"
                borderColor="paper.200"
                textAlign="left"
              >
                <Text fontSize="xs" fontWeight="700" color="ink.800" mb="1">
                  Titre personnalisé de la chanson (Optionnel)
                </Text>
                <Input
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value.slice(0, 80))}
                  placeholder="Ex: Fatou, 30 ans de lumière"
                  rounded="xl"
                  fontSize="xs"
                  h="10"
                  borderColor="paper.300"
                  bg="paper.50"
                />
                <Flex justify="flex-end" mt="1">
                  <Text fontSize="3xs" color="ink.400">
                    {customTitle.length}/80 caractères
                  </Text>
                </Flex>
              </Box>

              {/* 2. Téléversement de références (Images, Audios, Vidéos) */}
              <Box
                p="4"
                rounded="2xl"
                bg="paper.0"
                borderWidth="1.5px"
                borderColor="paper.200"
                textAlign="left"
              >
                <Flex justify="space-between" align="center" mb="1">
                  <Text fontSize="xs" fontWeight="700" color="ink.800">
                    Fichiers d&apos;inspiration & références
                  </Text>
                  <Badge size="xs" colorPalette="purple" rounded="full">
                    {attachmentsUsed}/10 utilisés
                  </Badge>
                </Flex>
                <Text fontSize="2xs" color="ink.500" mb="3">
                  Transmets une photo de la personne, une voix ou une mélodie guide à l&apos;IA.
                </Text>

                {/* Inputs cachés */}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => handleFileUpload(e, "image")}
                />
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  style={{ display: "none" }}
                  onChange={(e) => handleFileUpload(e, "video")}
                />
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  style={{ display: "none" }}
                  onChange={(e) => handleFileUpload(e, "audio")}
                />

                {/* Boutons d'upload */}
                <HStack gap="2" wrap="wrap">
                  <Button
                    size="xs"
                    variant="outline"
                    rounded="full"
                    borderColor="paper.300"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isUploading || imageUrls.length >= 5}
                    gap="1.5"
                  >
                    <LuImage size={13} /> + Photo (max 5)
                  </Button>

                  <Button
                    size="xs"
                    variant="outline"
                    rounded="full"
                    borderColor="paper.300"
                    onClick={() => audioInputRef.current?.click()}
                    disabled={isUploading || audioUrls.length >= 10}
                    gap="1.5"
                  >
                    <LuMic size={13} /> + Audio (max 10)
                  </Button>

                  <Button
                    size="xs"
                    variant="outline"
                    rounded="full"
                    borderColor="paper.300"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={isUploading || videoUrls.length >= 1}
                    gap="1.5"
                  >
                    <LuVideo size={13} /> + Vidéo (max 1)
                  </Button>
                </HStack>

                {/* Spinner pendant le téléversement */}
                {isUploading && (
                  <HStack gap="2" mt="2" color="brand.violetDeep">
                    <Spinner size="xs" />
                    <Text fontSize="2xs">Téléversement de la référence en cours...</Text>
                  </HStack>
                )}

                {/* Message d'erreur upload */}
                {uploadError && (
                  <Text fontSize="2xs" color="red.500" mt="1.5">
                    ⚠️ {uploadError}
                  </Text>
                )}

                {/* Aperçu des images ajoutées */}
                {imageUrls.length > 0 && (
                  <Box mt="3">
                    <Text fontSize="3xs" color="ink.400" mb="1">
                      Images ({imageUrls.length}/5) :
                    </Text>
                    <HStack gap="2" wrap="wrap">
                      {imageUrls.map((url, i) => (
                        <Box key={i} position="relative" boxSize="14" rounded="lg" overflow="hidden" borderWidth="1px" borderColor="paper.300">
                          <Image src={url} alt={`Ref ${i}`} objectFit="cover" boxSize="full" />
                          <IconButton
                            size="2xs"
                            position="absolute"
                            top="1"
                            right="1"
                            colorScheme="red"
                            rounded="full"
                            onClick={() => removeImage(i)}
                            aria-label="Supprimer image"
                          >
                            <LuX size={10} />
                          </IconButton>
                        </Box>
                      ))}
                    </HStack>
                  </Box>
                )}

                {/* Aperçu des audios ajoutés */}
                {audioUrls.length > 0 && (
                  <Box mt="2">
                    <Text fontSize="3xs" color="ink.400" mb="1">
                      Audios ({audioUrls.length}/10) :
                    </Text>
                    <Flex wrap="wrap" gap="1.5">
                      {audioUrls.map((url, i) => (
                        <Badge key={i} size="xs" rounded="full" colorPalette="blue" px="2" py="1">
                          <HStack gap="1">
                            <LuMusic size={11} />
                            <Text fontSize="3xs">Audio {i + 1}</Text>
                            <Box as="button" type="button" onClick={() => removeAudio(i)} cursor="pointer" ml="1">
                              <LuX size={10} />
                            </Box>
                          </HStack>
                        </Badge>
                      ))}
                    </Flex>
                  </Box>
                )}

                {/* Aperçu vidéo */}
                {videoUrls.length > 0 && (
                  <Box mt="2">
                    <Text fontSize="3xs" color="ink.400" mb="1">
                      Vidéo (1/1) :
                    </Text>
                    <Badge size="xs" rounded="full" colorPalette="purple" px="2" py="1">
                      <HStack gap="1">
                        <LuVideo size={11} />
                        <Text fontSize="3xs">Vidéo attachée</Text>
                        <Box as="button" type="button" onClick={removeVideo} cursor="pointer" ml="1">
                          <LuX size={10} />
                        </Box>
                      </HStack>
                    </Badge>
                  </Box>
                )}
              </Box>

              {/* 3. Durée du morceau */}
              <Box
                p="4"
                rounded="2xl"
                bg="paper.0"
                borderWidth="1.5px"
                borderColor="paper.200"
                textAlign="left"
              >
                <Flex justify="space-between" align="center" mb="2">
                  <Text fontSize="xs" fontWeight="700" color="ink.800">
                    Durée souhaitée
                  </Text>
                  <Badge colorPalette="purple" rounded="full" fontSize="xs" px="2.5">
                    {fmt(duration)} min ({duration}s)
                  </Badge>
                </Flex>

                <input
                  type="range"
                  min="30"
                  max="300"
                  step="10"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  style={{
                    width: "100%",
                    accentColor: "#7c3aed",
                    cursor: "pointer",
                  }}
                />

                <Flex justify="space-between" fontSize="3xs" color="ink.400" mt="1">
                  <Text>30 sec</Text>
                  <Text>3 min (Recommandé)</Text>
                  <Text>5 min</Text>
                </Flex>
              </Box>

              {/* 4. Tags négatifs / Éléments à éviter */}
              <Box
                p="4"
                rounded="2xl"
                bg="paper.0"
                borderWidth="1.5px"
                borderColor="paper.200"
                textAlign="left"
              >
                <Text fontSize="xs" fontWeight="700" color="ink.800" mb="1">
                  Styles ou instruments à éviter (Tags négatifs)
                </Text>
                <Input
                  value={negativeTags}
                  onChange={(e) => setNegativeTags(e.target.value.slice(0, 500))}
                  placeholder="Ex: autotune excessif, ambiance trop sombre, batterie agressive..."
                  rounded="xl"
                  fontSize="xs"
                  h="10"
                  borderColor="paper.300"
                  bg="paper.50"
                />
              </Box>

              {/* Boutons d'action : Continuer ou Passer */}
              <Stack gap="2" pt="2" align="center">
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
                  minW="240px"
                  h="12"
                  boxShadow="0 4px 18px rgba(124, 58, 237, 0.3)"
                >
                  Continuer vers la vérification
                </Button>

                <Button
                  size="xs"
                  variant="ghost"
                  color="ink.500"
                  onClick={handleNextStep}
                  fontSize="xs"
                >
                  Passer cette étape (garder les réglages recommandés) &gt;
                </Button>
              </Stack>
            </Stack>
          )}

          {/* ========================================================
              ÉTAPE 5 : VÉRIFICATION (2 NOTES) & LANCEMENT
             ======================================================== */}
          {status === "idle" && currentStep === 5 && (
            <Stack gap="5" textAlign="center" maxW="490px" mx="auto" w="full">
              <Stack gap="1">
                <Text fontFamily="heading" fontWeight="800" fontSize={{ base: "2xl", sm: "3xl" }} color="ink.900" letterSpacing="-0.03em">
                  Prêt à composer votre musique ?
                </Text>
                <Text fontSize="sm" color="ink.500">
                  Vérifiez vos préférences avant le lancement
                </Text>
              </Stack>

              {/* Récapitulatif épuré et complet */}
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
                  {/* Occasion */}
                  <Flex justify="space-between" align="center" borderBottomWidth="1px" borderColor="paper.150" pb="2">
                    <Text fontSize="xs" color="ink.500">Occasion</Text>
                    <HStack gap="1.5">
                      <Image src={selectedOccasionData.icon} alt={selectedOccasionData.title} width="20px" height="20px" />
                      <Text fontFamily="ui" fontWeight="700" fontSize="xs" color="ink.900">{selectedOccasionData.title}</Text>
                    </HStack>
                  </Flex>

                  {/* Voix */}
                  <Flex justify="space-between" align="center" borderBottomWidth="1px" borderColor="paper.150" pb="2">
                    <Text fontSize="xs" color="ink.500">Voix</Text>
                    <HStack gap="1.5">
                      <Image src={selectedVoiceData.icon} alt={selectedVoiceData.title} width="20px" height="20px" />
                      <Text fontFamily="ui" fontWeight="700" fontSize="xs" color="ink.900">
                        {selectedVoiceData.title}
                        {vocalGender !== "auto" && !instrumental && ` (${vocalGender.toUpperCase()})`}
                      </Text>
                    </HStack>
                  </Flex>

                  {/* Style & Modèle Suno */}
                  <Flex justify="space-between" align="center" borderBottomWidth="1px" borderColor="paper.150" pb="2">
                    <Text fontSize="xs" color="ink.500">Style & Modèle IA</Text>
                    <HStack gap="1.5">
                      <Badge px="2.5" py="0.5" rounded="full" bg="brand.violetTint" color="brand.violetDeep" fontSize="xs" fontWeight="700">
                        {isCustomStyleSelected ? (customStyleInput || "Personnalisé") : musicStyle}
                      </Badge>
                      <Badge px="2" py="0.5" rounded="full" colorPalette="purple" fontSize="2xs">
                        {model}
                      </Badge>
                    </HStack>
                  </Flex>

                  {/* Titre & Durée */}
                  <Flex justify="space-between" align="center" borderBottomWidth="1px" borderColor="paper.150" pb="2">
                    <Text fontSize="xs" color="ink.500">Titre & Durée</Text>
                    <Text fontFamily="ui" fontWeight="700" fontSize="xs" color="ink.900">
                      {customTitle.trim() ? `« ${customTitle.trim()} »` : "Titre auto"} • {fmt(duration)} min
                    </Text>
                  </Flex>

                  {/* Histoire */}
                  <Box pt="1">
                    <Text fontSize="2xs" color="ink.400" mb="1">Votre histoire :</Text>
                    <Text fontSize="xs" color="ink.700" fontStyle="italic" noOfLines={3}>
                      « {story || "Création musicale sur mesure melostars"} »
                    </Text>
                  </Box>

                  {/* Paroles si présentes */}
                  {lyrics.trim() && (
                    <Box pt="1">
                      <Text fontSize="2xs" color="brand.violetDeep" fontWeight="700" mb="1">
                        ✍️ Paroles personnalisées incluses ({lyrics.split("\n").filter(Boolean).length} lignes)
                      </Text>
                    </Box>
                  )}

                  {/* Références si présentes */}
                  {(imageUrls.length > 0 || audioUrls.length > 0 || videoUrls.length > 0) && (
                    <Box pt="1">
                      <Text fontSize="2xs" color="ink.400" mb="1">Références téléversées :</Text>
                      <HStack gap="2">
                        {imageUrls.length > 0 && <Badge size="xs" colorPalette="purple">{imageUrls.length} image(s)</Badge>}
                        {audioUrls.length > 0 && <Badge size="xs" colorPalette="blue">{audioUrls.length} audio(s)</Badge>}
                        {videoUrls.length > 0 && <Badge size="xs" colorPalette="green">1 vidéo</Badge>}
                      </HStack>
                    </Box>
                  )}
                </Stack>
              </Box>

              {/* Choix de visibilité publique ou privée */}
              <Flex
                p="3.5"
                rounded="2xl"
                bg="paper.50"
                borderWidth="1.5px"
                borderColor={isPublicTrack ? "green.300" : "paper.200"}
                justify="space-between"
                align="center"
                cursor="pointer"
                onClick={() => setIsPublicTrack(!isPublicTrack)}
                _hover={{ borderColor: isPublicTrack ? "green.400" : "brand.violet" }}
                transition="all 0.2s"
              >
                <HStack gap="3" align="center">
                  <Flex
                    boxSize="9"
                    rounded="full"
                    align="center"
                    justify="center"
                    bg={isPublicTrack ? "green.100" : "paper.200"}
                    color={isPublicTrack ? "green.600" : "ink.400"}
                  >
                    {isPublicTrack ? <LuGlobe size={18} /> : <LuLock size={18} />}
                  </Flex>
                  <Box textAlign="left">
                    <Text fontSize="xs" fontWeight="700" color="ink.900">
                      {isPublicTrack ? "🌐 Public (affiché sur la page d'accueil)" : "🔒 Privé (invisible sur la page d'accueil)"}
                    </Text>
                    <Text fontSize="2xs" color="ink.500">
                      {isPublicTrack
                        ? "Ce morceau sera partagé dans la vitrine publique du site"
                        : "Ce morceau reste privé dans votre bibliothèque personnelle"}
                    </Text>
                  </Box>
                </HStack>
                <Badge
                  size="sm"
                  colorPalette={isPublicTrack ? "green" : "gray"}
                  variant={isPublicTrack ? "solid" : "subtle"}
                  rounded="full"
                  px="2.5"
                >
                  {isPublicTrack ? "Public" : "Privé"}
                </Badge>
              </Flex>

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
                      Solde insuffisant pour créer cette chanson (2 Notes requises).
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
                  <Text>Studio IA Suno {model}</Text>
                  <Text fontWeight="700">{progress}%</Text>
                </Flex>
              </Box>

              <Text fontSize="2xs" color="ink.400">
                La composition et le rendu audio HD sont réalisés en direct. Veuillez patienter...
              </Text>
            </Stack>
          )}

          {/* ========================================================
              ÉTAPE : ERREUR AVEC REMBOURSEMENT AUTOMATIQUE
             ======================================================== */}
          {status === "error" && (
            <Stack gap="5" textAlign="center" py="6" maxW="480px" mx="auto">
              <Box
                p="6"
                rounded="3xl"
                bg="paper.0"
                borderWidth="1.5px"
                borderColor="red.300"
                boxShadow="0 10px 30px rgba(239, 68, 68, 0.1)"
              >
                <Box boxSize="12" rounded="full" bg="red.50" color="red.500" display="flex" alignItems="center" justifyContent="center" mx="auto" mb="3">
                  <LuShieldAlert size={28} />
                </Box>
                <Text fontFamily="heading" fontWeight="800" fontSize="lg" color="red.700" mb="2">
                  Composition non aboutie
                </Text>
                <Text fontSize="xs" color="ink.600" mb="4" lineHeight="relaxed">
                  {generationError || "Une erreur est survenue lors de la communication avec le moteur audio."}
                </Text>

                {wasRefunded && (
                  <Box p="3" rounded="xl" bg="green.50" borderWidth="1px" borderColor="green.200" mb="4">
                    <Text fontSize="2xs" color="green.800" fontWeight="700">
                      🛡️ Vos 2 Notes n&apos;ont pas été débitées (solde sécurisé).
                    </Text>
                  </Box>
                )}

                <HStack justify="center" gap="3">
                  <Button
                    size="sm"
                    rounded="full"
                    bg="brand.violetDeep"
                    color="white"
                    onClick={() => {
                      setStatus("idle");
                      setCurrentStep(5);
                    }}
                    _hover={{ bg: "brand.violet" }}
                  >
                    Modifier mes réglages et réessayer
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    rounded="full"
                    borderColor="paper.300"
                    onClick={handleResetWizard}
                  >
                    Recommencer
                  </Button>
                </HStack>
              </Box>
            </Stack>
          )}

          {/* ========================================================
              ÉTAPE : TITRE GÉNÉRÉ AVEC SUCCÈS (LECTEUR & EXPORT)
             ======================================================== */}
          {status === "completed" && generatedTrack && (
            <Stack gap="6" textAlign="center" maxW="490px" mx="auto">
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
                  <HStack gap="2">
                    <Badge px="2.5" py="1" rounded="full" bg="brand.violetTint" color="brand.violetDeep" fontSize="2xs" fontWeight="700">
                      ✨ Morceau créé avec succès
                    </Badge>
                    {generatedTrack.isPublic ? (
                      <Badge px="2" py="0.5" rounded="full" colorPalette="green" variant="subtle" fontSize="2xs">
                        🌐 Public
                      </Badge>
                    ) : (
                      <Badge px="2" py="0.5" rounded="full" colorPalette="gray" variant="subtle" fontSize="2xs">
                        🔒 Privé
                      </Badge>
                    )}
                  </HStack>
                  <HStack gap="1">
                    {onTogglePublic && generatedTrack?.id && (
                      <IconButton
                        size="xs"
                        variant="ghost"
                        rounded="full"
                        color={generatedTrack.isPublic ? "green.600" : "ink.400"}
                        _hover={{ color: generatedTrack.isPublic ? "red.500" : "green.600" }}
                        onClick={() => {
                          onTogglePublic(generatedTrack.id);
                          setGeneratedTrack((prev) => prev ? { ...prev, isPublic: !prev.isPublic } : null);
                        }}
                        title={
                          generatedTrack.isPublic
                            ? "Public : Visible sur l'accueil (cliquer pour masquer)"
                            : "Privé : Masqué de l'accueil (cliquer pour publier)"
                        }
                        aria-label="Visibilité"
                      >
                        {generatedTrack.isPublic ? <LuGlobe size={15} /> : <LuLock size={15} />}
                      </IconButton>
                    )}
                    <IconButton
                      size="xs"
                      variant="ghost"
                      rounded="full"
                      color={generatedTrack.isFavorite ? "red.500" : "ink.400"}
                      onClick={() => {
                        if (onToggleFavorite) onToggleFavorite(generatedTrack.id);
                        setGeneratedTrack((prev) => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
                      }}
                      aria-label="Favori"
                    >
                      <LuHeart size={16} fill={generatedTrack.isFavorite ? "currentColor" : "none"} />
                    </IconButton>
                  </HStack>
                </Flex>

                {/* Pochette de l'album généré */}
                {generatedTrack.coverUrl ? (
                  <Box
                    mb="4"
                    mx="auto"
                    boxSize={{ base: "32", sm: "40" }}
                    rounded="2xl"
                    overflow="hidden"
                    boxShadow="0 10px 30px -5px rgba(124, 58, 237, 0.3)"
                    borderWidth="1.5px"
                    borderColor="brand.violetDeep"
                  >
                    <Image
                      src={generatedTrack.coverUrl}
                      alt={generatedTrack.title || "Pochette de la musique"}
                      boxSize="full"
                      objectFit="cover"
                    />
                  </Box>
                ) : (
                  <Box
                    mb="4"
                    mx="auto"
                    boxSize="24"
                    rounded="2xl"
                    background="linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    color="white"
                    fontSize="3xl"
                    boxShadow="0 8px 25px rgba(124, 58, 237, 0.2)"
                  >
                    🎵
                  </Box>
                )}

                {/* Titre et Style */}
                <Stack gap="1" mb="4">
                  <Text fontFamily="heading" fontWeight="900" fontSize="xl" color="ink.900">
                    {generatedTrack.title || customTitle || "Morceau sans titre"}
                  </Text>
                  <Text fontSize="xs" color="ink.500">
                    {generatedTrack.genre || musicStyle} • {selectedVoiceData.title} • Modèle {model}
                  </Text>
                </Stack>

                {/* Waveform et Lecteur Audio */}
                <Box mb="4">
                  {generatedTrack?.audioUrl && (
                    <audio
                      ref={audioRef}
                      src={generatedTrack.audioUrl}
                      preload="metadata"
                      onLoadedMetadata={(e) => {
                        const dur = e.currentTarget.duration;
                        if (dur && !isNaN(dur) && dur > 0) {
                          setTotalDuration(dur);
                        }
                      }}
                      onTimeUpdate={() => {
                        if (audioRef.current) {
                          setCurrentTime(audioRef.current.currentTime);
                          const dur = audioRef.current.duration;
                          if (dur && !isNaN(dur) && dur > 0) {
                            setTotalDuration(dur);
                          }
                        }
                      }}
                      onEnded={() => {
                        setIsPlaying(false);
                        setCurrentTime(0);
                      }}
                    />
                  )}
                  <Waveform
                    bars={38}
                    height={46}
                    animate={isPlaying}
                    color="brand.violetDeep"
                    currentTime={currentTime}
                    duration={totalDuration || generatedTrack.seconds || 180}
                    onSeek={(seekTime) => {
                      if (audioRef.current) {
                        audioRef.current.currentTime = seekTime;
                      }
                      setCurrentTime(seekTime);
                    }}
                  />

                  <Flex justify="space-between" mt="2" fontSize="2xs" fontFamily="ui" color="ink.400">
                    <Text>{fmt(currentTime)}</Text>
                    <Text>{fmt(totalDuration || generatedTrack.seconds || 180)}</Text>
                  </Flex>
                </Box>

                {/* Bouton Play/Pause Principal */}
                <HStack justify="center" gap="4" mb="4">
                  <IconButton
                    size="lg"
                    rounded="full"
                    bg={accent.primary}
                    color="white"
                    onClick={togglePlayAudio}
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
                      {generatedTrack.lyrics || lyrics || "Paroles instrumentales ou générées par l'IA."}
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
    </Box>
  );
}
