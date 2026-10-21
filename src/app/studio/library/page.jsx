"use client";

import { useRouter } from "next/navigation";
import { Box } from "@chakra-ui/react";
import StudioLibrary from "@/components/studio/StudioLibrary";
import { useStudio } from "@/context/StudioContext";

export default function StudioLibraryPage() {
  const router = useRouter();
  const {
    library,
    isLoadingStudio,
    activePlayerTrack,
    isPlaying,
    playTrack,
    toggleFavorite,
    deleteTrack,
  } = useStudio();

  return (
    <Box py={{ base: "2", md: "4" }}>
      <StudioLibrary
        library={library}
        isLoading={isLoadingStudio}
        activeTrack={activePlayerTrack}
        isPlaying={isPlaying}
        onPlayTrack={playTrack}
        onToggleFavorite={toggleFavorite}
        onDeleteTrack={deleteTrack}
        onOpenCreate={() => router.push("/studio/create")}
      />
    </Box>
  );
}
