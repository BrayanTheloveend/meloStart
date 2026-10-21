"use client";

import { useState } from "react";
import { Badge, Box, Button, Center, Flex, Grid, HStack, IconButton, Input, Spinner, Stack, Text } from "@chakra-ui/react";
import { LuClock, LuDownload, LuHeart, LuMusic, LuPause, LuPlay, LuPlus, LuSearch, LuTrash2 } from "react-icons/lu";
import Waveform from "@/components/common/Waveform";
import { accent } from "@/theme/system";

export default function StudioLibrary({
  library = [],
  isLoading = false,
  activeTrack,
  isPlaying,
  onPlayTrack,
  onToggleFavorite,
  onDeleteTrack,
  onOpenCreate,
}) {
  const [search, setSearch] = useState("");
  const [filterGenre, setFilterGenre] = useState("all");

  const handleDownloadTrack = (track) => {
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

  const genres = ["all", "Afrobeat", "Pop", "Rap", "Électro", "Folk", "Lo-fi"];

  const filtered = library.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.meta && t.meta.toLowerCase().includes(search.toLowerCase()));
    const matchesGenre = filterGenre === "all" || (t.genre && t.genre.toLowerCase() === filterGenre.toLowerCase());
    return matchesSearch && matchesGenre;
  });

  return (
    <Stack gap="6" p={{ base: "5", md: "8" }} maxW="6xl" mx="auto">
      {/* En-tête */}
      <Flex justify="space-between" align={{ base: "flex-start", sm: "center" }} direction={{ base: "column", sm: "row" }} gap="4">
        <Box>
          <HStack gap="2">
            <Text fontFamily="heading" fontWeight="800" fontSize={{ base: "2xl", md: "3xl" }} color="ink.900" letterSpacing="-0.03em">
              Votre Bibliothèque
            </Text>
            <Badge rounded="full" bg="brand.violetTint" color="brand.violetDeep" px="2.5" py="0.5" fontFamily="ui" fontWeight="600">
              {library.length} titre{library.length > 1 ? "s" : ""}
            </Badge>
          </HStack>
          <Text fontSize="sm" color="ink.500" mt="1">
            Retrouvez tous vos morceaux générés, vos exports et vos favoris.
          </Text>
        </Box>

        <Button rounded="full" color="white" background={accent.primary} onClick={onOpenCreate}>
          <LuPlus /> Nouvelle création (2 Notes)
        </Button>
      </Flex>

      {/* Barre de recherche et filtres de genres */}
      <Flex direction={{ base: "column", md: "row" }} gap="3" align={{ base: "stretch", md: "center" }} justify="space-between">
        <Box position="relative" maxW={{ base: "full", md: "320px" }}>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par titre ou style…"
            pl="9"
            bg="paper.0"
            rounded="xl"
            borderColor="paper.300"
            _focusVisible={{ borderColor: "brand.violet" }}
          />
          <Box position="absolute" left="3" top="50%" transform="translateY(-50%)" color="ink.400" pointerEvents="none">
            <LuSearch size={16} />
          </Box>
        </Box>

        <Flex gap="2" wrap="wrap">
          {genres.map((g) => (
            <Button
              key={g}
              size="xs"
              rounded="full"
              fontFamily="ui"
              fontWeight="500"
              bg={filterGenre === g ? "brand.violetTint" : "paper.50"}
              color={filterGenre === g ? "brand.violetDeep" : "ink.500"}
              borderWidth="1px"
              borderColor={filterGenre === g ? "brand.violetDeep" : "paper.300"}
              onClick={() => setFilterGenre(g)}
            >
              {g === "all" ? "Tous les styles" : g}
            </Button>
          ))}
        </Flex>
      </Flex>

      {/* Liste des créations */}
      {isLoading ? (
        <Center py="16" flexDirection="column" gap="3">
          <Spinner size="xl" color="brand.violetDeep" />
          <Text fontSize="sm" color="ink.500" fontFamily="ui">
            Synchronisation de votre bibliothèque musicale...
          </Text>
        </Center>
      ) : filtered.length === 0 ? (
        <Box p="12" textAlign="center" rounded="3xl" bg="paper.50" borderWidth="1px" borderColor="paper.200">
          <Flex boxSize="16" mx="auto" mb="3" rounded="2xl" bg="paper.200" align="center" justify="center" color="ink.400">
            <LuMusic size={26} />
          </Flex>
          <Text fontFamily="heading" fontWeight="700" color="ink.900" mb="1">
            Aucun morceau trouvé
          </Text>
          <Text fontSize="sm" color="ink.500" maxW="sm" mx="auto" mb="5">
            {search ? "Aucun titre ne correspond à votre recherche." : "Votre bibliothèque est vide pour le moment."}
          </Text>
          <Button rounded="full" color="white" background={accent.primary} onClick={onOpenCreate}>
            <LuPlus /> Créer une chanson maintenant
          </Button>
        </Box>
      ) : (
        <Stack gap="3">
          {filtered.map((track) => {
            const isCurrent = activeTrack?.id === track.id;
            const trackPlaying = isCurrent && isPlaying;

            return (
              <Box
                key={track.id}
                p="4"
                rounded="2xl"
                bg={isCurrent ? "brand.violetTint" : "paper.50"}
                borderWidth="1.5px"
                borderColor={isCurrent ? "brand.violetDeep" : "paper.200"}
                _hover={{ borderColor: isCurrent ? "brand.violetDeep" : "paper.400", bg: isCurrent ? "brand.violetTint" : "paper.0" }}
                transition="all 0.2s"
              >
                <Flex align="center" justify="space-between" gap="4">
                  <HStack gap="3.5" flex="1" minW="0">
                    <IconButton
                      aria-label={trackPlaying ? "Pause" : "Écouter"}
                      size="md"
                      rounded="full"
                      color="white"
                      background={accent.primary}
                      onClick={() => onPlayTrack(track)}
                      flexShrink={0}
                    >
                      {trackPlaying ? <LuPause size={16} /> : <LuPlay size={16} />}
                    </IconButton>

                    <Box
                      boxSize="12"
                      rounded="xl"
                      background={track.coverGradient || "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)"}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      color="white"
                      fontSize="lg"
                      flexShrink={0}
                    >
                      🎵
                    </Box>

                    <Stack gap="0" flex="1" minW="0">
                      <HStack gap="2">
                        <Text fontFamily="heading" fontWeight="700" fontSize="md" color="ink.900" truncate>
                          {track.title}
                        </Text>
                        <Badge size="xs" rounded="full" bg="paper.200" color="ink.700">
                          {track.genre || "Pop"}
                        </Badge>
                      </HStack>
                      <Text fontSize="xs" color="ink.500" truncate>
                        {track.meta}
                      </Text>
                    </Stack>
                  </HStack>

                  <Box w="140px" display={{ base: "none", lg: "block" }}>
                    <Waveform bars={20} height={24} gap="2px" animate={trackPlaying} />
                  </Box>

                  <HStack gap="2" flexShrink={0}>
                    <HStack gap="1" color="ink.400" fontSize="xs" display={{ base: "none", sm: "flex" }}>
                      <LuClock size={12} />
                      <Text>{track.length || "1:00"}</Text>
                    </HStack>

                    <IconButton
                      aria-label="Favoris"
                      size="sm"
                      variant="ghost"
                      rounded="full"
                      color={track.isFavorite ? "red.500" : "ink.400"}
                      onClick={() => onToggleFavorite(track.id)}
                    >
                      <LuHeart size={16} fill={track.isFavorite ? "currentColor" : "none"} />
                    </IconButton>

                    <Button
                      size="xs"
                      rounded="full"
                      variant="outline"
                      borderColor="paper.300"
                      color="ink.700"
                      onClick={() => handleDownloadTrack(track)}
                    >
                      <LuDownload size={13} /> Télécharger
                    </Button>

                    <IconButton
                      aria-label="Supprimer"
                      size="sm"
                      variant="ghost"
                      rounded="full"
                      color="ink.400"
                      _hover={{ color: "red.500" }}
                      onClick={() => onDeleteTrack && onDeleteTrack(track.id)}
                    >
                      <LuTrash2 size={16} />
                    </IconButton>
                  </HStack>
                </Flex>
              </Box>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
