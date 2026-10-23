"use client";

import { useEffect, useRef, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  LuArrowDown,
  LuArrowLeft,
  LuCompass,
  LuFileText,
  LuHeart,
  LuMusic,
  LuPause,
  LuPlay,
  LuRepeat,
  LuSearch,
  LuShare2,
  LuSkipBack,
  LuSkipForward,
  LuSparkles,
  LuVolume2,
  LuVolumeX,
  LuWandSparkles,
  LuX,
} from "react-icons/lu";

import { explorerTracks } from "@/data/explorerTracks";
import { api } from "@/lib/apiClient";
import { accent } from "@/theme/system";
import Logo from "../common/Logo";

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

// Synthétiseur d'ambiance Web Audio natif + lecteur Audio HTML5 pour donner vie aux morceaux en direct
class AmbientAudioEngine {
  constructor() {
    this.ctx = null;
    this.osc1 = null;
    this.osc2 = null;
    this.gain = null;
    this.filter = null;
    this.lfo = null;
    this.lfoGain = null;
    this.htmlAudio = null;
  }

  init() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  playTrack(genre = "Afrobeat", volume = 80, isMuted = false, audioUrl = null) {
    this.stop();

    // Si une URL audio réelle est fournie (ex: MP3 généré ou stocké)
    if (audioUrl && typeof window !== "undefined") {
      try {
        if (!this.htmlAudio) {
          this.htmlAudio = new Audio();
        }
        this.htmlAudio.src = audioUrl;
        this.htmlAudio.volume = isMuted ? 0 : Math.min(1, volume / 100);
        const playPromise = this.htmlAudio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // En cas d'erreur de lecture média, basculer sur le synthé d'ambiance
            this.playSynthTrack(genre, volume, isMuted);
          });
        }
        return;
      } catch (_) {}
    }

    this.playSynthTrack(genre, volume, isMuted);
  }

  playSynthTrack(genre = "Afrobeat", volume = 80, isMuted = false) {
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      this.gain = this.ctx.createGain();
      const targetVol = isMuted ? 0 : (volume / 100) * 0.12;
      this.gain.gain.setValueAtTime(0.001, now);
      this.gain.gain.exponentialRampToValueAtTime(Math.max(0.001, targetVol), now + 0.3);

      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = "lowpass";
      this.filter.frequency.setValueAtTime(genre.includes("Synthwave") ? 1400 : 900, now);

      // Fréquences harmonieuses selon l'ambiance
      let freq1 = 220; // La3 (Afrobeat)
      let freq2 = 330; // Mi4
      let type1 = "triangle";
      let type2 = "sine";

      if (genre.includes("Synthwave")) {
        freq1 = 146.83; // Ré3
        freq2 = 220;    // La3
        type1 = "sawtooth";
        type2 = "triangle";
      } else if (genre.includes("Acoustique")) {
        freq1 = 196;    // Sol3
        freq2 = 293.66; // Ré4
        type1 = "sine";
        type2 = "triangle";
      } else if (genre.includes("Pop")) {
        freq1 = 261.63; // Do4
        freq2 = 392;    // Sol4
        type1 = "triangle";
        type2 = "sine";
      }

      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = type1;
      this.osc1.frequency.setValueAtTime(freq1, now);

      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = type2;
      this.osc2.frequency.setValueAtTime(freq2, now);

      // LFO pour créer une pulsation musicale douce
      this.lfo = this.ctx.createOscillator();
      this.lfo.frequency.setValueAtTime(genre.includes("Afrobeat") ? 2 : 1.2, now);
      this.lfoGain = this.ctx.createGain();
      this.lfoGain.gain.setValueAtTime(150, now);
      this.lfo.connect(this.lfoGain);
      this.lfoGain.connect(this.filter.frequency);

      this.osc1.connect(this.filter);
      this.osc2.connect(this.filter);
      this.filter.connect(this.gain);
      this.gain.connect(this.ctx.destination);

      this.osc1.start(now);
      this.osc2.start(now);
      this.lfo.start(now);
    } catch (_) {}
  }

  setVolume(volume = 80, isMuted = false) {
    if (this.htmlAudio) {
      try {
        this.htmlAudio.volume = isMuted ? 0 : Math.min(1, volume / 100);
      } catch (_) {}
    }

    if (!this.gain || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const targetVol = isMuted ? 0 : (volume / 100) * 0.12;
      this.gain.gain.setValueAtTime(this.gain.gain.value, now);
      this.gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, targetVol), now + 0.1);
    } catch (_) {}
  }

  stop() {
    if (this.htmlAudio) {
      try {
        this.htmlAudio.pause();
        this.htmlAudio.currentTime = 0;
      } catch (_) {}
    }

    try {
      if (this.osc1) {
        this.osc1.stop();
        this.osc1.disconnect();
        this.osc1 = null;
      }
      if (this.osc2) {
        this.osc2.stop();
        this.osc2.disconnect();
        this.osc2 = null;
      }
      if (this.lfo) {
        this.lfo.stop();
        this.lfo.disconnect();
        this.lfo = null;
      }
    } catch (_) {}
  }
}

