"use client";

import { Box, Container, Flex, Grid, GridItem, HStack, Stack, Text } from "@chakra-ui/react";
import { LuPalette, LuPenLine, LuMicVocal, LuDownload, LuCheck } from "react-icons/lu";
import SectionHead from "@/components/common/SectionHead";
import Reveal from "@/components/common/Reveal";
import Waveform from "@/components/common/Waveform";
import { accent } from "@/theme/system";

/** Carte "bento" : tuile d'icône, titre, texte et un mini aperçu de l'interface (idée Qtask / Paynance). */
function BentoCard({ icon: Icon, title, text, children, tint = "brand.violet", ...rest }) {
  return (
    <GridItem {...rest}>
      <Flex
        direction="column"
        h="100%"
        p="7"
        gap="6"
        rounded="3xl"
        bg="paper.100"
        borderWidth="1px"
        borderColor="paper.300"
        overflow="hidden"
        position="relative"
        _hover={{ borderColor: "paper.400" }}
        transition="border-color .3s"
      >
        <Stack gap="3">
          <Flex boxSize="11" rounded="xl" bg="paper.200" color={tint} align="center" justify="center" fontSize="xl">
            <Icon />
          </Flex>
          <Text as="h3" fontFamily="heading" fontWeight="700" fontSize="xl" letterSpacing="-0.02em">
            {title}
          </Text>
          <Text color="ink.500" fontSize="sm" maxW="md">
            {text}
          </Text>
        </Stack>
        <Box mt="auto">{children}</Box>
      </Flex>
    </GridItem>
  );
}

const chip = { px: "3", py: "1.5", rounded: "full", fontFamily: "ui", fontSize: "sm", borderWidth: "1px" };

export default function Features() {
  return (
    <Box as="section" id="fonctionnalites" py={{ base: "20", md: "28" }} scrollMarginTop="80px">
      <Container maxW="7xl">
        <Reveal>
          <SectionHead
            pill="Fonctionnalités"
            title="Tout ce qu'il faut pour une chanson qui vous ressemble"
            text="Choisissez chaque détail ou laissez l'IA décider : vous gardez la main à chaque étape."
          />
        </Reveal>

        <Grid mt="14" templateColumns={{ base: "1fr", lg: "repeat(6, 1fr)" }} gap="5">
          <BentoCard colSpan={{ base: 1, lg: 4 }} icon={LuPalette} title="Styles personnalisés" text="Plus de 120 genres, des humeurs et un tempo réglable pour une musique qui colle à votre projet.">
            <Flex gap="2" wrap="wrap">
              {["Afrobeat", "Lo-fi", "Synthwave", "Pop", "Jazz", "Trap"].map((g, i) => (
                <Box key={g} {...chip} borderColor={i === 0 ? "brand.violet" : "paper.300"} bg={i === 0 ? "rgba(139,92,246,0.18)" : "transparent"} color={i === 0 ? "ink.900" : "ink.500"}>
                  {g}
                </Box>
              ))}
              <Box {...chip} borderColor="paper.300" color="ink.500">
                +114
              </Box>
            </Flex>
          </BentoCard>

          <BentoCard colSpan={{ base: 1, lg: 2 }} icon={LuPenLine} title="Paroles par IA" text="Des textes originaux dans la langue de votre choix, modifiables avant la génération." tint="brand.pink">
            <Stack gap="2" fontSize="sm" color="ink.700" p="4" rounded="xl" bg="paper.0" borderWidth="1px" borderColor="paper.200">
              <Text color="ink.400" fontFamily="ui" fontSize="xs">
                Refrain
              </Text>
              <Text>Les lumières de juillet nous suivent,</Text>
              <Text>on danse jusqu&apos;au bout de la nuit.</Text>
              <Box h="2" w="40%" rounded="full" background={accent.pink} opacity="0.7" />
            </Stack>
          </BentoCard>

          <BentoCard colSpan={{ base: 1, lg: 2 }} icon={LuMicVocal} title="Voix off et chant" text="Voix féminine, masculine ou chœur. Ajoutez une voix parlée pour vos vidéos." tint="brand.cyanDeep">
            <Stack gap="3">
              {["Voix chaleureuse", "Voix grave"].map((v, i) => (
                <HStack key={v} gap="3" p="3" rounded="xl" bg="paper.0" borderWidth="1px" borderColor={i === 0 ? "brand.cyanDeep" : "paper.200"}>
                  <Text fontFamily="ui" fontSize="sm" w="28" flexShrink={0}>
                    {v}
                  </Text>
                  <Waveform bars={18} height={22} gap="2px" progress={i === 0 ? 0.6 : 0} />
                </HStack>
              ))}
            </Stack>
          </BentoCard>

          <BentoCard colSpan={{ base: 1, lg: 4 }} icon={LuDownload} title="Export instantané" text="Téléchargez en MP3 ou WAV, récupérez les paroles et, avec le plan Studio, chaque piste séparée." tint="brand.violet">
            <Flex gap="3" wrap="wrap">
              {["MP3 320 kbps", "WAV 24 bits", "Paroles (PDF)", "Pistes séparées"].map((f) => (
                <HStack key={f} gap="2" px="4" py="2.5" rounded="xl" bg="paper.0" borderWidth="1px" borderColor="paper.200" fontFamily="ui" fontSize="sm">
                  <Box color="brand.cyanDeep">
                    <LuCheck />
                  </Box>
                  {f}
                </HStack>
              ))}
            </Flex>
          </BentoCard>
        </Grid>
      </Container>
    </Box>
  );
}
