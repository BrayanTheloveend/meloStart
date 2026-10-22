"use client";

import { Box, Flex, HStack, Image, Stack, Text } from "@chakra-ui/react";
import { LuPlay } from "react-icons/lu";
import Waveform from "@/components/common/Waveform";
import { accent } from "@/theme/system";

/** Liste "Mes créations" (les plus récentes en premier). */
export default function TrackList({ tracks }) {
  return (
    <Stack gap="4" p={{ base: "5", md: "8" }} rounded="3xl" bg="paper.100" borderWidth="1px" borderColor="paper.300">
      <Text fontFamily="heading" fontWeight="700" fontSize="lg">
        Mes créations
      </Text>
      {tracks.map((t) => (
        <HStack key={t.id} gap="4" p="3" rounded="xl" _hover={{ bg: "paper.50" }} transition="background .2s">
          {t.coverUrl ? (
            <Image
              src={t.coverUrl}
              alt={t.title}
              boxSize="10"
              rounded="xl"
              objectFit="cover"
              flexShrink={0}
            />
          ) : (
            <Flex boxSize="10" flexShrink={0} rounded="full" align="center" justify="center" color="white" background={accent.primary}>
              <LuPlay size={15} />
            </Flex>
          )}
          <Stack gap="0" flex="1" minW="0">
            <Text fontFamily="ui" fontWeight="600" truncate>
              {t.title}
            </Text>
            <Text fontSize="xs" color="ink.500" truncate>
              {t.meta}
            </Text>
          </Stack>
          <Box w="16" display={{ base: "none", sm: "block" }}>
            <Waveform bars={10} height={20} gap="2px" />
          </Box>
          <Text fontFamily="ui" fontSize="sm" color="ink.500">
            {t.length}
          </Text>
        </HStack>
      ))}
    </Stack>
  );
}
