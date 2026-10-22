"use client";

import { Box, Flex } from "@chakra-ui/react";
import { accent } from "@/theme/system";

// Hauteurs déterministes (pas de Math.random → pas d'erreur d'hydratation)
const heightAt = (i) => 18 + Math.abs(Math.sin(i * 1.7) * 52) + Math.abs(Math.cos(i * 0.6) * 24);

/**
 * Forme d'onde audio interactive et synchronisée.
 * - bars : nombre de barres verticales
 * - height : hauteur totale en px
 * - animate : oscillation dynamique pendant la lecture
 * - progress : progression de 0 à 1 (ou 0 à 100)
 * - currentTime & duration : temps actuel et durée totale en secondes pour synchronisation exacte
 * - gap : espacement entre les barres
 * - color : couleur des barres lues (défaut : violet)
 * - unplayedColor : couleur des barres non lues (défaut : paper.300)
 * - onSeek : callback déclenché au clic (renvoie le seekTime en secondes ou le ratio)
 */
export default function Waveform({
  bars = 48,
  height = 64,
  animate = false,
  progress = 0,
  currentTime = null,
  duration = null,
  gap = "3px",
  color = null,
  unplayedColor = null,
  onSeek = null,
}) {
  // Calcul de la progression normalisée (garantie entre 0 et 1)
  let normProgress = 0;
  if (typeof duration === "number" && duration > 0 && typeof currentTime === "number") {
    normProgress = Math.max(0, Math.min(1, currentTime / duration));
  } else if (typeof progress === "number" && !isNaN(progress)) {
    // Gère intelligemment les valeurs 0..1 ainsi que les pourcentages 0..100
    normProgress = progress > 1 ? Math.min(1, Math.max(0, progress / 100)) : Math.min(1, Math.max(0, progress));
  }

  // Nombre exact de barres actives
  const activeBarsCount =
    normProgress <= 0
      ? 0
      : normProgress >= 1
      ? bars
      : Math.max(1, Math.round(normProgress * bars));

  const activeColor = color || accent.primary;
  const inactiveColor = unplayedColor || "paper.300";

  const handleClick = (e) => {
    if (!onSeek) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width) return;
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));

    if (typeof duration === "number" && duration > 0) {
      onSeek(ratio * duration);
    } else {
      onSeek(ratio);
    }
  };

  return (
    <Flex
      align="center"
      gap={gap}
      h={`${height}px`}
      w="100%"
      py="1"
      cursor={onSeek ? "pointer" : "default"}
      onClick={handleClick}
      role={onSeek ? "slider" : undefined}
      aria-label={onSeek ? "Position de lecture" : undefined}
      aria-valuenow={onSeek ? Math.round(normProgress * 100) : undefined}
      userSelect="none"
      transition="opacity 0.2s ease"
      _hover={onSeek ? { opacity: 0.92 } : undefined}
    >
      {Array.from({ length: bars }).map((_, i) => {
        const played = i < activeBarsCount;
        return (
          <Box
            key={i}
            flex="1"
            minW="2px"
            h={`${heightAt(i)}%`}
            rounded="full"
            transformOrigin="center"
            background={played ? activeColor : inactiveColor}
            opacity={played ? 1 : 0.65}
            transition="background 0.2s ease, opacity 0.2s ease"
            animation={
              animate
                ? `wave ${0.9 + (i % 7) * 0.12}s ease-in-out ${(i % 9) * 0.07}s infinite`
                : undefined
            }
          />
        );
      })}
    </Flex>
  );
}
