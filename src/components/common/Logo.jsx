"use client";

import NextLink from "next/link";
import { Flex, Box, Text, Image } from "@chakra-ui/react";
import { accent } from "@/theme/system";

/** Logo pretymelo : pastille dégradée avec 3 barres + nom de marque. */
export default function Logo({ size = "md" }) {
  const dim = size === "sm" ? 28 : 34;
  return (
    <NextLink href="/" aria-label="pretymelo, retour à l'accueil">
      <Flex align="center" gap="2.5">
        <Image src="/assets/logo.png" alt="pretymelo" width={{md: '35px', base: '25px'}} height={{md: '35px', base: '25px'}} />
        <Text fontFamily="heading" fontWeight="700" fontSize={{md: "xl", base: 'lg'}} letterSpacing="-0.03em">
          pretymelo
        </Text>
      </Flex>
    </NextLink>
  );
}
