"use client";

import { useEffect, useRef, useState } from "react";
import NextLink from "next/link";
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  IconButton,
  Image,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { LuArrowRight, LuDownload, LuPlay, LuPause, LuVolume2 } from "react-icons/lu";
import Reveal from "@/components/common/Reveal";
import Waveform from "@/components/common/Waveform";
import { Shimmer, ShimmerCircle } from "@/components/common/Shimmer";
import { accent } from "@/theme/system";
import { downloadTrackAudio } from "@/lib/downloadTrack";

const fallbackTracks = [
  {
    id: "fb-1",
    title: "Lumières de juillet",
    genre: "Afrobeat",
    meta: "Afrobeat · Joyeux · 108 BPM",
    length: "2:14",
    cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop",
    tags: ["AFROBEAT", "FESTIF"],
    audioUrl: null,
  },
  {
    id: "fb-2",
    title: "Le dernier train",
    genre: "Lo-fi & Soul",
    meta: "Lo-fi · Nostalgique · 82 BPM",
    length: "1:48",
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
    tags: ["LO-FI", "CHILL"],
    audioUrl: null,
  },
  {
    id: "fb-3",
    title: "Neon Horizons",
    genre: "Électro",
    meta: "Synthwave · Épique · 124 BPM",
    length: "3:02",
    cover: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop",
    tags: ["ÉLECTRO", "ÉPIQUE"],
    audioUrl: null,
  },
];

