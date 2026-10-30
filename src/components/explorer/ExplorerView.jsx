"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

import { api } from "@/lib/apiClient";
import Logo from "../common/Logo";
import { accent } from "@/theme/system";

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

// Synthétiseur d'ambiance Web Audio natif + lecteur Audio HTML5
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
    this.currentUrl = null;
    this.onTimeUpdate = null;
    this.onDurationChange = null;
    this.onEnded = null;
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

  playTrack(genre = "Afrobeat", volume = 80, isMuted = false, audioUrl = null, startTime = 0) {
    if (audioUrl && typeof window !== "undefined") {
      try {
        this.stopSynth();
        if (!this.htmlAudio) {
          this.htmlAudio = new Audio();
        }

        // Branchement des écouteurs de synchronisation en temps réel
        this.htmlAudio.ontimeupdate = () => {
          if (this.onTimeUpdate && !isNaN(this.htmlAudio.currentTime)) {
            this.onTimeUpdate(this.htmlAudio.currentTime);
          }
        };

        this.htmlAudio.onloadedmetadata = () => {
          if (this.onDurationChange && !isNaN(this.htmlAudio.duration) && this.htmlAudio.duration > 0) {
            this.onDurationChange(this.htmlAudio.duration);
          }
        };

        this.htmlAudio.onended = () => {
          if (this.onEnded) {
            this.onEnded();
          }
        };

        if (this.currentUrl !== audioUrl) {
          this.currentUrl = audioUrl;
          this.htmlAudio.src = audioUrl;
          this.htmlAudio.currentTime = startTime;
        }

        this.htmlAudio.volume = isMuted ? 0 : Math.min(1, volume / 100);
        const playPromise = this.htmlAudio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            this.playSynthTrack(genre, volume, isMuted);
          });
        }
        return;
      } catch (_) {}
    }

    this.playSynthTrack(genre, volume, isMuted);
  }

  seek(time) {
    if (this.htmlAudio && !isNaN(time)) {
      try {
        this.htmlAudio.currentTime = Math.max(0, time);
      } catch (_) {}
    }
  }

  pause() {
    if (this.htmlAudio) {
      try {
        this.htmlAudio.pause();
      } catch (_) {}
    }
    this.stopSynth();
  }

  resume() {
    if (this.htmlAudio && this.currentUrl) {
      try {
        const p = this.htmlAudio.play();
        if (p !== undefined) {
          p.catch(() => {});
        }
      } catch (_) {}
    }
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

      let freq1 = 220;
      let freq2 = 330;
      let type1 = "triangle";
      let type2 = "sine";

      if (genre.includes("Synthwave")) {
        freq1 = 146.83;
        freq2 = 220;
        type1 = "sawtooth";
        type2 = "triangle";
      } else if (genre.includes("Acoustique")) {
        freq1 = 196;
        freq2 = 293.66;
        type1 = "sine";
        type2 = "triangle";
      } else if (genre.includes("Pop")) {
        freq1 = 261.63;
        freq2 = 392;
        type1 = "triangle";
        type2 = "sine";
      }

      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = type1;
      this.osc1.frequency.setValueAtTime(freq1, now);

      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = type2;
      this.osc2.frequency.setValueAtTime(freq2, now);

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

  stopSynth() {
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

  stop() {
    if (this.htmlAudio) {
      try {
        this.htmlAudio.pause();
        this.htmlAudio.currentTime = 0;
      } catch (_) {}
    }
    this.currentUrl = null;
    this.stopSynth();
  }
}

const audioPlayer = new AmbientAudioEngine();

const GENRES = ["Tous", "Afrobeat", "Synthwave", "Pop", "Acoustique"];

export default function ExplorerView() {
  const router = useRouter();
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showLyrics, setShowLyrics] = useState(true);
  const [showMobileLyrics, setShowMobileLyrics] = useState(false);
  const [showSearchMobile, setShowSearchMobile] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("Tous");
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

  // Synchronisation des pistes publiques réelles depuis l'API (AUCUNE MOCK DATA)
  useEffect(() => {
    let isMounted = true;

    api.get("/api/tracks?public=true")
      .then((res) => {
        if (!isMounted) return;
        const rawList = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        if (rawList.length > 0) {
          const dbTracks = rawList.map((t) => ({
            id: t.id,
            title: t.title || "Titre sans nom",
            subtitle: t.prompt || `${t.genre || "Afrobeat"} composé par IA`,
            genre: t.genre || "Afrobeat",
            creator: t.user?.name || "Artiste pretymelo",
            duration: t.duration || 120,
            cover: t.coverUrl || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&fit=crop",
            audioUrl: t.audioUrl || null,
            accentColor: accent.primary,
            glowColor: "rgba(184, 30, 215, 0.25)",
            likes: t.likesCount || 0,
            shares: 0,
            listens: t.playCount || 0,
            tags: [t.genre || "Afrobeat", "IA pretymelo"].filter(Boolean),
            lyrics: t.lyrics
              ? t.lyrics.split("\n").filter(Boolean).map((line, idx) => ({
                  id: idx + 1,
                  time: idx * 5,
                  text: line,
                }))
              : [
                  { id: 1, time: 0, text: "♪ Mélodie composée par IA pretymelo ♪" },
                  { id: 2, time: 6, text: t.prompt || "Harmonies vocales et rythmes captivants" },
                ],
          }));
          setTracks(dbTracks);
        } else {
          setTracks([]);
        }
      })
      .catch((err) => {
        console.warn("[ExplorerView] Impossible de charger les pistes publiques:", err.message);
        if (isMounted) setTracks([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Morceaux filtrés selon la recherche et le genre
  const filteredTracks = tracks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.genre.toLowerCase().includes(search.toLowerCase()) ||
      t.creator.toLowerCase().includes(search.toLowerCase()) ||
      t.subtitle.toLowerCase().includes(search.toLowerCase());

    const matchesGenre =
      selectedGenre === "Tous" ||
      t.genre.toLowerCase().includes(selectedGenre.toLowerCase());

    return matchesSearch && matchesGenre;
  });

  const currentTrack = filteredTracks[currentIndex] || null;
  const [trackDuration, setTrackDuration] = useState(null);
  const totalDuration = trackDuration || currentTrack?.duration || 120;
  const currentAccent = currentTrack?.accentColor || accent.primary;
  const glowColor = currentTrack?.glowColor || "rgba(184, 30, 215, 0.2)";

  // Handlers de navigation et interactions déclarés en amont
  const goToNextTrack = useCallback(() => {
    if (filteredTracks.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % filteredTracks.length);
    setCurrentTime(0);
    setTrackDuration(null);
    setIsPlaying(true);
  }, [filteredTracks.length]);

  const goToPrevTrack = useCallback(() => {
    if (filteredTracks.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + filteredTracks.length) % filteredTracks.length);
    setCurrentTime(0);
    setTrackDuration(null);
    setIsPlaying(true);
  }, [filteredTracks.length]);

  const selectTrack = useCallback((index) => {
    setCurrentIndex(index);
    setCurrentTime(0);
    setTrackDuration(null);
    setIsPlaying(true);
  }, []);

  const handleLike = useCallback((trackId) => {
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
  }, []);

  // Navigation précise (Seek) dans le morceau
  const handleSeekTo = useCallback((time) => {
    const validTime = Math.max(0, Math.min(totalDuration, time));
    setCurrentTime(validTime);
    audioPlayer.seek(validTime);
  }, [totalDuration]);

  // Références stables pour les écouteurs audio afin d'éviter les re-créations
  const isDraggingSeekRef = useRef(false);
  const isLoopingRef = useRef(false);
  const autoScrollRef = useRef(true);
  const goToNextTrackRef = useRef(goToNextTrack);

  useEffect(() => {
    isDraggingSeekRef.current = isDraggingSeek;
  }, [isDraggingSeek]);

  useEffect(() => {
    isLoopingRef.current = isLooping;
  }, [isLooping]);

  useEffect(() => {
    autoScrollRef.current = autoScroll;
  }, [autoScroll]);

  useEffect(() => {
    goToNextTrackRef.current = goToNextTrack;
  }, [goToNextTrack]);

  // Synchronisation des callbacks temps réel de l'élément Audio HTML5
  useEffect(() => {
    audioPlayer.onTimeUpdate = (time) => {
      if (!isDraggingSeekRef.current) {
        setCurrentTime(time);
      }
    };

    audioPlayer.onDurationChange = (dur) => {
      if (dur > 0) {
        setTrackDuration(dur);
      }
    };

    audioPlayer.onEnded = () => {
      if (isLoopingRef.current) {
        audioPlayer.seek(0);
        audioPlayer.resume();
        setCurrentTime(0);
      } else if (autoScrollRef.current) {
        goToNextTrackRef.current();
      } else {
        setIsPlaying(false);
      }
    };
  }, []);

  // Synchronisation du chargement du morceau
  useEffect(() => {
    if (!currentTrack) {
      audioPlayer.stop();
      return;
    }

    if (isPlaying) {
      audioPlayer.playTrack(currentTrack.genre, volume, muted, currentTrack.audioUrl);
    } else {
      audioPlayer.stop();
    }

    return () => {
      audioPlayer.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id, currentTrack?.audioUrl]);

  // Gestion Play / Pause sans réinitialiser la position du morceau
  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      const next = !prev;
      if (next) {
        audioPlayer.resume();
      } else {
        audioPlayer.pause();
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!currentTrack) return;
    if (isPlaying) {
      audioPlayer.resume();
    } else {
      audioPlayer.pause();
    }
  }, [isPlaying, currentTrack]);

  useEffect(() => {
    audioPlayer.setVolume(volume, muted);
  }, [volume, muted]);

  // Défilement du chrono pour pistes de synthèse ou sans URL audio
  useEffect(() => {
    if (!isPlaying || isDraggingSeek || !currentTrack || currentTrack.audioUrl) {
      clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= totalDuration) {
          if (isLooping) return 0;
          if (autoScroll) {
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
  }, [isPlaying, isDraggingSeek, currentTrack, totalDuration, isLooping, autoScroll, goToNextTrack]);

  // Auto-centrage des paroles synchronisées sur la strophe active
  useEffect(() => {
    if (activeLyricRef.current && lyricsContainerRef.current) {
      activeLyricRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (mobileActiveLyricRef.current && mobileLyricsContainerRef.current) {
      mobileActiveLyricRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentTime]);

  // Raccourcis clavier (Espace, Flèche bas, Flèche haut, L, M, P)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowDown" || e.code === "KeyJ") {
        e.preventDefault();
        goToNextTrack();
      } else if (e.code === "ArrowUp" || e.code === "KeyK") {
        e.preventDefault();
        goToPrevTrack();
      } else if (e.code === "KeyL") {
        e.preventDefault();
        if (currentTrack?.id) {
          handleLike(currentTrack.id);
        }
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
  }, [goToNextTrack, goToPrevTrack, handleLike, currentTrack?.id, togglePlay]);

  // Gestes tactiles (Swipe UP / Swipe DOWN sur mobile)
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (deltaY < -40) {
      goToNextTrack();
    } else if (deltaY > 40) {
      goToPrevTrack();
    }
  };

  // Défilement à la molette de souris
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

  // Double tap sur la pochette
  const handleCoverClick = () => {
    const now = Date.now();
    if (now - lastCoverTap.current < 300) {
      if (!currentTrack?.hasLiked && currentTrack?.id) {
        handleLike(currentTrack.id);
      }
      setHeartBurst(true);
      setTimeout(() => setHeartBurst(false), 900);
    } else {
      togglePlay();
    }
    lastCoverTap.current = now;
  };

  // Partager le morceau
  const handleShare = () => {
    if (typeof window !== "undefined" && currentTrack?.id) {
      navigator.clipboard.writeText(`${window.location.origin}/explorer?track=${currentTrack.id}`);
      setCopyNotification("Lien du morceau copié !");
      setTimeout(() => setCopyNotification(""), 2200);
    }
  };

  // Ouvrir dans le studio
  const handleCreateSimilar = () => {
    if (!currentTrack) {
      router.push("/studio");
      return;
    }
    const params = new URLSearchParams();
    params.set("genre", currentTrack.genre.split("/")[0].trim());
    params.set("prompt", currentTrack.prompt || currentTrack.subtitle || "");
    router.push(`/studio?${params.toString()}`);
  };

  // Index de la strophe active
  const currentLyricIndex = currentTrack?.lyrics
    ? currentTrack.lyrics.reduce((acc, line, idx) => (currentTime >= line.time ? idx : acc), 0)
    : 0;
  const currentLyric = currentTrack?.lyrics?.[currentLyricIndex];

  // Calcul du temps pour le scrubber interactif (clic & glisser)
  const calculateScrubTime = useCallback((clientX, targetElement) => {
    if (!currentTrack || totalDuration <= 0) return 0;
    const rect = targetElement.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    return ratio * totalDuration;
  }, [currentTrack, totalDuration]);

  const handleScrub = useCallback((e) => {
    const newTime = calculateScrubTime(e.clientX, e.currentTarget);
    handleSeekTo(newTime);
  }, [calculateScrubTime, handleSeekTo]);

  const handlePointerDown = useCallback((e) => {
    setIsDraggingSeek(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    const newTime = calculateScrubTime(e.clientX, e.currentTarget);
    setCurrentTime(newTime);
  }, [calculateScrubTime]);

  const handlePointerMove = useCallback((e) => {
    if (!isDraggingSeek) return;
    const newTime = calculateScrubTime(e.clientX, e.currentTarget);
    setCurrentTime(newTime);
  }, [isDraggingSeek, calculateScrubTime]);

  const handlePointerUp = useCallback((e) => {
    if (!isDraggingSeek) return;
    setIsDraggingSeek(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
    const newTime = calculateScrubTime(e.clientX, e.currentTarget);
    handleSeekTo(newTime);
  }, [isDraggingSeek, calculateScrubTime, handleSeekTo]);

  return (
    <Box
      minH="100dvh"
      h="100dvh"
      w="100%"
      maxW="100vw"
      bg="#121212"
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
      {/* Halo d'ambiance dynamique ultra-doux (inspiration Spotify color mesh) */}
      <Box
        position="absolute"
        top="-10%"
        left="50%"
        transform="translateX(-50%)"
        w="100%"
        maxW="1100px"
        h="520px"
        bg={`radial-gradient(ellipse 90% 60% at 50% 0%, ${glowColor} 0%, rgba(18, 18, 18, 0.75) 65%, #121212 100%)`}
        pointerEvents="none"
        transition="background 0.8s ease"
        zIndex="0"
      />

      {/* 1. BARRE DE NAVIGATION MINIMALISTE ET SOFT STYLE SPOTIFY */}
      <Box
        as="header"
        h={{ base: "14", md: "16" }}
        px={{ base: "3", sm: "6", md: "8" }}
        borderBottomWidth="1px"
        borderColor="rgba(255, 255, 255, 0.06)"
        bg="rgba(18, 18, 18, 0.85)"
        backdropFilter="blur(20px)"
        zIndex="40"
        flexShrink={0}
      >
        <Flex h="full" align="center" justify="space-between" gap={{ base: "2", sm: "4" }}>
          {/* Gauche : Retour Studio et Logo */}
          <HStack gap={{ base: "2", sm: "3" }}>
            <IconButton
              asChild
              size="sm"
              variant="ghost"
              rounded="full"
              color="#b3b3b3"
              _hover={{ color: "white", bg: "rgba(255, 255, 255, 0.1)" }}
              aria-label="Retour au Studio"
            >
              <NextLink href="/studio">
                <LuArrowLeft size={18} />
              </NextLink>
            </IconButton>

            <HStack gap="2.5" cursor="pointer" onClick={() => router.push("/")}>
              <Logo />
            </HStack>
          </HStack>

          {/* Centre : Recherche capsule Spotify + Filtres genres */}
          <HStack flex="1" maxW="580px" mx={{ base: "1", md: "4" }} gap="3" justify="center">
            {/* Barre de recherche Desktop */}
            <Box position="relative" flex="1" maxW="280px" display={{ base: "none", md: "block" }}>
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentIndex(0);
                }}
                placeholder="Que souhaitez-vous écouter ?"
                bg="#242424"
                borderWidth="0"
                color="white"
                rounded="full"
                pl="9"
                pr="8"
                h="9"
                fontSize="xs"
                _hover={{ bg: "#2a2a2a" }}
                _focusVisible={{ bg: "#2a2a2a", boxShadow: "0 0 0 1.5px rgba(255,255,255,0.3)" }}
                _placeholder={{ color: "#b3b3b3" }}
              />
              <Box
                position="absolute"
                left="3"
                top="50%"
                transform="translateY(-50%)"
                color="#b3b3b3"
                pointerEvents="none"
              >
                <LuSearch size={14} />
              </Box>
              {search && (
                <Box
                  position="absolute"
                  right="2.5"
                  top="50%"
                  transform="translateY(-50%)"
                  cursor="pointer"
                  onClick={() => setSearch("")}
                >
                  <LuX size={14} color="#b3b3b3" />
                </Box>
              )}
            </Box>

            {/* Chips de genres style Spotify */}
            <HStack gap="1.5" overflowX="auto" py="1" display={{ base: "none", sm: "flex" }}>
              {GENRES.map((genre) => {
                const isActive = selectedGenre === genre;
                return (
                  <Button
                    key={genre}
                    size="2xs"
                    rounded="full"
                    variant="ghost"
                    bg={isActive ? "white" : "rgba(255, 255, 255, 0.07)"}
                    color={isActive ? "#121212" : "#b3b3b3"}
                    fontWeight={isActive ? "700" : "500"}
                    fontSize="2xs"
                    px="3"
                    py="1"
                    _hover={{
                      bg: isActive ? "white" : "rgba(255, 255, 255, 0.12)",
                      color: isActive ? "#121212" : "white",
                    }}
                    onClick={() => {
                      setSelectedGenre(genre);
                      setCurrentIndex(0);
                    }}
                  >
                    {genre}
                  </Button>
                );
              })}
            </HStack>
          </HStack>

          {/* Droite : Outils et CTA Créer */}
          <HStack gap={{ base: "1.5", sm: "2.5" }}>
            {/* Recherche mobile */}
            <IconButton
              display={{ base: "flex", md: "none" }}
              size="sm"
              variant="ghost"
              color="#b3b3b3"
              _hover={{ color: "white" }}
              rounded="full"
              onClick={() => setShowSearchMobile((v) => !v)}
              aria-label="Recherche"
            >
              <LuSearch size={17} />
            </IconButton>

            {/* Switch Auto-scroll épuré */}
            <Button
              size="xs"
              rounded="full"
              variant="ghost"
              bg={autoScroll ? "rgba(153, 30, 215, 0.15)" : "transparent"}
              color={autoScroll ? accent.primary : "#b3b3b3"}
              _hover={{ bg: autoScroll ? "rgba(156, 30, 215, 0.25)" : "rgba(255,255,255,0.08)" }}
              onClick={() => setAutoScroll((v) => !v)}
              display={{ base: "none", sm: "inline-flex" }}
              fontSize="2xs"
              fontWeight="600"
              gap="1.5"
              px="2.5"
            >
              <LuRepeat size={12} />
              Auto {autoScroll ? "ON" : "OFF"}
            </Button>

            {/* Bouton Créer style Spotify Pill */}
            <Button
              size="sm"
              rounded="full"
              fontWeight="700"
              fontSize="xs"
              color="#121212"
              bg="white"
              _hover={{ transform: "scale(1.03)", bg: "#f2f2f2" }}
              _active={{ transform: "scale(0.98)" }}
              transition="all 0.15s ease"
              onClick={handleCreateSimilar}
              px={{ base: "3", sm: "4" }}
              gap="1.5"
            >
              <Text display={{ base: "none", sm: "inline" }}>Créer</Text>
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
                placeholder="Rechercher une musique, un style..."
                bg="#242424"
                borderWidth="0"
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
                color="#b3b3b3"
                pointerEvents="none"
              >
                <LuSearch size={14} />
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      {/* Toast de copie de lien soft */}
      {copyNotification && (
        <Box
          position="absolute"
          top="18"
          left="50%"
          transform="translateX(-50%)"
          bg="#282828"
          color="white"
          px="4"
          py="1.5"
          rounded="full"
          fontSize="xs"
          fontWeight="600"
          boxShadow="0 10px 30px rgba(0,0,0,0.6)"
          borderWidth="1px"
          borderColor="rgba(255, 255, 255, 0.1)"
          zIndex="60"
        >
          {copyNotification}
        </Box>
      )}

      {/* 2. ZONE CENTRALE : SHIMMER LOADING OU LECTEUR RÉEL */}
      <Flex flex="1" minH="0" position="relative" zIndex="10" overflow="hidden">
        {/* CAS 1 : SHIMMER LOADING SPOTIFY SANS AUCUNE MOCK DATA */}
        {isLoading ? (
          <Flex w="full" h="full" direction={{ base: "column", lg: "row" }} align="center" justify="center">
            {/* Colonne gauche : Shimmer Player */}
            <Flex
              flex={{ base: "1", lg: "1.2" }}
              direction="column"
              align="center"
              justify="center"
              p={{ base: "3", sm: "5", md: "6" }}
              h="full"
              w="full"
            >
              <Box
                w="full"
                maxW="480px"
                bg="rgba(24, 24, 24, 0.6)"
                borderWidth="1px"
                borderColor="rgba(255, 255, 255, 0.06)"
                rounded="2xl"
                p={{ base: "4", sm: "6" }}
                backdropFilter="blur(24px)"
                boxShadow="0 20px 50px rgba(0, 0, 0, 0.6)"
              >
                <Stack align="center" gap={{ base: "3", sm: "4" }} textAlign="center">
                  {/* Pochette Shimmer */}
                  <Box
                    boxSize={{
                      base: "min(28vh, 190px)",
                      sm: "min(32vh, 230px)",
                      md: "min(36vh, 260px)",
                      lg: "min(38vh, 280px)",
                    }}
                    rounded="xl"
                    className="shimmer-box"
                  />

                  {/* Titre & Artiste Shimmer */}
                  <Stack align="center" gap="2" w="full" py="1">
                    <Box w="60%" h="20px" rounded="md" className="shimmer-box" />
                    <Box w="35%" h="14px" rounded="md" className="shimmer-box" />
                  </Stack>

                  {/* Barre de progression Shimmer */}
                  <Box w="full" px="2" pt="2">
                    <Box w="full" h="4px" rounded="full" className="shimmer-box" />
                    <Flex justify="space-between" mt="2">
                      <Box w="28px" h="10px" rounded="sm" className="shimmer-box" />
                      <Box w="28px" h="10px" rounded="sm" className="shimmer-box" />
                    </Flex>
                  </Box>

                  {/* Boutons de contrôle Shimmer */}
                  <HStack gap="5" justify="center" align="center" py="2">
                    <Box boxSize="28px" rounded="full" className="shimmer-box" />
                    <Box boxSize="34px" rounded="full" className="shimmer-box" />
                    <Box boxSize="52px" rounded="full" className="shimmer-box" />
                    <Box boxSize="34px" rounded="full" className="shimmer-box" />
                    <Box boxSize="28px" rounded="full" className="shimmer-box" />
                  </HStack>

                  {/* Barre secondaire Shimmer */}
                  <Flex w="full" justify="space-between" align="center" pt="2">
                    <Box w="70px" h="22px" rounded="full" className="shimmer-box" />
                    <Box w="120px" h="22px" rounded="full" className="shimmer-box" />
                  </Flex>
                </Stack>
              </Box>

              {/* Shimmer mini-shelf en bas */}
              <Box w="full" maxW="480px" mt="3" display={{ base: "none", sm: "block" }}>
                <HStack gap="2">
                  {[1, 2, 3].map((k) => (
                    <HStack
                      key={k}
                      gap="2"
                      p="1.5"
                      pr="3"
                      rounded="lg"
                      bg="rgba(255, 255, 255, 0.03)"
                      flex="1"
                    >
                      <Box boxSize="28px" rounded="md" className="shimmer-box" flexShrink={0} />
                      <Stack gap="1" flex="1">
                        <Box w="80%" h="10px" rounded="sm" className="shimmer-box" />
                        <Box w="50%" h="8px" rounded="sm" className="shimmer-box" />
                      </Stack>
                    </HStack>
                  ))}
                </HStack>
              </Box>
            </Flex>

            {/* Colonne droite : Shimmer Paroles (Desktop) */}
            <Box
              display={{ base: "none", lg: "flex" }}
              flex="0.95"
              h="full"
              borderLeftWidth="1px"
              borderColor="rgba(255, 255, 255, 0.06)"
              bg="rgba(18, 18, 18, 0.75)"
              backdropFilter="blur(30px)"
              p="8"
              flexDirection="column"
            >
              <Flex justify="space-between" align="center" pb="4" borderBottomWidth="1px" borderColor="rgba(255, 255, 255, 0.06)">
                <Box w="80px" h="16px" rounded="md" className="shimmer-box" />
              </Flex>
              <Stack gap="6" py="10" px="4" flex="1">
                {[75, 45, 85, 60, 40, 70, 50].map((w, idx) => (
                  <Box key={idx} w={`${w}%`} h="24px" rounded="md" className="shimmer-box" opacity={idx === 2 ? 1 : 0.45} />
                ))}
              </Stack>
            </Box>
          </Flex>
        ) : !currentTrack ? (
          /* CAS 2 : AUCUN MORCEAU DISPONIBLE */
          <Flex w="full" h="full" align="center" justify="center" p="6" direction="column" textAlign="center">
            <Box
              boxSize="64px"
              rounded="full"
              bg="rgba(255, 255, 255, 0.06)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              mb="4"
            >
              <LuMusic size={28} color={accent.primary} />
            </Box>
            <Text fontFamily="heading" fontWeight="700" fontSize="xl" mb="1">
              Aucun morceau public pour le moment
            </Text>
            <Text fontSize="sm" color="#b3b3b3" maxW="400px" mb="6">
              Soyez le premier à composer et partager une musique générée par l&apos;IA avec la communauté pretymelo.
            </Text>
            <Button
              rounded="full"
              bg={accent.primary}
              color="white"
              fontWeight="700"
              fontSize="sm"
              px="6"
              py="2.5"
              gap="2"
              onClick={() => router.push("/studio")}
              _hover={{ transform: "scale(1.04)" }}
            >
              <LuWandSparkles size={16} />
              Créer ma musique
            </Button>
          </Flex>
        ) : (
          /* CAS 3 : LECTEUR RÉEL SPOTIFY AVEC DONNÉES FETCHÉES */
          <>
            {/* SECTION GAUCHE / CENTRE : LE LECTEUR IMMERSIF SOFT */}
            <Flex
              flex={{ base: "1", lg: showLyrics ? "1.2" : "1" }}
              direction="column"
              align="center"
              justify="center"
              p={{ base: "2", sm: "4", md: "6" }}
              position="relative"
              h="full"
              overflowY="auto"
              transition="flex 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
            >
              <Box
                w="full"
                maxW="480px"
                bg="rgba(24, 24, 24, 0.6)"
                borderWidth="1px"
                borderColor="rgba(255, 255, 255, 0.06)"
                rounded="2xl"
                p={{ base: "3", sm: "5", md: "6" }}
                backdropFilter="blur(24px)"
                boxShadow="0 20px 50px rgba(0, 0, 0, 0.6)"
                my="auto"
              >
                <Stack align="center" gap={{ base: "3", sm: "4" }} textAlign="center">
                  {/* Pochette Album Spotify */}
                  <Box
                    position="relative"
                    boxSize={{
                      base: "min(28vh, 190px)",
                      sm: "min(32vh, 230px)",
                      md: "min(36vh, 260px)",
                      lg: "min(38vh, 280px)",
                    }}
                    rounded="xl"
                    overflow="hidden"
                    boxShadow="0 16px 36px rgba(0, 0, 0, 0.7)"
                    bg="#181818"
                    flexShrink={0}
                    cursor="pointer"
                    onClick={handleCoverClick}
                    transition="transform 0.25s ease"
                    _hover={{ transform: "scale(1.02)" }}
                  >
                    <Box
                      as="img"
                      src={currentTrack.cover}
                      alt={currentTrack.title}
                      w="full"
                      h="full"
                      objectFit="cover"
                    />

                    {/* Égaliseur discret Spotify en bas à droite */}
                    {isPlaying && (
                      <Box
                        position="absolute"
                        bottom="2"
                        right="2"
                        px="2"
                        py="1"
                        rounded="md"
                        bg="rgba(0, 0, 0, 0.7)"
                        backdropFilter="blur(8px)"
                      >
                        <HStack gap="1" align="flex-end" h="12px">
                          {[10, 16, 8, 18, 12].map((maxH, i) => (
                            <Box
                              key={i}
                              w="2px"
                              h={`${maxH}px`}
                              rounded="full"
                              bg={accent.primary}
                              style={{
                                animation: `wave ${0.5 + i * 0.15}s ease-in-out infinite alternate`,
                                transformOrigin: "bottom",
                              }}
                            />
                          ))}
                        </HStack>
                      </Box>
                    )}

                    {/* Animation Coeur Double Tap */}
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
                          fontSize="6xl"
                          animation="heartBurst 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards"
                        >
                          <LuHeart color={"red"} fill="red" />
                        </Box>
                      </Box>
                    )}
                  </Box>

                  {/* Métadonnées Titre et Artiste (Typographie épurée Spotify) */}
                  <Box w="full" px="2">
                    <Text
                      fontFamily="heading"
                      fontWeight="700"
                      fontSize={{ base: "lg", sm: "xl", md: "2xl" }}
                      color="white"
                      letterSpacing="-0.02em"
                      lineHeight="tight"
                      truncate
                    >
                      {currentTrack.title}
                    </Text>

                    <HStack justify="center" gap="2" mt="1">
                      <Text
                        fontSize="xs"
                        color="#b3b3b3"
                        fontWeight="500"
                        _hover={{ color: "white" }}
                        cursor="pointer"
                        truncate
                      >
                        {currentTrack.creator}
                      </Text>
                      <Text color="rgba(255, 255, 255, 0.2)">•</Text>
                      <Badge
                        size="xs"
                        px="2"
                        py="0.5"
                        rounded="full"
                        bg="rgba(255, 255, 255, 0.08)"
                        color="#e0e0e0"
                        fontSize="2xs"
                        fontWeight="500"
                      >
                        {currentTrack.genre}
                      </Badge>
                    </HStack>
                  </Box>

                  {/* Ticker de paroles doux pour mobile lorsque le tiroir est fermé avec gradient transparent noir */}
                  {currentLyric && (
                    <Box
                      position="relative"
                      h="34px"
                      w="full"
                      maxW="92%"
                      overflow="hidden"
                      rounded="none"
                      bg="rgba(24, 24, 24, 0.6)"
                      
                      cursor="pointer"
                      onClick={() => setShowMobileLyrics(true)}
                      display={{ base: "flex", lg: "none" }}
                      alignItems="center"
                      justifyContent="center"
                      transition="all 0.2s"
                      _hover={{ borderColor: "rgba(255, 255, 255, 0.16)", bg: "rgba(24, 24, 24, 0.6)" }}
                    >
                      {/* Dégradé noir transparent en haut (effet de disparition) */}
                      <Box
                        position="absolute"
                        top="0"
                        left="0"
                        right="0"
                        h="10px"
                        bg="linear-gradient(180deg, #181818 0%, rgba(24, 24, 24, 0) 100%)"
                        pointerEvents="none"
                        zIndex="3"
                      />

                      {/* Dégradé noir transparent en bas (effet d'apparition) */}
                      <Box
                        position="absolute"
                        bottom="0"
                        left="0"
                        right="0"
                        h="10px"
                        bg="linear-gradient(0deg, #181818 0%, rgba(24, 24, 24, 0) 100%)"
                        pointerEvents="none"
                        zIndex="3"
                      />

                      

                      {/* Contenu textuel avec animation au changement de paroles */}
                      <Box
                        key={currentLyric.id ?? currentLyric.time ?? currentLyric.text}
                        animation="lyricSlideUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards"
                        w="full"
                        px="4"
                        textAlign="center"
                        zIndex="1"
                      >
                        <Text
                          fontSize="sm"
                          fontWeight="500"
                          color="white"
                          truncate
                        >
                          {currentLyric.text}
                        </Text>
                      </Box>
                    </Box>
                  )}

                  {/* Barre de défilement Spotify (Ligne fine avec hover dynamique & navigation fluide) */}
                  <Box w="full" px="2">
                    <Box
                      w="full"
                      py="2"
                      cursor="pointer"
                      position="relative"
                      onClick={handleScrub}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      role="group"
                    >
                      {/* Piste de fond */}
                      <Box
                        w="full"
                        h="4px"
                        bg="rgba(255, 255, 255, 0.2)"
                        rounded="full"
                        position="relative"
                        _groupHover={{ h: "6px" }}
                        transition="height 0.15s ease"
                      >
                        {/* Piste remplie */}
                        <Box
                          h="full"
                          w={`${totalDuration > 0 ? Math.min(100, Math.max(0, (currentTime / totalDuration) * 100)) : 0}%`}
                          bg={currentAccent}
                          rounded="full"
                          position="relative"
                        >
                          {/* Poignée de scrub visible au survol ou en cours de drag */}
                          <Box
                            position="absolute"
                            right="-5px"
                            top="50%"
                            transform="translateY(-50%)"
                            boxSize={isDraggingSeek ? "13px" : "11px"}
                            rounded="full"
                            bg="white"
                            boxShadow="0 2px 6px rgba(0,0,0,0.6)"
                            opacity={isDraggingSeek ? "1" : "0"}
                            _groupHover={{ opacity: "1" }}
                            transition="all 0.15s ease"
                          />
                        </Box>
                      </Box>
                    </Box>

                    <Flex justify="space-between" mt="0.5" fontSize="2xs" color="#a7a7a7" fontWeight="500">
                      <Text>{fmt(currentTime)}</Text>
                      <Text>{fmt(totalDuration)}</Text>
                    </Flex>
                  </Box>

                  {/* Contrôles Multimédia Principaux Spotify */}
                  <HStack gap={{ base: "5", sm: "6" }} justify="center" align="center" py="1">
                    {/* Boucle / Repeat */}
                    <IconButton
                      aria-label="Répéter"
                      size="sm"
                      variant="ghost"
                      rounded="full"
                      color={isLooping ? accent.primary : "#b3b3b3"}
                      _hover={{ color: "white" }}
                      onClick={() => setIsLooping((v) => !v)}
                      position="relative"
                    >
                      <LuRepeat size={18} />
                      {isLooping && (
                        <Box
                          position="absolute"
                          bottom="1"
                          boxSize="3px"
                          rounded="full"
                          bg={accent.primary}
                        />
                      )}
                    </IconButton>

                    {/* Morceau précédent */}
                    <IconButton
                      aria-label="Morceau précédent"
                      size="md"
                      variant="ghost"
                      rounded="full"
                      color="#b3b3b3"
                      _hover={{ color: "white" }}
                      onClick={goToPrevTrack}
                    >
                      <LuSkipBack size={22} />
                    </IconButton>

                    {/* Bouton Play / Pause Signature Spotify (Cercle blanc, icône noire) */}
                    <IconButton
                      aria-label={isPlaying ? "Pause" : "Play"}
                      boxSize={{ base: "12", sm: "14" }}
                      rounded="full"
                      bg="white"
                      color="#121212"
                      onClick={togglePlay}
                      boxShadow="0 8px 24px rgba(0, 0, 0, 0.4)"
                      _hover={{ transform: "scale(1.06)", bg: "#f8f8f8" }}
                      _active={{ transform: "scale(0.96)" }}
                      transition="all 0.15s cubic-bezier(0.4, 0, 0.2, 1)"
                    >
                      {isPlaying ? (
                        <LuPause size={22} />
                      ) : (
                        <LuPlay size={22} style={{ marginLeft: "3px" }} />
                      )}
                    </IconButton>

                    {/* Morceau suivant */}
                    <IconButton
                      aria-label="Morceau suivant"
                      size="md"
                      variant="ghost"
                      rounded="full"
                      color="#b3b3b3"
                      _hover={{ color: "white" }}
                      onClick={goToNextTrack}
                    >
                      <LuSkipForward size={22} />
                    </IconButton>

                    {/* Like / Favori */}
                    <IconButton
                      aria-label="Aimer"
                      size="sm"
                      variant="ghost"
                      rounded="full"
                      color={currentTrack.hasLiked ? "#ef4444" : "#b3b3b3"}
                      _hover={{ color: currentTrack.hasLiked ? "#ef4444" : "white" }}
                      onClick={() => handleLike(currentTrack.id)}
                    >
                      <LuHeart
                        size={19}
                        fill={currentTrack.hasLiked ? "currentColor" : "none"}
                      />
                    </IconButton>
                  </HStack>

                  {/* Barre Secondaire : Paroles, Partage, Volume, Style */}
                  <Flex
                    w="full"
                    justify="space-between"
                    align="center"
                    pt="2"
                    borderTopWidth="1px"
                    borderColor="rgba(255, 255, 255, 0.06)"
                  >
                    {/* Bouton Paroles */}
                    <Button
                      size="xs"
                      rounded="full"
                      variant="ghost"
                      bg={showLyrics ? "rgba(255, 255, 255, 0.12)" : "transparent"}
                      color={showLyrics ? "white" : "#b3b3b3"}
                      _hover={{ bg: "rgba(255, 255, 255, 0.15)", color: "white" }}
                      onClick={() => {
                        setShowLyrics((v) => !v);
                        setShowMobileLyrics(true);
                      }}
                      fontSize="2xs"
                      fontWeight="600"
                      gap="1.5"
                      px="3"
                    >
                      <LuFileText size={13} />
                      Paroles
                    </Button>

                    {/* Outils droite : Partage, Créer similaire, Volume */}
                    <HStack gap="2">
                      <IconButton
                        aria-label="Partager"
                        size="xs"
                        variant="ghost"
                        rounded="full"
                        color="#b3b3b3"
                        _hover={{ color: "white" }}
                        onClick={handleShare}
                      >
                        <LuShare2 size={15} />
                      </IconButton>

                      {/* Volume Slider épuré */}
                      <HStack gap="1.5" display={{ base: "none", sm: "flex" }}>
                        <IconButton
                          aria-label="Mute"
                          size="xs"
                          variant="ghost"
                          color="#b3b3b3"
                          _hover={{ color: "white" }}
                          onClick={() => setMuted((m) => !m)}
                        >
                          {muted ? <LuVolumeX size={15} /> : <LuVolume2 size={15} />}
                        </IconButton>
                        <Box
                          w="56px"
                          h="3px"
                          bg="rgba(255, 255, 255, 0.2)"
                          rounded="full"
                          cursor="pointer"
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const newVol = Math.round((x / rect.width) * 100);
                            setVolume(Math.max(0, Math.min(100, newVol)));
                            setMuted(false);
                          }}
                          role="group"
                          _hover={{ h: "4px" }}
                        >
                          <Box
                            h="full"
                            w={`${muted ? 0 : volume}%`}
                            bg="white"
                            rounded="full"
                            _groupHover={{ bg: accent.primary }}
                          />
                        </Box>
                      </HStack>

                      <Button
                        size="2xs"
                        rounded="full"
                        variant="ghost"
                        color="#b3b3b3"
                        _hover={{ color: "white", bg: "rgba(255,255,255,0.08)" }}
                        onClick={handleCreateSimilar}
                        fontSize="2xs"
                        gap="1"
                        px="2.5"
                      >
                        <LuSparkles size={11} color={accent.primary} />
                        <Text display={{ base: "none", md: "inline" }}>Créer dans ce style</Text>
                      </Button>
                    </HStack>
                  </Flex>
                </Stack>
              </Box>

              {/* Mini-carrousel horizontal discret des morceaux (inspiration Spotify playlist queue) */}
              <Box w="full" maxW="480px" mt="3" display={{ base: "none", sm: "block" }}>
                <HStack gap="2" overflowX="auto" py="1" px="1">
                  {filteredTracks.map((tr, idx) => {
                    const isSelected = idx === currentIndex;
                    return (
                      <HStack
                        key={tr.id}
                        gap="2"
                        p="1.5"
                        pr="3"
                        rounded="lg"
                        bg={isSelected ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.03)"}
                        borderWidth="1px"
                        borderColor={isSelected ? "rgba(255, 255, 255, 0.15)" : "transparent"}
                        cursor="pointer"
                        flexShrink={0}
                        onClick={() => selectTrack(idx)}
                        _hover={{ bg: "rgba(255, 255, 255, 0.08)" }}
                        transition="all 0.2s"
                      >
                        <Box
                          boxSize="28px"
                          rounded="md"
                          overflow="hidden"
                          bg="#181818"
                          flexShrink={0}
                        >
                          <Box as="img" src={tr.cover} alt={tr.title} w="full" h="full" objectFit="cover" />
                        </Box>
                        <Box maxW="110px">
                          <Text fontSize="2xs" fontWeight="600" color={isSelected ? "white" : "#b3b3b3"} truncate>
                            {tr.title}
                          </Text>
                          <Text fontSize="3xs" color="#727272" truncate>
                            {tr.creator}
                          </Text>
                        </Box>
                      </HStack>
                    );
                  })}
                </HStack>
              </Box>

              {/* Indicateur de défilement vers le bas */}
              <Box
                position="absolute"
                bottom="2"
                left="50%"
                transform="translateX(-50%)"
                cursor="pointer"
                onClick={goToNextTrack}
                p="1.5"
                rounded="full"
                bg="rgba(255, 255, 255, 0.05)"
                _hover={{ bg: "rgba(255, 255, 255, 0.15)", transform: "translateX(-50%) translateY(2px)" }}
                transition="all 0.2s"
              >
                <LuArrowDown size={14} color="#b3b3b3" />
              </Box>
            </Flex>

            {/* SECTION DROITE : PAROLES SYNCHRONISÉES (DESKTOP >= 1024px STYLE SPOTIFY) */}
            {showLyrics && (
              <Box
                display={{ base: "none", lg: "flex" }}
                flex="0.95"
                h="full"
                borderLeftWidth="1px"
                borderColor="rgba(255, 255, 255, 0.06)"
                bg="rgba(18, 18, 18, 0.75)"
                backdropFilter="blur(30px)"
                p="8"
                flexDirection="column"
                position="relative"
                zIndex="20"
                transition="all 0.4s ease"
              >
                {/* En-tête des paroles */}
                <Flex justify="space-between" align="center" pb="4" borderBottomWidth="1px" borderColor="rgba(255, 255, 255, 0.06)">
                  <HStack gap="2">
                    <Text fontFamily="heading" fontWeight="700" fontSize="sm" color="#b3b3b3" textTransform="uppercase" letterSpacing="0.05em">
                      Paroles
                    </Text>
                  </HStack>
                  <IconButton
                    size="xs"
                    variant="ghost"
                    color="#b3b3b3"
                    _hover={{ color: "white", bg: "rgba(255, 255, 255, 0.1)" }}
                    onClick={() => setShowLyrics(false)}
                    aria-label="Fermer paroles"
                    rounded="full"
                  >
                    <LuX size={15} />
                  </IconButton>
                </Flex>

                {/* Défilement karaoké synchronisé avec masque de dégradé style Spotify */}
                <Box
                  ref={lyricsContainerRef}
                  flex="1"
                  overflowY="auto"
                  py="12"
                  px="4"
                  className="custom-lyrics-scroll"
                  style={{
                    maskImage: "linear-gradient(180deg, transparent 0%, black 12%, black 88%, transparent 100%)",
                    WebkitMaskImage: "linear-gradient(180deg, transparent 0%, black 12%, black 88%, transparent 100%)",
                  }}
                >
                  <Stack gap="8">
                    {currentTrack.lyrics?.map((line, idx) => {
                      const isActive = idx === currentLyricIndex;
                      const isPast = idx < currentLyricIndex;

                      return (
                        <Box
                          key={idx}
                          ref={isActive ? activeLyricRef : null}
                          cursor="pointer"
                          onClick={() => handleSeekTo(line.time)}
                          transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                          transform={isActive ? "scale(1.04) translateX(4px)" : "scale(1)"}
                          opacity={isActive ? 1 : isPast ? 0.35 : 0.65}
                        >
                          <Text
                            fontFamily="heading"
                            fontWeight={isActive ? "800" : "600"}
                            fontSize={isActive ? "2xl" : "lg"}
                            lineHeight="snug"
                            color={isActive ? "white" : "#a0a0a0"}
                            textShadow={isActive ? `0 0 20px ${glowColor}` : "none"}
                            _hover={{ color: "white", opacity: 1 }}
                          >
                            {line.text}
                          </Text>
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>

                {/* Pied de page Paroles */}
                <Flex
                  justify="space-between"
                  align="center"
                  pt="3"
                  borderTopWidth="1px"
                  borderColor="rgba(255, 255, 255, 0.06)"
                  fontSize="2xs"
                  color="#727272"
                >
                  <Text>Synchronisé par IA pretymelo</Text>
                  <Text>Cliquez sur une phrase pour naviguer</Text>
                </Flex>
              </Box>
            )}
          </>
        )}
      </Flex>

      {/* 3. TIROIR MODAL PAROLES MOBILE (< 1024px STYLE SPOTIFY BOTTOM SHEET) */}
      {showMobileLyrics && currentTrack && (
        <Box
          display={{ base: "flex", lg: "none" }}
          position="fixed"
          inset="0"
          zIndex="50"
          bg="rgba(0, 0, 0, 0.75)"
          backdropFilter="blur(24px)"
          alignItems="flex-end"
          onClick={() => setShowMobileLyrics(false)}
        >
          <Box
            w="full"
            maxH="78dvh"
            h="74dvh"
            bg="#181818"
            borderTopRadius="2xl"
            borderTopWidth="1px"
            borderColor="rgba(255, 255, 255, 0.1)"
            p="5"
            display="flex"
            flexDirection="column"
            onClick={(e) => e.stopPropagation()}
            boxShadow="0 -15px 40px rgba(0, 0, 0, 0.9)"
          >
            {/* Poignée de drag */}
            <Box w="36px" h="4px" rounded="full" bg="rgba(255, 255, 255, 0.2)" mx="auto" mb="3" />

            <Flex justify="space-between" align="center" pb="3" borderBottomWidth="1px" borderColor="rgba(255, 255, 255, 0.08)">
              <HStack gap="2">
                <Text fontSize="xs" color={accent.primary}>●</Text>
                <Text fontFamily="heading" fontWeight="700" fontSize="sm" color="white">
                  Paroles de « {currentTrack.title} »
                </Text>
              </HStack>
              <IconButton
                size="xs"
                variant="ghost"
                color="#b3b3b3"
                _hover={{ color: "white" }}
                onClick={() => setShowMobileLyrics(false)}
                aria-label="Fermer"
                rounded="full"
              >
                <LuX size={16} />
              </IconButton>
            </Flex>

            {/* Paroles défilantes mobile */}
            <Box
              ref={mobileLyricsContainerRef}
              flex="1"
              overflowY="auto"
              py="6"
              px="4"
              className="custom-lyrics-scroll"
            >
              <Stack gap="6" textAlign="center">
                {currentTrack.lyrics?.map((line, idx) => {
                  const isActive = idx === currentLyricIndex;
                  const isPast = idx < currentLyricIndex;

                  return (
                    <Box
                      key={idx}
                      ref={isActive ? mobileActiveLyricRef : null}
                      cursor="pointer"
                      onClick={() => handleSeekTo(line.time)}
                      opacity={isActive ? 1 : isPast ? 0.35 : 0.65}
                      transform={isActive ? "scale(1.04)" : "scale(1)"}
                      transition="all 0.2s"
                    >
                      <Text
                        fontFamily="heading"
                        fontWeight={isActive ? "800" : "600"}
                        fontSize={isActive ? "xl" : "md"}
                        color={isActive ? "white" : "#a0a0a0"}
                        textShadow={isActive ? `0 0 16px ${glowColor}` : "none"}
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

      {/* Styles CSS intégrés pour les animations Spotify & Shimmer loader */}
      <style jsx global>{`
        @keyframes lyricSlideUp {
          0% {
            opacity: 0;
            transform: translateY(12px);
            filter: blur(3px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .shimmer-box {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.04) 25%,
            rgba(255, 255, 255, 0.12) 37%,
            rgba(255, 255, 255, 0.04) 63%
          );
          background-size: 400% 100%;
          animation: shimmer 1.6s ease-in-out infinite;
        }
        @keyframes wave {
          0% {
            height: 4px;
          }
          100% {
            height: 18px;
          }
        }
        @keyframes heartBurst {
          0% {
            transform: scale(0.2);
            opacity: 0;
          }
          50% {
            transform: scale(1.3);
            opacity: 1;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }
        .custom-lyrics-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .custom-lyrics-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
      `}</style>
    </Box>
  );
}
