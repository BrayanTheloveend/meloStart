"use client";

import { useState } from "react";
import { Box, Button, Container, Flex, Grid, HStack, IconButton, Input, Stack, Text } from "@chakra-ui/react";
import { FaInstagram, FaTiktok, FaYoutube, FaXTwitter } from "react-icons/fa6";
import Logo from "@/components/common/Logo";
import { footerColumns } from "@/data/content";
import { accent } from "@/theme/system";

const socials = [
  { icon: FaInstagram, label: "Instagram" },
  { icon: FaTiktok, label: "TikTok" },
  { icon: FaYoutube, label: "YouTube" },
  { icon: FaXTwitter, label: "X" },
];

/** Footer complet : colonnes de liens, newsletter, réseaux, mentions (structure Qtask). */
export default function Footer() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const subscribe = (e) => {
    e.preventDefault();
    if (email.includes("@")) setSent(true); // Simulation : brancher votre API ici
  };

  return (
    <Box as="footer" borderTopWidth="1px" borderColor="paper.200" bg="paper.50" pt="16" pb="8">
      <Container maxW="7xl">
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", xl: "1.4fr repeat(4, 1fr)" }} gap={{ base: "10", xl: "8" }}>
          <Stack gap="4" maxW="xs">
            <Logo />
            <Text color="ink.500" fontSize="sm">
              Recevez les nouveautés et nos meilleurs conseils pour écrire de meilleurs prompts.
            </Text>
            {sent ? (
              <Text color="brand.cyanDeep" fontSize="sm" fontFamily="ui">
                Merci, vous êtes inscrit à la newsletter.
              </Text>
            ) : (
              <Flex as="form" onSubmit={subscribe} gap="2">
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre e-mail"
                  aria-label="Adresse e-mail"
                  rounded="full"
                  bg="paper.50"
                  borderColor="paper.300"
                  _focusVisible={{ borderColor: "brand.violet", boxShadow: "0 0 0 1px #8b5cf6" }}
                />
                <Button type="submit" rounded="full" color="white" background={accent.primary} px="5">
                  S&apos;abonner
                </Button>
              </Flex>
            )}
          </Stack>

          {footerColumns.map((col) => (
            <Stack key={col.title} gap="3">
              <Text fontFamily="ui" fontWeight="600">
                {col.title}
              </Text>
              {col.links.map((l) => (
                <Text key={l} as="a" href="#" fontSize="sm" color="ink.500" _hover={{ color: "ink.900" }} transition="color .2s">
                  {l}
                </Text>
              ))}
            </Stack>
          ))}
        </Grid>

        <Flex mt="14" pt="6" borderTopWidth="1px" borderColor="paper.200" direction={{ base: "column", sm: "row" }} justify="space-between" align="center" gap="4">
          <Text fontSize="sm" color="ink.400">
            © 2026 pretymelo. Tous droits réservés.
          </Text>
          <HStack gap="2">
            {socials.map(({ icon: Icon, label }) => (
              <IconButton key={label} aria-label={label} size="sm" rounded="full" variant="ghost" color="ink.500" _hover={{ bg: "paper.200", color: "ink.900" }}>
                <Icon />
              </IconButton>
            ))}
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}
