"use client";
import {
  Badge, Box, Button, Flex, HStack, Image, Spinner, Stack, Text,
} from "@chakra-ui/react";
import { LuCheck, LuTrash2, LuUpload } from "react-icons/lu";
import { LucideUploadCloud } from "lucide-react";
import { useRef } from "react";

/**
 * Étape 5 : Upload de la pochette (coverUrl)
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
    <Stack gap={{ base: "4", md: "5" }} textAlign="center" maxW="520px" mx="auto" w="full">
      <Stack gap="1">
        <HStack justify="center" gap="1.5">
          <Text fontFamily="heading" fontWeight="800" fontSize={{ base: "2xl", sm: "3xl" }} color="ink.900" letterSpacing="-0.03em">
            Image de couverture
          </Text>
          <Badge colorPalette="purple" rounded="full" fontSize="2xs" px="2.5" py="0.5">Optionnel</Badge>
        </HStack>
        <Text fontSize="sm" color="ink.500">
          Ajoutez un visuel pour illustrer votre morceau
        </Text>
      </Stack>

      {/* Input file caché */}
      <input type="file" ref={coverInputRef} accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />

      {/* Zone de prévisualisation ou Dropzone */}
      {coverUrl ? (
        <Box p="4" rounded="2xl" bg="paper.0" borderWidth="2px" borderColor="brand.violet"
          boxShadow="0 8px 30px rgba(124, 58, 237, 0.12)">
          <Flex direction={{ base: "column", sm: "row" }} align="center" gap="4">
            <Box position="relative" boxSize={{ base: "130px", sm: "110px" }}
              rounded="xl" overflow="hidden" flexShrink={0}
              borderWidth="1px" borderColor="paper.300"
              boxShadow="0 4px 12px rgba(0,0,0,0.15)">
              <Image src={coverUrl} alt="Pochette sélectionnée" w="full" h="full" objectFit="cover" />
              <Badge position="absolute" top="1.5" left="1.5" colorPalette="purple"
                fontSize="3xs" px="1.5" py="0.5" rounded="md">Active</Badge>
            </Box>

            <Stack gap="1.5" textAlign={{ base: "center", sm: "left" }} flex="1">
              <HStack gap="1.5" justify={{ base: "center", sm: "flex-start" }}>
                <LuCheck size={16} color="#7c3aed" />
                <Text fontSize="sm" fontWeight="700" color="ink.900">Pochette prête</Text>
              </HStack>
              <Text fontSize="xs" color="ink.500">
                Cette image sera affichée dans votre bibliothèque et sur le lecteur.
              </Text>
              <HStack gap="2" pt="1" justify={{ base: "center", sm: "flex-start" }}>
                <Button size="xs" variant="outline" rounded="full" borderColor="paper.300" color="ink.700"
                  _hover={{ bg: "paper.100" }} onClick={() => coverInputRef.current?.click()}
                  disabled={isUploading} gap="1">
                  <LuUpload size={12} /> Remplacer
                </Button>
                <Button size="xs" variant="ghost" rounded="full" color="red.600"
                  _hover={{ bg: "red.50" }} onClick={() => onCoverChange("")} gap="1">
                  <LuTrash2 size={12} /> Retirer
                </Button>
              </HStack>
            </Stack>
          </Flex>
        </Box>
      ) : (
        <Box
          p={{ base: "6", sm: "7" }} rounded="2xl" bg="paper.0"
          borderWidth="2px" borderStyle="dashed" borderColor="paper.300"
          _hover={{ borderColor: "brand.violetDeep", bg: "brand.violetTint" }}
          cursor="pointer" transition="all 0.2s"
          onClick={() => !isUploading && coverInputRef.current?.click()}
        >
          <Stack gap="2" align="center">
            <Flex boxSize="12" rounded="full" bg="brand.violetTint" color="brand.violetDeep" align="center" justify="center">
              {isUploading ? <Spinner size="sm" color="brand.violetDeep" /> : <LucideUploadCloud size={26} />}
            </Flex>
            <Text fontSize="sm" fontWeight="700" color="ink.900">
              {isUploading ? "Téléversement en cours..." : "Téléverser une image de couverture"}
            </Text>
            <Text fontSize="xs" color="ink.500" maxW="320px">
              Cliquez pour choisir une photo depuis votre appareil (JPG, PNG, WebP — max 10 Mo)
            </Text>
          </Stack>
        </Box>
      )}

      {uploadError && (
        <Text fontSize="xs" color="red.500" fontWeight="600">{uploadError}</Text>
      )}

      <Text fontStyle="italic" fontSize="xs" color="ink.500" textAlign="center">
        Si vous ne choisissez pas d'image, Suno en générera une automatiquement.
      </Text>

      <Stack gap="2" pt="2" align="center">
        <Button
          size="md" rounded="full" color="white"
          bg="linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)"
          onClick={onNext}
          _hover={{ transform: "translateY(-1px)", boxShadow: "0 8px 25px rgba(124, 58, 237, 0.4)" }}
          _active={{ transform: "scale(0.98)" }}
          fontFamily="ui" fontWeight="700" fontSize="sm" minW="240px" h="12"
          boxShadow="0 4px 18px rgba(124, 58, 237, 0.3)"
        >
          Continuer vers la vérification
        </Button>
        <Button size="xs" variant="ghost" color="ink.500" onClick={onSkip} fontSize="xs">
          Passer cette étape (pochette automatique) &gt;
        </Button>
      </Stack>
    </Stack>
  );
}
