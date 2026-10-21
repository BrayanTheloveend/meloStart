"use client";

import { Box, Flex, HStack, Stack } from "@chakra-ui/react";

/**
 * Composant Shimmer / Skeleton universel.
 * Remplace tout affichage de fausses données (mock) par une animation de chargement élégante.
 */
export function Shimmer({ h = "20px", w = "full", rounded = "xl", className = "", ...props }) {
  return (
    <Box
      h={h}
      w={w}
      rounded={rounded}
      className={`shimmer-loading ${className}`}
      {...props}
    />
  );
}

/**
 * Shimmer rond (avatars, boutons circulaires, icônes)
 */
export function ShimmerCircle({ size = "40px", ...props }) {
  return <Shimmer h={size} w={size} rounded="full" {...props} />;
}

/**
 * Shimmer de carte KPI (ex: statistiques dashboard, cartes services)
 */
export function ShimmerCard({ h = "130px", rounded = "2xl", ...props }) {
  return (
    <Box
      p="5"
      rounded={rounded}
      bg="paper.50"
      border="1px solid"
      borderColor="paper.200"
      h={h}
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      {...props}
    >
      <Flex justify="space-between" align="center">
        <HStack gap="2">
          <ShimmerCircle size="18px" />
          <Shimmer h="12px" w="90px" rounded="md" />
        </HStack>
        <Shimmer h="16px" w="50px" rounded="full" />
      </Flex>
      <Shimmer h="28px" w="110px" rounded="lg" my="2" />
      <Shimmer h="12px" w="140px" rounded="md" />
    </Box>
  );
}

/**
 * Shimmer pour ligne de tableau (Tracks, Users, Transactions)
 */
export function ShimmerTableRow({ columns = 6 }) {
  return (
    <Box as="tr" borderBottom="1px solid" borderColor="paper.100" py="3">
      <Box as="td" py="3.5" px="3">
        <HStack gap="3">
          <ShimmerCircle size="34px" />
          <Stack gap="1.5" flex="1">
            <Shimmer h="14px" w="160px" rounded="md" />
            <Shimmer h="10px" w="100px" rounded="md" />
          </Stack>
        </HStack>
      </Box>
      <Box as="td" py="3.5" px="3">
        <Stack gap="1.5">
          <Shimmer h="13px" w="120px" rounded="md" />
          <Shimmer h="10px" w="80px" rounded="md" />
        </Stack>
      </Box>
      <Box as="td" py="3.5" px="3">
        <Shimmer h="18px" w="80px" rounded="full" />
      </Box>
      <Box as="td" py="3.5" px="3">
        <Shimmer h="14px" w="50px" rounded="md" />
      </Box>
      <Box as="td" py="3.5" px="3">
        <Shimmer h="20px" w="90px" rounded="full" />
      </Box>
      {columns >= 6 && (
        <Box as="td" py="3.5" px="3" textAlign="right">
          <HStack gap="2" justify="flex-end">
            <ShimmerCircle size="26px" />
            <ShimmerCircle size="26px" />
          </HStack>
        </Box>
      )}
    </Box>
  );
}

/**
 * Shimmer pour item de liste (pistes récentes, transactions récentes)
 */
export function ShimmerListItem({ h = "64px" }) {
  return (
    <Box
      p="3.5"
      rounded="2xl"
      bg="paper.50"
      border="1px solid"
      borderColor="paper.200"
      h={h}
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      gap="3"
    >
      <HStack gap="3.5" flex="1">
        <ShimmerCircle size="42px" rounded="xl" />
        <Stack gap="2" flex="1">
          <Shimmer h="14px" w="180px" rounded="md" />
          <Shimmer h="11px" w="240px" rounded="md" />
        </Stack>
      </HStack>
      <HStack gap="3">
        <Shimmer h="22px" w="70px" rounded="full" />
        <ShimmerCircle size="28px" />
      </HStack>
    </Box>
  );
}

/**
 * Shimmer pour barre de genre / distribution
 */
export function ShimmerGenreBar() {
  return (
    <Stack gap="2">
      <Flex justify="space-between">
        <HStack gap="2">
          <ShimmerCircle size="10px" />
          <Shimmer h="13px" w="90px" rounded="md" />
        </HStack>
        <Shimmer h="13px" w="60px" rounded="md" />
      </Flex>
      <Shimmer h="8px" w="full" rounded="full" />
    </Stack>
  );
}

export default Shimmer;
