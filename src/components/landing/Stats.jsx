"use client";

import { Box, Container, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { stats } from "@/data/content";
import { accent } from "@/theme/system";

/** Chiffres clés (idée Paynance "2930M+"). */
export default function Stats() {
  return (
    <Box as="section" pb={{ base: "20", md: "28" }}>
      <Container maxW="7xl">
        <SimpleGrid columns={{ base: 2, md: 4 }} gap="6" p={{ base: "8", md: "12" }} rounded="3xl" bg="paper.100" borderWidth="1px" borderColor="paper.300">
          {stats.map((s) => (
            <Stack key={s.label} gap="1" textAlign="center">
              <Text fontFamily="heading" fontWeight="800" fontSize={{ base: "3xl", md: "5xl" }} letterSpacing="-0.04em" color="brand.violetDeep">
                {s.value}
              </Text>
              <Text color="ink.500" fontSize="sm">
                {s.label}
              </Text>
            </Stack>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}
