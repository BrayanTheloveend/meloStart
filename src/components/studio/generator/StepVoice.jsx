"use client";
import { Box, Button, Flex, HStack, Image, Stack, Text } from "@chakra-ui/react";
import { VOICE_TYPES } from "./constants";

/**
 * Étape 3 : Type de voix
 */
export default function StepVoice({ vocalType, onSelect, onNext }) {
  return (
    <Stack gap={{ base: "5", md: "6" }} textAlign="center" maxW="460px" mx="auto" w="full">
      <Stack gap="1">
        <Text fontFamily="heading" fontWeight="800" fontSize={{ base: "2xl", sm: "3xl" }} color="ink.900" letterSpacing="-0.03em">
          Quel type de voix ?
        </Text>
        <Text fontSize="sm" color="ink.500">
          Homme, femme, duo... ou instrumental ?
        </Text>
      </Stack>

      <Stack gap="3" w="full">
        {VOICE_TYPES.map((v) => {
          const isSelected = vocalType === v.id;
          return (
            <Box
              key={v.id} as="button" type="button"
              onClick={() => onSelect(v)}
              p="4" rounded="2xl"
              bg={isSelected ? "brand.violetTint" : "paper.0"}
              borderWidth="1.5px"
              borderColor={isSelected ? "brand.violetDeep" : "paper.200"}
              boxShadow={isSelected ? "0 4px 18px rgba(124, 58, 237, 0.12)" : "0 2px 6px rgba(0,0,0,0.02)"}
              _hover={{ borderColor: isSelected ? "brand.violetDeep" : "paper.350", transform: "translateY(-1px)" }}
              transition="all 0.2s" cursor="pointer" textAlign="left"
            >
              <Flex align="center" justify="space-between">
                <HStack gap="3.5">
                  <Image src={v.icon} alt={v.title} width="35px" height="35px" />
                  <Box>
                    <Text fontFamily="ui" fontWeight="700" fontSize="sm" color="ink.900">{v.title}</Text>
                    {v.desc && <Text fontSize="2xs" color="ink.500" mt="0.5">{v.desc}</Text>}
                  </Box>
                </HStack>
                <Box
                  boxSize="5" rounded="full" borderWidth="2px"
                  borderColor={isSelected ? "brand.violetDeep" : "paper.300"}
                  bg={isSelected ? "brand.violetDeep" : "transparent"}
                  display="flex" alignItems="center" justifyContent="center"
                  color="white" flexShrink={0} transition="all 0.2s"
                >
                  {isSelected && <Box boxSize="2" rounded="full" bg="white" />}
                </Box>
              </Flex>
            </Box>
          );
        })}
      </Stack>

      <Box pt="2">
        <Button
          size="md" rounded="full" color="white"
          bg="linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)"
          onClick={onNext}
          _hover={{ transform: "translateY(-1px)", boxShadow: "0 8px 25px rgba(124, 58, 237, 0.4)" }}
          _active={{ transform: "scale(0.98)" }}
          fontFamily="ui" fontWeight="700" fontSize="sm" minW="220px" h="12"
          boxShadow="0 4px 18px rgba(124, 58, 237, 0.3)"
        >
          Continuer
        </Button>
      </Box>
    </Stack>
  );
}
