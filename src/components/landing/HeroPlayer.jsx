"use client";

import { useEffect, useState } from "react";
import { Box, Flex, HStack, IconButton, Stack, Text, Badge } from "@chakra-ui/react";
import { LuPlay, LuPause, LuMicVocal, LuDownload, LuSparkles } from "react-icons/lu";
import Waveform from "@/components/common/Waveform";
import { accent } from "@/theme/system";

const TOTAL = 134; // durée simulée en secondes
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

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

/** Lecteur interactif du hero : le moment mémorable de la page. */
export default function HeroPlayer() {
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(38);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setTime((t) => (t >= TOTAL ? 0 : t + 0.25)), 250);
    return () => clearInterval(id);
  }, [playing]);

  return (
    <Box position="relative" maxW="3xl" mx="auto" mt={{ base: "12", md: "16" }}>

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
              Votre description
            </Text>
            <Text fontSize={{ base: "sm", md: "md" }} color="ink.700" maxW="md">
              « Une chanson afrobeat joyeuse pour l&apos;anniversaire de ma sœur Amina, avec des paroles en français. »
            </Text>
          </Stack>
          <Badge flexShrink={0} px="3" py="1" rounded="full" bg="rgba(6,182,212,0.15)" color="brand.cyanDeep" fontFamily="ui">
            Généré en 3 min
          </Badge>
        </Flex>

        <HStack gap="4" align="center">
          <IconButton
            aria-label={playing ? "Mettre en pause" : "Écouter l'exemple"}
            onClick={() => setPlaying((p) => !p)}
            boxSize="14"
            rounded="full"
            color="white"
            background={accent.primary}
            _hover={{ transform: "scale(1.06)" }}
            transition="transform .2s"
          >
            {playing ? <LuPause size={22} /> : <LuPlay size={22} />}
          </IconButton>
          <Stack gap="0" textAlign="left" flex="1" minW="0">
            <Text fontFamily="heading" fontWeight="700" fontSize="lg" truncate>
              Joyeux anniversaire, Amina
            </Text>
            <Text fontSize="sm" color="ink.500">
              Afrobeat · Joyeux · 108 BPM
            </Text>
          </Stack>
          <Text fontFamily="ui" fontSize="sm" color="ink.500" flexShrink={0}>
            {fmt(time)} / {fmt(TOTAL)}
          </Text>
        </HStack>

        <Box mt="6">
          <Waveform bars={56} height={72} animate={playing} progress={time / TOTAL} />
        </Box>
      </Box>

      {/* <FloatCard top="-22px" left="-64px">
        <Flex boxSize="9" rounded="lg" bg="rgba(139,92,246,0.2)" color="brand.violet" align="center" justify="center">
          <LuSparkles />
        </Flex>
        <Stack gap="0" textAlign="left">
          <Text fontSize="xs" color="ink.500">Paroles écrites par l&apos;IA</Text>
          <Text fontFamily="ui" fontSize="sm" fontWeight="600">3 couplets · 1 refrain</Text>
        </Stack>
      </FloatCard> */}

      <FloatCard bottom="30px" right="-72px" delay="1.5s">
        <Flex boxSize="9" rounded="lg" bg="rgba(236,72,153,0.2)" color="brand.pink" align="center" justify="center">
          <LuMicVocal />
        </Flex>
        <Stack gap="0" textAlign="left">
          <Text fontSize="xs" color="ink.500">Voix</Text>
          <Text fontFamily="ui" fontSize="sm" fontWeight="600">Féminine, chaleureuse</Text>
        </Stack>
      </FloatCard>

      <FloatCard bottom="-26px" left="40px" delay="3s">
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
