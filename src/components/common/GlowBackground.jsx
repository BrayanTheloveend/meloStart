"use client";

import { Box } from "@chakra-ui/react";

/**
 * Seul dégradé conservé : un halo violet très pâle en haut de section.
 * Le parent doit être position="relative" + overflow="hidden".
 */
export default function GlowBackground({ intensity = 1 }) {
  return (
    <Box
      position="absolute"
      insetX="0"
      top="0"
      h="560px"
      pointerEvents="none"
      opacity={intensity}
      background="radial-gradient(ellipse 60% 100% at 50% 0%, rgba(139,92,246,0.10), transparent 70%)"
    />
  );
}
