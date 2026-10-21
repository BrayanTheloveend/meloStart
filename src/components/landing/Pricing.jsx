"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { Badge, Box, Button, Container, HStack, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { LuCheck } from "react-icons/lu";
import SectionHead from "@/components/common/SectionHead";
import Reveal from "@/components/common/Reveal";
import { plans } from "@/data/content";
import { accent } from "@/theme/system";
import { api } from "@/lib/apiClient";

/** Trois offres à prix fixe, payées à la demande (pas d'abonnement). */
export default function Pricing() {
  const [livePlans, setLivePlans] = useState(plans);

  useEffect(() => {
    api
      .get("/api/pricing")
      .then((res) => {
        if (res?.plans && res.plans.length > 0) {
          setLivePlans(res.plans);
        }
      })
      .catch((err) => console.warn("[Landing Pricing] Utilisation des plans locaux :", err.message));
  }, []);

  return (
    <Box as="section" id="tarifs" pb={{ base: "20", md: "28" }} scrollMarginTop="80px">
      <Container maxW="7xl">
        <Reveal>
          <SectionHead
            pill="Tarifs"
            title="Payez uniquement la musique que vous créez"
            text="Un prix fixe par musique, en paiement unique. Pas d'abonnement, pas d'engagement."
          />
        </Reveal>

        <SimpleGrid
          mt="14"
          columns={{ base: 1, md: 2, lg: Math.min(Math.max(livePlans.length, 1), 3) }}
          gap="6"
          alignItems="stretch"
        >
          {livePlans.map((p, i) => {
            const planNotes = Number(p.notes ?? p.note ?? 4);
            const badgeLabel = p.badge || (p.popular ? "Populaire" : null);
            const features = Array.isArray(p.features)
              ? p.features
              : typeof p.features === "string"
              ? p.features.split("\n").map((f) => f.trim()).filter(Boolean)
              : [];

            return (
              <Reveal key={p.id || p.name || i} delay={i * 100} h="100%">
                {/* Fine bordure : violette pour l'offre mise en avant, grise pour les autres */}
                <Box
                  h="100%"
                  p="px"
                  rounded="3xl"
                  background={p.popular ? accent.primary : "paper.300"}
                >
                  <Stack
                    h="100%"
                    gap="6"
                    p="8"
                    rounded="calc(1.5rem - 1px)"
                    bg="paper.50"
                    position="relative"
                    justifyContent="space-between"
                  >
                    <Stack gap="6">
                      {badgeLabel && (
                        <Badge
                          position="absolute"
                          top="6"
                          right="6"
                          px="3"
                          py="1"
                          rounded="full"
                          color="white"
                          background={accent.pink}
                          fontFamily="ui"
                        >
                          {badgeLabel}
                        </Badge>
                      )}

                      <Stack gap="1">
                        <Text fontFamily="heading" fontWeight="700" fontSize="xl">
                          {p.name}
                        </Text>
                        <Text color="ink.500" fontSize="sm">
                          {p.description}
                        </Text>
                      </Stack>

                      <HStack justify="space-between" align="baseline" wrap="wrap" gap="2">
                        <HStack align="baseline" gap="2">
                          <Text
                            fontFamily="heading"
                            fontWeight="800"
                            fontSize={{
                              base: "3xl",
                              md: "5xl",
                            }}
                            letterSpacing="-0.04em"
                          >
                            {p.price?.toLocaleString()} {p.currency || "XAF"}
                          </Text>
                        </HStack>
                        {planNotes > 0 && (
                          <Badge
                            bg="brand.violetTint"
                            color="brand.violetDeep"
                            px="2.5"
                            py="1"
                            rounded="full"
                            fontWeight="700"
                            fontSize="xs"
                          >
                            {planNotes} Notes ({Math.floor(planNotes / 2)} titres)
                          </Badge>
                        )}
                      </HStack>

                      <Button
                        asChild
                        size="lg"
                        rounded="full"
                        fontFamily="ui"
                        fontWeight="600"
                        color={p.popular ? "white" : "ink.900"}
                        background={p.popular ? accent.primary : "paper.200"}
                        _hover={{
                          transform: "translateY(-1px)",
                          bg: p.popular ? undefined : "paper.300",
                        }}
                      >
                        <NextLink href="/studio/recharge">{p.cta || "Choisir ce pack"}</NextLink>
                      </Button>
                    </Stack>

                    <Stack gap="3" mt="2">
                      {features.map((f, idx) => (
                        <HStack key={`${p.id || p.name}_f_${idx}`} gap="3" fontSize="sm" color="ink.700" align="flex-start">
                          <Box color="brand.cyanDeep" flexShrink={0} mt="0.5">
                            <LuCheck />
                          </Box>
                          <Text>{f}</Text>
                        </HStack>
                      ))}
                    </Stack>
                  </Stack>
                </Box>
              </Reveal>
            );
          })}
        </SimpleGrid>

        <Text mt="8" textAlign="center" fontSize="sm" color="ink.500">
          Paiement unique et sécurisé. Aucune reconduction automatique.
        </Text>
      </Container>
    </Box>
  );
}