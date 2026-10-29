"use client";

import { useRef, useState, useEffect } from "react";
import {
  Badge, Box, Button, Flex, HStack, Image, Stack, Text,
} from "@chakra-ui/react";
import { downloadTrackAudio } from "@/lib/downloadTrack";
import { LuPause, LuPlay } from "react-icons/lu";

/**
 * Découpe les paroles en sections Spotify ([Verse], [Chorus], etc.) et lignes synchronisables.
 */
function parseSpotifyLyrics(rawLyrics) {
  if (!rawLyrics || typeof rawLyrics !== "string") {
    return { parsed: [], totalLyricLines: 0 };
  }

  const lines = rawLyrics.split(/\r?\n/);
  const parsed = [];
  let lyricLineCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      if (parsed.length > 0 && parsed[parsed.length - 1].type !== "spacer") {
        parsed.push({ type: "spacer", id: `sp-${i}` });
      }
      continue;
    }

    const sectionMatch = trimmed.match(/^\[(.*?)\]$/);
    if (sectionMatch) {
      parsed.push({
        type: "section",
        id: `sec-${i}`,
        title: sectionMatch[1].toUpperCase(),
      });
      continue;
    }

    const lineIndex = lyricLineCount++;
    parsed.push({
      type: "line",
      id: `ln-${i}`,
      index: lineIndex,
      text: trimmed,
    });
  }

  return { parsed, totalLyricLines: lyricLineCount };
}

