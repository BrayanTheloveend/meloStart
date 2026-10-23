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
    currentTime,
    duration,
    seekTrack,
    playTrack,
    toggleFavorite,
    togglePublic,
    deleteTrack,
  } = useStudio();

  return (
    <Box py={{ base: "2", md: "4" }}>
      <StudioLibrary
        library={library}
        isLoading={isLoadingStudio}
        activeTrack={activePlayerTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onSeekTrack={seekTrack}
        onPlayTrack={playTrack}
        onToggleFavorite={toggleFavorite}
        onTogglePublic={togglePublic}
        onDeleteTrack={deleteTrack}
        onOpenCreate={() => router.push("/studio/create")}
      />
    </Box>
  );
}
