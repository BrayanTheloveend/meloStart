"use client";

import { Badge, Box, Button, Flex, Grid, HStack, IconButton, Image, Stack, Text } from "@chakra-ui/react";
import { LuClock, LuDownload, LuHeart, LuMusic, LuPause, LuPlay, LuPlus, LuSparkles, LuWandSparkles, LuZap } from "react-icons/lu";
import Waveform from "@/components/common/Waveform";
import { accent } from "@/theme/system";
import { downloadTrackAudio } from "@/lib/downloadTrack";

const quickPrompts = [
  { genre: "Afrobeat", title: "Vibes d'été Afrobeat", prompt: "Une chanson afrobeat rythmée et solaire pour faire danser les amis en vacances." },
  { genre: "Pop", title: "Pop Acoustique Douce", prompt: "Une ballade pop douce au piano et guitare avec une voix féminine pleine d'émotion." },
  { genre: "Rap", title: "Rap R&B Nocturne", prompt: "Un beat trap R&B moderne et mélancolique pour rouler de nuit en ville." },
  { genre: "Électro", title: "Électro Festival Épique", prompt: "Un morceau électro dance énergique avec des synthés futuristes et une montée puissante." },
];

export default function StudioHome({
  notes,
  library = [],
  onOpenCreate,
  onOpenRecharge,
  activeTrack,
  isPlaying,
  currentTime = 0,
  duration = 0,
  onSeekTrack,
  onPlayTrack,
  onToggleFavorite,
  onPreloadPrompt,
}) {
  return (
    <Stack gap="8" p={{ base: "5", md: "8" }} maxW="6xl" mx="auto">
      {/* 1. Barre d'accueil et solde de Notes */}
      <Flex justify="space-between" align={{ base: "flex-start", sm: "center" }} direction={{ base: "column", sm: "row" }} gap="4">
        <Box>
          <HStack gap="2">
            <Text fontFamily="heading" fontWeight="800" fontSize={{ base: "xl", md: "3xl" }} color="ink.900" letterSpacing="-0.03em">
              Studio pretymelo
            </Text>
            <Badge size="sm" rounded="full" bg="brand.violetTint" color="brand.violetDeep" px="2.5" py="0.5" fontFamily="ui" fontWeight="600">
              v2.0
            </Badge>
          </HStack>
          <Text fontSize="sm" color="ink.500" mt="1">
            Générez, écoutez et téléchargez vos titres créés par IA.
          </Text>
        </Box>

        {/* Widget Solde de Notes */}
        <HStack display={{md: 'flex', base: 'none'}} p="2" pl="4" rounded="2xl" bg="paper.0"  gap="3">
          <HStack gap="1.5">
          
            <Box>
              <Text fontFamily="heading" fontWeight="800" fontSize="md" color="ink.900" lineHeight="1">
                {notes} Notes
              </Text>
              <Text mt="1" fontSize="2xs" color="ink.400" lineHeight="1">
                (2 notes / chanson)
              </Text>
            </Box>
          </HStack>
          <Button
            size="sm"
            rounded="xl"
            fontFamily="ui"
            fontWeight="600"
            color="white"
            background={accent.primary}
            onClick={onOpenRecharge}
            _hover={{ transform: "translateY(-1px)" }}
            transition="all 0.2s"
          >
            <LuZap size={14} /> Recharger
          </Button>
        </HStack>
      </Flex>

      {/* 2. Carte d'action principale : Créer une nouvelle chanson */}
      <Box
        p={{ base: "5", md: "6" }}
        rounded="2xl"
        bg="paper.0"
        borderWidth="1px"
        borderColor="paper.300"
      >
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align={{ base: "flex-start", md: "center" }}
          gap="5"
        >
          <Stack gap="1.5" maxW="xl">
            <HStack gap="2">
              <Badge
                rounded="full"
                px="2.5"
                py="0.5"
                bg="brand.violetTint"
                color="brand.violetDeep"
                fontSize="2xs"
                fontWeight="700"
              >
                Studio IA
              </Badge>
              <Text fontSize="xs" color="ink.400">
                2 Notes / chanson
              </Text>
            </HStack>
            <Text
              fontFamily="heading"
              fontWeight="800"
              fontSize={{ base: "lg", md: "2xl" }}
              color="ink.900"
              letterSpacing="-0.02em"
            >
              Prêt à composer votre prochain titre ?
            </Text>
            <Text fontSize="sm" color="ink.500" lineHeight="tall">
              Décrivez votre ambiance ou saisissez vos paroles. L&apos;IA compose les mélodies, les voix et le mastering en 30 secondes.
            </Text>
          </Stack>

          <Button
            size={{ base: "md", md: "lg" }}
            rounded="full"
            fontFamily="ui"
            fontWeight="600"
            color="white"
            background={accent.primary}
            _hover={{ opacity: 0.92 }}
            transition="all 0.2s"
            onClick={onOpenCreate}
            flexShrink={0}
          >
            <LuWandSparkles size={18} /> Créer une chanson
          </Button>
        </Flex>
      </Box>

      {/* 3. Inspirations & idées rapides */}
      <Stack gap="3" display={'none'}>
        <Flex justify="space-between" align="center" flexDir={{md: 'row', base: 'column'}}>
          <Text fontFamily="ui" fontWeight="700" fontSize="sm" color="ink.700" textTransform="uppercase" letterSpacing="wider">
            Inspirations en 1 clic
          </Text>
          <Text fontSize="xs" color="ink.400">
            Cliquez pour démarrer avec ce modèle
          </Text>
        </Flex>
        <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }} gap="3">
          {quickPrompts.map((q) => (
            <Box
              key={q.title}
              as="button"
              type="button"
              onClick={() => onPreloadPrompt(q)}
              p="4"
              textAlign="left"
              rounded="2xl"
              bg="paper.50"
              borderWidth="1px"
              borderColor="paper.200"
              _hover={{ borderColor: "brand.violetDeep", bg: "paper.0", transform: "translateY(-1px)" }}
              transition="all 0.2s"
              cursor="pointer"
            >
              <Badge size="xs" rounded="full" bg="brand.violetTint" color="brand.violetDeep" mb="2">
                {q.genre}
              </Badge>
              <Text fontFamily="ui" fontWeight="600" fontSize="sm" color="ink.900" mb="1" noOfLines={1}>
                {q.title}
              </Text>
              <Text fontSize="xs" color="ink.500" noOfLines={2}>
                {q.prompt}
              </Text>
            </Box>
          ))}
        </Grid>
      </Stack>

      {/* 4. Musiques Récemment Créées (Simple & Minimaliste) */}
      <Stack gap="4">
        <Flex justify="space-between" align="baseline" flexDir={{md: 'row', base: 'column'}}>
          <HStack gap="2">
            <Text fontFamily="heading" fontWeight="700" fontSize={{md: "xl", base: 'md'}} color="ink.900">
              Musiques récemment créées
            </Text>
            <Badge rounded="full" bg="paper.200" color="ink.700" fontSize="xs">
              {library.length}
            </Badge>
          </HStack>
          <Text fontSize="xs" color="ink.400" lineClamp={1}>
            Les plus récentes en premier
          </Text>
        </Flex>

        {library.length === 0 ? (
          <Box p="10" textAlign="center" rounded="3xl" bg="paper.50" borderWidth="1px" borderColor="paper.200">
            <Flex boxSize="14" mx="auto" mb="3" rounded="2xl" bg="paper.200" align="center" justify="center" color="ink.400">
              <LuMusic size={24} />
            </Flex>
            <Text fontFamily="heading" fontWeight="700" color="ink.900" mb="1">
              Aucune musique créée pour l&apos;instant
            </Text>
            <Text fontSize="sm" color="ink.500" maxW="sm" mx="auto" mb="5">
              Utilisez vos 2 notes pour donner vie à votre premier titre en quelques clics.
            </Text>
            <Button rounded="full" color="white" background={accent.primary} onClick={onOpenCreate}>
              <LuPlus /> Créer mon premier morceau
            </Button>
          </Box>
        ) : (
          <Stack gap="0.5">
            {library.slice(0, 5).map((track) => {
              const isCurrent = activeTrack?.id === track.id;
              const trackPlaying = isCurrent && isPlaying;
              const trackDuration = isCurrent ? (duration || track.seconds || 180) : (track.seconds || 180);
              const trackCurrentTime = isCurrent ? currentTime : 0;

              return (
                <Box
                  key={track.id}
                  p="2"
                  px={{base: '1', sm: '4'}}
                  bg={isCurrent ? "brand.violetTint" : "paper.50"}
                  borderBottomWidth="0.1px"
                  borderColor={isCurrent ? "brand.violetDeep" : "paper.200"}
                  _hover={{ borderColor: isCurrent ? "brand.violetDeep" : "paper.400", bg: isCurrent ? "brand.violetTint" : "paper.0" }}
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
                        <HStack gap="2">
                          <Text fontFamily="heading" fontWeight="700" fontSize="sm" color="ink.900" truncate>
                            {track.title}
                          </Text>
                          {track.isFavorite && <Text color="red.500" fontSize="xs">❤️</Text>}
                        </HStack>
                        <Text fontSize="xs" color="ink.500" truncate>
                          {track.meta || track.genre}
                        </Text>
                      </Stack>
                    </HStack>

                    {/* Waveform discrète au centre synchronisée */}
                    <Box w="100px" display={{ base: "none", md: "block" }}>
                      <Waveform
                        bars={16}
                        height={22}
                        gap="2px"
                        color="purple.500"
                        currentTime={trackCurrentTime}
                        duration={trackDuration}
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

                      <IconButton
                        size="xs"
                        rounded="full"
                        variant="outline"
                        colorPalette={'purple'}
                        onClick={() => downloadTrackAudio(track)}
                      >
                        <LuDownload size={13} />
                      </IconButton>
                    </HStack>
                  </Flex>
                </Box>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}
