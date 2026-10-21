"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, HStack, Text } from "@chakra-ui/react";
import { LuShieldAlert } from "react-icons/lu";
import StudioHome from "@/components/studio/StudioHome";
import { useStudio } from "@/context/StudioContext";

export default function StudioHomePage() {
  const router = useRouter();
  const [deniedAlert, setDeniedAlert] = useState(false);
  const {
    notes,
    library,
    activePlayerTrack,
    isPlaying,
    playTrack,
    toggleFavorite,
    setConfig,
  } = useStudio();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get("denied") === "admin_required") {
        setDeniedAlert(true);
        const timer = setTimeout(() => setDeniedAlert(false), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handlePreloadPrompt = (item) => {
    setConfig((prev) => ({
      ...prev,
      genre: item.genre,
      description: item.prompt,
    }));
    router.push(`/studio/create?genre=${encodeURIComponent(item.genre)}&prompt=${encodeURIComponent(item.prompt)}`);
  };

  return (
    <>
      {deniedAlert && (
        <Box
          position="fixed"
          top="4"
          left="50%"
          transform="translateX(-50%)"
          zIndex="70"
          bg="red.600"
          color="white"
          px="5"
          py="2.5"
          rounded="full"
          boxShadow="0 10px 25px rgba(220, 38, 38, 0.35)"
        >
          <HStack gap="2">
            <LuShieldAlert size={18} />
            <Text fontSize="xs" fontFamily="ui" fontWeight="700">
              Accès refusé : Privilèges Administrateur requis pour ouvrir la console.
            </Text>
          </HStack>
        </Box>
      )}

      <StudioHome
        notes={notes}
        library={library}
        onOpenCreate={() => router.push("/studio/create")}
        onOpenRecharge={() => router.push("/studio/recharge")}
        activeTrack={activePlayerTrack}
        isPlaying={isPlaying}
        onPlayTrack={playTrack}
        onToggleFavorite={toggleFavorite}
        onPreloadPrompt={handlePreloadPrompt}
      />
    </>
  );
}
