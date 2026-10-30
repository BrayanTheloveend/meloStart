"use client";

import { Badge, Box, Flex, Grid, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import { LuCheck } from "react-icons/lu";
import { onboardingGenres, onboardingLanguages, onboardingVocalTypes } from "@/data/onboardingData";

export default function Step1MusicPreferences({ data, onChange }) {
  const toggleGenre = (genreId) => {
    const current = data.genres || [];
    const next = current.includes(genreId)
      ? current.filter((id) => id !== genreId)
      : [...current, genreId];
    onChange({ genres: next });
  };

  const toggleLanguage = (langId) => {
    const current = data.languages || [];
    const next = current.includes(langId)
      ? current.filter((id) => id !== langId)
      : [...current, langId];
    onChange({ languages: next });
  };

  const setVocalType = (vocalId) => {
    onChange({ vocalType: vocalId });
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
          Étape 1 sur 4
        </Badge>
        <Heading as="h2" fontFamily="heading" fontWeight="800" fontSize={{ base: "2xl", md: "3xl" }} letterSpacing="-0.03em">
          Vos Préférences Musicales
        </Heading>
        <Text fontSize={{ base: "sm", md: "md" }} color="ink.500" maxW="xl">
          Cette étape permet de pré-configurer le studio avec des suggestions parfaitement adaptées à vos goûts.
        </Text>
      </Stack>

      {/* Section 1 : Genres musicaux (Multi-sélection) */}
      <Stack gap="3">
        <Flex justify="space-between" flexDir={{ md: "row", base: "column" }} align="baseline">
          <Text fontFamily="ui" fontWeight="700" fontSize="md" color="ink.900">
            Genres musicaux préférés
          </Text>
          <Text fontSize="xs" color="ink.400">
            {(data.genres || []).length} sélectionné{(data.genres || []).length > 1 ? "s" : ""}
          </Text>
        </Flex>

        <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }} gap="3">
          {onboardingGenres.map((g) => {
            const isSelected = (data.genres || []).includes(g.id);
            return (
              <Box
                key={g.id}
                as="button"
                type="button"
                onClick={() => toggleGenre(g.id)}
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
                position="relative"
                cursor="pointer"
              >
                <Flex justify="space-between" align="flex-start" mb="2">
                  {/* <Text fontSize="2xl">{g.icon}</Text> */}
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
                <Text fontFamily="ui" fontWeight="600" fontSize="sm" color="ink.900" mb="1">
                  {g.label}
                </Text>
                <Text fontSize="xs" color="ink.500" lineHeight="short">
                  {g.desc}
                </Text>
              </Box>
            );
          })}
        </Grid>
      </Stack>

      {/* Section 2 : Langues souhaitées
      <Stack gap="3">
        <Text fontFamily="ui" fontWeight="700" fontSize="md" color="ink.900">
          Langue(s) souhaitée(s) pour les chansons
        </Text>
        <Flex gap="2.5" wrap="wrap">
          {onboardingLanguages.map((lang) => {
            const isSelected = (data.languages || []).includes(lang.id);
            return (
              <Box
                key={lang.id}
                as="button"
                type="button"
                onClick={() => toggleLanguage(lang.id)}
                px="4"
                py="2.5"
                rounded="full"
                borderWidth="1.5px"
                borderColor={isSelected ? "brand.violetDeep" : "paper.300"}
                bg={isSelected ? "brand.violetTint" : "paper.50"}
                color={isSelected ? "brand.violetDeep" : "ink.700"}
                fontFamily="ui"
                fontWeight={isSelected ? "600" : "500"}
                fontSize="sm"
                cursor="pointer"
                display="flex"
                alignItems="center"
                gap="2"
                _hover={{ borderColor: isSelected ? "brand.violetDeep" : "ink.400" }}
                transition="all 0.18s"
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
                {isSelected && <LuCheck size={14} strokeWidth={2.5} />}
              </Box>
            );
          })}
        </Flex>
      </Stack> */}

      {/* Section 3 : Type de voix préféré */}
      {/* <Stack gap="3">
        <Text fontFamily="ui" fontWeight="700" fontSize="md" color="ink.900">
          Type de voix préféré
        </Text>
        <Grid templateColumns={{ base: "1fr", sm: "repeat(3, 1fr)" }} gap="3">
          {onboardingVocalTypes.map((v) => {
            const isSelected = data.vocalType === v.id;
            return (
              <Box
                key={v.id}
                as="button"
                type="button"
                onClick={() => setVocalType(v.id)}
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
                  <Text fontSize="xl">{v.icon}</Text>
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
                  {v.label}
                </Text>
                <Text fontSize="xs" color="ink.500" lineHeight="short">
                  {v.desc}
                </Text>
              </Box>
            );
          })}
        </Grid>
      </Stack> */}
    </Stack>
  );
}
