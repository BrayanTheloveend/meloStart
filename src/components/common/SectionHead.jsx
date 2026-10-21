"use client";

import { Badge, Heading, Stack, Text } from "@chakra-ui/react";

/** En-tête de section : pastille, titre, sous-titre (idée Paynance / Qtask). */
export default function SectionHead({ pill, title, text, align = "center" }) {
  return (
    <Stack gap="4" align={align === "center" ? "center" : "flex-start"} textAlign={align} maxW="2xl" mx={align === "center" ? "auto" : 0}>
      {pill && (
        <Badge
          px="3"
          py="1"
          rounded="full"
          bg="paper.200"
          color="ink.700"
          borderWidth="1px"
          borderColor="paper.300"
          fontFamily="ui"
          fontWeight="500"
          fontSize="sm"
        >
          {pill}
        </Badge>
      )}
      <Heading as="h2" fontFamily="heading" fontWeight="800" fontSize={{ base: "3xl", md: "5xl" }} letterSpacing="-0.035em" lineHeight="1.05">
        {title}
      </Heading>
      {text && (
        <Text color="ink.500" fontSize={{ base: "md", md: "lg" }} maxW="xl">
          {text}
        </Text>
      )}
    </Stack>
  );
}
