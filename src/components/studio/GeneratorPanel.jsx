"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Badge,
  Box,
  Button,
  Center,
  Flex,
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
  LuAlertCircle,
  LuArrowLeft,
  LuCheck,
  LuChevronDown,
  LuCoins,
  LuDownload,
  LuFileText,
  LuImage,
  LuMic,
  LuMusic,
  LuPause,
  LuPlay,
  LuPlus,
  LuRotateCcw,
  LuSparkles,
  LuTrash2,
  LuUploadCloud,
  LuVideo,
  LuWandSparkles,
  LuX,
  LuZap,
} from "react-icons/lu";

import { generateMusicWithAI, NOTES_PER_SONG, SUNO_MODELS } from "@/services/musicAiApi";
import { downloadTrackAudio } from "@/lib/downloadTrack";

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
  onPlayTrack,
}) {
  const router = useRouter();
  const { data: session } = useSession();

  // Mode personnalisé & Modèle Suno
  const [customMode, setCustomMode] = useState(false);
  const [model, setModel] = useState("V6");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  // Champs Mode Standard
  const [prompt, setPrompt] = useState(initialData.story || "");
  const [style, setStyle] = useState(initialData.musicStyle || "");
  const [lyrics, setLyrics] = useState("");
  const [imageUrls, setImageUrls] = useState([]);
  const [videoUrls, setVideoUrls] = useState([]);
  const [audioUrls, setAudioUrls] = useState([]);
  const [instrumental, setInstrumental] = useState(false);

  // Champs Mode Personnalisé (Custom)
  const [customTitle, setCustomTitle] = useState("");
  const [negativeTags, setNegativeTags] = useState("");
  const [vocalGender, setVocalGender] = useState("auto"); // "auto" | "f" | "m"
  const [duration, setDuration] = useState(180); // 10 to 360 seconds

  // États de téléversement (Uploads de référence)
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const audioInputRef = useRef(null);

  // États de génération
  const [status, setStatus] = useState("idle"); // "idle" | "generating" | "completed" | "error"
  const [progress, setProgress] = useState(0);
  const [stepLabel, setStepLabel] = useState("");
  const [generatedTrack, setGeneratedTrack] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [wasRefunded, setWasRefunded] = useState(false);

  // Lecteur audio HTML5 pour la chanson terminée
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioTotalDuration, setAudioTotalDuration] = useState(0);

  // Calcul du nombre total d'attachements utilisés (Règle Suno API : max 10 combinés)
  const attachmentsUsed =
    (style.trim() ? 1 : 0) +
    (lyrics.trim() ? 1 : 0) +
    imageUrls.length +
    videoUrls.length +
    audioUrls.length;

  // Gestion des uploads de fichiers de référence
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
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  // Insertion d'un tag de structure dans les paroles
  const insertStructureTag = (tag) => {
    setLyrics((prev) => (prev ? `${prev}\n\n${tag}\n` : `${tag}\n`));
  };

  // Ajout / bascule d'un tag de style suggéré
  const toggleStyleTag = (tag) => {
    if (!style) {
      setStyle(tag);
      return;
    }
    const tags = style.split(",").map((t) => t.trim());
    if (tags.includes(tag)) {
      setStyle(tags.filter((t) => t !== tag).join(", "));
    } else {
      setStyle(`${style}, ${tag}`);
    }
  };

  // Lancement de la génération Suno
  const handleGenerate = async () => {
    // Vérification de connexion
    if (!session?.user?.id) {
      router.push("/auth/signin");
      return;
    }

    // Vérification des notes
    if (notes < NOTES_PER_SONG) {
      if (onOpenRecharge) onOpenRecharge();
      return;
    }

    // Validation des entrées
    if (customMode) {
      if (!lyrics.trim() && !prompt.trim() && !style.trim()) {
        setErrorMessage("Veuillez renseigner des paroles, une description ou un style de musique.");
        setStatus("error");
        return;
      }
    } else {
      if (!prompt.trim() && !style.trim() && !lyrics.trim() && !imageUrls.length && !videoUrls.length && !audioUrls.length) {
        setErrorMessage("Veuillez renseigner la description de la chanson ou un style musical.");
        setStatus("error");
        return;
      }
    }

    setStatus("generating");
    setProgress(15);
    setStepLabel("Transmission des paramètres à Suno AI...");
    setErrorMessage("");
    setWasRefunded(false);

    try {
      const result = await generateMusicWithAI(
        {
          customMode,
          instrumental,
          model,
          prompt: prompt.trim(),
          style: style.trim(),
          lyrics: lyrics.trim(),
          imageUrls: customMode ? [] : imageUrls,
          videoUrls: customMode ? [] : videoUrls,
          audioUrls: customMode ? [] : audioUrls,
          title: customTitle.trim(),
          negativeTags: customMode ? negativeTags.trim() : "",
          vocalGender: customMode && vocalGender !== "auto" ? vocalGender : null,
          duration: customMode ? duration : 180,
        },
        (prog, label) => {
          setProgress(prog);
          setStepLabel(label);
        }
      );

      setGeneratedTrack(result);
      setStatus("completed");

      // Déduction locale des notes
      if (onDeductNotes) {
        onDeductNotes(NOTES_PER_SONG);
      }

      // Notification du parent pour mise à jour de la bibliothèque
      if (onTrackCreated) {
        onTrackCreated(result);
      }
    } catch (err) {
      console.error("[GeneratorPanel] Erreur de génération :", err);
      setStatus("error");
      setErrorMessage(err.message || "La génération audio n'a pas pu aboutir.");
      setWasRefunded(true);
    }
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

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setAudioCurrentTime(audioRef.current.currentTime);
      setAudioTotalDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setAudioCurrentTime(time);
    }
  };

  const formatSec = (s) => {
    if (isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = String(Math.floor(s % 60)).padStart(2, "0");
    return `${m}:${sec}`;
  };

  return (
    <Box
      w="100%"
      maxW="780px"
      mx="auto"
      bg="#0e0e13"
      color="#f4f4f7"
      borderRadius="24px"
      border="1px solid rgba(255, 255, 255, 0.08)"
      boxShadow="0 20px 60px rgba(0, 0, 0, 0.7)"
      p={{ base: "4", sm: "6", md: "8" }}
      my={{ base: "4", md: "8" }}
      fontFamily="system-ui, -apple-system, sans-serif"
    >
      {/* Bouton de retour au studio si disponible */}
      {onBack && (
        <Flex justify="flex-start" mb="4">
          <Button
            size="xs"
            variant="ghost"
            color="#a1a1aa"
            onClick={onBack}
            borderRadius="8px"
            _hover={{ color: "#ffffff", bg: "#1a1a24" }}
          >
            <HStack gap="1.5">
              <LuArrowLeft size={14} />
              <Text fontSize="xs" fontWeight="500">Retour au studio</Text>
            </HStack>
          </Button>
        </Flex>
      )}

      {/* ======================================================== */}
      {/* 1. TOP BAR : MODE PERSONNALISÉ & CHOIX DU MODÈLE SUNO */}
      {/* ======================================================== */}
      <Flex justify="space-between" align="center" mb="6" pb="4" borderBottom="1px solid rgba(255, 255, 255, 0.06)">
        {/* Toggle Switch Mode Personnalisé */}
        <Flex align="center" gap="3">
          <Box
            as="button"
            type="button"
            role="switch"
            aria-checked={customMode}
            onClick={() => setCustomMode(!customMode)}
            w="48px"
            h="26px"
            bg={customMode ? "#8b5cf6" : "#22222b"}
            borderRadius="full"
            position="relative"
            transition="all 0.2s ease"
            cursor="pointer"
            border="1px solid rgba(255, 255, 255, 0.15)"
            _focus={{ outline: "none", ring: 2, ringColor: "purple.400" }}
          >
            <Box
              w="20px"
              h="20px"
              bg="#ffffff"
              borderRadius="full"
              position="absolute"
              top="2px"
              left={customMode ? "24px" : "3px"}
              transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
              boxShadow="0 2px 5px rgba(0,0,0,0.4)"
            />
          </Box>
          <Text fontSize="sm" fontWeight="600" color="#e4e4e7">
            Mode personnalisé
          </Text>
        </Flex>

        {/* Sélecteur de Modèle Suno V6 / V6_WILD / etc. */}
        <Box position="relative">
          <Button
            size="sm"
            bg="#181822"
            color="#f4f4f7"
            border="1px solid rgba(255, 255, 255, 0.12)"
            borderRadius="10px"
            px="3"
            h="34px"
            fontSize="xs"
            fontWeight="700"
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
            _hover={{ bg: "#232332", borderColor: "rgba(255, 255, 255, 0.25)" }}
            _active={{ bg: "#282838" }}
          >
            <HStack gap="2">
              <Text>{model}</Text>
              <LuChevronDown size={14} />
            </HStack>
          </Button>

          {isModelDropdownOpen && (
            <Box
              position="absolute"
              right="0"
              top="40px"
              zIndex="50"
              bg="#181822"
              border="1px solid rgba(255, 255, 255, 0.15)"
              borderRadius="12px"
              boxShadow="0 15px 35px rgba(0, 0, 0, 0.8)"
              p="1"
              minW="180px"
            >
              {SUNO_MODELS.map((m) => (
                <Box
                  key={m.id}
                  as="button"
                  type="button"
                  w="100%"
                  textAlign="left"
                  px="3"
                  py="2"
                  borderRadius="8px"
                  bg={model === m.id ? "#8b5cf6" : "transparent"}
                  color={model === m.id ? "#ffffff" : "#d4d4d8"}
                  _hover={{ bg: model === m.id ? "#7c3aed" : "#242433" }}
                  onClick={() => {
                    setModel(m.id);
                    setIsModelDropdownOpen(false);
                  }}
                  cursor="pointer"
                >
                  <Flex justify="space-between" align="center">
                    <Text fontSize="xs" fontWeight="700">
                      {m.label}
                    </Text>
                    {m.badge && (
                      <Badge size="xs" colorScheme="purple" fontSize="9px" px="1" borderRadius="4px">
                        {m.badge}
                      </Badge>
                    )}
                  </Flex>
                  <Text fontSize="10px" opacity="0.7" mt="0.5">
                    {m.desc}
                  </Text>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Flex>

      {/* ======================================================== */}
      {/* 2. MODE NON-PERSONNALISÉ (EXACTEMENT COMME DANS LA CAPTURE) */}
      {/* ======================================================== */}
      {!customMode ? (
        <Stack gap="5">
          {/* Champ 1 : Description de la chanson */}
          <Box>
            <Flex justify="space-between" align="center" mb="2">
              <Text fontSize="sm" fontWeight="600" color="#f4f4f7">
                Description de la chanson
              </Text>
              <Text fontSize="xs" color="#71717a">
                {prompt.length}/3000
              </Text>
            </Flex>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, 3000))}
              placeholder="Décrivez le style de musique et le sujet que vous souhaitez, l'IA générera les paroles pour vous."
              rows={4}
              bg="#14141c"
              border="1px solid rgba(255, 255, 255, 0.08)"
              borderRadius="14px"
              p="3.5"
              fontSize="sm"
              color="#f4f4f7"
              _placeholder={{ color: "#52525b" }}
              _hover={{ borderColor: "rgba(255, 255, 255, 0.16)" }}
              _focus={{ borderColor: "#8b5cf6", outline: "none", boxShadow: "0 0 0 1px #8b5cf6" }}
            />
          </Box>

          {/* Champ 2 : Style de musique */}
          <Box>
            <Flex justify="space-between" align="center" mb="2">
              <Text fontSize="sm" fontWeight="600" color="#f4f4f7">
                Style de musique
              </Text>
              <Text fontSize="xs" color="#71717a">
                {style.length}/1000
              </Text>
            </Flex>
            <Textarea
              value={style}
              onChange={(e) => setStyle(e.target.value.slice(0, 1000))}
              placeholder="Entrez le style de musique"
              rows={2}
              bg="#14141c"
              border="1px solid rgba(255, 255, 255, 0.08)"
              borderRadius="14px"
              p="3.5"
              fontSize="sm"
              color="#f4f4f7"
              _placeholder={{ color: "#52525b" }}
              _hover={{ borderColor: "rgba(255, 255, 255, 0.16)" }}
              _focus={{ borderColor: "#8b5cf6", outline: "none", boxShadow: "0 0 0 1px #8b5cf6" }}
            />

            {/* Suggestions rapides de styles musicaux */}
            <Flex wrap="wrap" gap="1.5" mt="2.5">
              {SUGGESTED_STYLES.map((tag) => (
                <Button
                  key={tag}
                  size="xs"
                  variant="ghost"
                  bg={style.includes(tag) ? "#8b5cf6" : "#1a1a24"}
                  color={style.includes(tag) ? "#ffffff" : "#a1a1aa"}
                  border="1px solid"
                  borderColor={style.includes(tag) ? "#8b5cf6" : "rgba(255, 255, 255, 0.06)"}
                  borderRadius="full"
                  px="2.5"
                  py="1"
                  fontSize="11px"
                  fontWeight="500"
                  onClick={() => toggleStyleTag(tag)}
                  _hover={{ bg: style.includes(tag) ? "#7c3aed" : "#242433", color: "#ffffff" }}
                >
                  {tag}
                </Button>
              ))}
            </Flex>
          </Box>

          {/* Champ 3 : Images de référence (Facultatif) */}
          <Box>
            <Flex justify="space-between" align="center" mb="2">
              <Text fontSize="sm" fontWeight="600" color="#f4f4f7">
                Images de référence (Facultatif)
              </Text>
              <Text fontSize="xs" color="#71717a">
                {imageUrls.length}/5
              </Text>
            </Flex>

            <input
              type="file"
              ref={imageInputRef}
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={(e) => handleFileUpload(e, "image")}
            />

            <Box
              as="button"
              type="button"
              w="100%"
              py="5"
              px="4"
              bg="#14141c"
              border="1px dashed rgba(255, 255, 255, 0.12)"
              borderRadius="14px"
              textAlign="center"
              cursor="pointer"
              transition="all 0.2s"
              onClick={() => imageInputRef.current?.click()}
              _hover={{ borderColor: "#8b5cf6", bg: "#191924" }}
            >
              <Flex direction="column" align="center" justify="center" gap="1.5">
                <Text fontSize="lg" fontWeight="300" color="#a1a1aa">
                  +
                </Text>
                <Text fontSize="xs" fontWeight="600" color="#f4f4f7">
                  Ajouter une image
                </Text>
                <Text fontSize="10px" color="#71717a">
                  JPEG / JPG / PNG / WEBP · Max 10MB
                </Text>
              </Flex>
            </Box>

            {/* Aperçu des images ajoutées */}
            {imageUrls.length > 0 && (
              <Flex wrap="wrap" gap="2" mt="2.5">
                {imageUrls.map((url, idx) => (
                  <Box key={url} position="relative" w="50px" h="50px" borderRadius="8px" overflow="hidden" border="1px solid rgba(255,255,255,0.2)">
                    <Image src={url} alt={`Ref ${idx + 1}`} w="100%" h="100%" objectFit="cover" />
                    <Box
                      as="button"
                      type="button"
                      position="absolute"
                      top="2px"
                      right="2px"
                      w="16px"
                      h="16px"
                      bg="rgba(0,0,0,0.7)"
                      borderRadius="full"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      color="#fff"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageUrls(imageUrls.filter((_, i) => i !== idx));
                      }}
                    >
                      <LuX size={10} />
                    </Box>
                  </Box>
                ))}
              </Flex>
            )}
          </Box>

          {/* Champ 4 : Reference Video (Optional) */}
          <Box>
            <Flex justify="space-between" align="center" mb="2">
              <Text fontSize="sm" fontWeight="600" color="#f4f4f7">
                Reference Video (Optional)
              </Text>
              <Text fontSize="xs" color="#71717a">
                {videoUrls.length}/1
              </Text>
            </Flex>

            <input
              type="file"
              ref={videoInputRef}
              accept="video/mp4,video/quicktime,video/webm"
              style={{ display: "none" }}
              onChange={(e) => handleFileUpload(e, "video")}
            />

            <Box
              as="button"
              type="button"
              w="100%"
              py="5"
              px="4"
              bg="#14141c"
              border="1px dashed rgba(255, 255, 255, 0.12)"
              borderRadius="14px"
              textAlign="center"
              cursor="pointer"
              transition="all 0.2s"
              onClick={() => videoInputRef.current?.click()}
              _hover={{ borderColor: "#8b5cf6", bg: "#191924" }}
            >
              <Flex direction="column" align="center" justify="center" gap="1.5">
                <LuVideo size={18} color="#a1a1aa" />
                <Text fontSize="xs" fontWeight="600" color="#f4f4f7">
                  Click to upload a video file
                </Text>
                <Text fontSize="10px" color="#71717a">
                  MP4 / MOV / WEBM · Max 100MB
                </Text>
              </Flex>
            </Box>

            {videoUrls.length > 0 && (
              <Flex align="center" justify="space-between" mt="2" p="2" bg="#1a1a24" borderRadius="8px">
                <HStack gap="2">
                  <LuVideo size={14} color="#8b5cf6" />
                  <Text fontSize="xs" color="#e4e4e7">Vidéo de référence attachée</Text>
                </HStack>
                <IconButton
                  size="xs"
                  variant="ghost"
                  color="#ef4444"
                  onClick={() => setVideoUrls([])}
                >
                  <LuTrash2 size={12} />
                </IconButton>
              </Flex>
            )}
          </Box>

          {/* Champ 5 : Reference Audio (Optional) */}
          <Box>
            <Flex justify="space-between" align="center" mb="2">
              <Text fontSize="sm" fontWeight="600" color="#f4f4f7">
                Reference Audio (Optional)
              </Text>
              <Text fontSize="xs" color="#71717a">
                {audioUrls.length}/10
              </Text>
            </Flex>

            <input
              type="file"
              ref={audioInputRef}
              accept="audio/*"
              style={{ display: "none" }}
              onChange={(e) => handleFileUpload(e, "audio")}
            />

            <Box
              as="button"
              type="button"
              w="100%"
              py="5"
              px="4"
              bg="#14141c"
              border="1px dashed rgba(255, 255, 255, 0.12)"
              borderRadius="14px"
              textAlign="center"
              cursor="pointer"
              transition="all 0.2s"
              onClick={() => audioInputRef.current?.click()}
              _hover={{ borderColor: "#8b5cf6", bg: "#191924" }}
            >
              <Flex direction="column" align="center" justify="center" gap="1.5">
                <LuMusic size={18} color="#a1a1aa" />
                <Text fontSize="xs" fontWeight="600" color="#f4f4f7">
                  Click to upload audio files
                </Text>
                <Text fontSize="10px" color="#71717a">
                  Max 500MB · 6s - 30min
                </Text>
              </Flex>
            </Box>

            {audioUrls.length > 0 && (
              <Stack gap="1" mt="2">
                {audioUrls.map((url, idx) => (
                  <Flex key={url} align="center" justify="space-between" p="2" bg="#1a1a24" borderRadius="8px">
                    <HStack gap="2">
                      <LuMusic size={14} color="#8b5cf6" />
                      <Text fontSize="xs" color="#e4e4e7">Piste audio #{idx + 1}</Text>
                    </HStack>
                    <IconButton
                      size="xs"
                      variant="ghost"
                      color="#ef4444"
                      onClick={() => setAudioUrls(audioUrls.filter((_, i) => i !== idx))}
                    >
                      <LuTrash2 size={12} />
                    </IconButton>
                  </Flex>
                ))}
              </Stack>
            )}
          </Box>

          {/* Indicateur d'attachements combinés (Règle Suno API max 10) */}
          <Text fontSize="11px" color={attachmentsUsed > 10 ? "#ef4444" : "#71717a"}>
            Attachments used {attachmentsUsed}/10 (style, lyrics, images, video and audio combined)
          </Text>

          {/* Toggle Switch Instrumental */}
          <Flex align="center" gap="3" pt="1">
            <Box
              as="button"
              type="button"
              role="switch"
              aria-checked={instrumental}
              onClick={() => setInstrumental(!instrumental)}
              w="44px"
              h="24px"
              bg={instrumental ? "#8b5cf6" : "#22222b"}
              borderRadius="full"
              position="relative"
              transition="all 0.2s ease"
              cursor="pointer"
              border="1px solid rgba(255, 255, 255, 0.15)"
              _focus={{ outline: "none" }}
            >
              <Box
                w="18px"
                h="18px"
                bg="#ffffff"
                borderRadius="full"
                position="absolute"
                top="2px"
                left={instrumental ? "22px" : "3px"}
                transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
              />
            </Box>
            <Text fontSize="sm" fontWeight="600" color="#f4f4f7">
              Instrumental
            </Text>
          </Flex>

          {/* Champ 6 : Paroles (affiché si non instrumental ou optionnel) */}
          {!instrumental && (
            <Box>
              <Flex justify="space-between" align="center" mb="2">
                <Text fontSize="sm" fontWeight="600" color="#f4f4f7">
                  Paroles
                </Text>
                <Text fontSize="xs" color="#71717a">
                  {lyrics.length}/5000
                </Text>
              </Flex>
              <Textarea
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value.slice(0, 5000))}
                placeholder="Écrivez vos propres paroles, deux couplets (8 lignes) pour un meilleur résultat."
                rows={4}
                bg="#14141c"
                border="1px solid rgba(255, 255, 255, 0.08)"
                borderRadius="14px"
                p="3.5"
                fontSize="sm"
                color="#f4f4f7"
                _placeholder={{ color: "#52525b" }}
                _hover={{ borderColor: "rgba(255, 255, 255, 0.16)" }}
                _focus={{ borderColor: "#8b5cf6", outline: "none", boxShadow: "0 0 0 1px #8b5cf6" }}
              />
            </Box>
          )}
        </Stack>
      ) : (
        /* ======================================================== */
        /* 3. MODE PERSONNALISÉ (CUSTOM MODE - TOUS PARAMÈTRES SUNO) */
        /* ======================================================== */
        <Stack gap="5">
          {/* Titre de la chanson (Uniquement en mode Custom) */}
          <Box>
            <Flex justify="space-between" align="center" mb="2">
              <Text fontSize="sm" fontWeight="600" color="#f4f4f7">
                Titre de la chanson
              </Text>
              <Text fontSize="xs" color="#71717a">
                {customTitle.length}/80
              </Text>
            </Flex>
            <Input
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value.slice(0, 80))}
              placeholder="Entrez le titre de la chanson"
              bg="#14141c"
              border="1px solid rgba(255, 255, 255, 0.08)"
              borderRadius="14px"
              h="46px"
              px="3.5"
              fontSize="sm"
              color="#f4f4f7"
              _placeholder={{ color: "#52525b" }}
              _hover={{ borderColor: "rgba(255, 255, 255, 0.16)" }}
              _focus={{ borderColor: "#8b5cf6", outline: "none", boxShadow: "0 0 0 1px #8b5cf6" }}
            />
          </Box>

          {/* Instrumental switch */}
          <Flex align="center" gap="3">
            <Box
              as="button"
              type="button"
              role="switch"
              aria-checked={instrumental}
              onClick={() => setInstrumental(!instrumental)}
              w="44px"
              h="24px"
              bg={instrumental ? "#8b5cf6" : "#22222b"}
              borderRadius="full"
              position="relative"
              transition="all 0.2s ease"
              cursor="pointer"
              border="1px solid rgba(255, 255, 255, 0.15)"
              _focus={{ outline: "none" }}
            >
              <Box
                w="18px"
                h="18px"
                bg="#ffffff"
                borderRadius="full"
                position="absolute"
                top="2px"
                left={instrumental ? "22px" : "3px"}
                transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
              />
            </Box>
            <Text fontSize="sm" fontWeight="600" color="#f4f4f7">
              Instrumental (sans chant)
            </Text>
          </Flex>

          {/* Paroles & Balises de structure (si non instrumental) */}
          {!instrumental && (
            <Box>
              <Flex justify="space-between" align="center" mb="2">
                <Text fontSize="sm" fontWeight="600" color="#f4f4f7">
                  Paroles
                </Text>
                <Text fontSize="xs" color="#71717a">
                  {lyrics.length}/5000
                </Text>
              </Flex>

              {/* Boutons d'insertion rapide de structure Suno */}
              <Flex wrap="wrap" gap="1.5" mb="2">
                {STRUCTURE_TAGS.map((tag) => (
                  <Button
                    key={tag}
                    size="xs"
                    variant="ghost"
                    bg="#1a1a24"
                    color="#c4b5fd"
                    border="1px solid rgba(139, 92, 246, 0.25)"
                    borderRadius="6px"
                    px="2"
                    h="24px"
                    fontSize="11px"
                    fontWeight="600"
                    onClick={() => insertStructureTag(tag)}
                    _hover={{ bg: "#8b5cf6", color: "#ffffff" }}
                  >
                    {tag}
                  </Button>
                ))}
              </Flex>

              <Textarea
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value.slice(0, 5000))}
                placeholder="Écrivez vos propres paroles ou utilisez les balises [Verse], [Chorus] pour structurer la chanson..."
                rows={6}
                bg="#14141c"
                border="1px solid rgba(255, 255, 255, 0.08)"
                borderRadius="14px"
                p="3.5"
                fontSize="sm"
                color="#f4f4f7"
                _placeholder={{ color: "#52525b" }}
                _hover={{ borderColor: "rgba(255, 255, 255, 0.16)" }}
                _focus={{ borderColor: "#8b5cf6", outline: "none", boxShadow: "0 0 0 1px #8b5cf6" }}
              />
            </Box>
          )}

          {/* Style de musique */}
          <Box>
            <Flex justify="space-between" align="center" mb="2">
              <Text fontSize="sm" fontWeight="600" color="#f4f4f7">
                Style de musique
              </Text>
              <Text fontSize="xs" color="#71717a">
                {style.length}/1000
              </Text>
            </Flex>
            <Textarea
              value={style}
              onChange={(e) => setStyle(e.target.value.slice(0, 1000))}
              placeholder="Ex: Afrobeat, energetic, electric guitar, saxophone, studio master"
              rows={2}
              bg="#14141c"
              border="1px solid rgba(255, 255, 255, 0.08)"
              borderRadius="14px"
              p="3.5"
              fontSize="sm"
              color="#f4f4f7"
              _placeholder={{ color: "#52525b" }}
              _hover={{ borderColor: "rgba(255, 255, 255, 0.16)" }}
              _focus={{ borderColor: "#8b5cf6", outline: "none", boxShadow: "0 0 0 1px #8b5cf6" }}
            />
          </Box>

          {/* Genre de voix (Uniquement si chanté) */}
          {!instrumental && (
            <Box>
              <Text fontSize="sm" fontWeight="600" color="#f4f4f7" mb="2">
                Genre de voix (Vocal Gender)
              </Text>
              <HStack gap="2">
                {[
                  { id: "auto", label: "Automatique" },
                  { id: "f", label: "Voix féminine" },
                  { id: "m", label: "Voix masculine" },
                ].map((vg) => (
                  <Button
                    key={vg.id}
                    size="sm"
                    flex="1"
                    bg={vocalGender === vg.id ? "#8b5cf6" : "#14141c"}
                    color={vocalGender === vg.id ? "#ffffff" : "#a1a1aa"}
                    border="1px solid"
                    borderColor={vocalGender === vg.id ? "#8b5cf6" : "rgba(255, 255, 255, 0.08)"}
                    borderRadius="10px"
                    onClick={() => setVocalGender(vg.id)}
                    _hover={{ bg: vocalGender === vg.id ? "#7c3aed" : "#1e1e2b", color: "#fff" }}
                  >
                    {vg.label}
                  </Button>
                ))}
              </HStack>
            </Box>
          )}

          {/* Negative Tags (Styles à exclure) */}
          <Box>
            <Flex justify="space-between" align="center" mb="2">
              <Text fontSize="sm" fontWeight="600" color="#f4f4f7">
                Styles à exclure (Negative Tags)
              </Text>
              <Text fontSize="xs" color="#71717a">
                {negativeTags.length}/1000
              </Text>
            </Flex>
            <Input
              value={negativeTags}
              onChange={(e) => setNegativeTags(e.target.value.slice(0, 1000))}
              placeholder="Ex: low quality, distorted, scream, noisy, mumble"
              bg="#14141c"
              border="1px solid rgba(255, 255, 255, 0.08)"
              borderRadius="14px"
              h="46px"
              px="3.5"
              fontSize="sm"
              color="#f4f4f7"
              _placeholder={{ color: "#52525b" }}
              _hover={{ borderColor: "rgba(255, 255, 255, 0.16)" }}
              _focus={{ borderColor: "#8b5cf6", outline: "none", boxShadow: "0 0 0 1px #8b5cf6" }}
            />
          </Box>

          {/* Durée en secondes (10 à 360) */}
          <Box>
            <Flex justify="space-between" align="center" mb="2">
              <Text fontSize="sm" fontWeight="600" color="#f4f4f7">
                Durée de la chanson
              </Text>
              <Text fontSize="xs" fontWeight="700" color="#8b5cf6">
                {duration}s ({Math.floor(duration / 60)}m{duration % 60 ? ` ${duration % 60}s` : ""})
              </Text>
            </Flex>
            <input
              type="range"
              min="10"
              max="360"
              step="5"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              style={{
                width: "100%",
                accentColor: "#8b5cf6",
                cursor: "pointer",
              }}
            />
          </Box>
        </Stack>
      )}

      {/* Message d'erreur de téléversement si existant */}
      {uploadError && (
        <Flex align="center" gap="2" p="3" mt="4" bg="rgba(239, 68, 68, 0.1)" border="1px solid rgba(239, 68, 68, 0.3)" borderRadius="10px">
          <LuAlertCircle color="#ef4444" size={16} />
          <Text fontSize="xs" color="#ef4444">{uploadError}</Text>
        </Flex>
      )}

      {/* ======================================================== */}
      {/* 4. BANNIÈRE D'ERREUR RÉELLE & REMBOURSEMENT */}
      {/* ======================================================== */}
      {status === "error" && (
        <Box p="4" mt="5" bg="rgba(239, 68, 68, 0.12)" border="1px solid rgba(239, 68, 68, 0.4)" borderRadius="14px">
          <Flex align="start" gap="3">
            <LuAlertCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: "2px" }} />
            <Box>
              <Text fontSize="sm" fontWeight="700" color="#ef4444">
                La génération n'a pas pu aboutir
              </Text>
              <Text fontSize="xs" color="#fca5a5" mt="1">
                {errorMessage}
              </Text>
              {wasRefunded && (
                <Text fontSize="xs" fontWeight="600" color="#34d399" mt="1.5">
                  ✅ Vos {NOTES_PER_SONG} Notes ont été automatiquement remboursées sur votre solde.
                </Text>
              )}
            </Box>
          </Flex>
        </Box>
      )}

      {/* ======================================================== */}
      {/* 5. ÉTAT DE GÉNÉRATION EN DIRECT (PROGRESSION RÉELLE) */}
      {/* ======================================================== */}
      {status === "generating" && (
        <Box p="5" mt="5" bg="#14141c" border="1px solid rgba(139, 92, 246, 0.3)" borderRadius="16px">
          <Flex justify="space-between" align="center" mb="3">
            <HStack gap="2">
              <Spinner size="sm" color="#8b5cf6" />
              <Text fontSize="sm" fontWeight="700" color="#f4f4f7">
                Composition par Suno AI ({model})...
              </Text>
            </HStack>
            <Text fontSize="sm" fontWeight="800" color="#8b5cf6">
              {progress}%
            </Text>
          </Flex>

          {/* Barre de progression */}
          <Box w="100%" h="6px" bg="#22222e" borderRadius="full" overflow="hidden" mb="3">
            <Box
              h="100%"
              w={`${progress}%`}
              bg="linear-gradient(90deg, #8b5cf6 0%, #ec4899 100%)"
              transition="width 0.4s ease"
              borderRadius="full"
            />
          </Box>

          <Text fontSize="xs" color="#a1a1aa">
            {stepLabel || "Veuillez patienter pendant la synthèse studio du morceau..."}
          </Text>
        </Box>
      )}

      {/* ======================================================== */}
      {/* 6. LECTEUR DU MORCEAU TERMINÉ (VRAIE AUDIO SUNO) */}
      {/* ======================================================== */}
      {status === "completed" && generatedTrack && (
        <Box p="5" mt="5" bg="#14141c" border="1px solid rgba(52, 211, 153, 0.4)" borderRadius="18px">
          <audio
            ref={audioRef}
            src={generatedTrack.audioUrl}
            onTimeUpdate={handleAudioTimeUpdate}
            onEnded={() => setIsPlaying(false)}
          />

          <Flex align="center" gap="4" mb="4">
            <Box
              w="70px"
              h="70px"
              borderRadius="12px"
              overflow="hidden"
              flexShrink="0"
              boxShadow="0 4px 15px rgba(0,0,0,0.5)"
              position="relative"
            >
              <Image
                src={generatedTrack.coverUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&h=200&fit=crop"}
                alt={generatedTrack.title}
                w="100%"
                h="100%"
                objectFit="cover"
              />
            </Box>

            <Box flex="1" minW="0">
              <Badge size="xs" colorScheme="green" px="2" py="0.5" borderRadius="4px" mb="1">
                Génération Réussie · {model}
              </Badge>
              <Text fontSize="md" fontWeight="800" color="#ffffff" noOfLines={1}>
                {generatedTrack.title || "Titre Généré"}
              </Text>
              <Text fontSize="xs" color="#a1a1aa" noOfLines={1}>
                {generatedTrack.genre} · {formatSec(audioTotalDuration || generatedTrack.duration)}
              </Text>
            </Box>
          </Flex>

          {/* Timeline slider */}
          <Box mb="3">
            <input
              type="range"
              min="0"
              max={audioTotalDuration || 180}
              step="0.5"
              value={audioCurrentTime}
              onChange={handleSeek}
              style={{
                width: "100%",
                accentColor: "#8b5cf6",
                cursor: "pointer",
              }}
            />
            <Flex justify="space-between" fontSize="10px" color="#71717a" mt="1">
              <Text>{formatSec(audioCurrentTime)}</Text>
              <Text>{formatSec(audioTotalDuration || generatedTrack.duration)}</Text>
            </Flex>
          </Box>

          {/* Boutons d'action audio */}
          <Flex justify="space-between" align="center">
            <HStack gap="3">
              <Button
                size="sm"
                bg="#8b5cf6"
                color="#ffffff"
                borderRadius="full"
                px="4"
                onClick={togglePlayAudio}
                _hover={{ bg: "#7c3aed" }}
              >
                <HStack gap="2">
                  {isPlaying ? <LuPause size={16} /> : <LuPlay size={16} />}
                  <Text>{isPlaying ? "Pause" : "Écouter"}</Text>
                </HStack>
              </Button>

              <Button
                size="sm"
                variant="outline"
                borderColor="rgba(255,255,255,0.15)"
                color="#e4e4e7"
                borderRadius="full"
                onClick={() => downloadTrackAudio(generatedTrack)}
                _hover={{ bg: "#222230" }}
              >
                <HStack gap="1.5">
                  <LuDownload size={14} />
                  <Text fontSize="xs">Télécharger MP3</Text>
                </HStack>
              </Button>
            </HStack>

            <Button
              size="sm"
              variant="ghost"
              color="#a1a1aa"
              onClick={() => {
                setStatus("idle");
                setGeneratedTrack(null);
              }}
              _hover={{ color: "#ffffff" }}
            >
              Nouveau morceau
            </Button>
          </Flex>
        </Box>
      )}

      {/* ======================================================== */}
      {/* 7. BARRE D'ACTION INFÉRIEURE : COÛT & BOUTON GÉNÉRER */}
      {/* ======================================================== */}
      <Box mt="6" pt="5" borderTop="1px solid rgba(255, 255, 255, 0.06)">
        <Flex justify="space-between" align="center" wrap="wrap" gap="3">
          {/* Solde de Notes */}
          <HStack gap="2">
            <LuCoins size={16} color="#8b5cf6" />
            <Text fontSize="xs" color="#a1a1aa">
              Coût : <Text as="span" fontWeight="700" color="#f4f4f7">{NOTES_PER_SONG} Notes</Text>
            </Text>
            <Text fontSize="xs" color="#71717a">·</Text>
            <Text fontSize="xs" color="#a1a1aa">
              Solde : <Text as="span" fontWeight="700" color={notes >= NOTES_PER_SONG ? "#34d399" : "#ef4444"}>{notes} Notes</Text>
            </Text>
            {notes < NOTES_PER_SONG && onOpenRecharge && (
              <Button
                size="xs"
                variant="outline"
                colorScheme="purple"
                fontSize="10px"
                h="22px"
                px="2"
                borderRadius="full"
                onClick={onOpenRecharge}
              >
                Recharger
              </Button>
            )}
          </HStack>

          {/* Bouton de génération principal */}
          <Button
            size="lg"
            bg={notes >= NOTES_PER_SONG ? "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)" : "#272733"}
            color="#ffffff"
            borderRadius="14px"
            px="8"
            h="48px"
            fontWeight="700"
            fontSize="sm"
            onClick={handleGenerate}
            disabled={status === "generating" || isUploading || attachmentsUsed > 10}
            _hover={
              notes >= NOTES_PER_SONG
                ? {
                    bg: "linear-gradient(135deg, #7c3aed 0%, #db2777 100%)",
                    transform: "translateY(-1px)",
                    boxShadow: "0 8px 25px rgba(139, 92, 246, 0.4)",
                  }
                : {}
            }
            _active={{ transform: "translateY(0)" }}
            transition="all 0.2s"
          >
            <HStack gap="2">
              {status === "generating" ? (
                <>
                  <Spinner size="xs" color="#ffffff" />
                  <Text>Composition en cours...</Text>
                </>
              ) : isUploading ? (
                <>
                  <Spinner size="xs" color="#ffffff" />
                  <Text>Téléversement média...</Text>
                </>
              ) : (
                <>
                  <LuSparkles size={16} />
                  <Text>Générer la musique ({NOTES_PER_SONG} Notes)</Text>
                </>
              )}
            </HStack>
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}