function fmtTime(sec) {
  if (!sec || isNaN(sec) || sec < 0) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Composant de lecteur audio post-génération :
 * - Design 100% White / Light Mode haut de gamme (expert sans icônes superflues).
 * - Élément <audio> unique à la racine pour garantir une lecture fluide sans coupure.
 * - Desktop : vue double colonne (pochette & lecteur à gauche, paroles Spotify synchronisées à droite).
 * - Mobile : bascule plein écran instantanée pour les paroles avec mini-lecteur collé en bas de l'écran.
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
    Number(track?.seconds || track?.duration) || 180
  );
  const [copiedLyrics, setCopiedLyrics] = useState(false);
  const [localTrack, setLocalTrack] = useState(track);
  // Sur mobile : "player" | "lyrics" (mode plein écran)
  const [mobileTab, setMobileTab] = useState("player");

  useEffect(() => {
    setLocalTrack(track);
    setCurrentTime(0);
    setIsPlaying(false);
    const d = Number(track?.seconds || track?.duration) || 180;
    setTotalDuration(d);
  }, [track]);

  // Contrôle de lecture audio sécurisé
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn("[TrackPlayer] Erreur de lecture audio:", err);
            setIsPlaying(false);
          });
      }
    }
  };

  const handleSeek = (newTime) => {
    const clamped = Math.max(0, Math.min(newTime, totalDuration || 180));
    if (audioRef.current) {
      audioRef.current.currentTime = clamped;
    }
    setCurrentTime(clamped);
  };

  const rawLyrics = localTrack?.lyrics || customLyrics || "";
  const { parsed: lyricsList, totalLyricLines } = parseSpotifyLyrics(rawLyrics);

  // Estimation du vers actif pendant la lecture
  const activeLyricIndex =
    isPlaying && totalLyricLines > 0 && totalDuration > 0
      ? Math.min(totalLyricLines - 1, Math.floor((currentTime / totalDuration) * totalLyricLines))
      : -1;

  const handleLyricClick = (lineIndex) => {
    if (totalLyricLines <= 0) return;
    const targetTime = (lineIndex / totalLyricLines) * (totalDuration || 180);
    handleSeek(targetTime);
  };

  const handleCopyLyrics = () => {
    if (!rawLyrics.trim()) return;
    navigator.clipboard.writeText(rawLyrics);
    setCopiedLyrics(true);
    setTimeout(() => setCopiedLyrics(false), 2000);
  };

  // Priorité absolue : image uploadée par l'utilisateur > image Suno
  const displayCover = localTrack?.coverUrl || null;
  const trackTitle = localTrack?.title || customTitle || "Morceau généré";
  const trackGenre = localTrack?.genre || musicStyle || "Afrobeat";
  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <Box w="full" position="relative" color="slate.900">
      {/* ── ÉLÉMENT AUDIO RACINE UNIQUE (INDISPENSABLE POUR ÉVITER LES CONFLITS ET COUPURES) ── */}
      {localTrack?.audioUrl && (
        <audio
          ref={audioRef}
          src={localTrack.audioUrl}
          preload="metadata"
          playsInline
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration;
            if (d && !isNaN(d) && d > 0) setTotalDuration(d);
          }}
          onTimeUpdate={() => {
            if (audioRef.current) {
              setCurrentTime(audioRef.current.currentTime);
              const d = audioRef.current.duration;
              if (d && !isNaN(d) && d > 0 && Math.abs(d - totalDuration) > 1) {
                setTotalDuration(d);
              }
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
        />
      )}

      {/* ── BANDEAU DE STATUT SUPÉRIEUR (LIGHT MODE ÉLÉGANT) ── */}
      <Flex mb="6" justify="space-between" align="center" wrap="wrap" gap="3">
        <HStack gap="2">
          <Badge
            px="3" py="1" rounded="full"
            bg="purple.50" color="purple.700"
            borderWidth="1px" borderColor="purple.200"
            fontSize="xs" fontWeight="700" letterSpacing="0.02em"
          >
            Création finalisée
          </Badge>
          <Badge
            px="2.5" py="1" rounded="full"
            bg={localTrack?.isPublic ? "emerald.50" : "slate.100"}
            color={localTrack?.isPublic ? "emerald.700" : "slate.600"}
            borderWidth="1px"
            borderColor={localTrack?.isPublic ? "emerald.200" : "slate.200"}
            fontSize="2xs" fontWeight="600"
          >
            {localTrack?.isPublic ? "Public" : "Privé"}
          </Badge>
        </HStack>

        <HStack gap="2">
          {onTogglePublic && localTrack?.id && (
            <Button
              size="xs" variant="outline" rounded="full"
              borderColor="slate.300" color="slate.700" bg="white"
              _hover={{ bg: "slate.50" }}
              onClick={() => {
                onTogglePublic(localTrack.id);
                setLocalTrack((p) => (p ? { ...p, isPublic: !p.isPublic } : p));
              }}
            >
              {localTrack.isPublic ? "Rendre Privé" : "Rendre Public"}
            </Button>
          )}
          {onToggleFavorite && localTrack?.id && (
            <Button
              size="xs" variant="outline" rounded="full"
              borderColor={localTrack.isFavorite ? "rose.300" : "slate.300"}
              color={localTrack.isFavorite ? "rose.700" : "slate.700"}
              bg={localTrack.isFavorite ? "rose.50" : "white"}
              _hover={{ bg: localTrack.isFavorite ? "rose.100" : "slate.50" }}
              onClick={() => {
                onToggleFavorite(localTrack.id);
                setLocalTrack((p) => (p ? { ...p, isFavorite: !p.isFavorite } : p));
              }}
            >
              {localTrack.isFavorite ? "Favori" : "Ajouter aux favoris"}
            </Button>
          )}
        </HStack>
      </Flex>

      {/* ── DESKTOP : DOUBLE COLONNE HARMONIEUSE (LECTEUR GAUCHE | PAROLES DROITE) ── */}
      <Box display={{ base: "none", md: "grid" }} gridTemplateColumns="340px 1fr" gap="8" alignItems="start">
        {/* COLONNE GAUCHE : VISUEL ET CONTRÔLEUR */}
        <Stack gap="5" bg="white" p="6" rounded="3xl" borderWidth="1px" borderColor="slate.200" boxShadow="0 4px 20px rgba(0,0,0,0.04)">
          {/* Pochette avec protection de proportion */}
          <Box
            position="relative" mx="auto" w="full" maxW="280px"
            style={{ aspectRatio: "1/1" }}
            rounded="2xl" overflow="hidden"
            borderWidth="1px" borderColor="slate.200"
            boxShadow="0 12px 32px rgba(0,0,0,0.08)"
            bg="slate.50"
          >
            {displayCover ? (
              <Image src={displayCover} alt={trackTitle} w="full" h="full" objectFit="cover" />
            ) : (
              <Flex w="full" h="full" align="center" justify="center" bg="linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)">
                <Text fontSize="5xl" color="white" fontWeight="900" letterSpacing="-0.05em">
                  {trackTitle.slice(0, 2).toUpperCase()}
                </Text>
              </Flex>
            )}

            {/* Indicateur de lecture en cours */}
            {isPlaying && (
              <Box position="absolute" top="3" right="3" bg="white" px="2.5" py="1" rounded="full" boxShadow="0 2px 8px rgba(0,0,0,0.12)">
                <Text fontSize="2xs" fontWeight="800" color="purple.700" letterSpacing="0.04em">
                  LECTURE
                </Text>
              </Box>
            )}
          </Box>

          {/* Titre et métadonnées */}
          <Stack gap="1.5" textAlign="center">
            <Text fontFamily="heading" fontWeight="800" fontSize="xl" color="slate.900" noOfLines={2}>
              {trackTitle}
            </Text>
            <HStack justify="center" wrap="wrap" gap="1.5">
              <Badge px="2.5" py="0.5" rounded="full" bg="purple.50" color="purple.800" fontSize="2xs" fontWeight="700">
                {trackGenre}
              </Badge>
              {selectedVoiceData?.title && (
                <Badge px="2.5" py="0.5" rounded="full" bg="slate.100" color="slate.700" fontSize="2xs" fontWeight="600">
                  {selectedVoiceData.title}
                </Badge>
              )}
              {model && (
                <Badge px="2" py="0.5" rounded="full" bg="slate.100" color="slate.500" fontSize="2xs">
                  Suno {model}
                </Badge>
              )}
            </HStack>
          </Stack>

          {/* Contrôleur audio et barre de défilement */}
          <Box pt="2">
            {/* Barre de progression cliquable */}
            <Box
              position="relative" w="full" h="8px" bg="slate.100" rounded="full"
              cursor="pointer" overflow="hidden"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = (e.clientX - rect.left) / rect.width;
                handleSeek(ratio * (totalDuration || 180));
              }}
            >
              <Box
                h="full" bg="purple.600" rounded="full"
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                transition="width 0.1s linear"
              />
            </Box>

            {/* Horodatage */}
            <Flex justify="space-between" mt="2" fontSize="2xs" color="slate.500" fontFamily="mono" fontWeight="600">
              <Text>{fmtTime(currentTime)}</Text>
              <Text>{fmtTime(totalDuration)}</Text>
            </Flex>

            {/* Bouton Lecture / Pause centré */}
            <Flex justify="center" mt="3">
              <Box
                as="button"
                type="button"
                onClick={togglePlay}
                w="14" h="14" rounded="full"
                bg="slate.900" color="white"
                display="flex" alignItems="center" justifyContent="center"
                boxShadow="0 4px 16px rgba(15,23,42,0.25)"
                _hover={{ bg: "purple.700", transform: "scale(1.04)" }}
                _active={{ transform: "scale(0.96)" }}
                transition="all 0.18s ease"
                aria-label={isPlaying ? "Mettre en pause" : "Lancer la lecture"}
              >
                {isPlaying ? (
                  <LuPause size={20} />
                ) : (
                  <LuPlay size={20} />
                )}
              </Box>
            </Flex>
          </Box>

          {/* Boutons d'action */}
          <Stack gap="2" pt="2">
            <Button
              size="md" rounded="full"
              bg="purple.600" color="white"
              _hover={{ bg: "purple.700" }}
              onClick={() => downloadTrackAudio(localTrack)}
              fontWeight="700" fontSize="sm" h="11"
            >
              Télécharger le fichier MP3
            </Button>
            <Button
              size="sm" variant="ghost" rounded="full"
              color="slate.600" _hover={{ bg: "slate.100", color: "slate.900" }}
              onClick={onReset} fontSize="xs" fontWeight="600"
            >
              Composer un autre morceau
            </Button>
          </Stack>
        </Stack>

        {/* COLONNE DROITE : PAROLES STYLE SPOTIFY DANS UNE CHARTE LIGHT PURE */}
        <Box
          bg="white" rounded="3xl"
          borderWidth="1px" borderColor="slate.200"
          boxShadow="0 4px 20px rgba(0,0,0,0.04)"
          p="7" display="flex" flexDirection="column"
          minH="560px" maxH="680px"
        >
          {/* En-tête des paroles */}
          <Flex justify="space-between" align="center" pb="4" mb="4" borderBottomWidth="1px" borderColor="slate.150">
            <HStack gap="2.5">
              <Text fontFamily="heading" fontSize="xs" fontWeight="900" letterSpacing="0.08em" color="slate.900" textTransform="uppercase">
                Paroles de la chanson
              </Text>
              {totalLyricLines > 0 && (
                <Badge size="xs" bg="slate.100" color="slate.600" rounded="full" px="2" py="0.5">
                  {totalLyricLines} vers
                </Badge>
              )}
            </HStack>

            {rawLyrics.trim() && (
              <Button
                size="xs" variant="outline" rounded="full"
                borderColor={copiedLyrics ? "emerald.300" : "slate.300"}
                bg={copiedLyrics ? "emerald.50" : "white"}
                color={copiedLyrics ? "emerald.700" : "slate.700"}
                onClick={handleCopyLyrics}
                fontWeight="600"
              >
                {copiedLyrics ? "Copié !" : "Copier"}
              </Button>
            )}
          </Flex>

          {/* Zone de défilement des paroles */}
          <Box flex="1" overflowY="auto" pr="3">
            {lyricsList.length > 0 ? (
              <Stack gap="1" py="2">
                {lyricsList.map((item) => {
                  if (item.type === "spacer") return <Box key={item.id} h="4" />;
                  if (item.type === "section") {
                    return (
                      <Box key={item.id} pt="4" pb="1">
                        <Badge
                          size="xs" rounded="full"
                          bg="purple.50" color="purple.700"
                          borderWidth="1px" borderColor="purple.200"
                          px="3" py="1" fontSize="2xs" fontWeight="800"
                          letterSpacing="0.05em" textTransform="uppercase"
                        >
                          {item.title}
                        </Badge>
                      </Box>
                    );
                  }

                  const isActive = isPlaying && item.index === activeLyricIndex;
                  return (
                    <Box
                      key={item.id}
                      onClick={() => handleLyricClick(item.index)}
                      cursor="pointer"
                      py="2" px="3" rounded="xl"
                      bg={isActive ? "purple.50" : "transparent"}
                      transition="all 0.18s ease"
                      _hover={{ bg: isActive ? "purple.100" : "slate.50" }}
                    >
                      <Text
                        fontFamily="heading"
                        fontSize="xl"
                        fontWeight={isActive ? "800" : "600"}
                        color={isActive ? "purple.700" : "slate.400"}
                        lineHeight="1.5"
                        letterSpacing="-0.01em"
                        style={{
                          transform: isActive ? "translateX(4px)" : "none",
                          transition: "all 0.18s ease",
                        }}
                      >
                        {item.text}
                      </Text>
                    </Box>
                  );
                })}
              </Stack>
            ) : (
              <Flex direction="column" align="center" justify="center" h="full" py="16" textAlign="center" gap="2">
                <Text fontFamily="heading" fontWeight="800" fontSize="lg" color="slate.700">
                  Morceau Instrumental
                </Text>
                <Text fontSize="xs" color="slate.500" maxW="280px">
                  Cette piste a été enregistrée sans voix ni paroles.
                </Text>
              </Flex>
            )}
          </Box>

          <Text fontSize="2xs" color="slate.400" pt="3" mt="2" borderTopWidth="1px" borderColor="slate.100" textAlign="center">
            Cliquez sur un vers pour caler la lecture à cet instant
          </Text>
        </Box>
      </Box>

      {/* ── MOBILE : EXPÉRIENCE RESPONSIVE AVEC MODE PAROLES PLEIN ÉCRAN ET MINI-PLAYER ── */}
      <Box display={{ base: "block", md: "none" }}>
        {mobileTab === "player" ? (
          /* VUE MOBILE NORMALE (CARTE LECTEUR) */
          <Stack gap="5" bg="white" p="5" rounded="2xl" borderWidth="1px" borderColor="slate.200" boxShadow="0 2px 12px rgba(0,0,0,0.04)">
            {/* Pochette carrée */}
            <Box
              position="relative" mx="auto" w="full" maxW="240px"
              style={{ aspectRatio: "1/1" }}
              rounded="2xl" overflow="hidden"
              borderWidth="1px" borderColor="slate.200"
              boxShadow="0 8px 24px rgba(0,0,0,0.08)"
              bg="slate.50"
            >
              {displayCover ? (
                <Image src={displayCover} alt={trackTitle} w="full" h="full" objectFit="cover" />
              ) : (
                <Flex w="full" h="full" align="center" justify="center" bg="linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)">
                  <Text fontSize="4xl" color="white" fontWeight="900">
                    {trackTitle.slice(0, 2).toUpperCase()}
                  </Text>
                </Flex>
              )}
            </Box>

            {/* Titre & tags */}
            <Stack gap="1" textAlign="center">
              <Text fontFamily="heading" fontWeight="800" fontSize="lg" color="slate.900" noOfLines={2}>
                {trackTitle}
              </Text>
              <HStack justify="center" wrap="wrap" gap="1.5">
                <Badge px="2.5" py="0.5" rounded="full" bg="purple.50" color="purple.800" fontSize="2xs" fontWeight="700">
                  {trackGenre}
                </Badge>
                {selectedVoiceData?.title && (
                  <Badge px="2" py="0.5" rounded="full" bg="slate.100" color="slate.700" fontSize="2xs">
                    {selectedVoiceData.title}
                  </Badge>
                )}
              </HStack>
            </Stack>

            {/* Barre de progression & boutons */}
            <Box>
              <Box
                position="relative" w="full" h="8px" bg="slate.100" rounded="full"
                cursor="pointer" overflow="hidden"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = (e.clientX - rect.left) / rect.width;
                  handleSeek(ratio * (totalDuration || 180));
                }}
              >
                <Box
                  h="full" bg="purple.600" rounded="full"
                  style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                />
              </Box>
              <Flex justify="space-between" mt="1.5" fontSize="2xs" color="slate.500" fontFamily="mono">
                <Text>{fmtTime(currentTime)}</Text>
                <Text>{fmtTime(totalDuration)}</Text>
              </Flex>
              <Flex justify="center" my="3">
                <Box
                  as="button" type="button" onClick={togglePlay}
                  w="14" h="14" rounded="full" bg="slate.900" color="white"
                  display="flex" alignItems="center" justifyContent="center"
                  boxShadow="0 4px 16px rgba(15,23,42,0.25)"
                >
                  {isPlaying ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" rx="1.5" />
                      <rect x="14" y="4" width="4" height="16" rx="1.5" />
                    </svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: "3px" }}>
                      <path d="M6 4l14 8-14 8V4z" />
                    </svg>
                  )}
                </Box>
              </Flex>
            </Box>

            {/* Bouton pour ouvrir les paroles en mode plein écran sur mobile */}
            {lyricsList.length > 0 && (
              <Button
                size="md" rounded="2xl" variant="outline"
                borderColor="purple.300" bg="purple.50" color="purple.800"
                onClick={() => setMobileTab("lyrics")}
                fontWeight="700" fontSize="sm" h="12"
              >
                Afficher les paroles en plein écran
              </Button>
            )}

            <Button
              size="md" rounded="full" bg="slate.900" color="white"
              onClick={() => downloadTrackAudio(localTrack)}
              fontWeight="700" fontSize="sm" h="11"
            >
              Télécharger le MP3
            </Button>

            <Button size="xs" variant="ghost" color="slate.500" onClick={onReset}>
              Composer un autre morceau
            </Button>
          </Stack>
        ) : (
          /* VUE PAROLES PLEIN ÉCRAN SUR MOBILE AVEC MINI-PLAYER COLLÉ EN BAS */
          <Box
            position="fixed" inset="0" zIndex="1000"
            bg="white" display="flex" flexDirection="column"
          >
            {/* Barre de navigation supérieure */}
            <Flex
              position="sticky" top="0" zIndex="10"
              bg="rgba(255,255,255,0.95)" backdropFilter="blur(16px)"
              borderBottomWidth="1px" borderColor="slate.200"
              px="4" py="3" align="center" justify="space-between"
            >
              <Button
                size="xs" variant="ghost" rounded="full"
                color="slate.800" fontWeight="700"
                onClick={() => setMobileTab("player")}
              >
                Fermer
              </Button>

              <Text fontFamily="heading" fontWeight="800" fontSize="xs" color="slate.900" noOfLines={1} maxW="180px">
                {trackTitle}
              </Text>

              {rawLyrics.trim() && (
                <Button
                  size="xs" variant="outline" rounded="full"
                  borderColor={copiedLyrics ? "emerald.300" : "slate.300"}
                  bg={copiedLyrics ? "emerald.50" : "white"}
                  color={copiedLyrics ? "emerald.700" : "slate.700"}
                  onClick={handleCopyLyrics}
                >
                  {copiedLyrics ? "Copié !" : "Copier"}
                </Button>
              )}
            </Flex>

            {/* Contenu des paroles (défilement complet) */}
            <Box flex="1" overflowY="auto" px="5" pt="4" pb="32">
              <Stack gap="1">
                {lyricsList.map((item) => {
                  if (item.type === "spacer") return <Box key={item.id} h="4" />;
                  if (item.type === "section") {
                    return (
                      <Box key={item.id} pt="4" pb="1">
                        <Badge
                          size="xs" rounded="full" bg="purple.50" color="purple.700"
                          borderWidth="1px" borderColor="purple.200"
                          px="3" py="1" fontSize="2xs" fontWeight="800" textTransform="uppercase"
                        >
                          {item.title}
                        </Badge>
                      </Box>
                    );
                  }

                  const isActive = isPlaying && item.index === activeLyricIndex;
                  return (
                    <Box
                      key={item.id}
                      onClick={() => handleLyricClick(item.index)}
                      py="2" px="2" rounded="xl"
                      bg={isActive ? "purple.50" : "transparent"}
                    >
                      <Text
                        fontFamily="heading"
                        fontSize="2xl"
                        fontWeight={isActive ? "800" : "600"}
                        color={isActive ? "purple.700" : "slate.400"}
                        lineHeight="1.4"
                        letterSpacing="-0.02em"
                      >
                        {item.text}
                      </Text>
                    </Box>
                  );
                })}
              </Stack>
            </Box>

            {/* MINI-PLAYER STICKY COLLÉ EN BAS DE PAGE (PLEIN ÉCRAN MOBILE) */}
            <Box
              position="sticky" bottom="0" left="0" right="0" zIndex="20"
              bg="rgba(255,255,255,0.96)" backdropFilter="blur(20px)"
              borderTopWidth="1px" borderColor="slate.200"
              boxShadow="0 -4px 20px rgba(0,0,0,0.06)"
              px="4" py="3"
            >
              {/* Mini barre de progression */}
              <Box
                position="relative" w="full" h="4px" bg="slate.150" rounded="full"
                mb="2.5" cursor="pointer" overflow="hidden"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = (e.clientX - rect.left) / rect.width;
                  handleSeek(ratio * (totalDuration || 180));
                }}
              >
                <Box
                  h="full" bg="purple.600" rounded="full"
                  style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                />
              </Box>

              <Flex align="center" justify="space-between" gap="3">
                {/* Miniature & Titre */}
                <HStack gap="2.5" flex="1" minW="0">
                  <Box boxSize="10" rounded="lg" overflow="hidden" flexShrink={0} borderWidth="1px" borderColor="slate.200">
                    {displayCover ? (
                      <Image src={displayCover} alt={trackTitle} w="full" h="full" objectFit="cover" />
                    ) : (
                      <Flex w="full" h="full" bg="purple.600" align="center" justify="center">
                        <Text fontSize="xs" color="white" fontWeight="900">
                          {trackTitle.slice(0, 1)}
                        </Text>
                      </Flex>
                    )}
                  </Box>
                  <Box minW="0" flex="1">
                    <Text fontFamily="ui" fontWeight="700" fontSize="xs" color="slate.900" noOfLines={1}>
                      {trackTitle}
                    </Text>
                    <Text fontSize="2xs" color="slate.500" fontFamily="mono">
                      {fmtTime(currentTime)} / {fmtTime(totalDuration)}
                    </Text>
                  </Box>
                </HStack>

                {/* Bouton Play/Pause tactile */}
                <Box
                  as="button" type="button" onClick={togglePlay}
                  w="10" h="10" rounded="full" bg="slate.900" color="white"
                  display="flex" alignItems="center" justifyContent="center"
                  flexShrink={0}
                >
                  {isPlaying ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: "2px" }}>
                      <path d="M6 4l14 8-14 8V4z" />
                    </svg>
                  )}
                </Box>
              </Flex>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
