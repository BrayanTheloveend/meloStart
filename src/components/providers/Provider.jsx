"use client";

import { Box, ChakraProvider, Spinner, Stack, Text } from "@chakra-ui/react";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { system } from "@/theme/system";
import { Suspense } from "react";

function AppLoader() {
  return (
    <Box
      minH="100dvh"
      w="full"
      bg="#fafbfc"
      display="flex"
      alignItems="center"
      justifyContent="center"
      position="fixed"
      inset="0"
      zIndex="9999"
    >
      <Stack align="center" gap="3.5">
        <Box position="relative" display="flex" alignItems="center" justifyContent="center">
          <Box
            position="absolute"
            boxSize="48px"
            rounded="full"
            bg="purple.100"
            opacity="0.7"
            style={{ animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}
          />
          <Spinner
            boxSize="32px"
            borderWidth="2.5px"
            color="purple.600"
          />
        </Box>

        <Stack align="center" gap="0.5">
          <Text
            fontFamily="heading"
            fontWeight="900"
            fontSize="sm"
            letterSpacing="-0.02em"
            color="slate.900"
          >
            pretymelo
          </Text>
          <Text
            fontSize="xs"
            color="slate.400"
            fontWeight="500"
          >
            Chargement...
          </Text>
        </Stack>
      </Stack>
    </Box>
  );
}

/** Fournit NextAuth SessionProvider + Chakra UI v3 + thème clair forcé. */
export default function Provider({ children }) {
  return (
    <SessionProvider>
      <ChakraProvider value={system}>
        <ThemeProvider attribute="class" forcedTheme="light" disableTransitionOnChange>
          <Suspense fallback={<AppLoader />}>
            {children}
          </Suspense>
        </ThemeProvider>
      </ChakraProvider>
    </SessionProvider>
  );
}
