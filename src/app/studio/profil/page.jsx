"use client";

import { useRouter } from "next/navigation";
import { Box } from "@chakra-ui/react";
import StudioProfile from "@/components/studio/StudioProfile";
import { useStudio } from "@/context/StudioContext";

export default function StudioProfilePage() {
  const router = useRouter();
  const { notes, library, updateNotes } = useStudio();

  return (
    <Box py={{ base: "4", md: "6" }}>
      <StudioProfile
        notes={notes}
        library={library}
        onOpenRecharge={() => router.push("/studio/recharge")}
        onUpdateNotes={updateNotes}
      />
    </Box>
  );
}
