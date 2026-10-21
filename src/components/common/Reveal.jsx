"use client";

import { useEffect, useRef, useState } from "react";
import { Box } from "@chakra-ui/react";

/**
 * Apparition douce au scroll (IntersectionObserver, pas de dépendance).
 * Utilisé avec parcimonie : sur les blocs principaux seulement.
 */
export default function Reveal({ children, delay = 0, ...rest }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Box
      ref={ref}
      opacity={shown ? 1 : 0}
      transform={shown ? "translateY(0)" : "translateY(24px)"}
      transition={`opacity .7s ease ${delay}ms, transform .7s ease ${delay}ms`}
      {...rest}
    >
      {children}
    </Box>
  );
}
