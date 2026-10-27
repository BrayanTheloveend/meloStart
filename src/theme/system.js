import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

/**
 * Thème pretymelo — Chakra UI v3 (thème clair)
 * Surfaces blanches / gris très clair, texte quasi noir, accents violet / cyan / rose.
 * Polices chargées via next/font dans layout.jsx.
 */
const config = defineConfig({
  globalCss: {
    html: { scrollBehavior: "smooth" },
    body: {
      bg: "paper.0",
      color: "ink.900",
      fontFamily: "body",
      WebkitFontSmoothing: "antialiased",
    },
    "::selection": { background: "#ddd6fe", color: "#18181b" },
    // Respect de prefers-reduced-motion : on coupe les animations décoratives
    "@media (prefers-reduced-motion: reduce)": {
      "*, *::before, *::after": {
        animationDuration: "0.001ms !important",
        animationIterationCount: "1 !important",
        transitionDuration: "0.001ms !important",
      },
    },
  },
  theme: {
    tokens: {
      colors: {
        // Surfaces (du plus clair au plus marqué)
        paper: {
          0: { value: "#ffffff" },
          50: { value: "#fafafa" },
          100: { value: "#f4f4f5" },
          200: { value: "#ececef" },
          300: { value: "#e4e4e7" },
          400: { value: "#d4d4d8" },
        },
        // Texte
        ink: {
          900: { value: "#18181b" },
          700: { value: "#3f3f46" },
          500: { value: "#52525b" },
          400: { value: "#71717a" },
        },
        // Accents (les variantes "Deep" garantissent un bon contraste sur fond blanc)
        brand: {
          violet: { value: "#8b5cf6" },
          violetDeep: { value: "#7c3aed" },
          violetTint: { value: "#f5f3ff" },
          cyan: { value: "#06b6d4" },
          cyanDeep: { value: "#0e7490" },
          pink: { value: "#ec4899" },
        },
      },
      fonts: {
        heading: { value: "var(--font-jakarta), system-ui, sans-serif" },
        ui: { value: "var(--font-onest), system-ui, sans-serif" },
        body: { value: "var(--font-instrument), system-ui, sans-serif" },
      },
    },
    keyframes: {
      marqueeLeft: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
      marqueeRight: { from: { transform: "translateX(-50%)" }, to: { transform: "translateX(0)" } },
      wave: { "0%, 100%": { transform: "scaleY(0.25)" }, "50%": { transform: "scaleY(1)" } },
      floatY: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
      pulseGlow: { "0%, 100%": { opacity: 0.55 }, "50%": { opacity: 1 } },
      spinSlow: { to: { transform: "rotate(360deg)" } },
    },
  },
});

export const system = createSystem(defaultConfig, config);

/** Accents unis (plus de dégradés : une couleur d'action, une couleur secondaire). */
export const accent = {
  primary: "#7c3aed",
  pink: "#ec4899",
  tint: "#f5f3ff",
};
