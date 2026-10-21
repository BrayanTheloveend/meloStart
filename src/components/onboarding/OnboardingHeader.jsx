"use client";

import NextLink from "next/link";
import { Box, Button, Container, Flex, HStack, Text } from "@chakra-ui/react";
import Logo from "@/components/common/Logo";
import { accent } from "@/theme/system";

export default function OnboardingHeader({ currentStep, totalSteps = 4, onSkip }) {
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  return (
    <Box as="header" borderBottomWidth="1px" borderColor="paper.200" bg="rgba(255,255,255,0.85)" backdropFilter="blur(16px)" position="sticky" top="0" zIndex="30">
      <Container maxW="5xl" py="3.5">
        <Flex align="center" justify="space-between" gap="4">
          <Logo size="sm" />

          {/* Stepper centré avec barre de progression fine
          <Flex direction="column" align="center" gap="1.5" flex="1" maxW="320px" mx="auto">
            <Flex justify="space-between" w="full" fontSize="xs" fontFamily="ui" fontWeight="600" color="ink.500">
              <Text>Configuration du studio</Text>
              <Text color="brand.violetDeep">
                Étape {currentStep} / {totalSteps}
              </Text>
            </Flex>
            <Box w="full" h="2" bg="paper.200" rounded="full" overflow="hidden">
              <Box
                h="full"
                w={`${progressPercent}%`}
                bg={accent.primary}
                rounded="full"
                transition="width 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
              />
            </Box>
          </Flex> */}

          {/* Option de passer directement si l'utilisateur est pressé */}
          <HStack gap="2">
            {currentStep < totalSteps ? (
              <Button
                variant="ghost"
                size="sm"
                fontFamily="ui"
                fontSize="xs"
                color="ink.400"
                _hover={{ color: "ink.900", bg: "paper.200" }}
                onClick={onSkip}
              >
                Passer l&apos;onboarding
              </Button>
            ) : (
              <Button asChild variant="ghost" size="sm" fontFamily="ui" fontSize="xs" color="ink.500">
                <NextLink href="/studio">Aller au Studio</NextLink>
              </Button>
            )}
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}
