"use client";

import NextLink from "next/link";
import { Box, Button, Container, Heading, Stack, Text } from "@chakra-ui/react";
import { LuArrowRight } from "react-icons/lu";
import Reveal from "@/components/common/Reveal";
import Waveform from "@/components/common/Waveform";
import { accent } from "@/theme/system";

/** Grande carte d'appel à l'action finale (idée Qtask "All of your work, in one place"). */
export default function CtaBanner() {
  return (
    <Box as="section" pb={{ base: "20", md: "28" }}>
      <Container maxW="7xl">
        <Reveal>
          <Stack position="relative" overflow="hidden" align="center" textAlign="center" gap="6" px={{ base: "6", md: "16" }} py={{ base: "14", md: "20" }} rounded="3xl" borderWidth="1px" borderColor="paper.300" bg="paper.50">
            <Box position="absolute" inset="0" bg="brand.violetTint" />
            <Box position="absolute" insetX="0" bottom="0" opacity="0.25" px="6" pointerEvents="none">
              <Waveform bars={90} height={120} animate progress={1} />
            </Box>
            <Stack position="relative" gap="6" align="center">
              <Heading as="h2" fontFamily="heading" fontWeight="800" fontSize={{ base: "3xl", md: "6xl" }} letterSpacing="-0.04em" lineHeight="1.03" maxW="3xl">
                Votre prochaine chanson est à une phrase d&apos;ici
              </Heading>
              <Text color="ink.700" fontSize="lg" maxW="xl">
                Essayez gratuitement : 5 titres offerts, sans carte bancaire.
              </Text>
              <Button
                asChild
                size="xl"
                rounded="full"
                px="8"
                fontFamily="ui"
                fontWeight="600"
                color="white"
                background={accent.primary}
                _hover={{ transform: "translateY(-2px)" }}
                transition="all .25s"
              >
                <NextLink href="/studio">
                  Créer ma musique maintenant <LuArrowRight />
                </NextLink>
              </Button>
            </Stack>
          </Stack>
        </Reveal>
      </Container>
    </Box>
  );
}
