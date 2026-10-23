"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Spinner, Center } from "@chakra-ui/react";
import GeneratorPanel from "@/components/studio/GeneratorPanel";
import { useStudio } from "@/context/StudioContext";

function StudioCreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { notes, updateNotes, addTrack, toggleFavorite, togglePublic, playTrack, config } = useStudio();

  const [initialData, setInitialData] = useState({
    musicStyle: config.genre || "Afrobeat",
    story: config.description || "",
    vocalType: config.vocalType || "female",
  });

  useEffect(() => {
    const genreParam = searchParams.get("genre");
    const promptParam = searchParams.get("prompt");

    if (genreParam || promptParam) {
      setInitialData((prev) => ({
        ...prev,
        ...(genreParam ? { musicStyle: genreParam } : {}),
        ...(promptParam ? { story: promptParam } : {}),
      }));
    }
  }, [searchParams]);

  return (
    <GeneratorPanel
      notes={notes}
      onOpenRecharge={() => router.push("/studio/recharge")}
      onDeductNotes={(cost) => updateNotes(notes - cost)}
      onTrackCreated={(newTrack) => addTrack(newTrack)}
      initialData={initialData}
      onToggleFavorite={toggleFavorite}
      onTogglePublic={togglePublic}
      onPlayTrack={playTrack}
    />
  );
}

export default function StudioCreatePage() {
  return (
    <Suspense
      fallback={
        <Center py="20">
          <Spinner size="lg" color="brand.violetDeep" />
        </Center>
      }
    >
      <StudioCreateContent />
    </Suspense>
  );
}
