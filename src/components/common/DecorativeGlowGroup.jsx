"use client";

import { Box } from "@chakra-ui/react";

/**
 * Groupe décoratif de deux cercles en intersection floutés (Purple & Pink).
 * Conforme à la charte pretymelo (Violet #7c3aed / Rose #ec4899).
 * Crée un effet de halo lumineux doux et moderne (ambient mesh glow).
 */
export default function DecorativeGlowGroup({
  top,
  bottom,
  left,
  right,
  transform,
  size = { base: "280px", sm: "340px", md: "440px" },
  opacity = 0.28,
  blur = { base: "60px", md: "80px" },
  purpleColor = "#7c3aed",
  pinkColor = "#ec4899",
  reversed = false,
  animated = true,
  ...props
}) {
  return (
    <Box
      position="absolute"
      top={top}
      bottom={bottom}
      left={left}
      right={right}
      transform={transform}
      pointerEvents="none"
      userSelect="none"
      zIndex="0"
      aria-hidden="true"
      {...props}
    >
      <Box
        position="relative"
        w={size}
        h={size}
        animation={animated ? "floatY 9s ease-in-out infinite" : undefined}
      >
        {/* Cercle Purple (Violet pretymelo) */}
        <Box
          position="absolute"
          top={reversed ? "20%" : "0"}
          left={reversed ? "25%" : "0"}
          w="68%"
          h="68%"
          rounded="full"
          bg={`radial-gradient(circle, ${purpleColor} 0%, rgba(139, 92, 246, 0.75) 50%, transparent 75%)`}
          filter={{ base: `blur(55px)`, md: `blur(${blur})` }}
          opacity={opacity}
          mixBlendMode="multiply"
        />

        {/* Cercle Pink (Rose pretymelo) en intersection */}
        <Box
          position="absolute"
          bottom={reversed ? "0" : "15%"}
          right={reversed ? "0" : "15%"}
          w="68%"
          h="68%"
          rounded="full"
          bg={`radial-gradient(circle, ${pinkColor} 0%, rgba(244, 114, 182, 0.75) 50%, transparent 75%)`}
          filter={{ base: `blur(55px)`, md: `blur(${blur})` }}
          opacity={opacity}
          mixBlendMode="multiply"
        />
      </Box>
    </Box>
  );
}

