"use client";

import NextLink from "next/link";
import { Box, Container, Flex, HStack, Text } from "@chakra-ui/react";
import { LuArrowLeft, LuShieldCheck } from "react-icons/lu";
import Logo from "@/components/common/Logo";
import GlowBackground from "@/components/common/GlowBackground";

export default function AuthShell({ children, backHref = "/", backLabel = "Retour au site" }) {
  return (
    <Box
      minH="100dvh"
      bg="paper.50"
      color="ink.900"
      position="relative"
      display="flex"
      flexDirection="column"
      overflow="hidden"
      style={{
        background:
          "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124, 58, 237, 0.08) 0%, #fafafa 70%)",
      }}
    >
      <GlowBackground intensity={0.25} />

      {/* Barre supérieure minimale */}
      <Box as="header" px={{ base: "4", sm: "8" }} py="4" position="relative" zIndex="20">
        <Flex justify="space-between" align="center" maxW="6xl" mx="auto">
          <Logo />

          <NextLink href={backHref}>
            <HStack
              gap="1.5"
              px="3"
              py="1.5"
              rounded="full"
              fontSize="xs"
              fontFamily="ui"
              fontWeight="600"
              color="ink.600"
              _hover={{ color: "ink.900", bg: "paper.200" }}
              transition="all 0.2s"
            >
              <LuArrowLeft size={14} />
              <Text>{backLabel}</Text>
            </HStack>
          </NextLink>
        </Flex>
      </Box>

      {/* Contenu principal centré */}
      <Flex flex="1" align="center" justify="center" px={{ base: "4", sm: "6" }} py={{ base: "6", md: "12" }} position="relative" zIndex="10">
        <Box w="full" maxW="460px">
          {children}
        </Box>
      </Flex>

      {/* Pied de page discret */}
      <Box as="footer" py="4" textAlign="center" fontSize="xs" color="ink.400" fontFamily="ui" position="relative" zIndex="10">
        <HStack justify="center" gap="4">
          <HStack gap="1">
            <LuShieldCheck size={14} />
            <Text>Connexion chiffrée & sécurisée</Text>
          </HStack>
          <Text>•</Text>
          <Text>© 2026 melostars</Text>
        </HStack>
      </Box>
    </Box>
  );
}
