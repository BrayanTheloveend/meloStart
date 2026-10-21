"use client";

import { Box, Container, Flex, Grid, Heading, Stack, Text } from "@chakra-ui/react";
import Reveal from "@/components/common/Reveal";
import SectionHead from "@/components/common/SectionHead";
import { steps } from "@/data/content";
import { accent } from "@/theme/system";

/**
 * Trois étapes numérotées : ici la numérotation est justifiée, c'est une vraie séquence.
 * Panneau dégradé à gauche + cartes empilées à droite (structure Paynance "How it works").
 */
export default function HowItWorks() {
  return (
    <Box as="section" id="comment-ca-marche" py={{ base: "20", md: "28" }} scrollMarginTop="80px">
      <Container maxW="7xl">
        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} rounded="3xl" overflow="hidden" borderWidth="1px" borderColor="paper.300" bg="paper.50">
          <Flex direction="column" justify="center" gap="6" p={{ base: "8", md: "14" }} position="relative" overflow="hidden">
            <Box position="absolute" inset="0" bg="brand.violetTint" />
            <Reveal position="relative">
              <Stack gap="5">
                <Heading as="h2" fontFamily="heading" fontWeight="800" fontSize={{ base: "3xl", md: "5xl" }} letterSpacing="-0.035em" lineHeight="1.05">
                  Votre chanson en trois étapes
                </Heading>
                <Text color="ink.700" fontSize="lg" maxW="md">
                  Pas de logiciel à installer, pas de connaissances musicales requises.
                </Text>
              </Stack>
            </Reveal>
          </Flex>

          <Stack gap="4" p={{ base: "5", md: "10" }}>
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 120}>
                <Flex gap="5" p="6" rounded="2xl" bg="paper.100" borderWidth="1px" borderColor="paper.200" align="flex-start">
                  <Flex boxSize="12" flexShrink={0} rounded="full" align="center" justify="center" fontFamily="heading" fontWeight="800" fontSize="lg" color="white" background={accent.primary}>
                    {i + 1}
                  </Flex>
                  <Stack gap="1.5">
                    <Text as="h3" fontFamily="heading" fontWeight="700" fontSize="xl">
                      {s.title}
                    </Text>
                    <Text color="ink.500" fontSize="sm">
                      {s.text}
                    </Text>
                  </Stack>
                </Flex>
              </Reveal>
            ))}
          </Stack>
        </Grid>
      </Container>
    </Box>
  );
}
