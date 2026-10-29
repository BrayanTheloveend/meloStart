"use client";
import { useRef, useState, useEffect } from "react";
import {
  Badge, Box, Button, Flex, HStack, Image, Stack, Text,
} from "@chakra-ui/react";
import { LuCheck, LuCopy, LuDownload, LuHeart, LuGlobe, LuLock, LuRotateCcw } from "react-icons/lu";
import Waveform from "@/components/common/Waveform";
import { downloadTrackAudio } from "@/lib/downloadTrack";
import { parseSpotifyLyrics, fmt } from "./constants";

/**
 * Écran final après génération réussie.
 * - Light mode premium
 * - Mobile : lyrics fullscreen avec mini-player collé en bas
 * - Desktop : 2 colonnes (player gauche | lyrics droite)
 */
export default function TrackPlayer({
  track,
  musicStyle,
  selectedVoiceData,
  model,
  lyrics: customLyrics = "",
  customTitle = "",
  onReset,
  onToggleFavorite,
  onTogglePublic,
}) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(
    Number(track.seconds || track.duration) || 180
  );
  const [copiedLyrics, setCopiedLyrics] = useState(false);
  const [localTrack, setLocalTrack] = useState(track);
  // mobile: "player" | "lyrics"
  const [mobileTab, setMobileTab] = useState("player");

  useEffect(() => {
    setLocalTrack(track);
    setCurrentTime(0);
    setIsPlaying(false);
    const d = Number(track.seconds || track.duration) || 180;
    setTotalDuration(d);
  }, [track]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play().catch(() => {}); setIsPlaying(true); }
  };

  const rawLyrics = localTrack.lyrics || customLyrics || "";
  const { parsed: lyricsList, totalLyricLines } = parseSpotifyLyrics(rawLyrics);
  const activeLyricIndex =
    isPlaying && totalLyricLines > 0 && totalDuration > 0
      ? Math.min(totalLyricLines - 1, Math.floor((currentTime / totalDuration) * totalLyricLines))
      : -1;

  const handleLyricClick = (lineIndex) => {
    if (totalLyricLines <= 0) return;
    const t = (lineIndex / totalLyricLines) * (totalDuration || 180);
    if (audioRef.current) audioRef.current.currentTime = t;
    setCurrentTime(t);
  };

  const handleCopyLyrics = () => {
    if (!rawLyrics) return;
    navigator.clipboard.writeText(rawLyrics);
    setCopiedLyrics(true);
    setTimeout(() => setCopiedLyrics(false), 2000);
  };

  // ── Cover: priority = uploaded coverUrl > track.coverUrl > gradient fallback
  const displayCover = localTrack.coverUrl || null;

  // ─────────────────── Shared: audio element ───────────────────
  const AudioEl = localTrack?.audioUrl ? (
    <audio
      ref={audioRef}
      src={localTrack.audioUrl}
      preload="metadata"
      onLoadedMetadata={(e) => {
        const d = e.currentTarget.duration;
        if (d && !isNaN(d) && d > 0) setTotalDuration(d);
      }}
      onTimeUpdate={() => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
          const d = audioRef.current.duration;
          if (d && !isNaN(d) && d > 0) setTotalDuration(d);
        }
      }}
      onEnded={() => { setIsPlaying(false); setCurrentTime(0); }}
      onPause={() => setIsPlaying(false)}
      onPlay={() => setIsPlaying(true)}
    />
  ) : null;

  // ─────────────────── PlayButton ───────────────────
  const PlayButton = ({ size = "lg" }) => (
    <Box
      as="button" type="button"
      onClick={togglePlay}
      w={size === "lg" ? "14" : "10"}
      h={size === "lg" ? "14" : "10"}
      rounded="full"
      bg="ink.900"
      color="white"
      display="flex" alignItems="center" justifyContent="center"
      flexShrink={0}
      boxShadow="0 4px 18px rgba(0,0,0,0.18)"
      _hover={{ transform: "scale(1.05)", boxShadow: "0 6px 24px rgba(0,0,0,0.25)" }}
      _active={{ transform: "scale(0.96)" }}
      transition="all 0.2s"
      aria-label={isPlaying ? "Pause" : "Écouter"}
    >
      {isPlaying
        ? (
          <svg width={size === "lg" ? 20 : 14} height={size === "lg" ? 20 : 14} viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width={size === "lg" ? 20 : 14} height={size === "lg" ? 20 : 14} viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: "2px" }}>
            <path d="M5 3l14 9-14 9V3z" />
          </svg>
        )
      }
    </Box>
  );

  // ─────────────────── Player column ───────────────────
  const PlayerColumn = () => (
    <Stack gap="5" textAlign="center">
      {/* Artwork */}
      <Box position="relative" mx="auto"
        boxSize={{ base: "200px", sm: "220px" }}
        rounded="2xl" overflow="hidden"
        borderWidth="1px" borderColor="paper.200"
        boxShadow="0 16px 48px rgba(0,0,0,0.12)"
      >
        {displayCover ? (
          <Image src={displayCover} alt={localTrack.title || "Pochette"} w="full" h="full" objectFit="cover" />
        ) : (
          <Flex w="full" h="full" align="center" justify="center"
            bg="linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)">
            <Text fontSize="5xl">🎵</Text>
          </Flex>
        )}
        {/* Playing indicator */}
        {isPlaying && (
          <Flex
            position="absolute" bottom="2.5" right="2.5"
            bg="rgba(255,255,255,0.9)" backdropFilter="blur(8px)"
            rounded="full" px="2" py="1" gap="1" align="center"
            boxShadow="0 2px 8px rgba(0,0,0,0.15)"
          >
            {[1, 2, 3].map((i) => (
              <Box key={i} w="2.5px" bg="brand.violetDeep" rounded="full"
                style={{
                  height: `${8 + i * 3}px`,
                  animation: `wave ${0.5 + i * 0.15}s ease-in-out infinite alternate`,
                  transformOrigin: "bottom",
                }} />
            ))}
          </Flex>
        )}
      </Box>

      {/* Title & badges */}
      <Stack gap="1.5">
        <Text fontFamily="heading" fontWeight="800"
          fontSize={{ base: "xl", sm: "2xl" }}
          color="ink.900" letterSpacing="-0.02em" noOfLines={2}>
          {localTrack.title || customTitle || "Morceau sans titre"}
        </Text>
        <HStack justify="center" wrap="wrap" gap="1.5">
          <Badge px="2.5" py="0.5" rounded="full"
            bg="brand.violetTint" color="brand.violetDeep"
            fontSize="2xs" fontWeight="700">
            {localTrack.genre || musicStyle}
          </Badge>
          <Badge px="2" py="0.5" rounded="full"
            bg="paper.100" color="ink.600" fontSize="2xs">
            {selectedVoiceData?.title}
          </Badge>
          <Badge px="2" py="0.5" rounded="full"
            bg="paper.100" color="ink.500" fontSize="2xs">
            {model}
          </Badge>
        </HStack>
      </Stack>

      {/* Audio Player */}
      <Box p="4" rounded="2xl" bg="paper.0" borderWidth="1px" borderColor="paper.200">
        {AudioEl}
        <Waveform
          bars={34} height={38} animate={isPlaying}
          color="#7c3aed"
          currentTime={currentTime}
          duration={totalDuration}
          onSeek={(t) => {
            if (audioRef.current) audioRef.current.currentTime = t;
            setCurrentTime(t);
          }}
        />
        <Flex justify="space-between" mt="2" fontSize="2xs" color="ink.500" fontFamily="ui">
          <Text>{fmt(currentTime)}</Text>
          <Text>{fmt(totalDuration)}</Text>
        </Flex>
        <Flex justify="center" my="2">
          <PlayButton size="lg" />
        </Flex>
      </Box>

      {/* Actions */}
      <Stack gap="2">
        {/* Favoris + Public toggle */}
        <HStack gap="2" justify="center">
          {onToggleFavorite && localTrack?.id && (
            <Box as="button" type="button"
              onClick={() => {
                onToggleFavorite(localTrack.id);
                setLocalTrack((p) => p ? { ...p, isFavorite: !p.isFavorite } : p);
              }}
              display="flex" alignItems="center" gap="1.5"
              px="3" py="1.5" rounded="full"
              bg={localTrack.isFavorite ? "red.50" : "paper.100"}
              borderWidth="1px"
              borderColor={localTrack.isFavorite ? "red.200" : "paper.200"}
              color={localTrack.isFavorite ? "red.600" : "ink.500"}
              fontSize="xs" fontWeight="600"
              _hover={{ bg: "red.50", borderColor: "red.200", color: "red.600" }}
              transition="all 0.15s"
            >
              <LuHeart size={14} fill={localTrack.isFavorite ? "currentColor" : "none"} />
              {localTrack.isFavorite ? "Favori" : "Ajouter aux favoris"}
            </Box>
          )}
          {onTogglePublic && localTrack?.id && (
            <Box as="button" type="button"
              onClick={() => {
                onTogglePublic(localTrack.id);
                setLocalTrack((p) => p ? { ...p, isPublic: !p.isPublic } : p);
              }}
              display="flex" alignItems="center" gap="1.5"
              px="3" py="1.5" rounded="full"
              bg={localTrack.isPublic ? "green.50" : "paper.100"}
              borderWidth="1px"
              borderColor={localTrack.isPublic ? "green.200" : "paper.200"}
              color={localTrack.isPublic ? "green.700" : "ink.500"}
              fontSize="xs" fontWeight="600"
              _hover={{ bg: "green.50", borderColor: "green.200", color: "green.700" }}
              transition="all 0.15s"
            >
              {localTrack.isPublic ? <LuGlobe size={13} /> : <LuLock size={13} />}
              {localTrack.isPublic ? "Public" : "Privé"}
            </Box>
          )}
        </HStack>

        <Button size="sm" rounded="full"
          bg="ink.900" color="white"
          _hover={{ bg: "ink.700" }}
          onClick={() => downloadTrackAudio(localTrack)}
          fontFamily="ui" fontWeight="700" gap="2" w="full" h="10">
          <LuDownload size={14} /> Télécharger le MP3
        </Button>

        <Button size="sm" rounded="full" variant="outline"
          borderColor="paper.300" color="brand.violetDeep"
          _hover={{ bg: "brand.violetTint" }}
          onClick={onReset}
          fontFamily="ui" fontWeight="700" gap="1.5" w="full">
          <LuRotateCcw size={14} /> Composer une autre chanson
        </Button>
      </Stack>
    </Stack>
  );

  // ─────────────────── Lyrics column (scrollable) ───────────────────
  const LyricsColumn = () => (
    <Box
      bg="paper.0" rounded="2xl"
      borderWidth="1px" borderColor="paper.200"
      boxShadow="0 4px 24px rgba(0,0,0,0.04)"
      p={{ base: "4", sm: "6" }}
      textAlign="left"
      display="flex" flexDirection="column"
      minH={{ base: "450px", lg: "520px" }}
    >
      {/* Header */}
      <Flex justify="space-between" align="center" mb="4" pb="3"
        borderBottomWidth="1px" borderColor="paper.200">
        <HStack gap="2">
          <Box w="2" h="2" rounded="full" bg={isPlaying ? "green.500" : "paper.400"} />
          <Text fontFamily="heading" fontSize="xs" fontWeight="900"
            letterSpacing="0.08em" color="ink.700" textTransform="uppercase">
            Paroles
          </Text>
          {totalLyricLines > 0 && (
            <Badge size="xs" bg="paper.100" color="ink.500" rounded="full">
              {totalLyricLines} vers
            </Badge>
          )}
        </HStack>
        {rawLyrics.trim() && (
          <Box as="button" type="button"
            onClick={handleCopyLyrics}
            display="flex" alignItems="center" gap="1.5"
            px="2.5" py="1" rounded="full"
            bg={copiedLyrics ? "green.50" : "paper.100"}
            borderWidth="1px"
            borderColor={copiedLyrics ? "green.200" : "paper.200"}
            color={copiedLyrics ? "green.700" : "ink.500"}
            fontSize="2xs" fontWeight="600"
            _hover={{ bg: "paper.200" }}
            transition="all 0.15s"
          >
            {copiedLyrics ? <LuCheck size={11} /> : <LuCopy size={11} />}
            {copiedLyrics ? "Copié !" : "Copier"}
          </Box>
        )}
      </Flex>

      {/* Lyrics scroll zone */}
      <Box
        flex="1" overflowY="auto" pr="1"
        css={{
          "&::-webkit-scrollbar": { width: "4px" },
          "&::-webkit-scrollbar-thumb": { background: "rgba(0,0,0,0.12)", borderRadius: "8px" },
        }}
      >
        {lyricsList.length > 0 ? (
          <Stack gap="0.5" py="2">
            {lyricsList.map((line) => {
              if (line.type === "spacer") return <Box key={line.id} h="3" />;

              if (line.type === "section") {
                return (
                  <Box key={line.id} pt="3" pb="1">
                    <Badge
                      size="xs" rounded="full"
                      bg="brand.violetTint" color="brand.violetDeep"
                      borderWidth="1px" borderColor="rgba(124,58,237,0.2)"
                      px="3" py="1" fontSize="2xs" fontWeight="800"
                      letterSpacing="0.05em" textTransform="uppercase"
                    >
                      {line.title}
                    </Badge>
                  </Box>
                );
              }

              const isActive = isPlaying && line.index === activeLyricIndex;
              return (
                <Box
                  key={line.id}
                  onClick={() => handleLyricClick(line.index)}
                  cursor="pointer"
                  py="1.5" px="2" rounded="lg"
                  bg={isActive ? "brand.violetTint" : "transparent"}
                  transition="all 0.2s"
                  _hover={{ bg: "paper.100" }}
                >
                  <Text
                    fontFamily="heading"
                    fontSize={{ base: "lg", sm: "xl" }}
                    fontWeight="800"
                    letterSpacing="-0.02em"
                    lineHeight="1.5"
                    color={isActive ? "brand.violetDeep" : "ink.400"}
                    style={{
                      transform: isActive ? "scale(1.01)" : "scale(1)",
                      transformOrigin: "left center",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {line.text}
                  </Text>
                </Box>
              );
            })}
          </Stack>
        ) : (
          <Flex direction="column" align="center" justify="center"
            h="full" py="12" textAlign="center" gap="3" color="ink.300">
            <Box fontSize="3xl">🎼</Box>
            <Text fontFamily="heading" fontWeight="800" fontSize="lg" color="ink.500">
              Morceau Instrumental
            </Text>
            <Text fontSize="xs" maxW="240px" color="ink.400">
              Composé sans paroles — laissez la musique parler !
            </Text>
          </Flex>
        )}
      </Box>

      {/* Hint footer */}
      <Text fontSize="2xs" color="ink.400" pt="3" mt="2"
        borderTopWidth="1px" borderColor="paper.100">
        Cliquez sur un vers pour naviguer dans la chanson
      </Text>
    </Box>
  );

  // ─────────────────── Render ───────────────────
  return (
    <Box w="full">
      {/* Success badge */}
      <Flex mb="5" justify="space-between" align="center" wrap="wrap" gap="2">
        <Badge
          px="3" py="1.5" rounded="full"
          bg="brand.violetTint" color="brand.violetDeep"
          fontSize="xs" fontWeight="700"
          borderWidth="1px" borderColor="rgba(124,58,237,0.25)"
        >
          ✨ Morceau créé avec succès
        </Badge>
        <HStack gap="1.5">
          {localTrack.isPublic ? (
            <Badge px="2.5" py="1" rounded="full" colorPalette="green" fontSize="2xs">🌐 Public</Badge>
          ) : (
            <Badge px="2.5" py="1" rounded="full" colorPalette="gray" fontSize="2xs">🔒 Privé</Badge>
          )}
        </HStack>
      </Flex>

      {/* ── DESKTOP : 2 colonnes ── */}
      <Box display={{ base: "none", lg: "grid" }}
        gridTemplateColumns="320px 1fr" gap="7" alignItems="start">
        <PlayerColumn />
        <LyricsColumn />
      </Box>

      {/* ── MOBILE : tabs ── */}
      <Box display={{ base: "block", lg: "none" }}>
        {mobileTab === "player" ? (
          <>
            <PlayerColumn />
            {/* Bouton flottant pour ouvrir les paroles */}
            {lyricsList.length > 0 && (
              <Box
                position="fixed" bottom="0" left="0" right="0" zIndex="50"
                bg="paper.0" borderTopWidth="1px" borderColor="paper.200"
                boxShadow="0 -4px 24px rgba(0,0,0,0.08)"
                p="3"
              >
                <Flex align="center" justify="space-between" gap="3">
                  {/* Mini info track */}
                  <HStack gap="2" flex="1" minW="0">
                    <Box
                      boxSize="9" rounded="lg" overflow="hidden"
                      borderWidth="1px" borderColor="paper.200" flexShrink={0}>
                      {displayCover
                        ? <Image src={displayCover} alt="Cover" w="full" h="full" objectFit="cover" />
                        : <Flex w="full" h="full" align="center" justify="center" bg="linear-gradient(135deg, #7c3aed, #ec4899)">
                            <Text fontSize="xs">🎵</Text>
                          </Flex>
                      }
                    </Box>
                    <Box minW="0">
                      <Text fontFamily="ui" fontWeight="700" fontSize="xs" color="ink.900" noOfLines={1}>
                        {localTrack.title || "Morceau"}
                      </Text>
                      <Text fontSize="2xs" color="ink.500" noOfLines={1}>{localTrack.genre || musicStyle}</Text>
                    </Box>
                  </HStack>
                  <PlayButton size="sm" />
                  <Box as="button" type="button"
                    onClick={() => setMobileTab("lyrics")}
                    px="3" py="1.5" rounded="full"
                    bg="brand.violetTint" borderWidth="1px" borderColor="rgba(124,58,237,0.2)"
                    color="brand.violetDeep" fontSize="2xs" fontWeight="700"
                    _hover={{ bg: "brand.violetDeep", color: "white" }}
                    flexShrink={0}
                  >
                    Paroles
                  </Box>
                </Flex>
              </Box>
            )}
            {/* spacer pour le mini player fixe */}
            {lyricsList.length > 0 && <Box h="20" />}
          </>
        ) : (
          /* MOBILE LYRICS FULLSCREEN */
          <Box position="fixed" inset="0" zIndex="100"
            bg="paper.0" overflowY="auto" display="flex" flexDirection="column">
            {/* Header */}
            <Flex
              position="sticky" top="0" zIndex="10"
              bg="rgba(255,255,255,0.92)" backdropFilter="blur(16px)"
              borderBottomWidth="1px" borderColor="paper.200"
              px="4" py="3" align="center" gap="3"
            >
              <Box as="button" type="button"
                onClick={() => setMobileTab("player")}
                w="8" h="8" rounded="full" bg="paper.100"
                display="flex" alignItems="center" justifyContent="center"
                _hover={{ bg: "paper.200" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Box>
              <Text fontFamily="heading" fontWeight="800" fontSize="sm" color="ink.900" flex="1" noOfLines={1}>
                {localTrack.title || "Paroles"}
              </Text>
              {rawLyrics.trim() && (
                <Box as="button" type="button"
                  onClick={handleCopyLyrics}
                  display="flex" alignItems="center" gap="1.5"
                  px="2.5" py="1" rounded="full"
                  bg={copiedLyrics ? "green.50" : "paper.100"}
                  color={copiedLyrics ? "green.700" : "ink.500"}
                  fontSize="2xs" fontWeight="600"
                >
                  {copiedLyrics ? <LuCheck size={11} /> : <LuCopy size={11} />}
                  {copiedLyrics ? "Copié" : "Copier"}
                </Box>
              )}
            </Flex>

            {/* Lyrics scrollable */}
            <Box flex="1" px="5" pb="32">
              <Stack gap="0.5" py="4">
                {lyricsList.map((line) => {
                  if (line.type === "spacer") return <Box key={line.id} h="4" />;
                  if (line.type === "section") {
                    return (
                      <Box key={line.id} pt="4" pb="2">
                        <Badge size="xs" rounded="full" bg="brand.violetTint" color="brand.violetDeep"
                          borderWidth="1px" borderColor="rgba(124,58,237,0.2)"
                          px="3" py="1" fontSize="2xs" fontWeight="800"
                          letterSpacing="0.05em" textTransform="uppercase">
                          {line.title}
                        </Badge>
                      </Box>
                    );
                  }
                  const isActive = isPlaying && line.index === activeLyricIndex;
                  return (
                    <Box key={line.id} onClick={() => handleLyricClick(line.index)}
                      cursor="pointer" py="2" px="2" rounded="xl"
                      bg={isActive ? "brand.violetTint" : "transparent"}
                      transition="all 0.2s" _hover={{ bg: "paper.100" }}>
                      <Text
                        fontFamily="heading" fontSize="2xl" fontWeight="800"
                        letterSpacing="-0.02em" lineHeight="1.4"
                        color={isActive ? "brand.violetDeep" : "ink.300"}
                        style={{
                          transform: isActive ? "scale(1.01)" : "scale(1)",
                          transformOrigin: "left center",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {line.text}
                      </Text>
                    </Box>
                  );
                })}
              </Stack>
            </Box>

            {/* Mini-player fixé en bas (fullscreen lyrics) */}
            <Box
              position="fixed" bottom="0" left="0" right="0" zIndex="110"
              bg="rgba(255,255,255,0.95)" backdropFilter="blur(20px)"
              borderTopWidth="1px" borderColor="paper.200"
              boxShadow="0 -4px 24px rgba(0,0,0,0.08)"
              px="4" py="3"
            >
              {AudioEl}
              {/* Waveform miniature */}
              <Box mb="2">
                <Waveform
                  bars={24} height={24} animate={isPlaying}
                  color="#7c3aed"
                  currentTime={currentTime}
                  duration={totalDuration}
                  onSeek={(t) => {
                    if (audioRef.current) audioRef.current.currentTime = t;
                    setCurrentTime(t);
                  }}
                />
                <Flex justify="space-between" fontSize="2xs" color="ink.400" fontFamily="ui" mt="1">
                  <Text>{fmt(currentTime)}</Text>
                  <Text>{fmt(totalDuration)}</Text>
                </Flex>
              </Box>
              <Flex align="center" justify="space-between" gap="3">
                <HStack gap="2" flex="1" minW="0">
                  <Box boxSize="8" rounded="md" overflow="hidden" flexShrink={0}
                    borderWidth="1px" borderColor="paper.200">
                    {displayCover
                      ? <Image src={displayCover} alt="Cover" w="full" h="full" objectFit="cover" />
                      : <Flex w="full" h="full" bg="linear-gradient(135deg, #7c3aed, #ec4899)" align="center" justify="center">
                          <Text fontSize="2xs">🎵</Text>
                        </Flex>
                    }
                  </Box>
                  <Text fontFamily="ui" fontWeight="700" fontSize="xs" color="ink.900" noOfLines={1} flex="1">
                    {localTrack.title || "Morceau"}
                  </Text>
                </HStack>
                <PlayButton size="sm" />
              </Flex>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
