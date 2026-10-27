"use client";

import { Avatar, Box, Container, HStack, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { LuStar } from "react-icons/lu";
import SectionHead from "@/components/common/SectionHead";
import Reveal from "@/components/common/Reveal";
import { testimonials } from "@/data/content";

export default function Testimonials() {
  return (
    <Box as="section" pb={{ base: "20", md: "28" }}>
      <Container maxW="7xl">
        <Reveal>
          <SectionHead pill="Avis" title="Ils créent déjà avec pretymelo" />
        </Reveal>
        <SimpleGrid mt="12" columns={{ base: 1, md: 3 }} gap="5">
          {testimonials.map((t) => (
            <Stack key={t.name} gap="5" p="7" rounded="3xl" bg="paper.100" borderWidth="1px" borderColor="paper.300" justify="space-between">
              <Stack gap="4">
                <HStack gap="0.5" color="#facc15" aria-label="5 étoiles sur 5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <LuStar key={i} size={16} fill="currentColor" />
                  ))}
                </HStack>
                <Text color="ink.700">« {t.text} »</Text>
              </Stack>
              <HStack gap="3">
                <Avatar.Root size="md">
                  <Avatar.Fallback name={t.name} />
                </Avatar.Root>
                <Stack gap="0">
                  <Text fontFamily="ui" fontWeight="600">
                    {t.name}
                  </Text>
                  <Text fontSize="sm" color="ink.500">
                    {t.role}
                  </Text>
                </Stack>
              </HStack>
            </Stack>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}
