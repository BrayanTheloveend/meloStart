"use client";

import { useRef } from "react";
import {
  Badge, Box, Button, Flex, HStack, Image, Spinner, Stack, Text,
} from "@chakra-ui/react";

/**
 * Étape 5 : Téléversement de l'image de pochette (coverUrl)
 * Design Light Mode sobre et haut de gamme.
 */
export default function StepCover({
  coverUrl,
  onCoverChange,
  isUploading,
  uploadError,
  onNext,
  onSkip,
}) {
  const coverInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      onCoverChange(null, "L'image ne doit pas dépasser 10 Mo.");
      return;
    }

    onCoverChange(null, "", true); // isUploading = true

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "image");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Échec du téléversement de la pochette.");
      onCoverChange(data.url, "", false);
    } catch (err) {
      onCoverChange(null, err.message || "Erreur de téléversement.", false);
    } finally {
      e.target.value = "";
    }
  };

  return (
    <Stack gap={{ base: "4", md: "5" }} textAlign="center" maxW="500px" mx="auto" w="full">
      <Stack gap="1">
        <HStack justify="center" gap="2">
          <Text fontFamily="heading" fontWeight="800" fontSize={{ base: "2xl", sm: "3xl" }} color="slate.900" letterSpacing="-0.03em">
            Image de couverture
          </Text>
          <Badge bg="purple.50" color="purple.700" borderWidth="1px" borderColor="purple.200" rounded="full" fontSize="2xs" px="2.5" py="0.5">
            Optionnel
          </Badge>
        </HStack>
        {/* <Text fontSize="sm" color="slate.500">
          Illustrez votre morceau avec une photo ou laissez Suno en créer une
        </Text> */}
      </Stack>

      {/* Input de fichier masqué */}
      <input
        type="file"
        ref={coverInputRef}
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {/* Zone d'aperçu ou de téléversement */}
      {coverUrl ? (
        <Box
          p="5" rounded="2xl" bg="white"
          borderWidth="1.5px" borderColor="purple.400"
          boxShadow="0 4px 20px rgba(124, 58, 237, 0.08)"
        >
          <Flex direction={{ base: "column", sm: "row" }} align="center" gap="4">
            <Box
              position="relative" boxSize={{ base: "130px", sm: "110px" }}
              rounded="xl" overflow="hidden" flexShrink={0}
              borderWidth="1px" borderColor="slate.200"
              boxShadow="0 2px 8px rgba(0,0,0,0.06)"
            >
              <Image src={coverUrl} alt="Pochette sélectionnée" w="full" h="full" objectFit="cover" />
              <Badge position="absolute" top="1.5" left="1.5" bg="purple.600" color="white" fontSize="3xs" px="1.5" py="0.5" rounded="md">
                Active
              </Badge>
            </Box>

            <Stack gap="1.5" textAlign={{ base: "center", sm: "left" }} flex="1">
              <Text fontSize="sm" fontWeight="700" color="slate.900">
                Pochette personnalisée prête
              </Text>
              <Text fontSize="xs" color="slate.500">
                Cette image sera enregistrée dans votre bibliothèque et conservée sur le lecteur.
              </Text>
              <HStack gap="2" pt="1" justify={{ base: "center", sm: "flex-start" }}>
                <Button
                  size="xs" variant="outline" rounded="full"
                  borderColor="slate.300" color="slate.700"
                  _hover={{ bg: "slate.50" }}
                  onClick={() => coverInputRef.current?.click()}
                  disabled={isUploading}
                >
                  Remplacer
                </Button>
                <Button
                  size="xs" variant="ghost" rounded="full"
                  color="rose.600" _hover={{ bg: "rose.50" }}
                  onClick={() => onCoverChange("")}
                >
                  Retirer
                </Button>
              </HStack>
            </Stack>
          </Flex>
        </Box>
      ) : (
        <Box
          p={{ base: "7", sm: "8" }} rounded="2xl" bg="white"
          borderWidth="2px" borderStyle="dashed" borderColor="slate.250"
          _hover={{ borderColor: "purple.500", bg: "purple.50" }}
          cursor="pointer" transition="all 0.18s ease"
          onClick={() => !isUploading && coverInputRef.current?.click()}
        >
          <Stack gap="2.5" align="center">
            {isUploading ? (
              <Spinner size="md" color="purple.600" />
            ) : (
              <Box
                px="3" py="1" rounded="full" bg="slate.100" color="slate.700"
                fontSize="sm" 
              >
                Cliquez pour choisir une photo
              </Box>
            )}
            <Text fontSize="sm"  color="slate.800">
              {isUploading ? "Téléversement en cours..." : "Téléverser depuis cet appareil"}
            </Text>
            <Text fontSize="xs" color="slate.500" maxW="320px">
              Formats acceptés : JPG, PNG, WebP (max 10 Mo)
            </Text>
          </Stack>
        </Box>
      )}

      {uploadError && (
        <Text fontSize="xs" color="rose.600" fontWeight="600">{uploadError}</Text>
      )}

      <Text fontSize="xs" color="slate.400" textAlign="center">
        Si vous passez cette étape, nous généreront automatiquement un visuel studio.
      </Text>

      <Stack gap="2" pt="2" align="center">
        <Button
          size="md" rounded="full" color="white"
          bg="purple.600"
          onClick={onNext}
          _hover={{ bg: "purple.700", transform: "translateY(-1px)" }}
          _active={{ transform: "scale(0.98)" }}
           fontSize="sm" minW="240px" h="12"
          boxShadow="0 4px 14px rgba(124, 58, 237, 0.25)"
        >
          Continuer vers la vérification
        </Button>
       
      </Stack>
    </Stack>
  );
}
