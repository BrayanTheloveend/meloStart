"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Button, Flex, HStack, IconButton, Slider, Stack, Text } from "@chakra-ui/react";
import { LuDownload, LuHeart, LuPause, LuPlay, LuVolume2, LuX } from "react-icons/lu";
import Waveform from "@/components/common/Waveform";
import { accent } from "@/theme/system";

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export default function StudioPlayerBar({ track, isPlaying, onTogglePlay, onClose, onToggleFavorite }) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(track?.seconds ?? 60);
  const audioRef = useRef(null);

  // Synchronisation de la durée et réinitialisation au changement de piste
  useEffect(() => {
    setCurrentTime(0);
    setDuration(track?.seconds ?? (track?.duration || 60));
  }, [track?.id, track?.seconds, track?.duration]);

  // Gestion de la lecture réelle via élément HTML5 Audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, track?.audioUrl]);

  // Simulation timer si pas d'audioUrl
  useEffect(() => {
    if (!isPlaying || track?.audioUrl) return;
    const interval = setInterval(() => {
      setCurrentTime((t) => {
        if (t >= duration) {
          onTogglePlay(false);
          return 0;
        }
        return t + 0.25;
      });
    }, 250);
    return () => clearInterval(interval);
  }, [isPlaying, duration, onTogglePlay, track?.audioUrl]);

  const handleDownload = () => {
    if (!track) return;
    if (track.audioUrl) {
      const a = document.createElement("a");
      a.href = track.audioUrl;
      a.download = `${track.title || "melostars-track"}.mp3`;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      alert(`Téléchargement de « ${track.title} » au format MP3 en cours…`);
    }
  };

  if (!track) return null;

  return (
    <Box
      position="fixed"
      bottom={{ base: "82px", lg: "0" }}
      left={{ base: "3", lg: "288px" }}
      right={{ base: "3", lg: "0" }}
      zIndex="44"
      bg="rgba(255, 255, 255, 0.9)"
      backdropFilter="blur(20px) saturate(180%)"
      borderWidth={{ base: "1px", lg: "1px 0 0 0" }}
      borderColor={{ base: "rgba(255, 255, 255, 0.65)", lg: "paper.200" }}
      rounded={{ base: "2xl", lg: "none" }}
      boxShadow={{ base: "0 10px 30px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.5) inset", lg: "0 -10px 30px rgba(0, 0, 0, 0.08)" }}
      px={{ base: "3.5", md: "8" }}
      py={{ base: "2", md: "3" }}
    >
      {track.audioUrl && (
        <audio
          ref={audioRef}
          src={track.audioUrl}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => {
            if (e.currentTarget.duration && !isNaN(e.currentTarget.duration)) {
              setDuration(e.currentTarget.duration);
            }
          }}
          onEnded={() => {
            onTogglePlay(false);
            setCurrentTime(0);
          }}
          onError={() => {
            console.warn("[StudioPlayerBar] Erreur lecture fichier audio.");
          }}
        />
      )}

      <Flex align="center" justify="space-between" gap="4">
        {/* Infos morceau */}
        <HStack gap="3" minW="0" maxW={{ base: "200px", sm: "300px" }}>
          <Box
            boxSize="10"
            rounded="xl"
            background={track.coverGradient || "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)"}
            display="flex"
            alignItems="center"
            justifyContent="center"
            color="white"
            fontSize="sm"
            flexShrink={0}
          >
            🎵
          </Box>
          <Stack gap="0" minW="0">
            <Text fontFamily="heading" fontWeight="700" fontSize="sm" color="ink.900" truncate>
              {track.title}
            </Text>
            <Text fontSize="xs" color="ink.500" truncate>
              {track.meta}
            </Text>
          </Stack>
        </HStack>

        {/* Contrôles centraux (Lecture + Barre de progression) */}
        <Flex direction="column" align="center" gap="1" flex="1" maxW="480px">
          <HStack gap="3">
            <IconButton
              aria-label={isPlaying ? "Pause" : "Play"}
              size="sm"
              rounded="full"
              color="white"
              background={accent.primary}
              onClick={() => onTogglePlay()}
            >
              {isPlaying ? <LuPause size={16} /> : <LuPlay size={16} />}
            </IconButton>
            <Text fontSize="xs" fontFamily="ui" color="ink.500">
              {fmt(currentTime)} / {fmt(duration)}
            </Text>
          </HStack>

          {/* Barre de défilement */}
          <Box w="full" h="1.5" bg="paper.200" rounded="full" overflow="hidden" position="relative">
            <Box
              h="full"
              w={`${duration > 0 ? (currentTime / duration) * 100 : 0}%`}
              bg={accent.primary}
              rounded="full"
              transition="width 0.25s linear"
            />
          </Box>
        </Flex>

        {/* Outils et fermeture */}
        <HStack gap="2">
          <IconButton
            aria-label="Favoris"
            size="sm"
            variant="ghost"
            rounded="full"
            color={track.isFavorite ? "red.500" : "ink.400"}
            onClick={() => onToggleFavorite && onToggleFavorite(track.id)}
          >
            <LuHeart size={16} fill={track.isFavorite ? "currentColor" : "none"} />
          </IconButton>

          <Button
            size="xs"
            rounded="full"
            variant="outline"
            borderColor="paper.300"
            display={{ base: "none", sm: "inline-flex" }}
            onClick={handleDownload}
          >
            <LuDownload size={13} /> Télécharger
          </Button>

          <IconButton size="sm" variant="ghost" rounded="full" onClick={onClose} aria-label="Fermer le lecteur">
            <LuX size={16} />
          </IconButton>
        </HStack>
      </Flex>
    </Box>
  );
}
