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
  Stack,
  Text,
} from "@chakra-ui/react";
import { LuArrowRight, LuDownload, LuPlay, LuPause, LuVolume2 } from "react-icons/lu";
import Reveal from "@/components/common/Reveal";
import Waveform from "@/components/common/Waveform";
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
  const [activeTrackId, setActiveTrackId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
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
      }
    }

    loadPublicTracks();
    return () => {
      isMounted = false;
    };
  }, []);

  const activeTrack = tracks.find((t) => t.id === activeTrackId) || tracks[0] || fallbackTracks[0];

  // Gestion de la balise Audio HTML5
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, [activeTrackId]);

  const togglePlay = (t) => {
    const audio = audioRef.current;
    const target = t || activeTrack;

    if (!target) return;

    if (activeTrackId === target.id) {
      if (isPlaying) {
        if (audio) audio.pause();
        setIsPlaying(false);
      } else {
        if (audio && target.audioUrl) {
          audio.play().catch(() => {});
          setIsPlaying(true);
        } else {
          // Simulation si aucun flux audio réel
          setIsPlaying(true);
        }
      }
    } else {
      setActiveTrackId(target.id);
      setCurrentTime(0);
      setDuration(target.durationSeconds || 60);

      if (audio && target.audioUrl) {
        audio.src = target.audioUrl;
        audio.play().catch(() => {});
        setIsPlaying(true);
      } else {
        setIsPlaying(true);
      }
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pos * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) : 0;

  return (
    <Box as="section" id="examples" py={{ base: "16", md: "24" }} bg="paper.50">
      {/* Audio element invisible */}
      <audio ref={audioRef} preload="metadata" />

      <Container maxW="7xl">
        <Reveal>
          <SimpleGrid
            columns={{ base: 1, lg: 12 }}
            gap={{ base: "10", lg: "12" }}
            alignItems="center"
          >
            {/* --- COLONNE GAUCHE : Textes, Sélection de pistes & CTA --- */}
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
                  Écoutez les démos officielles créées en quelques secondes avec notre moteur IA.
                </Text>
              </Stack>

              {/* Sous-titre indicatif */}
              <Text
                fontFamily="ui"
                fontSize="xs"
                fontWeight="700"
                letterSpacing="0.1em"
                textTransform="uppercase"
                color="ink.400"
                mt="2"
              >
                {tracks.length} morceau{tracks.length > 1 ? "x" : ""}  {tracks.length} histoires, {tracks.length} émotions
              </Text>

              {/* Liste interactives des morceaux */}
              <Stack gap="2.5" w="100%" maxW="lg">
                {tracks.map((t) => {
                  const isActive = t.id === activeTrackId;
                  const isCurrentPlaying = isActive && isPlaying;

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
                        {(t.coverUrl || t.cover) ? (
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

                        {/* Overlay Bouton Play */}
                        <Flex
                          pos="absolute"
                          inset="0"
                          bg="rgba(0,0,0,0.3)"
                          align="center"
                          justify="center"
                          color="white"
                        >
                          {isCurrentPlaying ? <LuPause size={16} /> : <LuPlay size={16} ml="0.5" />}
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
                })}
              </Stack>

              {/* Bouton CTA principal */}
              <Button
                asChild
                size="lg"
                rounded="full"
                px="8"
                mt="2"
                fontFamily="ui"
                background={accent.primary}
                color="white"
                _hover={{ opacity: 0.9, transform: "translateY(-1px)" }}
                boxShadow="0 10px 20px -5px rgba(139, 92, 246, 0.3)"
              >
                <NextLink href="/studio">
                  Créer la mienne <LuArrowRight />
                </NextLink>
              </Button>
            </Stack>

            {/* --- COLONNE DROITE : Player Principal Grand Format --- */}
            <Box  gridColumn={{ lg: "span 6" }}>
              <Box
                p={{ base: "6", md: "8" }}
                rounded="3xl"
                bg="white"
                borderWidth="1px"
                borderColor="paper.200"
                boxShadow="0 20px 45px -15px rgba(0,0,0,0.08)"
                pos="relative"
              >
                {/* Pochette + Vinyle */}
                <Box pos="relative" w="100%" mb="6">
                  <Flex
                    justify="center"
                    align="center"
                    pos="relative"
                    mx="auto"
                    maxW="360px"
                  >
                    {/* Disque Vinyle animé en arrière-plan */}
                    <Box
                      pos="absolute"
                      right={isPlaying ? "-25px" : "-10px"}
                      boxSize="220px"
                      rounded="full"
                      bg="#111"
                      borderWidth="4px"
                      borderColor="rgba(255,255,255,0.12)"
                      boxShadow="0 15px 35px rgba(0,0,0,0.4)"
                      transition="right 0.4s ease"
                      display={{ base: "none", sm: "block" }}
                    >
                      <Flex
                        boxSize="100%"
                        align="center"
                        justify="center"
                        rounded="full"
                      >
                        <Box boxSize="80px" rounded="full" bg="brand.violetDeep" opacity={0.8} />
                      </Flex>
                    </Box>

                    {/* Pochette Principale */}
                    <Box
                      pos="relative"
                      zIndex={1}
                      w="100%"
                      h="260px"
                      rounded="2xl"
                      overflow="hidden"
                      bg="paper.200"
                      boxShadow="0 15px 30px rgba(0,0,0,0.15)"
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

                      {/* Badges de Tags sur la pochette */}
                      <HStack pos="absolute" bottom="4" left="4" gap="2">
                        {(activeTrack?.tags || ["DÉMO", "STUDIO"]).map(
                          (tag, idx) => (
                            <Badge
                              key={idx}
                              px="3"
                              py="1"
                              rounded="full"
                              bg="rgba(0,0,0,0.7)"
                              backdropFilter="blur(8px)"
                              color="white"
                              fontSize="xs"
                              fontWeight="600"
                              borderWidth="1px"
                              borderColor="whiteAlpha.300"
                            >
                              {tag}
                            </Badge>
                          )
                        )}
                      </HStack>
                    </Box>
                  </Flex>
                </Box>

                {/* Status indicator & Actions */}
                <Flex justify="space-between" align="center" mb="2">
                  <HStack gap="2">
                    <Box
                      boxSize="2.5"
                      rounded="full"
                      bg={isPlaying ? "green.400" : "brand.violet"}
                      animation={isPlaying ? "pulse 1.5s infinite" : "none"}
                    />
                    <Text
                      fontFamily="ui"
                      fontSize="xs"
                      fontWeight="700"
                      letterSpacing="0.08em"
                      textTransform="uppercase"
                      color="brand.violet"
                    >
                      {isPlaying ? "En cours de lecture" : "Prêt à écouter"}
                    </Text>
                  </HStack>

                  {/* Bouton de téléchargement */}
                  {activeTrack?.audioUrl && (
                    <Button
                      size="xs"
                      variant="ghost"
                      rounded="full"
                      color="ink.600"
                      onClick={() => downloadTrackAudio(activeTrack)}
                    >
                      <LuDownload size={13} /> Télécharger
                    </Button>
                  )}
                </Flex>

                {/* Titre & Style du morceau actif */}
                <Heading
                  as="h3"
                  fontFamily="heading"
                  fontWeight="800"
                  fontSize="2xl"
                  lineHeight="1.2"
                  mb="1"
                  color="ink.900"
                >
                  {activeTrack?.title}
                </Heading>
                <Text fontSize="sm" color="ink.500" mb="5">
                  {activeTrack?.meta || "Style personnalisé"}
                </Text>

                {/* Forme d'onde + Bouton Play/Pause */}
                <HStack gap="4" align="center">
                  <IconButton
                    aria-label={isPlaying ? "Pause" : "Lecture"}
                    onClick={() => togglePlay(activeTrack)}
                    boxSize={{ md: "14", base: "12" }}
                    flexShrink={0}
                    rounded="full"
                    color="white"
                    background={accent.primary}
                    boxShadow="0 8px 20px -4px rgba(139, 92, 246, 0.5)"
                    transition="transform 0.2s ease"
                    _hover={{ transform: "scale(1.05)" }}
                    _active={{ transform: "scale(0.95)" }}
                  >
                    {isPlaying ? <LuPause size={24} /> : <LuPlay size={24} ml="1" />}
                  </IconButton>

                  <Stack gap="1.5" flex="1">
                    <Box cursor="pointer" onClick={handleSeek} pos="relative">
                      <Waveform
                        bars={46}
                        height={64}
                        progress={progressPercent > 0 ? progressPercent : (isPlaying ? 0.35 : 0.05)}
                      />
                    </Box>

                    <Flex justify="space-between" fontFamily="ui" fontSize="xs" color="ink.400">
                      <Text fontWeight="600">{fmt(currentTime)}</Text>
                      <Text>{fmt(duration)}</Text>
                    </Flex>
                  </Stack>
                </HStack>
              </Box>
            </Box>
          </SimpleGrid>
        </Reveal>
      </Container>
    </Box>
  );
}