"use client";
import {
  Box, Button, Grid, Image, Stack, Text,
} from "@chakra-ui/react";
import { OCCASIONS } from "./constants";

/**
 * Étape 1 : Choix de l'occasion
 */
export default function StepOccasion({ occasion, onSelect, onNext }) {
  return (
    <Stack gap={{ base: "5", md: "6" }} textAlign="center">
      <Stack gap="1">
        <Text fontFamily="heading" fontWeight="800" fontSize={{ base: "2xl", sm: "3xl" }} color="ink.900" letterSpacing="-0.03em">
          Pour quelle occasion ?
        </Text>
        <Text fontSize="sm" color="ink.500">
          Choisis le moment que tu veux célébrer
        </Text>
      </Stack>

      <Grid templateColumns="repeat(2, 1fr)" gap="3.5" maxW="440px" mx="auto" w="full">
        {OCCASIONS.map((o) => {
          const isSelected = occasion === o.id;
          return (
            <Box
              key={o.id}
              as="button"
              type="button"
              display="flex"
              flexDir="column"
              alignItems="center"
              justifyContent="center"
              onClick={() => onSelect(o.id)}
              p={{ base: "4", sm: "5" }}
              rounded="2xl"
              bg={isSelected ? "brand.violetTint" : "paper.0"}
              borderWidth="1.5px"
              borderColor={isSelected ? "brand.violetDeep" : "paper.200"}
              boxShadow={isSelected ? "0 4px 18px rgba(124, 58, 237, 0.12)" : "0 2px 6px rgba(0,0,0,0.02)"}
              _hover={{ borderColor: isSelected ? "brand.violetDeep" : "paper.350", transform: "translateY(-1px)" }}
              transition="all 0.2s"
              cursor="pointer"
              textAlign="center"
            >
              <Image src={o.icon} alt={o.title} width="55px" height="55px" />
              <Text fontFamily="ui" fontWeight={600} fontSize="sm" color="ink.900" mt="1">
                {o.title}
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
          fontFamily="ui" fontSize="sm" minW="220px" h="12"
          boxShadow="0 4px 18px rgba(124, 58, 237, 0.3)"
        >
          Continuer
        </Button>
      </Box>
    </Stack>
  );
}
