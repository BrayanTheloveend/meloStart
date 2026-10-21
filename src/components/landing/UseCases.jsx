"use client";

import { Box, Container, Flex, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { LuCake, LuHeart, LuVideo, LuMegaphone, LuGamepad2, LuGift } from "react-icons/lu";
import SectionHead from "@/components/common/SectionHead";
import Reveal from "@/components/common/Reveal";
import { useCases } from "@/data/content";

const icons = [LuCake, LuHeart, LuVideo, LuMegaphone, LuGamepad2, LuGift];

/** Grille 3×2 d'usages (idée Qtask "Workflows for any project"). */
export default function UseCases() {
  return (
    <Box as="section" pb={{ base: "20", md: "28" }}>
      <Container maxW="7xl">
        <Reveal>
          <SectionHead title="Une musique pour chaque occasion" text="Des cadeaux aux contenus professionnels, melostars s'adapte à votre projet." />
        </Reveal>
        <SimpleGrid mt="12" columns={{ base: 1, md: 2, lg: 3 }} gap="4">
          {useCases.map((u, i) => {
            const Icon = icons[i];
            return (
              <Stack
                key={u.title}
                gap="3"
                p="6"
                rounded="2xl"
                bg="paper.100"
                borderWidth="1px"
                borderColor="paper.200"
                _hover={{ bg: "paper.200", borderColor: "paper.400", transform: "translateY(-3px)" }}
                transition="all .25s"
              >
                <Flex boxSize="10" rounded="lg" bg="paper.200" color="brand.violet" align="center" justify="center">
                  <Icon size={24} />
                </Flex>
                <Text as="h3" fontFamily="heading" fontWeight="700" fontSize="lg">
                  {u.title}
                </Text>
                <Text color="ink.500" fontSize="sm">
                  {u.text}
                </Text>
              </Stack>
            );
          })}
        </SimpleGrid>
      </Container>
    </Box>
  );
}
