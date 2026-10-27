"use client";

import { Badge, Box, Flex, Grid, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import { LuCheck } from "react-icons/lu";
import { onboardingGoals, onboardingFrequencies } from "@/data/onboardingData";

export default function Step2UsageGoals({ data, onChange }) {
  const setGoal = (goalId) => {
    onChange({ goal: goalId });
  };

  const setFrequency = (freqId) => {
    onChange({ frequency: freqId });
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
          Étape 2 sur 4
        </Badge>
        <Heading as="h2" fontFamily="heading" fontWeight="800" fontSize={{ base: "2xl", md: "3xl" }} letterSpacing="-0.03em">
          Votre Usage
        </Heading>
        <Text fontSize={{ base: "sm", md: "md" }} color="ink.500" maxW="xl">
          Cette étape permet d&apos;adapter l&apos;interface de pretymelo et de vous proposer la meilleure configuration pour vos créations.
        </Text>
      </Stack>

      {/* Section 1 : Objectif principal avec pretymelo */}
      <Stack gap="3">
        <Text fontFamily="ui" fontWeight="700" fontSize="md" color="ink.900">
          Quel est votre objectif principal avec pretymelo ?
        </Text>

        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap="3.5">
          {onboardingGoals.map((g) => {
            const isSelected = data.goal === g.id;
            return (
              <Box
                key={g.id}
                as="button"
                type="button"
                onClick={() => setGoal(g.id)}
                p="5"
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
                position="relative"
              >
                <Flex justify="space-between" align="flex-start" mb="3">
                  <HStack gap="3">
                    <Text fontSize="2xl">{g.icon}</Text>
                    {/* <Badge
                      size="sm"
                      rounded="full"
                      bg={isSelected ? "brand.violetDeep" : "paper.200"}
                      color={isSelected ? "white" : "ink.500"}
                      fontSize="2xs"
                      fontFamily="ui"
                      px="2"
                      py="0.5"
                    >
                      Plan {g.recommendedPlan}
                    </Badge> */}
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

                <Text fontFamily="ui" fontWeight="700" fontSize="sm" color="ink.900" mb="1">
                  {g.title}
                </Text>
                <Text fontSize="xs" color="ink.500" lineHeight="short">
                  {g.subtitle}
                </Text>
              </Box>
            );
          })}
        </Grid>
      </Stack>

      {/* Section 2 : Fréquence de création
      <Stack gap="3">
        <Text fontFamily="ui" fontWeight="700" fontSize="md" color="ink.900">
          À quelle fréquence pensez-vous créer des morceaux ?
        </Text>

        <Grid templateColumns={{ base: "1fr", sm: "repeat(3, 1fr)" }} gap="3">
          {onboardingFrequencies.map((f) => {
            const isSelected = data.frequency === f.id;
            return (
              <Box
                key={f.id}
                as="button"
                type="button"
                onClick={() => setFrequency(f.id)}
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
                transition="all 0.2s"
                cursor="pointer"
              >
                <HStack justify="space-between" mb="2">
                  <Badge
                    size="sm"
                    rounded="full"
                    bg={isSelected ? "brand.violetDeep" : "paper.200"}
                    color={isSelected ? "white" : "ink.500"}
                    fontSize="2xs"
                  >
                    {f.badge}
                  </Badge>
                  <Box
                    boxSize="4"
                    rounded="full"
                    borderWidth="2px"
                    borderColor={isSelected ? "brand.violetDeep" : "paper.300"}
                    bg={isSelected ? "brand.violetDeep" : "transparent"}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {isSelected && <Box boxSize="1.5" rounded="full" bg="white" />}
                  </Box>
                </HStack>
                <Text fontFamily="ui" fontWeight="600" fontSize="sm" color="ink.900" mb="1">
                  {f.label}
                </Text>
                <Text fontSize="xs" color="ink.500" lineHeight="short">
                  {f.desc}
                </Text>
              </Box>
            );
          })}
        </Grid>
      </Stack> */}
    </Stack>
  );
}