const fmt = (s) => {
  if (isNaN(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
};

export default function Showcase() {
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTrackId, setActiveTrackId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(60);
  const audioRef = useRef(null);

  // 1. Récupération des vraies musiques publiques / créées par l'admin pour l'accueil
  useEffect(() => {
    let isMounted = true;
    async function loadPublicTracks() {
      try {
        const res = await fetch("/api/tracks?public=true&limit=8");
        const json = await res.json().catch(() => null);

        if (isMounted && json?.data && json.data.length > 0) {
          const formatted = json.data.map((t) => {
            const min = Math.floor((t.duration || 60) / 60);
            const sec = String((t.duration || 60) % 60).padStart(2, "0");
            const mood = t.moods?.[0] || "Harmonieux";

            return {
              id: t.id,
              title: t.title,
              genre: t.genre || "Pop",
              meta: `${t.genre || "Pop"} · ${mood} · ${t.vocalType || "Vocal"}`,
              length: `${min}:${sec}`,
              durationSeconds: t.duration || 60,
              cover: t.coverUrl || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop",
              tags: [t.genre?.toUpperCase() || "HIT", mood.toUpperCase()].slice(0, 2),
              audioUrl: t.audioUrl,
              prompt: t.prompt,
            };
          });

          setTracks(formatted);
          setActiveTrackId(formatted[0]?.id);
        } else if (isMounted) {
          setTracks(fallbackTracks);
          setActiveTrackId(fallbackTracks[0]?.id);
        }
      } catch (_) {
        if (isMounted) {
          setTracks(fallbackTracks);
          setActiveTrackId(fallbackTracks[0]?.id);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadPublicTracks();
    return () => {
      isMounted = false;
    };
  }, []);

  const activeTrack = tracks.find((t) => t.id === activeTrackId) || tracks[0] || null;
  const desktopTracks = tracks.slice(0, 4);

  const togglePlay = async (t) => {
    const audio = audioRef.current;
    const target = t || activeTrack;
    if (!target) return;

    if (activeTrackId === target.id) {
      // Piste déjà active : bascule pause / reprise
      if (isPlaying || isBuffering) {
        if (audio) audio.pause();
        setIsPlaying(false);
        setIsBuffering(false);
      } else {
        if (audio && target.audioUrl) {
          setIsBuffering(true);
          try {
            if (!audio.src || !audio.src.includes(target.audioUrl)) {
              audio.src = target.audioUrl;
              audio.load();
            }
            await audio.play();
            setIsBuffering(false);
            setIsPlaying(true);
          } catch (err) {
            if (err.name !== "AbortError") {
              console.warn("[Showcase] Lecture bloquée/échouée :", err);
            }
            setIsBuffering(false);
            setIsPlaying(false);
          }
        }
      }
    } else {
      // Nouvelle piste sélectionnée : activation, chargement et lecture directe
      setActiveTrackId(target.id);
      setCurrentTime(0);
      setDuration(target.durationSeconds || 60);

      if (audio && target.audioUrl) {
        setIsBuffering(true);
        setIsPlaying(false);

        try {
          audio.pause();
          audio.currentTime = 0;
          audio.src = target.audioUrl;
          audio.load();
          await audio.play();
          setIsBuffering(false);
          setIsPlaying(true);
        } catch (err) {
          if (err.name !== "AbortError") {
            console.warn("[Showcase] Lecture bloquée/échouée :", err);
          }
          setIsBuffering(false);
          setIsPlaying(false);
        }
      } else {
        if (audio) audio.pause();
        setIsBuffering(false);
        setIsPlaying(false);
      }
    }
  };

  const handleSeek = (e) => {
    if (isBuffering || !duration) return;
    const audio = audioRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pos * duration;
    if (audio && activeTrack?.audioUrl) {
      audio.currentTime = newTime;
    }
    setCurrentTime(newTime);
  };

  const progressPercent = duration > 0 ? currentTime / duration : 0;

  return (
    <Box as="section" id="examples" py={{ base: "16", md: "24" }} bg="paper.50" overflowX="hidden" pos="relative">
      {/* Audio element invisible avec liaison contrôlée et gestion du buffer */}
      <audio
        ref={audioRef}
        preload="auto"
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
        }}
        onPause={() => {
          setIsPlaying(false);
        }}
        onTimeUpdate={(e) => {
          const cur = e.currentTarget.currentTime;
          setCurrentTime(cur);
          if (isBuffering && cur > 0) setIsBuffering(false);
        }}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (d && !isNaN(d) && d > 0) {
            setDuration(d);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          setIsBuffering(false);
          setCurrentTime(0);
        }}
        onError={() => {
          setIsBuffering(false);
          setIsPlaying(false);
          console.warn("[Showcase] Erreur chargement source audio:", activeTrack?.audioUrl);
        }}
      />

      <Container maxW="7xl">
        <Reveal>
          <SimpleGrid
            columns={{ base: 1, lg: 12 }}
            gap={{ base: "8", lg: "12" }}
            alignItems="center"
          >
            {/* --- COLONNE GAUCHE : Textes, Sélection de 4 pistes (Web) & CTA --- */}
            <Stack gap="6" gridColumn={{ lg: "span 6" }} align="flex-start">
              <Stack gap="3">
                <Heading
                  as="h2"
                  fontFamily="heading"
                  fontWeight="800"
                  fontSize={{ base: "3xl", md: "5xl" }}
                  letterSpacing="-0.035em"
                  lineHeight="1.1"
                >
                  Ils ont créé ça avec <br />
                  <Text as="span" color="brand.violet">
                    pretymelo
                  </Text>
                </Heading>
                <Text color="ink.500" fontSize="lg" maxW="md">
                  Écoutez les créations officielles générées en quelques secondes avec notre studio IA.
                </Text>
              </Stack>

              {/* Sous-titre indicatif sur Desktop */}
              {isLoading ? (
                <Shimmer h="16px" w="220px" rounded="md" mt="2" display={{ base: "none", lg: "block" }} />
              ) : (
                <Text
                  fontFamily="ui"
                  fontSize="xs"
                  fontWeight="700"
                  letterSpacing="0.1em"
                  textTransform="uppercase"
                  color="ink.400"
                  mt="2"
                  display={{ base: "none", lg: "block" }}
                >
                  {desktopTracks.length} créations à l&apos;honneur · Écoutez nos favoris
                </Text>
              )}

              {/* Liste interactive des 4 morceaux sur Web (Desktop) */}
              <Stack gap="2.5" w="100%" maxW="lg" display={{ base: "none", lg: "flex" }}>
                {isLoading ? (
                  [1, 2, 3, 4].map((i) => (
                    <HStack
                      key={i}
                      gap="4"
                      p="3"
                      px="4"
                      rounded="2xl"
                      bg="paper.100"
                      borderWidth="1px"
                      borderColor="transparent"
                    >
                      <Shimmer boxSize="12" rounded="xl" flexShrink={0} />
                      <Stack gap="2" flex="1" minW="0">
                        <Shimmer h="15px" w="55%" rounded="md" />
                        <Shimmer h="12px" w="80%" rounded="md" />
                      </Stack>
                      <Shimmer h="12px" w="32px" rounded="md" flexShrink={0} />
                    </HStack>
                  ))
                ) : (
                  desktopTracks.map((t) => {
                    const isActive = t.id === activeTrackId;
                    const isCurrentPlaying = isActive && isPlaying && !isBuffering;
                    const isCurrentBuffering = isActive && isBuffering;

                    return (
                      <HStack
                        key={t.id}
                        gap="4"
                        p="3"
                        px="4"
                        rounded="2xl"
                        cursor="pointer"
                        transition="all 0.2s ease"
                        bg={isActive ? "white" : "paper.100"}
                        borderWidth="1px"
                        borderColor={isActive ? "brand.violet" : "transparent"}
                        boxShadow={
                          isActive
                            ? "0 10px 25px -5px rgba(139, 92, 246, 0.12)"
                            : "none"
                        }
                        _hover={{
                          bg: "white",
                          borderColor: isActive ? "brand.violet" : "paper.300",
                          transform: "translateX(2px)",
                        }}
                        onClick={() => togglePlay(t)}
                      >
                        {/* Vignette / Cover miniature */}
                        <Box
                          pos="relative"
                          boxSize="12"
                          rounded="xl"
                          overflow="hidden"
                          flexShrink={0}
                          bg="paper.200"
                        >
                          {t.coverUrl || t.cover ? (
                            <Image
                              src={t.coverUrl || t.cover}
                              alt={t.title}
                              boxSize="100%"
                              objectFit="cover"
                            />
                          ) : (
                            <Flex
                              boxSize="100%"
                              align="center"
                              justify="center"
                              bg={accent.primary}
                              color="white"
                            >
                              <LuVolume2 size={16} />
                            </Flex>
                          )}

                          {/* Overlay Bouton Play / Égaliseur miniature / Spinner */}
                          <Flex
                            pos="absolute"
                            inset="0"
                            bg={isCurrentPlaying || isCurrentBuffering ? "rgba(124, 58, 237, 0.6)" : "rgba(0,0,0,0.3)"}
                            align="center"
                            justify="center"
                            color="white"
                            backdropFilter={isCurrentPlaying || isCurrentBuffering ? "blur(1px)" : "none"}
                          >
                            {isCurrentBuffering ? (
                              <Spinner size="xs" color="white" borderWidth="2px" />
                            ) : isCurrentPlaying ? (
                              <HStack gap="0.5" align="flex-end" h="12px">
                                <Box w="2px" h="100%" bg="white" rounded="full" animation="wave 0.8s ease-in-out infinite" />
                                <Box w="2px" h="60%" bg="white" rounded="full" animation="wave 0.8s ease-in-out 0.2s infinite" />
                                <Box w="2px" h="85%" bg="white" rounded="full" animation="wave 0.8s ease-in-out 0.4s infinite" />
                              </HStack>
                            ) : (
                              <LuPlay size={16} ml="0.5" />
                            )}
                          </Flex>
                        </Box>

                        {/* Infos morceau */}
                        <Stack gap="0" flex="1" minW="0">
                          <Text
                            fontFamily="heading"
                            fontWeight={isActive ? "700" : "600"}
                            fontSize="md"
                            color={isActive ? "brand.violet" : "ink.900"}
                            truncate
                          >
                            {t.title}
                          </Text>
                          <Text fontSize="xs" color="ink.500" truncate>
                            {t.meta}
                          </Text>
                        </Stack>

                        {/* Durée */}
                        <Text
                          fontFamily="ui"
                          fontSize="xs"
                          fontWeight="600"
                          color={isActive ? "brand.violet" : "ink.400"}
                        >
                          {t.length}
                        </Text>
                      </HStack>
                    );
                  })
                )}
              </Stack>

              {/* Bouton CTA principal sur Desktop avec animation captivante */}
              <Button
                asChild
                size="lg"
                rounded="full"
                px="8"
                py="6"
                mt="3"
                display={{ base: "none", lg: "inline-flex" }}
                fontFamily="ui"
                fontWeight="700"
                fontSize="md"
                bg="linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)"
                color="white"
                transition="all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
                style={{
                  animation: "ctaPulse 2.6s infinite ease-in-out",
                }}
                _hover={{
                  transform: "translateY(-3px) scale(1.02)",
                  filter: "brightness(1.08)",
                  boxShadow: "0 16px 36px -4px rgba(124, 58, 237, 0.7)",
                  "& .cta-arrow-box": {
                    transform: "translateX(6px)",
                    bg: "whiteAlpha.350",
                  },
                }}
                _active={{
                  transform: "scale(0.97)",
                }}
              >
                <NextLink href="/studio">
                  <Text as="span" fontWeight={'normal'}>Créer la mienne</Text>
                  <Flex
                    as="span"
                    align="center"
                    justify="center"
                    boxSize="28px"
                    rounded="full"
                    bg="whiteAlpha.200"
                    ml="3"
                    className="cta-arrow-box"
                    transition="all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
                  >
                    <Box
                      as="span"
                      display="inline-flex"
                      style={{
                        animation: "arrowSlide 1.4s ease-in-out infinite",
                      }}
                    >
                      <LuArrowRight size={17} />
                    </Box>
                  </Flex>
                </NextLink>
              </Button>
            </Stack>

            {/* --- COLONNE DROITE : Pochette + Disque Vinyle Épuré (Anti-Overflow, Ligne Lumineuse) --- */}
            <Box gridColumn={{ lg: "span 6" }} w="100%" overflow="hidden">
              {isLoading ? (
                <Box
                  p={{ base: "5", md: "7" }}
                  rounded="3xl"
                  bg="white"
                  borderWidth="1px"
                  borderColor="paper.200"
                  boxShadow="0 20px 45px -15px rgba(0,0,0,0.08)"
                  pos="relative"
                  overflow="hidden"
                >
                  {/* Stage Pochette Shimmer */}
                  <Box pos="relative" w="100%" mb="6" display="flex" justifyContent="center" alignItems="center">
                    <Shimmer
                      w={{ base: "215px", sm: "245px", md: "260px" }}
                      h={{ base: "215px", sm: "245px", md: "260px" }}
                      rounded="3xl"
                    />
                  </Box>

                  {/* Titre & Badges Shimmer */}
                  <Flex justify="space-between" align="baseline" mb="2" flexWrap="wrap" gap="2">
                    <Shimmer h="28px" w={{ base: "180px", sm: "230px" }} rounded="lg" />
                    <HStack gap="1.5">
                      <Shimmer h="20px" w="58px" rounded="full" />
                      <Shimmer h="20px" w="58px" rounded="full" />
                    </HStack>
                  </Flex>

                  {/* Meta info Shimmer */}
                  <Shimmer h="16px" w="190px" rounded="md" mb="5" />

                  {/* Forme d'onde + Bouton Shimmer */}
                  <HStack gap="4" align="center">
                    <ShimmerCircle size={{ md: "56px", base: "48px" }} flexShrink={0} />
                    <Stack gap="1.5" flex="1">
                      <Shimmer h="60px" rounded="lg" />
                      <Flex justify="space-between">
                        <Shimmer h="12px" w="36px" rounded="md" />
                        <Shimmer h="12px" w="36px" rounded="md" />
                      </Flex>
                    </Stack>
                  </HStack>
                </Box>
              ) : (
                <Box
                  p={{ base: "5", md: "7" }}
                  rounded="3xl"
                  bg="white"
                  borderWidth="1px"
                  borderColor="paper.200"
                  boxShadow="0 20px 45px -15px rgba(0,0,0,0.08)"
                  pos="relative"
                  overflow="hidden"
                >
                  {/* ── STAGE POCHETTE + DISQUE VINYLE ── */}
                  <Box pos="relative" w="100%" mb="6" display="flex" justifyContent="center" align="center">
                    <Box
                      pos="relative"
                      w={{ base: "215px", sm: "245px", md: "260px" }}
                      h={{ base: "215px", sm: "245px", md: "260px" }}
                      mr={isPlaying && !isBuffering ? { base: "28px", sm: "38px" } : "0px"}
                      transition="margin-right 0.6s cubic-bezier(0.16, 1, 0.3, 1)"
                    >
                      {/* Disque Vinyle en arrière-plan (bien caché initialement, sort légèrement et tourne en lecture) */}
                      <Box
                        pos="absolute"
                        top="50%"
                        transform="translateY(-50%)"
                        right={isPlaying && !isBuffering ? { base: "-38px", sm: "-50px" } : { base: "4px", sm: "6px" }}
                        boxSize={{ base: "205px", sm: "235px", md: "250px" }}
                        rounded="full"
                        zIndex={1}
                        transition="right 0.6s cubic-bezier(0.16, 1, 0.3, 1)"
                        cursor={isBuffering ? "wait" : "pointer"}
                        onClick={() => !isBuffering && togglePlay(activeTrack)}
                        title={isBuffering ? "Chargement du morceau…" : isPlaying ? "Mettre en pause" : "Lancer la lecture"}
                      >
                        {/* Corps rotatif épuré du vinyle noir */}
                        <Box
                          boxSize="100%"
                          rounded="full"
                          overflow="hidden"
                          bg="#0f1014"
                          boxShadow="0 14px 32px rgba(0,0,0,0.4)"
                          style={{
                            animation: "spinVinyl 6s linear infinite",
                            animationPlayState: isPlaying && !isBuffering ? "running" : "paused",
                            willChange: "transform",
                          }}
                          pos="relative"
                        >
                          {/* Sillons concentriques fins et discrets */}
                          <Box
                            pos="absolute"
                            inset="0"
                            rounded="full"
                            style={{
                              background:
                                "radial-gradient(circle, transparent 28%, rgba(255,255,255,0.06) 29%, rgba(0,0,0,0.45) 30%, transparent 31%, rgba(255,255,255,0.05) 38%, transparent 40%, rgba(255,255,255,0.07) 54%, rgba(0,0,0,0.45) 56%, transparent 58%, rgba(255,255,255,0.06) 72%, transparent 74%, rgba(255,255,255,0.08) 86%, rgba(0,0,0,0.4) 88%, transparent 90%)",
                            }}
                            pointerEvents="none"
                          />

                          {/* Rayon lumineux vibrant traversant le disque pour faire nettement ressentir la rotation */}
                          <Box
                            pos="absolute"
                            top="0"
                            bottom="0"
                            left="50%"
                            w="2.5px"
                            transform="translateX(-50%) rotate(40deg)"
                            bg="linear-gradient(180deg, transparent 4%, rgba(255,255,255,0.95) 25%, rgba(192,132,252,1) 50%, rgba(255,255,255,0.95) 75%, transparent 96%)"
                            boxShadow="0 0 10px rgba(255,255,255,0.9), 0 0 18px rgba(168,85,247,0.8)"
                            pointerEvents="none"
                            opacity="0.9"
                          />

                          {/* Reflet spéculaire angulaire (sheen) qui balaie le disque pendant qu'il tourne */}
                          <Box
                            pos="absolute"
                            inset="0"
                            rounded="full"
                            style={{
                              background:
                                "conic-gradient(from 40deg, transparent 0deg, rgba(255,255,255,0.2) 35deg, transparent 70deg, transparent 180deg, rgba(255,255,255,0.2) 215deg, transparent 250deg, transparent 360deg)",
                            }}
                            pointerEvents="none"
                          />

                          {/* Macaron / Image centrale du morceau */}
                          <Box
                            pos="absolute"
                            top="50%"
                            left="50%"
                            transform="translate(-50%, -50%)"
                            boxSize={{ base: "76px", sm: "88px" }}
                            rounded="full"
                            overflow="hidden"
                            borderWidth="2px"
                            borderColor="rgba(255,255,255,0.35)"
                            boxShadow="0 4px 12px rgba(0,0,0,0.5)"
                            pointerEvents="none"
                          >
                            {activeTrack?.cover ? (
                              <Image
                                src={activeTrack.cover}
                                alt={activeTrack.title}
                                boxSize="100%"
                                objectFit="cover"
                                style={{ filter: "contrast(1.08) saturate(0.95)" }}
                              />
                            ) : (
                              <Box
                                boxSize="100%"
                                bg="linear-gradient(135deg, #c2410c 0%, #ea580c 50%, #f97316 100%)"
                              />
                            )}
                            <Box pos="absolute" inset="0" bg="rgba(0,0,0,0.18)" />
                          </Box>

                          {/* Trou central / Axe du vinyle */}
                          <Box
                            pos="absolute"
                            top="50%"
                            left="50%"
                            transform="translate(-50%, -50%)"
                            boxSize="20px"
                            rounded="full"
                            bg="#08080a"
                            borderWidth="1.5px"
                            borderColor="rgba(255,255,255,0.3)"
                            boxShadow="inset 0 2px 4px rgba(0,0,0,0.8)"
                            pointerEvents="none"
                          />
                        </Box>
                      </Box>

                      {/* Pochette Principale (Premier Plan) */}
                      <Box
                        pos="relative"
                        zIndex={2}
                        w="100%"
                        h="100%"
                        rounded="3xl"
                        overflow="hidden"
                        bg="paper.200"
                        boxShadow="0 18px 40px -10px rgba(0,0,0,0.32)"
                        cursor="pointer"
                        onClick={() => togglePlay(activeTrack)}
                      >
                        {activeTrack?.cover ? (
                          <Image
                            src={activeTrack.cover}
                            alt={activeTrack.title}
                            boxSize="100%"
                            objectFit="cover"
                          />
                        ) : (
                          <Box
                            boxSize="100%"
                            background={accent.primary}
                            opacity={0.85}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>

                  

                  {/* Titre & Style du morceau actif */}
                  <Flex justify="space-between" align="baseline" mb="1" flexWrap="wrap" gap="2">
                    <Heading
                      as="h3"
                      fontFamily="heading"
                      fontWeight="800"
                      fontSize="2xl"
                      lineHeight="1.2"
                      color="ink.900"
                    >
                      {activeTrack?.title}
                    </Heading>
                    {/* <HStack gap="1.5">
                      {(activeTrack?.tags || ["DÉMO", "STUDIO"]).map((tag, idx) => (
                        <Badge
                          key={idx}
                          px="2.5"
                          py="0.5"
                          rounded="full"
                          bg="purple.50"
                          color="purple.700"
                          fontSize="2xs"
                          fontWeight="700"
                          borderWidth="1px"
                          borderColor="purple.200"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </HStack> */}
                  </Flex>

                  <Text fontSize="sm" color="ink.500" mb="5">
                    {activeTrack?.meta || "Style personnalisé pretymelo"}
                  </Text>

                  {/* Forme d'onde + Bouton Play/Pause */}
                  <HStack gap="4" align="center">
                    <IconButton
                      aria-label={isBuffering ? "Chargement en cours" : isPlaying ? "Pause" : "Lecture"}
                      onClick={() => togglePlay(activeTrack)}
                      disabled={isBuffering}
                      cursor={isBuffering ? "wait" : "pointer"}
                      boxSize={{ md: "14", base: "12" }}
                      flexShrink={0}
                      rounded="full"
                      color="white"
                      background={accent.primary}
                      boxShadow="0 8px 22px -4px rgba(139, 92, 246, 0.55)"
                      transition="all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
                      _hover={{
                        transform: isBuffering ? "none" : "scale(1.06)",
                        boxShadow: "0 10px 26px -2px rgba(139, 92, 246, 0.65)",
                      }}
                      _active={{ transform: isBuffering ? "none" : "scale(0.95)" }}
                    >
                      {isBuffering ? (
                        <Spinner size="md" color="white" borderWidth="2.5px" />
                      ) : isPlaying ? (
                        <LuPause size={24} />
                      ) : (
                        <LuPlay size={24} ml="1" />
                      )}
                    </IconButton>

                    <Stack gap="1.5" flex="1">
                      <Box
                        cursor={isBuffering ? "not-allowed" : "pointer"}
                        onClick={handleSeek}
                        pos="relative"
                        opacity={isBuffering ? 0.45 : 1}
                        filter={isBuffering ? "grayscale(40%)" : "none"}
                        transition="all 0.3s ease"
                        pointerEvents={isBuffering ? "none" : "auto"}
                      >
                        <Waveform
                          bars={46}
                          height={60}
                          animate={isPlaying && !isBuffering}
                          progress={isBuffering ? 0 : progressPercent}
                        />
                      </Box>

                      <Flex justify="space-between" fontFamily="ui" fontSize="xs" color="ink.400">
                        <Text
                          fontWeight="700"
                          color={isPlaying && !isBuffering ? "brand.violet" : "ink.500"}
                        >
                          {isBuffering ? "Chargement…" : fmt(currentTime)}
                        </Text>
                        <Text fontWeight="600">{fmt(duration)}</Text>
                      </Flex>
                    </Stack>
                  </HStack>
                </Box>
              )}

              {/* --- SECTION MOBILE : Pistes en Scroll Horizontal en dessous du Player --- */}
              <Box display={{ base: "block", lg: "none" }} mt="6" w="100%">
                <Flex justify="space-between" align="center" mb="3" px="1">
                  <Text
                    fontFamily="ui"
                    fontSize="xs"
                    fontWeight="700"
                    letterSpacing="0.08em"
                    textTransform="uppercase"
                    color="ink.500"
                  >
                    Toutes les créations · Balayer
                  </Text>
                  <Text fontFamily="ui" fontSize="2xs" color="brand.violet" fontWeight="700">
                    {tracks.length} morceau{tracks.length > 1 ? "x" : ""}
                  </Text>
                </Flex>

                {/* Rail à défilement horizontal fluide */}
                <Box
                  display="flex"
                  gap="3"
                  overflowX="auto"
                  pb="3"
                  pt="1"
                  px="1"
                  css={{
                    scrollbarWidth: "none",
                    "&::-webkit-scrollbar": { display: "none" },
                    scrollSnapType: "x mandatory",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  {isLoading ? (
                    [1, 2, 3, 4].map((i) => (
                      <HStack
                        key={i}
                        minW="220px"
                        maxW="250px"
                        flexShrink={0}
                        scrollSnapAlign="start"
                        gap="3"
                        p="2.5"
                        px="3"
                        rounded="2xl"
                        bg="paper.100"
                        borderWidth="1px"
                        borderColor="transparent"
                      >
                        <Shimmer boxSize="11" rounded="xl" flexShrink={0} />
                        <Stack gap="2" flex="1" minW="0">
                          <Shimmer h="14px" w="70%" rounded="md" />
                          <Shimmer h="10px" w="50%" rounded="md" />
                        </Stack>
                      </HStack>
                    ))
                  ) : (
                    tracks.map((t) => {
                      const isActive = t.id === activeTrackId;
                      const isCurrentPlaying = isActive && isPlaying && !isBuffering;
                      const isCurrentBuffering = isActive && isBuffering;

                      return (
                        <HStack
                          key={t.id}
                          minW="220px"
                          maxW="250px"
                          flexShrink={0}
                          scrollSnapAlign="start"
                          gap="3"
                          p="2.5"
                          px="3"
                          rounded="2xl"
                          cursor="pointer"
                          transition="all 0.2s ease"
                          bg={isActive ? "white" : "paper.100"}
                          borderWidth="1.5px"
                          borderColor={isActive ? "brand.violet" : "paper.200"}
                          boxShadow={
                            isActive
                              ? "0 8px 20px -4px rgba(139, 92, 246, 0.2)"
                              : "none"
                          }
                          _hover={{
                            bg: "white",
                            borderColor: isActive ? "brand.violet" : "paper.300",
                          }}
                          onClick={() => togglePlay(t)}
                        >
                          {/* Vignette miniature */}
                          <Box
                            pos="relative"
                            boxSize="11"
                            rounded="xl"
                            overflow="hidden"
                            flexShrink={0}
                            bg="paper.200"
                          >
                            {t.coverUrl || t.cover ? (
                              <Image
                                src={t.coverUrl || t.cover}
                                alt={t.title}
                                boxSize="100%"
                                objectFit="cover"
                              />
                            ) : (
                              <Flex boxSize="100%" align="center" justify="center" bg={accent.primary} color="white">
                                <LuVolume2 size={16} />
                              </Flex>
                            )}

                            {/* Overlay Bouton Play / Égaliseur / Spinner */}
                            <Flex
                              pos="absolute"
                              inset="0"
                              bg={isCurrentPlaying || isCurrentBuffering ? "rgba(124, 58, 237, 0.6)" : "rgba(0,0,0,0.3)"}
                              align="center"
                              justify="center"
                              color="white"
                              backdropFilter={isCurrentPlaying || isCurrentBuffering ? "blur(1px)" : "none"}
                            >
                              {isCurrentBuffering ? (
                                <Spinner size="xs" color="white" borderWidth="2px" />
                              ) : isCurrentPlaying ? (
                                <HStack gap="0.5" align="flex-end" h="10px">
                                  <Box w="2px" h="100%" bg="white" rounded="full" animation="wave 0.8s ease-in-out infinite" />
                                  <Box w="2px" h="60%" bg="white" rounded="full" animation="wave 0.8s ease-in-out 0.2s infinite" />
                                  <Box w="2px" h="85%" bg="white" rounded="full" animation="wave 0.8s ease-in-out 0.4s infinite" />
                                </HStack>
                              ) : (
                                <LuPlay size={14} ml="0.5" />
                              )}
                            </Flex>
                          </Box>

                          {/* Infos morceau */}
                          <Stack gap="0" flex="1" minW="0">
                            <Text
                              fontFamily="heading"
                              fontWeight={isActive ? "700" : "600"}
                              fontSize="xs"
                              color={isActive ? "brand.violet" : "ink.900"}
                              truncate
                            >
                              {t.title}
                            </Text>
                            <Text fontSize="2xs" color="ink.500" truncate>
                              {t.genre || "Pop"} · {t.length}
                            </Text>
                          </Stack>
                        </HStack>
                      );
                    })
                  )}
                </Box>

                {/* Bouton CTA pour Mobile sous le scroll horizontal */}
                <Button
                  asChild
                  size="lg"
                  p={6}
                  rounded="full"
                  w="100%"
                  mt="4"
                  fontFamily="ui"
                  background={accent.primary}
                  color="white"
                  _hover={{ opacity: 0.9 }}
                  boxShadow="0 10px 20px -5px rgba(139, 92, 246, 0.3)"
                >
                  <NextLink href="/studio">
                    Créer la mienne <LuArrowRight />
                  </NextLink>
                </Button>
              </Box>
            </Box>
          </SimpleGrid>
        </Reveal>
      </Container>
    </Box>
  );
}