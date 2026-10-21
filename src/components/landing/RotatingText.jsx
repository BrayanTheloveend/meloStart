"use client";

import { useEffect, useState } from "react";
import { Box, VisuallyHidden } from "@chakra-ui/react";

// Réglages de l'effet (en ms)
const IN_STAGGER = 35; // décalage entre lettres à l'entrée
const IN_ANIM = 750; // durée d'animation d'une lettre à l'entrée
const HOLD = 1800; // temps d'affichage une fois la phrase entièrement arrivée
const OUT_STAGGER = 18; // décalage entre lettres à la sortie
const OUT_ANIM = 450; // durée d'animation d'une lettre à la sortie

// Keyframes embarquées : aucune dépendance au thème Chakra.
// --rt-color / --rt-flash sont définies sur le conteneur (voir plus bas).
const KEYFRAMES = `
@keyframes rt-in {
  0%   { opacity: 0; transform: perspective(500px) translateY(0.7em) rotateX(-85deg) scale(0.9); filter: blur(8px); color: var(--rt-flash); }
  55%  { opacity: 1; transform: perspective(500px) translateY(-0.07em) rotateX(10deg) scale(1.05); filter: blur(0); color: var(--rt-flash); }
  100% { opacity: 1; transform: perspective(500px) translateY(0) rotateX(0) scale(1); filter: blur(0); color: var(--rt-color); }
}
@keyframes rt-out {
  0%   { opacity: 1; transform: perspective(500px) translateY(0) rotateX(0) scale(1); filter: blur(0); color: var(--rt-color); }
  100% { opacity: 0; transform: perspective(500px) translateY(-0.6em) rotateX(75deg) scale(0.92); filter: blur(8px); color: var(--rt-flash); }
}
@keyframes rt-bar-in  { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes rt-bar-out { from { transform: scaleX(1); } to { transform: scaleX(0); } }
`;

/**
 * Texte coloré qui défile avec un effet "flip" lettre par lettre :
 * entrée par le bas (rotation 3D + flou + éclair cyan), sortie par le haut,
 * soulignement qui se trace puis se retire.
 *
 * - Toutes les phrases sont empilées dans la même cellule de grille (invisibles sauf l'active) :
 *   la hauteur réservée est celle de la plus longue, donc aucun saut de mise en page.
 * - Lecteurs d'écran : une seule version texte, les lettres animées sont masquées.
 * - prefers-reduced-motion : la coupure globale du thème rend le changement instantané.
 */
export default function RotatingText({
  phrases,
  color = "#7c3aed", // couleur finale (violet de la charte)
  flash = "#06b6d4", // couleur de l'éclair pendant l'animation (cyan de la charte)
}) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState("in"); // "in" | "out"

  useEffect(() => {
    const len = phrases[index].length;
    const delay =
      phase === "in"
        ? len * IN_STAGGER + IN_ANIM + HOLD
        : len * OUT_STAGGER + OUT_ANIM;

    const t = setTimeout(() => {
      if (phase === "in") {
        setPhase("out");
      } else {
        setIndex((i) => (i + 1) % phrases.length);
        setPhase("in");
      }
    }, delay);
    return () => clearTimeout(t);
  }, [index, phase, phrases]);

  return (
    <Box
      as="span"
      display="grid"
      justifyItems="center"
      style={{ "--rt-color": color, "--rt-flash": flash, color }}
    >
      <style>{KEYFRAMES}</style>
      <VisuallyHidden>{phrases.join(", ")}</VisuallyHidden>

      {phrases.map((phrase, p) => {
        const active = p === index;
        return (
          <Box
            key={phrase}
            as="span"
            aria-hidden="true"
            gridArea="1 / 1"
            justifySelf="center"
            position="relative"
            textAlign="center"
            visibility={active ? "visible" : "hidden"}
          >
            {/* Un bloc insécable par mot : les retours à la ligne se font entre les mots */}
            {phrase.split(" ").map((word, w, words) => {
              const offset = words.slice(0, w).join(" ").length + (w ? 1 : 0);
              return (
                <Box as="span" key={w} display="inline-block" whiteSpace="nowrap">
                  {word.split("").map((ch, c) => {
                    const i = offset + c;
                    let animation;
                    if (active && phase === "in") {
                      animation = `rt-in ${IN_ANIM}ms cubic-bezier(.2,.9,.25,1) ${i * IN_STAGGER}ms both`;
                    } else if (active && phase === "out") {
                      animation = `rt-out ${OUT_ANIM}ms cubic-bezier(.5,0,.75,0) ${i * OUT_STAGGER}ms both`;
                    }
                    return (
                      <Box
                        as="span"
                        key={c}
                        display="inline-block"
                        willChange="transform, filter, opacity"
                        animation={animation}
                      >
                        {ch}
                      </Box>
                    );
                  })}
                  {w < words.length - 1 && "\u00A0"}
                </Box>
              );
            })}

            {/* Soulignement : se trace à l'entrée (depuis la gauche), se retire à la sortie (vers la droite) */}
            {active && (
              <Box
                as="span"
                position="absolute"
                display={'none'}
                left="0"
                right="0"
                bottom="-0.04em"
                h="0.07em"
                rounded="full"
                bg="brand.violet"
                opacity="0.35"
                transformOrigin={phase === "in" ? "left" : "right"}
                animation={
                  phase === "in"
                    ? `rt-bar-in ${IN_ANIM}ms cubic-bezier(.2,.9,.25,1) ${phrase.length * IN_STAGGER * 0.6}ms both`
                    : `rt-bar-out ${OUT_ANIM}ms ease-in both`
                }
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}