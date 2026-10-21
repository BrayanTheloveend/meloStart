"use client";

import { Flex, Box } from "@chakra-ui/react";
import { accent } from "@/theme/system";

// Hauteurs déterministes (pas de Math.random → pas d'erreur d'hydratation)
const heightAt = (i) => 18 + Math.abs(Math.sin(i * 1.7) * 52) + Math.abs(Math.cos(i * 0.6) * 24);

/**
 * Forme d'onde.
 * - animate : barres qui "respirent" (lecture / génération)
 * - progress : 0..1, colore les barres déjà lues
 */
export default function Waveform({ bars = 48, height = 64, animate = false, progress = 0, gap = "3px" }) {
  return (
    <Flex align="center" gap={gap} h={`${height}px`} w="100%" aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => {
        const played = i / bars <= progress;
        return (
          <Box
            key={i}
            flex="1"
            minW="2px"
            h={`${heightAt(i)}%`}
            rounded="full"
            transformOrigin="center"
            background={played ? accent.primary : "paper.400"}
            opacity={played ? 1 : 0.7}
            transition="background .3s"
            animation={animate ? `wave ${0.9 + (i % 7) * 0.12}s ease-in-out ${(i % 9) * 0.07}s infinite` : undefined}
          />
        );
      })}
    </Flex>
  );
}
