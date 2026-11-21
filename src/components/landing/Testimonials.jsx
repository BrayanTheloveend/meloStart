"use client";

import { Avatar, Box, Container, HStack, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { LuStar } from "react-icons/lu";
import SectionHead from "@/components/common/SectionHead";
import Reveal from "@/components/common/Reveal";
import DecorativeGlowGroup from "@/components/common/DecorativeGlowGroup";
import { testimonials as defaultTestimonials } from "@/data/content";

export default function Testimonials({ items = [] }) {
  const displayItems = Array.isArray(items) && items.length > 0 ? items : [];

  return (
    <Box as="section" pb={{ base: "20", md: "28" }} position="relative" overflow="hidden">
      {/* Halo décoratif Purple & Pink en intersection */}
      <DecorativeGlowGroup
        top={{ base: "0%", md: "5%" }}
        left={{ base: "-100px", sm: "-50px", lg: "0px" }}
        size={{ base: "280px", sm: "360px", md: "460px" }}
        opacity={0.25}
      />

      <Container maxW="7xl" position="relative" zIndex="1">
        <Reveal>
          <SectionHead pill="Avis" title="Ils créent déjà avec pretymelo" />
        </Reveal>
        <SimpleGrid mt="12" columns={{ base: 1, md: 3 }} gap="5">
          {displayItems.map((t, idx) => {
            const starCount = Math.min(Math.max(Number(t.rating) || 5, 1), 5);
            return (
              <Stack
                key={t.id || `${t.name}-${idx}`}
                gap="5"
                p="7"
                rounded="3xl"
                bg="paper.100"
                borderWidth="1px"
                borderColor="paper.300"
                justify="space-between"
              >
                <Stack gap="4">
                  <HStack gap="0.5" color="#facc15" aria-label={`${starCount} étoiles sur 5`}>
                    {Array.from({ length: starCount }).map((_, i) => (
                      <LuStar key={i} size={16} fill="currentColor" />
                    ))}
                  </HStack>
                  <Text color="ink.700">« {t.text} »</Text>
                </Stack>
                <HStack gap="3">
                  <Avatar.Root size="md">
                    {t.avatarUrl && <Avatar.Image src={t.avatarUrl} alt={t.name} />}
                    <Avatar.Fallback name={t.name} />
                  </Avatar.Root>
                  <Stack gap="0">
                    <Text fontFamily="ui" fontWeight="600">
                      {t.name}
                    </Text>
                    <Text fontSize="sm" color="ink.500">
                      {t.role || "Créateur"}
                    </Text>
                  </Stack>
                </HStack>
              </Stack>
            );
          })}
        </SimpleGrid>
      </Container>
    </Box>
  );
}
