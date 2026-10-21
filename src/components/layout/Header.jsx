"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { Box, Button, Container, Flex, HStack, IconButton, Stack } from "@chakra-ui/react";
import { LuMenu, LuX } from "react-icons/lu";
import Logo from "@/components/common/Logo";
import { navLinks } from "@/data/content";
import { accent } from "@/theme/system";

/** Header fixe, transparent puis flouté (backdrop-filter) dès qu'on scrolle. */
export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Box
      as="header"
      position="fixed"
      top="0"
      insetX="0"
      zIndex="50"
      bg={scrolled || open ? "rgba(255,255,255,0.8)" : "transparent"}
      backdropFilter={scrolled || open ? "blur(16px) saturate(140%)" : "none"}
      borderBottomWidth="1px"
      borderColor={scrolled || open ? "paper.200" : "transparent"}
      transition="background .3s, border-color .3s"
    >
      <Container maxW="7xl">
        <Flex h="16" align="center" justify="space-between">
          <Logo />

          {/* Navigation desktop */}
          <HStack as="nav" gap="8" display={{ base: "none", lg: "flex" }} fontFamily="ui" fontSize="sm">
            {navLinks.map((l) => (
              <NextLink key={l.href} href={l.href}>
                <Box color="ink.500" _hover={{ color: "ink.900" }} transition="color .2s">
                  {l.label}
                </Box>
              </NextLink>
            ))}
          </HStack>

          <HStack gap="3">
            <Button asChild variant="ghost" display={{ base: "none", md: "inline-flex" }} fontFamily="ui" color="ink.700" _hover={{ bg: "paper.200" }}>
              <NextLink href="/login">Connexion</NextLink>
            </Button>
            <Button
              asChild
              rounded="full"
              fontFamily="ui"
              fontWeight="600"
              color="white"
              background={accent.primary}
              _hover={{ transform: "translateY(-1px)" }}
              transition="all .25s"
            >
              <NextLink href="/onboarding">Démarrer</NextLink>
            </Button>
            <IconButton
              aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
              display={{ base: "inline-flex", lg: "none" }}
              variant="ghost"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <LuX /> : <LuMenu />}
            </IconButton>
          </HStack>
        </Flex>

        {/* Menu mobile */}
        {open && (
          <Stack pb="5" gap="1" display={{ base: "flex", lg: "none" }} fontFamily="ui">
            {navLinks.map((l) => (
              <NextLink key={l.href} href={l.href} onClick={() => setOpen(false)}>
                <Box py="3" color="ink.700" borderBottomWidth="1px" borderColor="paper.200">
                  {l.label}
                </Box>
              </NextLink>
            ))}
            <Button asChild variant="outline" mt="3" rounded="full">
              <NextLink href="/login">Connexion</NextLink>
            </Button>
          </Stack>
        )}
      </Container>
    </Box>
  );
}
