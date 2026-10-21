"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Flex, HStack, IconButton, Stack, Text, Badge } from "@chakra-ui/react";
import { LuPlay, LuPause, LuMicVocal, LuDownload } from "react-icons/lu";
import Waveform from "@/components/common/Waveform";
import { accent } from "@/theme/system";
import { downloadTrackAudio } from "@/lib/downloadTrack";

const fmt = (s) => {
  if (isNaN(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
};

/** Petite carte flottante en verre dépoli, posée autour du lecteur. */
function FloatCard({ children, delay = "0s", ...pos }) {
  return (
    <Flex
      position="absolute"
      display={{ base: "none", md: "flex" }}
      align="center"
      gap="3"
      px="4"
      py="3"
      rounded="2xl"
      bg="rgba(255,255,255,0.9)"
      backdropFilter="blur(14px)"
      borderWidth="1px"
      borderColor="paper.300"
      boxShadow="0 12px 32px rgba(24,24,27,0.10)"
      animation={`floatY 6s ease-in-out ${delay} infinite`}
      {...pos}
    >
      {children}
    </Flex>
  );
}

/** Lecteur interactif du hero : connecté à la première musique publique / démo du site. */
export default function HeroPlayer() {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(75);
  const [track, setTrack] = useState({
    title: "Joyeux anniversaire, Amina",
    prompt: "« Une chanson afrobeat joyeuse pour l'anniversaire de ma sœur Amina, avec des paroles en français. »",
    meta: "Afrobeat · Joyeux · 108 BPM",
    vocalDesc: "Féminine, chaleureuse",
    audioUrl: null,
  });

  const audioRef = useRef(null);

  // Chargement de la première musique démo publique
  useEffect(() => {
    let isMounted = true;
    async function fetchTopDemo() {
      try {
        const res = await fetch("/api/tracks?public=true&limit=1");
        const json = await res.json().catch(() => null);

        if (isMounted && json?.data?.[0]) {
          const t = json.data[0];
          setTrack({
            id: t.id,
            title: t.title,
            prompt: t.prompt ? `« ${t.prompt} »` : "« Une mélodie personnalisée créée avec melostars. »",
            meta: `${t.genre || "Afrobeat"} · ${t.moods?.[0] || "Joyeux"} · Studio HD`,
            vocalDesc: t.vocalType === "female" ? "Féminine, chaleureuse" : t.vocalType === "male" ? "Masculine, expressive" : "Instrumental pur",
            audioUrl: t.audioUrl,
            duration: t.duration || 60,
          });
          if (t.duration) setDuration(t.duration);
        }
      } catch (_) {}
    }

    fetchTopDemo();
    return () => {
      isMounted = false;
    };
  }, []);

  // Gestion des événements audio
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
      setPlaying(false);
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
  }, [track.audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (playing) {
      if (audio) audio.pause();
      setPlaying(false);
    } else {
      if (audio && track.audioUrl) {
        audio.src = track.audioUrl;
        audio.play().catch(() => {});
        setPlaying(true);
      } else {
        setPlaying(true);
      }
    }
  };

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <Box position="relative" maxW="3xl" mx="auto" mt={{ base: "12", md: "16" }}>
      {/* Balise audio invisible */}
      <audio ref={audioRef} preload="metadata" />

      <Box
        position="relative"
        p={{ base: "5", md: "7" }}
        rounded="3xl"
        bg="rgba(255,255,255,0.92)"
        backdropFilter="blur(18px)"
        borderWidth="1px"
        borderColor="paper.300"
        boxShadow="0 24px 60px rgba(24,24,27,0.10)"
      >
        <Flex justify="space-between" align="start" gap="4" mb="6">
          <Stack gap="1" textAlign="left">
            <Text fontFamily="ui" fontSize="sm" color="ink.500">
              Description de l&apos;utilisateur
            </Text>
            <Text fontSize={{ base: "sm", md: "md" }} color="ink.700" maxW="md">
              {track.prompt}
            </Text>
          </Stack>
          <Badge flexShrink={0} px="3" py="1" rounded="full" bg="rgba(6,182,212,0.15)" color="brand.cyanDeep" fontFamily="ui">
            Démo d&apos;accueil
          </Badge>
        </Flex>

        <HStack gap="4" align="center">
          <IconButton
            aria-label={playing ? "Mettre en pause" : "Écouter l'exemple"}
            onClick={togglePlay}
            boxSize="14"
            rounded="full"
            color="white"
            background={accent.primary}
            _hover={{ transform: "scale(1.06)" }}
            transition="transform .2s"
          >
            {playing ? <LuPause size={22} /> : <LuPlay size={22} ml="0.5" />}
          </IconButton>
          <Stack gap="0" textAlign="left" flex="1" minW="0">
            <Text fontFamily="heading" fontWeight="700" fontSize="lg" truncate color="ink.900">
              {track.title}
            </Text>
            <Text fontSize="sm" color="ink.500">
              {track.meta}
            </Text>
          </Stack>
          <Text fontFamily="ui" fontSize="sm" color="ink.500" flexShrink={0}>
            {fmt(currentTime)} / {fmt(duration)}
          </Text>
        </HStack>

        <Box mt="6">
          <Waveform bars={56} height={72} animate={playing} progress={progress > 0 ? progress : (playing ? 0.35 : 0.08)} />
        </Box>
      </Box>

      {/* Cartes flottantes informatives */}
      <FloatCard bottom="30px" right="-72px" delay="1.5s">
        <Flex boxSize="9" rounded="lg" bg="rgba(236,72,153,0.2)" color="brand.pink" align="center" justify="center">
          <LuMicVocal />
        </Flex>
        <Stack gap="0" textAlign="left">
          <Text fontSize="xs" color="ink.500">Voix</Text>
          <Text fontFamily="ui" fontSize="sm" fontWeight="600">{track.vocalDesc}</Text>
        </Stack>
      </FloatCard>

      <FloatCard
        bottom="-26px"
        left="40px"
        delay="3s"
        cursor={track.audioUrl ? "pointer" : "default"}
        onClick={() => track.audioUrl && downloadTrackAudio(track)}
      >
        <Flex boxSize="9" rounded="lg" bg="rgba(6,182,212,0.2)" color="brand.cyanDeep" align="center" justify="center">
          <LuDownload />
        </Flex>
        <Stack gap="0" textAlign="left">
          <Text fontSize="xs" color="ink.500">Export</Text>
          <Text fontFamily="ui" fontSize="sm" fontWeight="600">MP3 · WAV</Text>
        </Stack>
      </FloatCard>
    </Box>
  );
}
