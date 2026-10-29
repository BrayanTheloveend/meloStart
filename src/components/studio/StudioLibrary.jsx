"use client";

import { useState, useEffect } from "react";
import {
  Badge,
  Box,
  Button,
  Center,
  Flex,
  HStack,
  IconButton,
  Image,
  Input,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  LuClock,
  LuDownload,
  LuGlobe,
  LuHeart,
  LuLock,
  LuMusic,
  LuPause,
  LuPlay,
  LuPlus,
  LuSearch,
  LuShuffle,
  LuTrash2,
} from "react-icons/lu";
import Waveform from "@/components/common/Waveform";
import { accent } from "@/theme/system";
import { downloadTrackAudio } from "@/lib/downloadTrack";
import { LucideMoreVertical } from "lucide-react";

export default function StudioLibrary({
  library = [],
  isLoading = false,
  activeTrack,
  isPlaying,
  currentTime = 0,
  duration = 0,
  onSeekTrack,
  onPlayTrack,
  onToggleFavorite,
  onTogglePublic,
  onDeleteTrack,
  onOpenCreate,
}) {
  const [search, setSearch] = useState("");
  const [filterGenre, setFilterGenre] = useState("all");
  const [openMenuTrackId, setOpenMenuTrackId] = useState(null);

  // Fermer le menu d'actions quand on clique en dehors
  useEffect(() => {
    if (!openMenuTrackId) return;
    const handleClose = () => setOpenMenuTrackId(null);
    window.addEventListener("click", handleClose);
    return () => window.removeEventListener("click", handleClose);
  }, [openMenuTrackId]);

  const handleDownloadTrack = (track) => {
    if (!track) return;
    downloadTrackAudio(track);
  };

  const handleDeleteTrack = (track) => {
    if (!onDeleteTrack || !track) return;
    const confirmMessage = track.title
      ? `Êtes-vous sûr de vouloir supprimer "${track.title}" ?`
      : "Êtes-vous sûr de vouloir supprimer ce morceau ?";
    if (window.confirm(confirmMessage)) {
      onDeleteTrack(track.id);
    }
  };

  const genres = ["all", "Afrobeat", "Pop", "Rap", "Électro", "Folk", "Lo-fi", "R&B"];

  const filtered = library.filter((t) => {
    const matchesSearch =
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      (t.meta && t.meta.toLowerCase().includes(search.toLowerCase())) ||
      (t.genre && t.genre.toLowerCase().includes(search.toLowerCase()));
    const matchesGenre =
      filterGenre === "all" ||
      (t.genre && t.genre.toLowerCase() === filterGenre.toLowerCase());
    return matchesSearch && matchesGenre;
  });

  // Bouton de lecture aléatoire (Shuffle)
  const handleShufflePlay = () => {
    if (filtered.length === 0) return;
    const randomIndex = Math.floor(Math.random() * filtered.length);
    onPlayTrack(filtered[randomIndex]);
  };

  return (
    <Stack gap="6" p={{ base: "5", md: "8" }} maxW="6xl" mx="auto">
      {/* En-tête */}
      <Flex
        justify="space-between"
        align={{ base: "flex-start", sm: "center" }}
        direction={{ base: "column", sm: "row" }}
        gap="4"
      >
        <Box>
          <HStack gap="2">
            <Text
              fontFamily="heading"
              fontWeight="800"
              fontSize={{ base: "2xl", md: "3xl" }}
              color="ink.900"
              letterSpacing="-0.03em"
            >
              Votre Bibliothèque
            </Text>
            <Badge
              rounded="full"
              bg="brand.violetTint"
              color="brand.violetDeep"
              px="2.5"
              py="0.5"
              fontFamily="ui"
              fontWeight="600"
            >
              {library.length} titre{library.length > 1 ? "s" : ""}
            </Badge>
          </HStack>
          <Text fontSize="sm" color="ink.500" mt="1">
            Retrouvez tous vos morceaux générés, vos exports et vos favoris.
          </Text>
        </Box>

        <HStack gap="2.5">
          {/* Bouton Shuffle conservé */}
          {filtered.length > 0 && (
            <IconButton
              size="md"
              rounded="full"
              variant="outline"
              borderColor="paper.300"
              color="ink.700"
              _hover={{ borderColor: "brand.violetDeep", color: "brand.violetDeep", bg: "brand.violetTint" }}
              onClick={handleShufflePlay}
              aria-label="Lecture aléatoire"
              title="Lecture aléatoire (Shuffle)"
            >
              <LuShuffle size={18} />
            </IconButton>
          )}

          <Button
            rounded="full"
            color="white"
            background={accent.primary}
            onClick={onOpenCreate}
            boxShadow="0 4px 18px rgba(124, 58, 237, 0.3)"
          >
            <LuPlus /> Nouvelle création (2 Notes)
          </Button>
        </HStack>
      </Flex>

      {/* Barre de recherche et filtres de genres */}
      <Flex
        direction={{ base: "column", md: "row" }}
        gap="3"
        align={{ base: "stretch", md: "center" }}
        justify="space-between"
      >
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
          <Box
            position="absolute"
            left="3"
            top="50%"
            transform="translateY(-50%)"
            color="ink.400"
            pointerEvents="none"
          >
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

      {/* Liste des créations au design carte précédent */}
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
                p="2"
                px={{base: '1', sm: '2'}}
                bg={isCurrent ? "brand.violetTint" : "paper.50"}
                borderBottomWidth="0.9px"
                borderColor={isCurrent ? "brand.violetDeep" : "paper.200"}
                _hover={{
                  borderColor: isCurrent ? "brand.violetDeep" : "paper.400",
                  bg: isCurrent ? "brand.violetTint" : "paper.0",
                }}
                transition="all 0.2s"
              >
               <Flex align="center" justify="space-between" gap="3">
                <HStack gap="3" flex="1" minW="0">
                  {/* Bouton lecture rapide */}
                  {/* <IconButton
                    aria-label={trackPlaying ? "Pause" : "Écouter"}
                    size="md"
                    rounded="full"
                    color="white"
                    background={accent.primary}
                    onClick={() => onPlayTrack(track)}
                    boxShadow={trackPlaying ? "0 0 0 3px #c4b5fd" : "none"}
                    flexShrink={0}
                  >
                    {trackPlaying ? <LuPause size={16} /> : <LuPlay size={16} />}
                  </IconButton> */}

                  <Box position={'relative'} display={'flex'} justifyContent={'center'} alignItems="center">
                    
                    <Image
                      src={track.coverUrl ? track.coverUrl : '/assets/13.png'}
                      alt={track.title}
                      boxSize={{base: "12", sm: '14'}}
                      rounded="none"
                      objectFit="cover"
                      display={{ base: "block", sm: "block" }}
                      flexShrink={0}
                    />
                  </Box>
                
                  <Stack gap="0" flex="1" minW="0">
                    <Flex gap="2" wrap="wrap">
                      <Text fontFamily="heading" fontWeight="700" fontSize="sm" color="ink.900" truncate>
                        {track.title}
                      </Text>
                     
                      </Flex>
                      <HStack>
                        <Text fontSize="xs" color="ink.500" truncate>
                          {track.meta || track.genre}
                        </Text>
                        {track.isPublic ? (
                            <Badge size="xs" w={'min-content'} colorPalette="green" variant="subtle" rounded="full" px="2" title="Visible sur la page d'accueil">
                              Public
                            </Badge>
                          ) : (
                            <Badge size="xs" w={'min-content'} colorPalette="gray" variant="subtle" rounded="full" px="2" title="Privé (masqué de l'accueil)">
                              Privé
                            </Badge>
                          )}

                        </HStack>
                  </Stack>
                </HStack>

                {/* Waveform discrète au centre synchronisée */}
                <Box w="100px" display={{ base: "none", md: "block" }}>
                  <Waveform
                    bars={16}
                    height={22}
                    gap="2px"
                    color="purple.500"
                    currentTime={isCurrent ? currentTime : 0}
                    duration={isCurrent ? (duration || track.seconds || 180) : (track.seconds || 180)}
                    animate={trackPlaying}
                    onSeek={isCurrent && onSeekTrack ? (seekSec) => onSeekTrack(seekSec) : undefined}
                  />
                </Box>

                {/* Durée et actions */}
                <HStack gap="2" flexShrink={0}>
                  {/* <HStack gap="1" color="ink.400" fontSize="xs" display={{ base: "none", sm: "flex" }}>
                    <LuClock size={12} />
                    <Text>{track.length || "1:00"}</Text>
                  </HStack> */}

                  {/* <IconButton
                    aria-label="Ajouter aux favoris"
                    size="sm"
                    variant="ghost"
                    rounded="full"
                    color={track.isFavorite ? "red.500" : "ink.400"}
                    onClick={() => onToggleFavorite(track.id)}
                  >
                    <LuHeart size={16} fill={track.isFavorite ? "currentColor" : "none"} />
                  </IconButton> */}

                  <IconButton
                      aria-label={trackPlaying ? "Pause" : "Écouter"}
                      size="xs"
                      variant={'surface'}
                      rounded="full"
                      colorPalette={'purple'}
                      onClick={() => onPlayTrack(track)}
                      boxShadow={trackPlaying ? "0 0 0 3px #c4b5fd" : "none"}
                      flexShrink={0}
                    >
                      {trackPlaying ? <LuPause size={16} /> : <LuPlay size={16} />}
                    </IconButton>

                  {/* Menu déroulant compact d'actions */}
                  <Box pos="relative">
                    <IconButton
                      aria-label="Plus d'actions"
                      size="xs"
                      variant="ghost"
                      rounded="full"
                      color="ink.500"
                      _hover={{ bg: "paper.200", color: "ink.900" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuTrackId((prev) => (prev === track.id ? null : track.id));
                      }}
                      title="Options"
                      flexShrink={0}
                    >
                      <LucideMoreVertical size={15} />
                    </IconButton>

                    {openMenuTrackId === track.id && (
                      <Box
                        pos="absolute"
                        right="0"
                        top="calc(100% + 4px)"
                        w="200px"
                        bg="white"
                        borderWidth="1px"
                        borderColor="paper.200"
                        rounded="xl"
                        boxShadow="0 12px 28px -4px rgba(0,0,0,0.12), 0 4px 10px -2px rgba(0,0,0,0.06)"
                        py="1.5"
                        zIndex="50"
                        fontFamily="ui"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Télécharger */}
                        <Box
                          as="button"
                          w="100%"
                          display="flex"
                          alignItems="center"
                          gap="2.5"
                          px="3.5"
                          py="2"
                          fontSize="xs"
                          fontWeight="600"
                          color="ink.700"
                          _hover={{ bg: "paper.100", color: "brand.violet" }}
                          transition="all 0.15s ease"
                          onClick={() => {
                            setOpenMenuTrackId(null);
                            handleDownloadTrack(track);
                          }}
                        >
                          <LuDownload size={14} />
                          <Text>Télécharger MP3</Text>
                        </Box>

                        {/* Rendre Public / Privé */}
                        {onTogglePublic && (
                          <Box
                            as="button"
                            w="100%"
                            display="flex"
                            alignItems="center"
                            gap="2.5"
                            px="3.5"
                            py="2"
                            fontSize="xs"
                            fontWeight="600"
                            color={track.isPublic ? "green.700" : "ink.700"}
                            _hover={{ bg: "paper.100", color: track.isPublic ? "red.600" : "green.600" }}
                            transition="all 0.15s ease"
                            onClick={() => {
                              setOpenMenuTrackId(null);
                              onTogglePublic(track.id);
                            }}
                          >
                            {track.isPublic ? <LuLock size={14} /> : <LuGlobe size={14} />}
                            <Text>{track.isPublic ? "Rendre privé" : "Rendre public (accueil)"}</Text>
                          </Box>
                        )}

                        {/* Supprimer */}
                        {onDeleteTrack && (
                          <>
                            <Box my="1" borderTopWidth="1px" borderColor="paper.150" />
                            <Box
                              as="button"
                              w="100%"
                              display="flex"
                              alignItems="center"
                              gap="2.5"
                              px="3.5"
                              py="2"
                              fontSize="xs"
                              fontWeight="600"
                              color="red.600"
                              _hover={{ bg: "red.50" }}
                              transition="all 0.15s ease"
                              onClick={() => {
                                setOpenMenuTrackId(null);
                                handleDeleteTrack(track);
                              }}
                            >
                              <LuTrash2 size={14} />
                              <Text>Supprimer</Text>
                            </Box>
                          </>
                        )}
                      </Box>
                    )}
                  </Box>
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
