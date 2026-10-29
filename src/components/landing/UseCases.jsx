"use client";

import { useEffect, useRef } from "react";
import NextLink from "next/link";
import { Box, Container, Flex, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import SectionHead from "@/components/common/SectionHead";
import Reveal from "@/components/common/Reveal";
import { useCases } from "@/data/content";

// Métadonnées artistiques pour enrichir chaque disque vinyle selon l'occasion
const OCCASION_ART_META = {
  "Anniversaires": {
    scriptTitle: "Joyeux Anniversaire",
    edition: "Vol 01 · B-Day",
    code: "2026",
    label: "Festif / Pop",
    tapeColor: "rgba(238, 222, 178, 0.88)",
    targetOccasion: "birthday",
  },
  "Mariages": {
    scriptTitle: "Pour la Vie",
    edition: "Side A · Union",
    code: "Stereo",
    label: "Ballade / Émotion",
    tapeColor: "rgba(244, 230, 218, 0.88)",
    targetOccasion: "wedding",
  },
  "Vidéos et podcasts": {
    scriptTitle: "Studio Session",
    edition: "Tape 03 · Media",
    code: "Lo-Fi",
    label: "Groove / Podcast",
    tapeColor: "rgba(224, 234, 238, 0.88)",
    targetOccasion: "other",
  },
  "Marques et publicités": {
    scriptTitle: "Brand Signature",
    edition: "Master 04 · Pro",
    code: "HQ 24bit",
    label: "Électro / Impact",
    tapeColor: "rgba(236, 226, 198, 0.88)",
    targetOccasion: "success",
  },
  "Jeux et applications": {
    scriptTitle: "Level Complete",
    edition: "OST 05 · Arcade",
    code: "Synth",
    label: "Épique / Gaming",
    tapeColor: "rgba(228, 222, 245, 0.88)",
    targetOccasion: "party",
  },
  "Déclarations d'amour": {
    scriptTitle: "Mon Amour",
    edition: "Side B · Romance",
    code: "Acoustic",
    label: "Doux / Intime",
    tapeColor: "rgba(246, 220, 220, 0.88)",
    targetOccasion: "romance",
  },
};

/**
 * Tracé vectoriel reproduisant le croquis artistique au crayon sur le disque
 */
function ScribbleDoodle() {
  return (
    <svg
      width="135"
      height="80"
      viewBox="0 0 135 80"
      fill="none"
      style={{
        position: "absolute",
        top: "14%",
        right: "4%",
        zIndex: 5,
        pointerEvents: "none",
        opacity: 0.88,
      }}
    >
      <path
        d="M6 32 Q42 18 84 22 T128 16"
        stroke="#0f172a"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M15 45 Q52 34 98 28 T131 22"
        stroke="#0f172a"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M30 56 Q72 46 112 40 T126 34"
        stroke="#0f172a"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M48 66 Q88 56 122 48"
        stroke="#0f172a"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Carte d'Occasion stylisée en pochette de vinyle éditoriale haut de gamme
 */
function OccasionVinylCard({ item }) {
  const meta = OCCASION_ART_META[item.title] || {
    scriptTitle: item.title,
    edition: "Vol 01",
    code: "Studio AI",
    label: item.genre,
    tapeColor: "rgba(238, 222, 178, 0.88)",
    targetOccasion: "other",
  };

  const targetHref = `/studio/create?occasion=${encodeURIComponent(meta.targetOccasion)}`;

  return (
    <Box
      as={NextLink}
      href={targetHref}
      role="group"
      display="flex"
      flexDirection="column"
      h="100%"
      w="100%"
      overflow="hidden"
      transition="all 0.35s cubic-bezier(0.16, 1, 0.3, 1)"
      // _hover={{
      //   transform: "translateY(-6px)",
      //   borderColor: "purple.300",
      //   boxShadow: "0 20px 42px rgba(124, 58, 237, 0.12)",
      // }}
      textDecoration="none"
    >
      {/* ── PARTIE SUPÉRIEURE : POCHETTE ÉDITORIALE AVEC DISQUE VINYLE ── */}
      <Box
        position="relative"
        bg="trensparent"
        p="5"
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
        minH="200px"
      >
        

        {/* Le Disque Vinyle / CD centré */}
        <Box
          position="relative"
          boxSize={{ base: "190px", sm: "205px" }}
          borderWidth={'14px'}
          borderColor={'ink.900'}
          borderRadius={'full'}
          mx="auto"
          my="auto"
        >
          {/* Ruban adhésif / Washi tape texturé (coin haut gauche) */}
          <Box
            position="absolute"
            top="3%"
            left="8%"
            w="70px"
            h="25px"
            // bg={meta.tapeColor}
            transform="rotate(-18deg)"
            zIndex="6"
            boxShadow="0 2px 6px rgba(0,0,0,0.08)"
            style={{
              clipPath: "polygon(3% 0%, 97% 0%, 100% 90%, 95% 100%, 0% 100%, 5% 10%)",
              backdropFilter: "blur(2px)",
            }}
            opacity="0.92"
          />

          {/* Titre calligraphique manuscrit (style signature d'artiste) */}
          <Box
            position="absolute"
            top="14%"
            left="18%"
            zIndex="6"
            pointerEvents="none"
            transform="rotate(-8deg)"
          >
            <Text
              fontFamily="'Caveat', 'Brush Script MT', 'Dancing Script', cursive, sans-serif"
              fontStyle="italic"
              fontWeight="600"
              fontSize={{ base: "2xl", sm: "3xl" }}
              color="#f4bef2ff"
              lineHeight="1"
              letterSpacing="-0.02em"
              // style={{ textShadow: "0 1px 2px rgba(255,255,255,0.75)" }}
            >
              {meta.scriptTitle}
            </Text>
          </Box>

          {/* Gribouillis au trait de crayon artistique */}
          <ScribbleDoodle />

          {/* Corps rotatif du disque vinyle */}
          <Box
            position="relative"
            w="full"
            h="full"
            rounded="full"
            overflow="hidden"
            boxShadow="0 14px 34px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(0,0,0,0.1)"
            transition="transform 12s linear"
            _groupHover={{
              transform: "rotate(360deg)",
            }}
          >
            {/* Photographie imprimée de l'occasion */}
            <Box
              as="img"
              src={item.image}
              alt={item.alt || item.title}
              w="full"
              h="full"
              objectFit="cover"
              style={{
                filter: "contrast(1.05) saturate(0.92) brightness(0.97)",
              }}
            />

            {/* Sillons concentriques du disque */}
            <Box
              position="absolute"
              inset="0"
              rounded="full"
              style={{
                background:
                  "radial-gradient(circle, transparent 24%, rgba(0,0,0,0.05) 25%, transparent 27%, rgba(255,255,255,0.12) 42%, transparent 45%, rgba(0,0,0,0.06) 58%, transparent 60%, rgba(255,255,255,0.09) 75%, transparent 78%)",
              }}
              pointerEvents="none"
            />

            {/* Anneau transparent intermédiaire */}
            <Box
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              boxSize={{ base: "52px", sm: "58px" }}
              rounded="full"
              bg="rgba(244, 243, 239, 0.35)"
              borderWidth="1.5px"
              borderColor="rgba(0,0,0,0.14)"
              backdropFilter="blur(2px)"
              zIndex="2"
              pointerEvents="none"
            />

            {/* Trou central du CD (reprend le fond de la pochette) */}
            <Box
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              boxSize={{ base: "36px", sm: "40px" }}
              rounded="full"
              bg="#f4f3ef"
              borderWidth="1.5px"
              borderColor="rgba(0,0,0,0.12)"
              boxShadow="inset 0 2px 6px rgba(0,0,0,0.18)"
              zIndex="3"
              pointerEvents="none"
            />
          </Box>
        </Box>

        {/* Typographie aux 2 coins inférieurs */}
        <Flex justify="center" align="center" zIndex="6" mt="2">
          <Text
            fontFamily="heading"
            fontSize="lg"
            fontWeight="900"

            color="slate.900"
          >
            {meta.scriptTitle}
          </Text>

          
        </Flex>
      </Box>

      
    </Box>
  );
}

/**
 * Grille d'usages et occasions (Anniversaires, Mariages, Podcasts, etc.)
 * Présentée sous forme de pochettes de vinyles de collection.
 */
export default function UseCases() {
  const scrollRef = useRef(null);
  const isInteractingRef = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Défilement automatique fluide sur mobile quand le carrousel horizontal est actif
    const interval = setInterval(() => {
      if (isInteractingRef.current) return;
      if (window.innerWidth >= 768) return; // Uniquement sur mobile/tablette (< 768px)

      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 5) return;

      const cardWidth = el.firstElementChild?.clientWidth || 240;
      const gap = 16;
      const step = cardWidth + gap;

      if (el.scrollLeft >= maxScroll - 15) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: step, behavior: "smooth" });
      }
    }, 2800);

    const onUserInteraction = () => {
      isInteractingRef.current = true;
    };
    const onUserLeave = () => {
      // Reprise douce de l'autoplay après 2.5 secondes d'inactivité
      setTimeout(() => {
        isInteractingRef.current = false;
      }, 2500);
    };

    el.addEventListener("touchstart", onUserInteraction, { passive: true });
    el.addEventListener("touchend", onUserLeave, { passive: true });
    el.addEventListener("mouseenter", onUserInteraction);
    el.addEventListener("mouseleave", onUserLeave);

    return () => {
      clearInterval(interval);
      el.removeEventListener("touchstart", onUserInteraction);
      el.removeEventListener("touchend", onUserLeave);
      el.removeEventListener("mouseenter", onUserInteraction);
      el.removeEventListener("mouseleave", onUserLeave);
    };
  }, []);

  return (
    <Box as="section" id="occasions" pb={{ base: "8", md: "24" }} pt={{ base: "6", md: "10" }} >
      <Container maxW="7xl">
        <Reveal>
          <SectionHead
            pill="Occasions & Moments"
            title="Une musique pour chaque occasion"
            text="Des cadeaux émouvants aux contenus professionnels, pretymelo donne vie à vos histoires en quelques secondes."
          />
        </Reveal>

        <Box
          ref={scrollRef}
          mt="12"
          display={{ base: "flex", md: "grid" }}
          gridTemplateColumns={{ md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
          overflowX={{ base: "auto", md: "visible" }}
          scrollSnapType={{ base: "x mandatory", md: "none" }}
          scrollBehavior="smooth"
          gap={{ base: "4", sm: "5", md: "7" }}
          pb={{ base: "5", md: "0" }}
          pt="2"
          px={{ base: "4", md: "0" }}
          mx={{ base: "-4", md: "0" }}
          css={{
            "&::-webkit-scrollbar": { display: "none" },
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          {useCases.map((u, i) => (
            <Reveal
              key={u.title}
              delay={i * 70}
              flex={{ base: "0 0 240px", sm: "0 0 260px", md: "1" }}
              w={{ base: "240px", sm: "260px", md: "100%" }}
              maxW={{ base: "250px", sm: "270px", md: "100%" }}
              scrollSnapAlign={{ base: "start", md: "none" }}
            >
              <OccasionVinylCard item={u} />
            </Reveal>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
