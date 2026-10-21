"use client";

import { Box, Container, Flex, Heading, VisuallyHidden } from "@chakra-ui/react";
import { LuMusic } from "react-icons/lu";
import { genres } from "@/data/content";

/**
 * Un ruban incliné qui défile.
 * - On répète la liste 4 fois et on anime de -50 % : la boucle est sans saut,
 *   même sur un très grand écran.
 * - Le ruban fait 110 vw de large pour déborder des deux côtés malgré l'inclinaison.
 */
function Band({ items, reverse = false, duration = 40, rotate = 0, bg, color, iconColor, ...rest }) {
  const set = [...items, ...items];
  const loop = [...set, ...set];

  return (
    <Box
      aria-hidden="true"
      position="absolute"
      left="-5vw"
      w="110vw"
      overflow="hidden"
      py={{ base: "3", md: "4" }}
      bg={bg}
      color={color}
      transform={`rotate(${rotate}deg)`}
      {...rest}
    >
      <Flex
        w="max-content"
        align="center"
        animation={`${reverse ? "marqueeRight" : "marqueeLeft"} ${duration}s linear infinite`}
        _hover={{ animationPlayState: "paused" }}
      >
        {loop.map((g, i) => (
          <Flex key={`${g}-${i}`} align="center" gap={{ base: "4", md: "6" }} pr={{ base: "4", md: "6" }} flexShrink={0}>
            <Box
              as="span"
              fontFamily="heading"
              fontWeight="800"
              fontSize={{ base: "xl", md: "3xl" }}
              letterSpacing="-0.02em"
              whiteSpace="nowrap"
            >
              {g}
            </Box>
            <Box as="span" color={iconColor} fontSize={{ base: "lg", md: "2xl" }} display="flex">
              <LuMusic />
            </Box>
          </Flex>
        ))}
      </Flex>
    </Box>
  );
}

/** Deux rubans qui se croisent : violet (vers la gauche) et noir (vers la droite). */
export default function GenreMarquee() {
  const half = Math.ceil(genres.length / 2);

  return (
    <Box as="section" py={{ base: "12", md: "16" }} overflow="hidden">
      <Container maxW="7xl">
        <Heading
          as="h2"
          textAlign="center"
          fontFamily="ui"
          fontWeight="500"
          fontSize={{ base: "xl", md: "2xl" }}
          color="ink.700"
          mb={{ base: "8", md: "10" }}
        >
          Plus de 120 styles musicaux, du classique au dernier tube du moment
        </Heading>
      </Container>

      {/* Les rubans sont décoratifs : une version texte pour les lecteurs d'écran */}
      <VisuallyHidden>{genres.join(", ")}</VisuallyHidden>

      <Box position="relative" h={{ base: "150px", md: "190px" }}>
        <Band
          items={genres.slice(0, half)}
          duration={45}
          rotate={-2}
          top={{ base: "10px", md: "14px" }}
          bg="brand.violetDeep"
          color="white"
          iconColor="brand.cyan"
          zIndex="1"
        />
        <Band
          items={genres.slice(half)}
          reverse
          duration={52}
          rotate={2}
          top={{ base: "62px", md: "82px" }}
          bg="ink.900"
          color="white"
          iconColor="brand.violet"
          zIndex="2"
        />
      </Box>
    </Box>
  );
}