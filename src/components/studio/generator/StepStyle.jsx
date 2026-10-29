"use client";
import { Box, Button, Grid, Image, Stack, Text } from "@chakra-ui/react";
import { MUSIC_STYLES } from "./constants";

/**
 * Étape 4 : Style de musique (Suno AI)
 */
export default function StepStyle({ musicStyle, onSelect, onNext }) {
  return (
    <Stack gap={{ base: "4", md: "5" }} textAlign="center">
      <Stack gap="1">
        <Text fontFamily="heading" fontWeight="800" fontSize={{ base: "2xl", sm: "3xl" }} color="ink.900" letterSpacing="-0.03em">
          Quel style de musique ?
        </Text>
        <Text fontSize="sm" color="ink.500">
          Choisis l&apos;ambiance de ta chanson
        </Text>
      </Stack>

      <Grid
        templateColumns={{ base: "repeat(3, 1fr)", sm: "repeat(4, 1fr)" }}
        gap="2.5" maxW="520px" mx="auto" w="full"
      >
        {MUSIC_STYLES.map((s) => {
          const isSelected = musicStyle === s.id;
          return (
            <Box
              key={s.id} as="button" type="button"
              onClick={() => onSelect(s)}
              py="3" px="2" display="flex" gap={3} flexDirection="column" alignItems="center"
              rounded="2xl"
              bg={isSelected ? "brand.violetTint" : "paper.0"}
              borderWidth={isSelected ? "2px" : "1.5px"}
              borderColor={isSelected ? "brand.violetDeep" : "paper.200"}
              boxShadow={isSelected ? "0 4px 16px rgba(124, 58, 237, 0.16)" : "none"}
              _hover={{ borderColor: isSelected ? "brand.violetDeep" : "paper.400", transform: "translateY(-1px)" }}
              transition="all 0.2s" cursor="pointer" textAlign="center"
            >
              <Image src={s.icon} alt={s.title} w="35px" h="35px" mx="auto" />
              <Text fontFamily="ui" fontSize="2xs"
                color={isSelected ? "brand.violetDeep" : "ink.800"} truncate>
                {s.title}
              </Text>
            </Box>
          );
        })}
      </Grid>

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