const audioPlayer = new AmbientAudioEngine();

export default function ExplorerView() {
  const router = useRouter();
  const [tracks, setTracks] = useState(explorerTracks);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showLyrics, setShowLyrics] = useState(true); // Ouvert par défaut sur grand écran, adaptatif
  const [showSearchMobile, setShowSearchMobile] = useState(false);
  const [search, setSearch] = useState("");
  const [volume, setVolume] = useState(80);
  const [muted, setMuted] = useState(false);
  const [copyNotification, setCopyNotification] = useState("");
  const [isLooping, setIsLooping] = useState(false);
  const [heartBurst, setHeartBurst] = useState(false);
  const [isDraggingSeek, setIsDraggingSeek] = useState(false);

  const timerRef = useRef(null);
  const lyricsContainerRef = useRef(null);
  const activeLyricRef = useRef(null);
  const mobileLyricsContainerRef = useRef(null);
  const mobileActiveLyricRef = useRef(null);
  const touchStartY = useRef(0);
  const lastWheelTime = useRef(0);
  const lastCoverTap = useRef(0);

  // Détecter la largeur d'écran initiale pour le panneau de paroles
  useEffect(() => {
    if (typeof window !== "undefined") {
      setShowLyrics(window.innerWidth >= 1024);
    }
  }, []);

  // Synchronisation des pistes publiques réelles depuis la base de données
  useEffect(() => {
    let isMounted = true;
    api.get("/api/tracks?public=true")
      .then((res) => {
        if (!isMounted || !res?.data || res.data.length === 0) return;
        const dbTracks = res.data.map((t) => ({
          id: t.id,
          title: t.title,
          subtitle: t.prompt || `${t.genre || "Afrobeat"} composé par IA`,
          genre: t.genre || "Afrobeat",
          creator: t.user?.name || "Artiste melostars",
          duration: t.duration || 120,
          cover: t.coverUrl || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&fit=crop",
          audioUrl: t.audioUrl || null,
          accentColor: "#7c3aed",
          likes: 38,
          shares: 7,
          lyrics: t.lyrics
            ? t.lyrics.split("\n").filter(Boolean).map((line, idx) => ({
                id: idx + 1,
                time: idx * 5,
                text: line,
              }))
            : [
                { id: 1, time: 0, text: "♪ Mélodie composée par IA melostars ♪" },
                { id: 2, time: 6, text: t.prompt || "Harmonies vocales et rythmes captivants" },
              ],
        }));

        setTracks((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newUnique = dbTracks.filter((d) => !existingIds.has(d.id));
          return [...newUnique, ...prev];
        });
      })
      .catch((err) => {
        console.warn("[ExplorerView] Impossible de charger les pistes publiques:", err.message);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Morceaux filtrés selon recherche
  const filteredTracks = tracks.filter((t) => {
    return (
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.genre.toLowerCase().includes(search.toLowerCase()) ||
      t.creator.toLowerCase().includes(search.toLowerCase()) ||
      t.subtitle.toLowerCase().includes(search.toLowerCase())
    );
  });

  const currentTrack = filteredTracks[currentIndex] || tracks[0];
  const totalDuration = currentTrack?.duration || 135;
  const currentAccent = currentTrack?.accentColor || "#f97316";

  // Réinitialiser le temps quand le morceau change
  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(true);
  }, [currentIndex, currentTrack?.id]);

  // Synchronisation du moteur audio (Audio HTML5 ou Synthé Web Audio)
  useEffect(() => {
    if (isPlaying && currentTrack) {
      audioPlayer.playTrack(currentTrack.genre, volume, muted, currentTrack.audioUrl);
    } else {
      audioPlayer.stop();
    }
    return () => audioPlayer.stop();
  }, [isPlaying, currentIndex, currentTrack?.id, currentTrack?.audioUrl]);

  useEffect(() => {
    audioPlayer.setVolume(volume, muted);
  }, [volume, muted]);

  // Défilement du chrono de lecture et auto-scroll à la fin du morceau
  useEffect(() => {
    if (!isPlaying || isDraggingSeek) {
      clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= totalDuration) {
          if (isLooping) return 0;

          if (autoScroll) {
            // Auto-défilement instantané vers le morceau suivant
            goToNextTrack();
            return 0;
          } else {
            setIsPlaying(false);
            return totalDuration;
          }
        }
        return prev + 0.25;
      });
    }, 250);

    return () => clearInterval(timerRef.current);
  }, [isPlaying, totalDuration, autoScroll, isLooping, currentIndex, filteredTracks.length, isDraggingSeek]);

  // Auto-centrage des paroles synchronisées sur la strophe active (Desktop & Mobile)
  useEffect(() => {
    if (activeLyricRef.current && lyricsContainerRef.current) {
      activeLyricRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (mobileActiveLyricRef.current && mobileLyricsContainerRef.current) {
      mobileActiveLyricRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentTime]);

  const goToNextTrack = () => {
    if (filteredTracks.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % filteredTracks.length);
  };

  const goToPrevTrack = () => {
    if (filteredTracks.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + filteredTracks.length) % filteredTracks.length);
  };

  // Gestion des gestes tactiles (Swipe UP / Swipe DOWN sur mobile)
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (deltaY < -40) {
      // Glissé vers le haut -> Titre suivant (comme TikTok/Reels)
      goToNextTrack();
    } else if (deltaY > 40) {
      // Glissé vers le bas -> Titre précédent
      goToPrevTrack();
    }
  };

  // Défilement à la molette de souris (throttled)
  const handleWheel = (e) => {
    const now = Date.now();
    if (now - lastWheelTime.current < 550) return;
    if (e.deltaY > 50) {
      lastWheelTime.current = now;
      goToNextTrack();
    } else if (e.deltaY < -50) {
      lastWheelTime.current = now;
      goToPrevTrack();
    }
  };

  // Raccourcis clavier (Espace, Flèche bas, Flèche haut, L, M, P)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.code === "ArrowDown" || e.code === "KeyJ") {
        e.preventDefault();
        goToNextTrack();
      } else if (e.code === "ArrowUp" || e.code === "KeyK") {
        e.preventDefault();
        goToPrevTrack();
      } else if (e.code === "KeyL") {
        e.preventDefault();
        handleLike(currentTrack?.id);
      } else if (e.code === "KeyM") {
        e.preventDefault();
        setMuted((m) => !m);
      } else if (e.code === "KeyP") {
        e.preventDefault();
        setShowLyrics((v) => !v);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, filteredTracks.length, currentTrack?.id]);

  // Like interactif
  const handleLike = (trackId) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          const isLiked = t.hasLiked;
          return {
            ...t,
            likes: isLiked ? t.likes - 1 : t.likes + 1,
            hasLiked: !isLiked,
          };
        }
        return t;
      })
    );
  };

  // Double tap sur la pochette (effet Reels / TikTok)
  const handleCoverClick = () => {
    const now = Date.now();
    if (now - lastCoverTap.current < 300) {
      // Double tap détecté !
      if (!currentTrack?.hasLiked) {
        handleLike(currentTrack?.id);
      }
      setHeartBurst(true);
      setTimeout(() => setHeartBurst(false), 900);
    } else {
      // Simple tap -> Play / Pause
      setIsPlaying((p) => !p);
    }
    lastCoverTap.current = now;
  };

  // Partager le morceau
  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(`${window.location.origin}/explorer?track=${currentTrack.id}`);
      setCopyNotification("Lien du morceau copié !");
      setTimeout(() => setCopyNotification(""), 2200);
    }
  };

  // Utiliser ce son pour créer dans le studio
  const handleCreateSimilar = () => {
    const params = new URLSearchParams();
    params.set("genre", currentTrack.genre.split("/")[0].trim());
    params.set("prompt", currentTrack.prompt);
    router.push(`/studio?${params.toString()}`);
  };

  // Index de la strophe active
  const currentLyricIndex = currentTrack?.lyrics
    ? currentTrack.lyrics.reduce((acc, line, idx) => (currentTime >= line.time ? idx : acc), 0)
    : 0;
  const currentLyric = currentTrack?.lyrics?.[currentLyricIndex];

  // Gestion du scrub interactif sur la barre de progression
  const handleScrub = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    setCurrentTime(ratio * totalDuration);
  };

  return (
    <Box
      minH="100dvh"
      h="100dvh"
      w="100%"
      maxW="100vw"
      bg="black" // Charte mélostars : noir ultra-profond avec nuance violette
      color="white"
      overflow="hidden"
      position="relative"
      display="flex"
      flexDirection="column"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      userSelect="none"
    >
      {/* Halo d'ambiance dynamique réactif au style de la musique */}
      <Box
        position="absolute"
        top="50%"
        left={{ base: "50%", lg: showLyrics ? "35%" : "50%" }}
        transform="translate(-50%, -50%)"
        boxSize={{ base: "320px", sm: "440px", md: "560px", lg: "650px" }}
        rounded="full"
        bg={`radial-gradient(circle, ${currentTrack?.glowColor || "rgba(139,92,246,0.25)"} 0%, rgba(8,5,18,0) 70%)`}
        filter="blur(60px)"
        pointerEvents="none"
        transition="all 0.8s ease"
        zIndex="0"
        animation="pulseGlow 6s ease-in-out infinite"
      />

      {/* 1. BARRE SUPÉRIEURE ULTRA-RESPONSIVE (EXACTE AU DESIGN CAPTURE) */}
      <Box
        as="header"
        h={{ base: "13", sm: "14", md: "16" }}
        px={{ base: "3", sm: "5", md: "8" }}
        borderBottomWidth="1px"
        borderColor="rgba(255, 255, 255, 0.08)"
        bg="blackAlpha.900"
        backdropFilter="blur(16px)"
        zIndex="40"
        flexShrink={0}
      >
        <Flex h="full" align="center" justify="space-between" gap={{ base: "2", sm: "4" }}>
          {/* Gauche : Retour Studio et Titre Explorer */}
          <HStack gap={{ base: "1.5", sm: "3" }}>
            <IconButton
              asChild
              size="sm"
              variant="ghost"
              rounded="full"
              color="white"
              _hover={{ bg: "rgba(255,255,255,0.12)" }}
              aria-label="Retour au Studio"
            >
              <NextLink href="/studio">
                <LuArrowLeft size={18} />
              </NextLink>
            </IconButton>

            <HStack gap="2" cursor="pointer" onClick={() => router.push("/")}>
              <Logo />
              <Text
                fontFamily="heading"
                fontWeight="800"
                fontSize={{ base: "sm", sm: "md", md: "lg" }}
                letterSpacing="-0.02em"
                color="white"
              >
                Explorer
              </Text>
            </HStack>
          </HStack>

          {/* Centre : Barre de recherche Desktop (identique à la capture) */}
          <Box flex="1" maxW="420px" mx="4" display={{ base: "none", md: "block" }}>
            <Box position="relative">
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentIndex(0);
                }}
                placeholder="Rechercher une chanson..."
                bg="rgba(255, 255, 255, 0.08)"
                borderColor="rgba(255, 255, 255, 0.12)"
                color="white"
                rounded="full"
                pl="10"
                h="9"
                fontSize="xs"
                _hover={{ borderColor: "rgba(255, 255, 255, 0.25)" }}
                _focusVisible={{ borderColor: currentAccent, boxShadow: `0 0 0 1px ${currentAccent}` }}
                _placeholder={{ color: "rgba(255, 255, 255, 0.4)" }}
              />
              <Box
                position="absolute"
                left="3.5"
                top="50%"
                transform="translateY(-50%)"
                color="rgba(255,255,255,0.45)"
                pointerEvents="none"
              >
                <LuSearch size={15} />
              </Box>
              {search && (
                <Box
                  position="absolute"
                  right="3"
                  top="50%"
                  transform="translateY(-50%)"
                  cursor="pointer"
                  onClick={() => setSearch("")}
                >
                  <LuX size={14} color="rgba(255,255,255,0.5)" />
                </Box>
              )}
            </Box>
          </Box>

          {/* Droite : Outils, Switch Auto-scroll et Bouton Créer */}
          <HStack gap={{ base: "1", sm: "2.5" }}>
            {/* Bouton recherche mobile */}
            <IconButton
              display={{ base: "flex", md: "none" }}
              size="sm"
              variant="ghost"
              color="white"
              rounded="full"
              onClick={() => setShowSearchMobile((v) => !v)}
              aria-label="Recherche"
            >
              <LuSearch size={16} />
            </IconButton>

            {/* Switch Auto-scroll */}
            <Button
              size="xs"
              rounded="full"
              variant={autoScroll ? "solid" : "outline"}
              bg={autoScroll ? "rgba(139, 92, 246, 0.25)" : "transparent"}
              borderColor={autoScroll ? "rgba(139, 92, 246, 0.5)" : "rgba(255,255,255,0.15)"}
              color={autoScroll ? "#c4b5fd" : "rgba(255,255,255,0.5)"}
              onClick={() => setAutoScroll((v) => !v)}
              display={{ base: "none", sm: "inline-flex" }}
              fontFamily="ui"
              fontSize="2xs"
              fontWeight="600"
              gap="1"
            >
              <LuRepeat size={11} /> Auto {autoScroll ? "ON" : "OFF"}
            </Button>

            {/* Bouton Créer dans le studio */}
            <Button
              size={{ base: "xs", sm: "sm" }}
              rounded="full"
              fontFamily="ui"
              fontWeight="700"
              color="white"
              background={accent.primary}
              _hover={{ transform: "translateY(-1px)", boxShadow: "0 6px 20px rgba(124, 58, 237, 0.45)" }}
              onClick={handleCreateSimilar}
              px={{ base: "2.5", sm: "4" }}
            >
              <LuWandSparkles size={14} />
              <Text display={{ base: "none", sm: "inline" }}>Créer ma musique</Text>
              <Text display={{ base: "inline", sm: "none" }}>Créer</Text>
            </Button>
          </HStack>
        </Flex>

        {/* Barre de recherche déroulante en mobile */}
        {showSearchMobile && (
          <Box pb="3" pt="1" display={{ base: "block", md: "none" }}>
            <Box position="relative">
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentIndex(0);
                }}
                placeholder="Rechercher une chanson, un style…"
                bg="rgba(255, 255, 255, 0.1)"
                borderColor="rgba(255, 255, 255, 0.25)"
                color="white"
                rounded="full"
                h="9"
                fontSize="xs"
                pl="9"
                autoFocus
              />
              <Box
                position="absolute"
                left="3"
                top="50%"
                transform="translateY(-50%)"
                color="rgba(255,255,255,0.5)"
                pointerEvents="none"
              >
                <LuSearch size={15} />
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      {/* Toast de copie de lien */}
      {copyNotification && (
        <Box
          position="absolute"
          top="18"
          left="50%"
          transform="translateX(-50%)"
          bg="rgba(124, 58, 237, 0.95)"
          color="white"
          px="4"
          py="1.5"
          rounded="full"
          fontSize="xs"
          fontFamily="ui"
          fontWeight="600"
          boxShadow="0 8px 24px rgba(0,0,0,0.6)"
          zIndex="60"
        >
          ✨ {copyNotification}
        </Box>
      )}

      {/* 2. ZONE CENTRALE DE REEL (TOTALEMENT RESPONSIVE SUR MOBILE, TABLETTE ET DESKTOP) */}
      <Flex flex="1" minH="0" position="relative" zIndex="10" overflow="hidden">
        {/* INDICATEUR VERTICAL DU FIL (DOTS À DROITE OU SUR LE CÔTÉ) */}
        <Box
          position="absolute"
          right={{ base: "2", md: "4" }}
          top="50%"
          transform="translateY(-50%)"
          zIndex="25"
          display={{ base: "none", sm: "flex" }}
          flexDirection="column"
          gap="2"
        >
          {filteredTracks.map((_, idx) => (
            <Box
              key={idx}
              boxSize={idx === currentIndex ? "2.5" : "1.5"}
              rounded="full"
              bg={idx === currentIndex ? currentAccent : "rgba(255,255,255,0.25)"}
              boxShadow={idx === currentIndex ? `0 0 10px ${currentAccent}` : "none"}
              cursor="pointer"
              transition="all 0.3s"
              onClick={() => setCurrentIndex(idx)}
            />
          ))}
        </Box>

        {/* SECTION GAUCHE / CENTRE : LE LECTEUR IMMERSIF */}
        <Flex
          flex={{ base: "1", lg: showLyrics ? "1.25" : "1" }}
          direction="column"
          align="center"
          justify="center"
          p={{ base: "2", sm: "3", md: "5" }}
          position="relative"
          h="full"
          overflowY="auto"
          transition="flex 0.4s ease"
        >
          <Stack
            align="center"
            gap={{ base: "2", sm: "2.5", md: "3.5" }}
            maxW="430px"
            w="full"
            textAlign="center"
            my="auto"
          >
            {/* Badge écoutes au-dessus de la pochette (comme dans la capture) */}
            <HStack
              gap="1.5"
              px="3"
              py="0.5"
              rounded="full"
              bg="rgba(255, 255, 255, 0.08)"
              backdropFilter="blur(8px)"
              fontSize="2xs"
              color="rgba(255, 255, 255, 0.75)"
              borderWidth="1px"
              borderColor="rgba(255, 255, 255, 0.08)"
            >
              <Text fontSize="2xs">🎧</Text>
              <Text fontWeight="600">{currentTrack?.listens?.toLocaleString()} écoutes</Text>
            </HStack>

            {/* Pochette d'Album (Dimensions dynamiques avec min/clamp pour s'adapter à toutes les hauteurs d'écran) */}
            <Box
              position="relative"
              boxSize={{
                base: "min(31vh, 215px)",
                sm: "min(35vh, 255px)",
                md: "min(39vh, 290px)",
                lg: "min(42vh, 320px)",
              }}
              rounded="2xl"
              overflow="hidden"
              boxShadow={`0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 45px ${currentTrack.glowColor || "rgba(124, 58, 237, 0.25)"}`}
              borderWidth="1px"
              borderColor="rgba(255, 255, 255, 0.14)"
              bg="#120c24"
              flexShrink={0}
              cursor="pointer"
              onClick={handleCoverClick}
              transition="transform 0.25s ease"
              _hover={{ transform: "scale(1.015)" }}
            >
              <Box
                as="img"
                src={currentTrack.cover}
                alt={currentTrack.title}
                w="full"
                h="full"
                objectFit="cover"
              />

              {/* Animation Égaliseur en bas à droite de la pochette */}
              {isPlaying && (
                <Box
                  position="absolute"
                  bottom="2.5"
                  right="2.5"
                  px="2"
                  py="1.5"
                  rounded="lg"
                  bg="rgba(0,0,0,0.65)"
                  backdropFilter="blur(6px)"
                  borderWidth="1px"
                  borderColor="rgba(255,255,255,0.12)"
                >
                  <HStack gap="1" align="flex-end" h="14px">
                    {[12, 18, 9, 22, 15].map((maxH, i) => (
                      <Box
                        key={i}
                        w="2.5px"
                        h={`${maxH}px`}
                        rounded="full"
                        bg={currentAccent}
                        style={{
                          animation: `wave ${0.6 + i * 0.15}s ease-in-out infinite alternate`,
                          transformOrigin: "bottom",
                        }}
                      />
                    ))}
                  </HStack>
                </Box>
              )}

              {/* Effet d'explosion de cœur lors d'un double-tap */}
              {heartBurst && (
                <Box
                  position="absolute"
                  inset="0"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  pointerEvents="none"
                  zIndex="20"
                >
                  <Box
                    fontSize={{ base: "6xl", md: "7xl" }}
                    animation="heartBurst 0.9s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards"
                  >
                    ❤️
                  </Box>
                </Box>
              )}
            </Box>

            {/* Tags sous la pochette (identique à la capture: Instrumental, Couplet-Refrain...) */}
            <HStack gap="1.5" wrap="wrap" justify="center">
              {currentTrack.tags.map((tag) => (
                <Badge
                  key={tag}
                  px="2.5"
                  py="0.5"
                  rounded="full"
                  bg="rgba(255, 255, 255, 0.08)"
                  color="rgba(255, 255, 255, 0.8)"
                  borderWidth="1px"
                  borderColor="rgba(255, 255, 255, 0.12)"
                  fontSize="2xs"
                  fontFamily="ui"
                  fontWeight="500"
                >
                  {tag}
                </Badge>
              ))}
            </HStack>

            {/* Titre et Sous-titre */}
            <Stack gap="0.5" w="full" px="2">
              <Text
                fontFamily="heading"
                fontWeight="800"
                fontSize={{ base: "md", sm: "lg", md: "xl" }}
                color="white"
                letterSpacing="-0.02em"
                lineHeight="short"
                truncate
              >
                {currentTrack.title}
              </Text>
              <Text
                fontSize={{ base: "2xs", sm: "xs" }}
                color="rgba(255, 255, 255, 0.6)"
                fontFamily="ui"
                truncate
              >
                {currentTrack.subtitle}
              </Text>
            </Stack>

            {/* Ticker de paroles en direct sur mobile lorsque le tiroir de paroles est fermé */}
            {!showLyrics && currentLyric && (
              <Box
                px="3.5"
                py="1.5"
                rounded="full"
                bg="rgba(255, 255, 255, 0.08)"
                backdropFilter="blur(10px)"
                borderWidth="1px"
                borderColor="rgba(255, 255, 255, 0.1)"
                cursor="pointer"
                onClick={() => setShowLyrics(true)}
                maxW="92%"
                transition="all 0.2s"
                _hover={{ bg: "rgba(255, 255, 255, 0.15)" }}
              >
                <HStack gap="2" justify="center">
                  <LuMusic size={13} color={currentAccent} />
                  <Text
                    fontSize="2xs"
                    fontWeight="700"
                    color={currentAccent}
                    fontFamily="heading"
                    truncate
                  >
                    « {currentLyric.text} »
                  </Text>
                </HStack>
              </Box>
            )}

            {/* Barre de défilement audio avec scrubber précis */}
            <Box w="full" px="2">
              <Box
                w="full"
                h="2"
                bg="rgba(255, 255, 255, 0.16)"
                rounded="full"
                cursor="pointer"
                position="relative"
                onClick={handleScrub}
              >
                <Box
                  h="full"
                  w={`${(currentTime / totalDuration) * 100}%`}
                  bg={currentAccent}
                  rounded="full"
                  position="relative"
                >
                  <Box
                    position="absolute"
                    right="-5px"
                    top="-3px"
                    boxSize="3.5"
                    rounded="full"
                    bg="white"
                    boxShadow={`0 0 10px ${currentAccent}`}
                  />
                </Box>
              </Box>

              <Flex justify="space-between" mt="1.5" fontSize="2xs" fontFamily="ui" color="rgba(255, 255, 255, 0.45)">
                <Text>{fmt(currentTime)}</Text>
                <Text>{fmt(totalDuration)}</Text>
              </Flex>
            </Box>

            {/* Contrôles Multimédia Principaux (Previous, Big Play/Pause, Next) */}
            <HStack gap={{ base: "4", sm: "5" }} justify="center" align="center">
              <IconButton
                aria-label="Morceau précédent"
                size="md"
                variant="ghost"
                rounded="full"
                color="white"
                _hover={{ bg: "rgba(255,255,255,0.12)" }}
                onClick={goToPrevTrack}
              >
                <LuSkipBack size={20} />
              </IconButton>

              {/* Bouton Play/Pause Principal (Orange / Couleur d'accentuation vive) */}
              <IconButton
                aria-label={isPlaying ? "Pause" : "Play"}
                boxSize={{ base: "13", sm: "15" }}
                rounded="full"
                bg={currentAccent}
                color="white"
                onClick={() => setIsPlaying((p) => !p)}
                boxShadow={`0 0 30px ${currentTrack.glowColor || "rgba(249, 115, 22, 0.5)"}`}
                _hover={{ transform: "scale(1.08)" }}
                transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
              >
                {isPlaying ? <LuPause size={24} /> : <LuPlay size={24} style={{ marginLeft: "3px" }} />}
              </IconButton>

              <IconButton
                aria-label="Morceau suivant"
                size="md"
                variant="ghost"
                rounded="full"
                color="white"
                _hover={{ bg: "rgba(255,255,255,0.12)" }}
                onClick={goToNextTrack}
              >
                <LuSkipForward size={20} />
              </IconButton>
            </HStack>

            {/* Barre Secondaire : Répéter, Like, Partage, Paroles, Volume */}
            <HStack
              gap={{ base: "1.5", sm: "2.5" }}
              justify="center"
              align="center"
              pt="0.5"
              color="rgba(255,255,255,0.7)"
              wrap="wrap"
            >
              {/* Répéter */}
              <IconButton
                aria-label="Répéter"
                size="sm"
                variant="ghost"
                rounded="full"
                color={isLooping ? currentAccent : "rgba(255,255,255,0.6)"}
                _hover={{ bg: "rgba(255,255,255,0.1)" }}
                onClick={() => setIsLooping((v) => !v)}
              >
                <LuRepeat size={16} />
              </IconButton>

              {/* Like avec compteur (comme 🤍 68 dans la capture) */}
              <Button
                size="xs"
                variant="ghost"
                rounded="full"
                color={currentTrack.hasLiked ? "red.400" : "rgba(255,255,255,0.85)"}
                bg={currentTrack.hasLiked ? "rgba(239, 68, 68, 0.15)" : "transparent"}
                _hover={{ bg: "rgba(255,255,255,0.12)" }}
                onClick={() => handleLike(currentTrack.id)}
                fontFamily="ui"
                gap="1.5"
                px="3"
              >
                <LuHeart size={16} fill={currentTrack.hasLiked ? "currentColor" : "none"} />
                <Text fontSize="xs" fontWeight="600">
                  {currentTrack.likes}
                </Text>
              </Button>

              {/* Partager */}
              <IconButton
                aria-label="Partager"
                size="sm"
                variant="ghost"
                rounded="full"
                color="rgba(255,255,255,0.75)"
                _hover={{ bg: "rgba(255,255,255,0.1)" }}
                onClick={handleShare}
              >
                <LuShare2 size={16} />
              </IconButton>

              {/* Bouton Paroles dédié orange/accent (identique à la capture) */}
              <Button
                size="xs"
                rounded="full"
                variant="solid"
                bg={showLyrics ? currentAccent : "rgba(255, 255, 255, 0.12)"}
                color="white"
                _hover={{ bg: currentAccent, transform: "scale(1.04)" }}
                onClick={() => setShowLyrics((v) => !v)}
                fontFamily="ui"
                fontSize="xs"
                fontWeight="700"
                gap="1.5"
                px="3.5"
                boxShadow={showLyrics ? `0 0 15px ${currentAccent}66` : "none"}
                transition="all 0.2s"
              >
                <LuFileText size={13} /> Paroles
              </Button>

              {/* Volume avec slider tactile/souris (Desktop et grand écran) */}
              <HStack gap="1.5" display={{ base: "none", md: "flex" }} pl="1">
                <IconButton
                  aria-label="Mute"
                  size="xs"
                  variant="ghost"
                  color="rgba(255,255,255,0.6)"
                  onClick={() => setMuted((m) => !m)}
                >
                  {muted ? <LuVolumeX size={15} /> : <LuVolume2 size={15} />}
                </IconButton>
                <Box w="56px">
                  <Box
                    h="1.5"
                    w="full"
                    bg="rgba(255,255,255,0.2)"
                    rounded="full"
                    cursor="pointer"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const newVol = Math.round((x / rect.width) * 100);
                      setVolume(Math.max(0, Math.min(100, newVol)));
                      setMuted(false);
                    }}
                  >
                    <Box h="full" w={`${muted ? 0 : volume}%`} bg="white" rounded="full" />
                  </Box>
                </Box>
              </HStack>
            </HStack>

            {/* Bouton Créer dans ce style */}
            <Button
              size="2xs"
              rounded="full"
              variant="outline"
              borderColor="rgba(255, 255, 255, 0.2)"
              color="rgba(255, 255, 255, 0.85)"
              _hover={{ borderColor: currentAccent, color: "white", bg: "rgba(255,255,255,0.08)" }}
              onClick={handleCreateSimilar}
              py="1"
              px="3"
            >
              <LuSparkles size={11} color={currentAccent} /> Créer dans ce style
            </Button>
          </Stack>

          {/* INDICATEUR FLÈCHE FLOTTANTE VERS LE BAS (SWIPE UP / TITRE SUIVANT) */}
          <Box
            position="absolute"
            bottom={{ base: "2", sm: "3" }}
            left="50%"
            transform="translateX(-50%)"
            cursor="pointer"
            onClick={goToNextTrack}
            animation="floatY 2s ease-in-out infinite"
            p="1.5"
            rounded="full"
            bg="rgba(255, 255, 255, 0.08)"
            _hover={{ bg: "rgba(255, 255, 255, 0.2)", transform: "translateX(-50%) scale(1.1)" }}
            transition="all 0.2s"
          >
            <LuArrowDown size={16} color="rgba(255, 255, 255, 0.6)" />
          </Box>
        </Flex>

        {/* SECTION DROITE : PAROLES SYNCHRONISÉES (DESKTOP >= 1024px) */}
        {showLyrics && (
          <Box
            display={{ base: "none", lg: "flex" }}
            flex="0.95"
            h="full"
            borderLeftWidth="1px"
            borderColor="rgba(255, 255, 255, 0.08)"
           bg="blackAlpha.900"
            backdropFilter="blur(26px)"
            p="8"
            flexDirection="column"
            position="relative"
            zIndex="20"
            transition="all 0.4s ease"
          >
            {/* En-tête des paroles (avec icône et bouton fermer ✕ de la capture) */}
            <Flex
              justify="space-between"
              align="center"
              pb="4"
              borderBottomWidth="1px"
              borderColor="rgba(255, 255, 255, 0.08)"
            >
              <HStack gap="2">
                <Text fontFamily="heading" fontWeight="700" fontSize="md" color="white">
                  Paroles
                </Text>
              </HStack>
              <IconButton
                size="xs"
                variant="ghost"
                color="rgba(255, 255, 255, 0.5)"
                _hover={{ color: "white", bg: "rgba(255, 255, 255, 0.1)" }}
                onClick={() => setShowLyrics(false)}
                aria-label="Fermer paroles"
              >
                <LuX size={16} />
              </IconButton>
            </Flex>

            {/* Défilement karaoké synchronisé */}
            <Box
              ref={lyricsContainerRef}
              flex="1"
              overflowY="auto"
              py="10"
              px="4"
              className="custom-lyrics-scroll"
            >
              <Stack gap="7">
                {currentTrack.lyrics?.map((line, idx) => {
                  const isActive = idx === currentLyricIndex;
                  const isPast = idx < currentLyricIndex;

                  return (
                    <Box
                      key={idx}
                      ref={isActive ? activeLyricRef : null}
                      cursor="pointer"
                      onClick={() => setCurrentTime(line.time)}
                      transition="all 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
                      transform={isActive ? "scale(1.06) translateX(6px)" : "scale(1)"}
                      opacity={isActive ? 1 : isPast ? 0.35 : 0.65}
                    >
                      <Text
                        fontFamily="heading"
                        fontWeight={isActive ? "800" : "600"}
                        fontSize={isActive ? "2xl" : "lg"}
                        lineHeight="short"
                        color={isActive ? currentAccent : "rgba(255, 255, 255, 0.85)"}
                        textShadow={isActive ? `0 0 25px ${currentTrack.glowColor || "rgba(249, 115, 22, 0.6)"}` : "none"}
                        _hover={{ color: "white", opacity: 1 }}
                      >
                        {line.text}
                      </Text>
                    </Box>
                  );
                })}
              </Stack>
            </Box>

            {/* Bas de page Karaoké */}
            <Flex
              justify="space-between"
              align="center"
              pt="3"
              borderTopWidth="1px"
              borderColor="rgba(255, 255, 255, 0.08)"
              fontSize="2xs"
              color="rgba(255, 255, 255, 0.4)"
              fontFamily="ui"
            >
              <Text>Karaoké IA melostars</Text>
              <Text>Cliquez sur une phrase pour avancer</Text>
            </Flex>
          </Box>
        )}
      </Flex>

      {/* 3. TIROIR MODAL PAROLES POUR MOBILE / TABLETTE (< 1024px) */}
      {showLyrics && (
        <Box
          display={{ base: "flex", lg: "none" }}
          position="fixed"
          inset="0"
          zIndex="50"
          bg="blackAlpha.900"
          backdropFilter="blur(20px)"
          alignItems="flex-end"
          onClick={() => setShowLyrics(false)}
        >
          <Box
            w="full"
            maxH="75dvh"
            h="72dvh"
            bg="rgba(12, 7, 24, 0.98)"
            borderTopRadius="3xl"
            borderTopWidth="1px"
            borderColor="rgba(255, 255, 255, 0.16)"
            p="5"
            display="flex"
            flexDirection="column"
            onClick={(e) => e.stopPropagation()}
            boxShadow="0 -15px 45px rgba(0,0,0,0.85)"
          >
            {/* Barre de poignée (drag handle) */}
            <Box w="40px" h="4px" rounded="full" bg="rgba(255,255,255,0.25)" mx="auto" mb="3" />

            <Flex justify="space-between" align="center" pb="3" borderBottomWidth="1px" borderColor="rgba(255,255,255,0.1)">
              <HStack gap="2">
                <Text fontSize="sm">🎵</Text>
                <Text fontFamily="heading" fontWeight="700" fontSize="sm" color="white">
                  Paroles de « {currentTrack.title} »
                </Text>
              </HStack>
              <IconButton
                size="xs"
                variant="ghost"
                color="white"
                onClick={() => setShowLyrics(false)}
                aria-label="Fermer"
              >
                <LuX size={16} />
              </IconButton>
            </Flex>

            {/* Liste défilante des paroles en mobile */}
            <Box
              ref={mobileLyricsContainerRef}
              flex="1"
              overflowY="auto"
              py="5"
              px="5"
              className="custom-lyrics-scroll"
            >
              <Stack gap="5" textAlign="center">
                {currentTrack.lyrics?.map((line, idx) => {
                  const isActive = idx === currentLyricIndex;
                  const isPast = idx < currentLyricIndex;

                  return (
                    <Box
                      key={idx}
                      ref={isActive ? mobileActiveLyricRef : null}
                      cursor="pointer"
                      onClick={() => setCurrentTime(line.time)}
                      opacity={isActive ? 1 : isPast ? 0.35 : 0.65}
                      transform={isActive ? "scale(1.05)" : "scale(1)"}
                      transition="all 0.3s"
                    >
                      <Text
                        fontFamily="heading"
                        fontWeight={isActive ? "800" : "600"}
                        fontSize={isActive ? "xl" : "md"}
                        color={isActive ? currentAccent : "white"}
                        textShadow={isActive ? `0 0 20px ${currentTrack.glowColor}` : "none"}
                      >
                        {line.text}
                      </Text>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
