"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Avatar, Badge, Box, Button, Flex, HStack, IconButton, Spinner, Stack, Text,
} from "@chakra-ui/react";
import { LuArrowLeft, LuHouse, LuPlus, LuShieldAlert, LuRotateCcw, LuZap } from "react-icons/lu";

// Services & utilitaires
import { generateMusicWithAI, NOTES_PER_SONG } from "@/services/musicAiApi";
import { accent } from "@/theme/system";

// Constantes partagées
import { OCCASIONS, VOICE_TYPES, MUSIC_STYLES } from "./generator/constants";

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
  const [occasion, setOccasion]   = useState(initialData.occasion || "birthday");

  // ── Étape 2 : Histoire & Langue ──────────────────────
  const [story, setStory]         = useState(initialData.story || "");
  const [language, setLanguage]   = useState(initialData.language || "French");
  const [lyrics, setLyrics]       = useState(initialData.customLyrics || initialData.lyrics || "");
  const [showCustomLyrics, setShowCustomLyrics] = useState(false);
  const [customMode, setCustomMode] = useState(false);

  // ── Étape 3 : Voix ───────────────────────────────────
  const [vocalType, setVocalType]   = useState(initialData.vocalType || "female");
  const [vocalGender, setVocalGender] = useState("auto");
  const [instrumental, setInstrumental] = useState(false);

  // ── Étape 4 : Style ──────────────────────────────────
  const [musicStyle, setMusicStyle] = useState(initialData.musicStyle || "Afrobeat");

  // ── Étape 5 : Pochette ───────────────────────────────
  const [coverUrl, setCoverUrl]     = useState(initialData.coverUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // ── Étape 6 : Options avancées ───────────────────────
  const [customTitle, setCustomTitle]   = useState("");
  const [negativeTags, setNegativeTags] = useState("");
  const [model, setModel]               = useState("V6");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isPublicTrack, setIsPublicTrack]   = useState(session?.user?.role === "ADMIN");

  // ── Génération ───────────────────────────────────────
  const [status, setStatus]           = useState("idle"); // idle | generating | completed | error
  const [progress, setProgress]       = useState(0);
  const [stepLabel, setStepLabel]     = useState("");
  const [generatedTrack, setGeneratedTrack] = useState(null);
  const [generationError, setGenerationError] = useState("");
  const [wasRefunded, setWasRefunded] = useState(false);

  // Sync initialData
  useEffect(() => {
    if (initialData.story)     setStory(initialData.story);
    if (initialData.musicStyle) setMusicStyle(initialData.musicStyle);
    if (initialData.occasion)   setOccasion(initialData.occasion);
    if (initialData.language)   setLanguage(initialData.language);
    if (initialData.coverUrl)   setCoverUrl(initialData.coverUrl);
    if (initialData.vocalType) {
      setVocalType(initialData.vocalType);
      if (initialData.vocalType === "instrumental") setInstrumental(true);
    }
  }, [initialData]);

  // ── Navigation Stepper ───────────────────────────────
  const handlePrevStep = () => {
    if (currentStep > 1) setCurrentStep((p) => p - 1);
    else if (onBack)     onBack();
    else                 router.push("/studio");
  };
  const handleNextStep = () => {
    if (currentStep < TOTAL_STEPS) setCurrentStep((p) => p + 1);
  };

  // ── Handlers step 1 ──────────────────────────────────
  const handleFillSample = () => {
    const occ = OCCASIONS.find((o) => o.id === occasion) || OCCASIONS[0];
    setStory(occ.sample);
  };

  // ── Handlers step 3 ──────────────────────────────────
  const handleSelectVoice = (v) => {
    setVocalType(v.id);
    if (v.isInstrumental) { setInstrumental(true); setVocalGender("auto"); }
    else { setInstrumental(false); setVocalGender(v.gender || "auto"); }
  };

  // ── Handlers step 5 : cover ──────────────────────────
  const handleCoverChange = (url, error = "", uploading = false) => {
    if (url !== null) setCoverUrl(url);
    setUploadError(error);
    setIsUploading(uploading);
  };

  // ── Lancement de la génération ───────────────────────
  const handleStartGeneration = async () => {
    setGenerationError("");
    setWasRefunded(false);

    if (!session?.user?.id) { router.push("/auth/signin"); return; }
    if (notes < NOTES_PER_SONG) {
      if (onOpenRecharge) onOpenRecharge();
      else router.push("/studio/recharge");
      return;
    }

    setStatus("generating");
    setProgress(15);
    setStepLabel("Transmission des consignes créatives à Suno AI...");

    const finalStyle = musicStyle || "Afrobeat";
    const isInst = instrumental || vocalType === "instrumental";
    const finalLyrics = lyrics.trim();
    const isCustom = Boolean(customMode || finalLyrics || customTitle.trim() || negativeTags.trim());

    const { LANGUAGES } = await import("./generator/constants");
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
      coverUrl: coverUrl || undefined,
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

      // Priorité : coverUrl uploadée > coverUrl retournée par Suno
      const enrichedResult = result
        ? { ...result, coverUrl: result.coverUrl || coverUrl || undefined }
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

  // ── Rendu ────────────────────────────────────────────
  return (
    <Box
      minH="100dvh" bg="paper.50" color="ink.900"
      display="flex" flexDirection="column" position="relative"
      style={{ background: "radial-gradient(ellipse 90% 50% at 50% 0%, rgba(124,58,237,0.05) 0%, #fafafa 75%)" }}
    >
      {/* ── EN-TÊTE STICKY ─────────────────────────────── */}
      <Box
        as="header"
        h={{ base: "14", md: "16" }}
        px={{ base: "4", md: "8" }}
        borderBottomWidth="1px" borderColor="paper.200"
        bg="rgba(255,255,255,0.92)" backdropFilter="blur(16px)"
        position="sticky" top="0" zIndex="30"
      >
        <Flex h="full" align="center" justify="space-between">
          {/* Gauche : retour */}
          <HStack gap="1.5">
            <IconButton size="sm" variant="ghost" rounded="full" color="ink.600"
              _hover={{ bg: "paper.200", color: "ink.900" }}
              onClick={handlePrevStep} aria-label="Retour">
              <LuArrowLeft size={18} />
            </IconButton>
            <IconButton size="sm" variant="ghost" rounded="full" color="ink.600"
              _hover={{ bg: "paper.200", color: "ink.900" }}
              onClick={() => router.push("/studio")} aria-label="Accueil studio">
              <LuHouse size={18} />
            </IconButton>
          </HStack>

          {/* Centre : stepper pilules */}
          <HStack gap="2">
            {[1, 2, 3, 4, 5, 6].map((n) => {
              const isActive = currentStep === n;
              const isPast   = currentStep > n;
              return (
                <Box key={n} as="button" type="button"
                  h="5px" w={isActive ? "28px" : "6px"} rounded="full"
                  bg={isActive || isPast ? "brand.violetDeep" : "paper.300"}
                  boxShadow={isActive ? "0 0 10px rgba(124,58,237,0.4)" : "none"}
                  transition="all 0.3s cubic-bezier(0.4,0,0.2,1)"
                  cursor={n <= currentStep ? "pointer" : "default"}
                  onClick={() => { if (status === "idle" && n < currentStep) setCurrentStep(n); }}
                  aria-label={`Étape ${n}`}
                />
              );
            })}
          </HStack>

          {/* Droite : notes + avatar */}
          <HStack gap="2.5">
            <Button size="xs" rounded="full" variant="outline"
              borderColor="brand.violet" color="brand.violetDeep" bg="brand.violetTint"
              onClick={onOpenRecharge || (() => router.push("/studio/recharge"))}
              fontFamily="ui" fontWeight="700" fontSize="2xs" px="2.5">
              🎵 {notes} Notes <LuPlus size={11} style={{ marginLeft: "2px" }} />
            </Button>
            <Box as="button" type="button" onClick={() => router.push("/studio/profil")}
              rounded="full" p="0.5" borderWidth="1.5px" borderColor="paper.200"
              boxShadow="0 2px 8px rgba(0,0,0,0.06)"
              _hover={{ borderColor: "brand.violetDeep", transform: "scale(1.05)" }}
              _active={{ transform: "scale(0.95)" }}
              transition="all 0.2s" cursor="pointer"
              display="flex" alignItems="center" justifyContent="center">
              <Avatar.Root size="xs">
                <Avatar.Image
                  src={session?.user?.image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"}
                  alt={session?.user?.name || "Profil"}
                  referrerPolicy="no-referrer"
                />
                <Avatar.Fallback name={session?.user?.name || "Créateur pretymelo"} />
              </Avatar.Root>
            </Box>
          </HStack>
        </Flex>
      </Box>

      {/* ── ZONE PRINCIPALE ────────────────────────────── */}
      <Flex flex="1" align="center" justify="center" p={{ base: "4", sm: "6", md: "8" }}>
        <Box
          w="full"
          maxW={status === "completed" ? { base: "580px", lg: "1020px" } : "580px"}
          my="auto"
          transition="max-width 0.3s ease"
        >
          {/* ÉTAPE 1 */}
          {status === "idle" && currentStep === 1 && (
            <StepOccasion occasion={occasion} onSelect={setOccasion} onNext={handleNextStep} />
          )}

          {/* ÉTAPE 2 */}
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

          {/* ÉTAPE 3 */}
          {status === "idle" && currentStep === 3 && (
            <StepVoice vocalType={vocalType} onSelect={handleSelectVoice} onNext={handleNextStep} />
          )}

          {/* ÉTAPE 4 */}
          {status === "idle" && currentStep === 4 && (
            <StepStyle
              musicStyle={musicStyle}
              onSelect={(s) => setMusicStyle(s.id)}
              onNext={handleNextStep}
            />
          )}

          {/* ÉTAPE 5 */}
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

          {/* ÉTAPE 6 */}
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

          {/* GÉNÉRATION EN COURS */}
          {status === "generating" && (
            <Stack gap="6" textAlign="center" py="8" maxW="440px" mx="auto">
              <Box
                boxSize="24" rounded="full" bg="brand.violetTint"
                display="flex" alignItems="center" justifyContent="center"
                mx="auto" position="relative">
                <HStack gap="1.5" align="flex-end" h="28px">
                  {[14, 24, 18, 28, 16].map((h, i) => (
                    <Box key={i} w="3.5px" h={`${h}px`} rounded="full" bg="brand.violetDeep"
                      style={{
                        animation: `wave ${0.6 + i * 0.15}s ease-in-out infinite alternate`,
                        transformOrigin: "bottom",
                      }} />
                  ))}
                </HStack>
              </Box>
              <Stack gap="1.5">
                <Text fontFamily="heading" fontWeight="900" fontSize="2xl" color="ink.900">
                  pretymelo compose votre titre...
                </Text>
                <Text fontSize="xs" color="ink.500">{stepLabel}</Text>
              </Stack>
              <Box w="full">
                <Box h="2.5" rounded="full" bg="paper.200" overflow="hidden">
                  <Box h="full" w={`${progress}%`} bg={accent.primary} rounded="full" transition="width 0.4s ease" />
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

          {/* ERREUR */}
          {status === "error" && (
            <Stack gap="5" textAlign="center" py="6" maxW="480px" mx="auto">
              <Box p="6" rounded="3xl" bg="paper.0" borderWidth="1.5px" borderColor="red.300"
                boxShadow="0 10px 30px rgba(239,68,68,0.1)">
                <Box boxSize="12" rounded="full" bg="red.50" color="red.500"
                  display="flex" alignItems="center" justifyContent="center" mx="auto" mb="3">
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
                  <Button size="sm" rounded="full" bg="brand.violetDeep" color="white"
                    onClick={() => { setStatus("idle"); setCurrentStep(5); }}
                    _hover={{ bg: "brand.violet" }}>
                    Modifier et réessayer
                  </Button>
                  <Button size="sm" variant="outline" rounded="full" borderColor="paper.300"
                    onClick={handleResetWizard}>
                    Recommencer
                  </Button>
                </HStack>
              </Box>
            </Stack>
          )}

          {/* RÉSULTAT — TrackPlayer */}
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
