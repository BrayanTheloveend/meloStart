"use client";

import { Badge, Box, Flex, Grid, Heading, HStack, Icon, Input, Stack, Text } from "@chakra-ui/react";
import { LuCheck } from "react-icons/lu";
import { onboardingAttributions } from "@/data/onboardingData";

export default function Step3Attribution({ data, onChange }) {
  const setAttribution = (attrId) => {
    onChange({ attribution: attrId });
  };

  const setCustomAttribution = (val) => {
    onChange({ customAttribution: val });
  };

  return (
    <Stack gap="8">
      {/* En-tête de l'étape */}
      <Stack gap="2" textAlign="center" align="center">
        <Badge
          px="3"
          py="1"
          rounded="full"
          bg="brand.violetTint"
          color="brand.violetDeep"
          fontFamily="ui"
          fontWeight="600"
          fontSize="xs"
        >
          Étape 3 sur 4
        </Badge>
        <Heading as="h2" fontFamily="heading" fontWeight="800" fontSize={{ base: "2xl", md: "3xl" }} letterSpacing="-0.03em">
          Comment nous avez-vous découverts ?
        </Heading>
        <Text fontSize={{ base: "sm", md: "md" }} color="ink.500" maxW="xl">
          Ces retours nous aident à comprendre comment pretymelo se fait connaître et à concentrer nos efforts au bon endroit.
        </Text>
      </Stack>

      <Stack gap="3">
        <Text fontFamily="ui" fontWeight="700" fontSize="md" color="ink.900">
          Comment avez-vous entendu parler de pretymelo ?
        </Text>

        <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }} gap="3">
          {onboardingAttributions.map((a) => {
            const isSelected = data.attribution === a.id;
            return (
              <Box
                key={a.id}
                as="button"
                type="button"
                onClick={() => setAttribution(a.id)}
                p="4"
                textAlign="left"
                rounded="2xl"
                bg={isSelected ? "brand.violetTint" : "paper.50"}
                borderWidth="2px"
                borderColor={isSelected ? "brand.violetDeep" : "paper.200"}
                boxShadow={isSelected ? "0 4px 16px rgba(124, 58, 237, 0.12)" : "none"}
                _hover={{
                  borderColor: isSelected ? "brand.violetDeep" : "paper.400",
                  transform: "translateY(-1px)",
                }}
                transition="all 0.2s ease"
                cursor="pointer"
              >
                <Flex justify="space-between" align="center">
                  <HStack gap="3">
                    <Icon>
                      {a.icon}
                    </Icon>
                    <Text fontFamily="ui" fontWeight="600" fontSize="sm" color="ink.900">
                      {a.label}
                    </Text>
                  </HStack>
                  <Box
                    boxSize="5"
                    rounded="full"
                    borderWidth="2px"
                    borderColor={isSelected ? "brand.violetDeep" : "paper.300"}
                    bg={isSelected ? "brand.violetDeep" : "transparent"}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    color="white"
                    fontSize="xs"
                    transition="all 0.2s"
                  >
                    {isSelected && <LuCheck strokeWidth={3} size={12} />}
                  </Box>
                </Flex>
              </Box>
            );
          })}
        </Grid>

        {/* Champ conditionnel pour 'Autre' */}
        {data.attribution === "other" && (
          <Box mt="2" p="4" bg="paper.50" rounded="2xl" borderWidth="1px" borderColor="paper.300">
            <Text fontFamily="ui" fontSize="xs" fontWeight="600" color="ink.700" mb="2">
              Précisez si vous le souhaitez :
            </Text>
            <Input
              value={data.customAttribution || ""}
              onChange={(e) => setCustomAttribution(e.target.value)}
              placeholder="Ex: Podcast, événement, conférence..."
              bg="paper.0"
              rounded="xl"
              borderColor="paper.300"
              _focusVisible={{ borderColor: "brand.violet", boxShadow: "0 0 0 1px #8b5cf6" }}
            />
          </Box>
        )}
      </Stack>
    </Stack>
  );
}
