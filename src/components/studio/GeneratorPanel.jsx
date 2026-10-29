"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Avatar, Badge, Box, Button, Flex, HStack, Spinner, Stack, Text,
} from "@chakra-ui/react";

// Services & utilitaires
import { generateMusicWithAI, NOTES_PER_SONG } from "@/services/musicAiApi";

// Constantes partagées
import { OCCASIONS, VOICE_TYPES, MUSIC_STYLES, LANGUAGES } from "./generator/constants";

// Composants de chaque étape
import StepOccasion from "./generator/StepOccasion";
import StepStory    from "./generator/StepStory";
import StepVoice    from "./generator/StepVoice";
import StepStyle    from "./generator/StepStyle";
import StepCover    from "./generator/StepCover";
import StepConfirm  from "./generator/StepConfirm";
import TrackPlayer  from "./generator/TrackPlayer";

const TOTAL_STEPS = 6;

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

  // ── Stepper ──────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(1);

  // ── Étape 1 : Occasion ───────────────────────────────
  const [occasion, setOccasion] = useState(initialData.occasion || "birthday");

  // ── Étape 2 : Histoire & Langue ──────────────────────
  const [story, setStory] = useState(initialData.story || "");
  const [language, setLanguage] = useState(initialData.language || "French");
  const [lyrics, setLyrics] = useState(initialData.customLyrics || initialData.lyrics || "");
  const [showCustomLyrics, setShowCustomLyrics] = useState(false);
  const [customMode, setCustomMode] = useState(false);

  // ── Étape 3 : Voix ───────────────────────────────────
  const [vocalType, setVocalType] = useState(initialData.vocalType || "female");
  const [vocalGender, setVocalGender] = useState("auto");
  const [instrumental, setInstrumental] = useState(false);

  // ── Étape 4 : Style ──────────────────────────────────
  const [musicStyle, setMusicStyle] = useState(initialData.musicStyle || "Afrobeat");

  // ── Étape 5 : Pochette (coverUrl) ────────────────────
  const [coverUrl, setCoverUrl] = useState(initialData.coverUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // ── Étape 6 : Options avancées ───────────────────────
  const [customTitle, setCustomTitle] = useState("");
  const [negativeTags, setNegativeTags] = useState("");
  const [model, setModel] = useState("V6");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isPublicTrack, setIsPublicTrack] = useState(session?.user?.role === "ADMIN");

  // ── Génération ───────────────────────────────────────
  const [status, setStatus] = useState("idle"); // idle | generating | completed | error
  const [progress, setProgress] = useState(0);
  const [stepLabel, setStepLabel] = useState("");
  const [generatedTrack, setGeneratedTrack] = useState(null);
  const [generationError, setGenerationError] = useState("");
  const [wasRefunded, setWasRefunded] = useState(false);

  // Synchronisation avec initialData
  useEffect(() => {
    if (initialData.story) setStory(initialData.story);
    if (initialData.musicStyle) setMusicStyle(initialData.musicStyle);
    if (initialData.occasion) setOccasion(initialData.occasion);
    if (initialData.language) setLanguage(initialData.language);
    if (initialData.coverUrl) setCoverUrl(initialData.coverUrl);
    if (initialData.vocalType) {
      setVocalType(initialData.vocalType);
      if (initialData.vocalType === "instrumental") setInstrumental(true);
    }
  }, [initialData]);

  // ── Navigation du Stepper ────────────────────────────
  const handlePrevStep = () => {
    if (currentStep > 1) setCurrentStep((p) => p - 1);
    else if (onBack) onBack();
    else router.push("/studio");
  };

  const handleNextStep = () => {
    if (currentStep < TOTAL_STEPS) setCurrentStep((p) => p + 1);
  };

  // ── Handlers étape 2 ─────────────────────────────────
  const handleFillSample = () => {
    const samples = {
      birthday: "Chanson joyeuse et dansante pour les 50 ans de ma mère Fatou. Elle est généreuse, adore danser sur l'afrobeat et rassemble toujours toute la famille.",
      love: "Une déclaration d'amour poétique et douce pour Aya. Évoque notre première rencontre sous la pluie et nos projets d'avenir.",
      wedding: "Célébration festive du mariage de Moussa et Mariam, ambiance d'union, d'amour, de danse et de bénédictions.",
      party: "Ambiance de fête explosive du samedi soir entre amis, énergie festive et rythme entraînant qui fait sauter tout le monde.",
    };
    setStory(samples[occasion] || samples.birthday);
  };

  // ── Handlers étape 3 : voix ──────────────────────────
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

  // ── Handlers étape 5 : pochette ──────────────────────
  const handleCoverChange = (url, error = "", uploading = false) => {
    if (url !== null && url !== undefined) setCoverUrl(url);
    setUploadError(error);
    setIsUploading(uploading);
  };

  // ── Lancement de la composition audio Suno ───────────
  const handleStartGeneration = async () => {
    if (notes < NOTES_PER_SONG) {
      if (onOpenRecharge) onOpenRecharge();
      else router.push("/studio/recharge");
      return;
    }

    setStatus("generating");
    setProgress(15);
    setStepLabel("Transmission des consignes créatives au studio IA...");
    setGenerationError("");
    setWasRefunded(false);

    const isCustom = Boolean(customMode || lyrics.trim() || customTitle.trim() || negativeTags.trim());
    const isInst = instrumental || vocalType === "instrumental";
    const finalStyle = musicStyle;
    const finalLyrics = isInst ? "" : lyrics.trim();
    let promptText = story.trim();

    if (!isCustom && language && language !== "English") {
      const langLabel = LANGUAGES.find((l) => l.id === language)?.label || language;
      if (promptText) promptText = `${promptText} (Chanson en ${langLabel.toLowerCase()})`;
    }

    const payload = {
      customMode: isCustom,
      instrumental: isInst,
      model,
      genre: finalStyle,
      style: finalStyle,
      description: promptText,
      story: promptText,
      prompt: isCustom ? (finalLyrics || promptText) : promptText,
      lyrics: finalLyrics,
      customLyrics: finalLyrics,
      vocalType,
      occasion,
      language,
      coverUrl: coverUrl ? coverUrl.trim() : undefined,
      isPublic: isPublicTrack,
    };

    if (isCustom) {
      if (customTitle.trim()) payload.title = customTitle.trim();
      if (negativeTags.trim()) payload.negativeTags = negativeTags.trim();
      if (vocalGender && vocalGender !== "auto" && !isInst) payload.vocalGender = vocalGender;
      payload.duration = 180;
    } else {
      payload.imageUrls = [];
      payload.videoUrls = [];
      payload.audioUrls = [];
    }

    try {
      const result = await generateMusicWithAI(payload, (p, label) => {
        setProgress(p);
        setStepLabel(label);
      });

      if (onDeductNotes) onDeductNotes(NOTES_PER_SONG);

      // Priorité stricte : si l'utilisateur a uploadé une pochette, la conserver
      const enrichedResult = result
        ? { ...result, coverUrl: coverUrl || result.coverUrl || undefined }
        : result;

      setGeneratedTrack(enrichedResult);
      setStatus("completed");

      if (onTrackCreated) onTrackCreated(enrichedResult);
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
        setGenerationError(err?.message || "La composition audio n'a pas pu aboutir. Vos 2 Notes ont été remboursées.");
      }
    }
  };

  const handleResetWizard = () => {
    setStatus("idle");
    setCurrentStep(1);
    setGeneratedTrack(null);
    setGenerationError("");
  };

  const selectedOccasionData = OCCASIONS.find((o) => o.id === occasion) || OCCASIONS[0];
  const selectedVoiceData    = VOICE_TYPES.find((v) => v.id === vocalType) || VOICE_TYPES[0];

  return (
    <Box
      minH="100dvh" bg="#fcfcfd" color="slate.900"
      display="flex" flexDirection="column" position="relative"
    >
      {/* ── EN-TÊTE STICKY LIGHT PUR & MINIMALISTE ── */}
      <Box
        as="header"
        h={{ base: "14", md: "16" }}
        px={{ base: "4", md: "8" }}
        borderBottomWidth="1px" borderColor="slate.200"
        bg="rgba(255,255,255,0.95)" backdropFilter="blur(16px)"
        position="sticky" top="0" zIndex="30"
      >
        <Flex h="full" align="center" justify="space-between">
          {/* Gauche : Retour simple et lisible */}
          <HStack gap="2">
            <Button
              size="xs" variant="ghost" rounded="full" color="slate.700"
              _hover={{ bg: "slate.100" }} onClick={handlePrevStep}
              px="2.5" fontWeight="600"
            >
              ← Retour
            </Button>
            <Button
              size="xs" variant="ghost" rounded="full" color="slate.500"
              _hover={{ bg: "slate.100", color: "slate.900" }}
              onClick={() => router.push("/studio")}
            >
              Studio
            </Button>
          </HStack>

          {/* Centre : Stepper indicateurs épurés */}
          <HStack gap="2">
            {[1, 2, 3, 4, 5, 6].map((n) => {
              const isActive = currentStep === n;
              const isPast   = currentStep > n;
              return (
                <Box
                  key={n} as="button" type="button"
                  h="6px" w={isActive ? "28px" : "8px"} rounded="full"
                  bg={isActive ? "purple.600" : isPast ? "purple.300" : "slate.200"}
                  transition="all 0.25s ease"
                  cursor={n <= currentStep ? "pointer" : "default"}
                  onClick={() => { if (status === "idle" && n < currentStep) setCurrentStep(n); }}
                  aria-label={`Étape ${n}`}
                />
              );
            })}
          </HStack>

          {/* Droite : Solde de Notes & Profil */}
          <HStack gap="3">
            <Button
              size="xs" rounded="full" variant="outline"
              borderColor="purple.300" color="purple.800" bg="purple.50"
              onClick={onOpenRecharge || (() => router.push("/studio/recharge"))}
              fontWeight="700" fontSize="2xs" px="3"
            >
              {notes} Notes +
            </Button>
            <Box
              as="button" type="button" onClick={() => router.push("/studio/profil")}
              rounded="full" p="0.5" borderWidth="1.5px" borderColor="slate.200"
              _hover={{ borderColor: "purple.500" }}
              transition="all 0.2s" cursor="pointer"
            >
              <Avatar.Root size="xs">
                <Avatar.Image
                  src={session?.user?.image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"}
                  alt={session?.user?.name || "Profil"}
                  referrerPolicy="no-referrer"
                />
                <Avatar.Fallback name={session?.user?.name || "Pretymelo"} />
              </Avatar.Root>
            </Box>
          </HStack>
        </Flex>
      </Box>

      {/* ── ZONE DE CONTENU CENTRALE ── */}
      <Flex flex="1" align="center" justify="center" p={{ base: "4", sm: "6", md: "8" }}>
        <Box
          w="full"
          maxW={status === "completed" ? { base: "580px", lg: "1020px" } : "580px"}
          my="auto"
          transition="max-width 0.3s ease"
        >
          {/* ÉTAPE 1 : OCCASION */}
          {status === "idle" && currentStep === 1 && (
            <StepOccasion occasion={occasion} onSelect={setOccasion} onNext={handleNextStep} />
          )}

          {/* ÉTAPE 2 : HISTOIRE & PAROLES */}
          {status === "idle" && currentStep === 2 && (
            <StepStory
              story={story} onStoryChange={setStory}
              language={language} onLanguageChange={setLanguage}
              lyrics={lyrics} onLyricsChange={setLyrics}
              showCustomLyrics={showCustomLyrics} onToggleCustomLyrics={setShowCustomLyrics}
              customMode={customMode} onCustomModeChange={setCustomMode}
              occasion={occasion} onFillSample={handleFillSample}
              onNext={handleNextStep}
            />
          )}

          {/* ÉTAPE 3 : TYPE DE VOIX */}
          {status === "idle" && currentStep === 3 && (
            <StepVoice vocalType={vocalType} onSelect={handleSelectVoice} onNext={handleNextStep} />
          )}

          {/* ÉTAPE 4 : STYLE MUSICAL */}
          {status === "idle" && currentStep === 4 && (
            <StepStyle
              musicStyle={musicStyle}
              onSelect={(s) => setMusicStyle(s.id)}
              onNext={handleNextStep}
            />
          )}

          {/* ÉTAPE 5 : IMAGE DE COUVERTURE (COVER) */}
          {status === "idle" && currentStep === 5 && (
            <StepCover
              coverUrl={coverUrl}
              onCoverChange={handleCoverChange}
              isUploading={isUploading}
              uploadError={uploadError}
              onNext={handleNextStep}
              onSkip={handleNextStep}
            />
          )}

          {/* ÉTAPE 6 : RÉCAPITULATIF & CONFIRMATION */}
          {status === "idle" && currentStep === 6 && (
            <StepConfirm
              selectedOccasionData={selectedOccasionData}
              selectedVoiceData={selectedVoiceData}
              musicStyle={musicStyle}
              language={language}
              coverUrl={coverUrl}
              story={story}
              lyrics={lyrics}
              customTitle={customTitle} onCustomTitleChange={(v) => { setCustomTitle(v); if (v.trim()) setCustomMode(true); }}
              negativeTags={negativeTags} onNegativeTagsChange={(v) => { setNegativeTags(v); if (v.trim()) setCustomMode(true); }}
              model={model} onModelChange={setModel}
              vocalGender={vocalGender}
              instrumental={instrumental}
              isPublicTrack={isPublicTrack} onTogglePublic={() => setIsPublicTrack(!isPublicTrack)}
              notes={notes}
              notesPerSong={NOTES_PER_SONG}
              onLaunch={handleStartGeneration}
              onOpenRecharge={onOpenRecharge || (() => router.push("/studio/recharge"))}
              customMode={customMode}
              isAdvancedOpen={isAdvancedOpen} onToggleAdvanced={() => setIsAdvancedOpen(!isAdvancedOpen)}
            />
          )}

          {/* ÉTAT : GÉNÉRATION EN DIRECT */}
          {status === "generating" && (
            <Stack gap="6" textAlign="center" py="10" maxW="440px" mx="auto">
              <Flex
                boxSize="20" rounded="full" bg="purple.50"
                borderWidth="2px" borderColor="purple.200"
                align="center" justify="center" mx="auto"
              >
                <Spinner size="lg" color="purple.600" />
              </Flex>
              <Stack gap="1.5">
                <Text fontFamily="heading" fontWeight="800" fontSize="2xl" color="slate.900">
                  Composition de votre titre...
                </Text>
                <Text fontSize="xs" color="slate.500">{stepLabel}</Text>
              </Stack>
              <Box w="full">
                <Box h="2.5" rounded="full" bg="slate.100" overflow="hidden">
                  <Box h="full" w={`${progress}%`} bg="purple.600" rounded="full" transition="width 0.4s ease" />
                </Box>
                <Flex justify="space-between" mt="1.5" fontSize="2xs" color="slate.400" fontFamily="mono">
                  <Text>Studio Suno {model}</Text>
                  <Text fontWeight="700">{progress}%</Text>
                </Flex>
              </Box>
              <Text fontSize="2xs" color="slate.400">
                La composition et le rendu audio HD sont réalisés en direct. Veuillez patienter...
              </Text>
            </Stack>
          )}

          {/* ÉTAT : ERREUR */}
          {status === "error" && (
            <Stack gap="5" textAlign="center" py="6" maxW="480px" mx="auto">
              <Box p="6" rounded="3xl" bg="white" borderWidth="1.5px" borderColor="rose.300" boxShadow="0 8px 24px rgba(244,63,94,0.08)">
                <Text fontFamily="heading" fontWeight="800" fontSize="lg" color="rose.700" mb="2">
                  Composition non aboutie
                </Text>
                <Text fontSize="xs" color="slate.600" mb="4" lineHeight="relaxed">
                  {generationError || "Une erreur est survenue lors de la communication avec le moteur audio."}
                </Text>
                {wasRefunded && (
                  <Box p="3" rounded="xl" bg="emerald.50" borderWidth="1px" borderColor="emerald.200" mb="4">
                    <Text fontSize="2xs" color="emerald.800" fontWeight="700">
                      Vos 2 Notes n&apos;ont pas été débitées (solde sécurisé).
                    </Text>
                  </Box>
                )}
                <HStack justify="center" gap="3">
                  <Button
                    size="sm" rounded="full" bg="purple.600" color="white"
                    onClick={() => { setStatus("idle"); setCurrentStep(5); }}
                    _hover={{ bg: "purple.700" }}
                  >
                    Modifier et réessayer
                  </Button>
                  <Button
                    size="sm" variant="outline" rounded="full" borderColor="slate.300"
                    onClick={handleResetWizard}
                  >
                    Recommencer
                  </Button>
                </HStack>
              </Box>
            </Stack>
          )}

          {/* ÉTAT : MORCEAU FINALISÉ → TRACKPLAYER */}
          {status === "completed" && generatedTrack && (
            <TrackPlayer
              track={generatedTrack}
              musicStyle={musicStyle}
              selectedVoiceData={selectedVoiceData}
              model={model}
              lyrics={lyrics}
              customTitle={customTitle}
              onReset={handleResetWizard}
              onToggleFavorite={onToggleFavorite}
              onTogglePublic={onTogglePublic}
            />
          )}
        </Box>
      </Flex>
    </Box>
  );
}
