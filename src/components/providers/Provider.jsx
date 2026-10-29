"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { system } from "@/theme/system";
import { Suspense } from "react";

/** Fournit NextAuth SessionProvider + Chakra UI v3 + thème clair forcé. */
export default function Provider({ children }) {
  return (
    <SessionProvider>
      <ChakraProvider value={system}>
        <ThemeProvider attribute="class" forcedTheme="light" disableTransitionOnChange>
          <Suspense fallback={<div>Chargement...</div>}>
            {children}
          </Suspense>
        </ThemeProvider>
      </ChakraProvider>
    </SessionProvider>
  );
}
