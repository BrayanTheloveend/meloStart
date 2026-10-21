"use client";

import { useState } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Input,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { LuCheck, LuMusic, LuPlus, LuSparkles, LuX } from "react-icons/lu";
import { LucideUploadCloud } from "lucide-react";

export default function CreateDemoTrackModal({ isOpen, onClose, onSuccess, notify }) {
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("Afrobeat");
  const [prompt, setPrompt] = useState("");
  const [mood, setMood] = useState("Joyeux");
  const [vocalType, setVocalType] = useState("female");
  const [language, setLanguage] = useState("Français");
  const [mode, setMode] = useState("ai"); // "ai" ou "upload"
  const [audioFile, setAudioFile] = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === "upload" && audioFile) {
        // Envoi Multipart FormData avec fichier audio
        const formData = new FormData();
        formData.append("title", title || `Démo ${genre}`);
        formData.append("genre", genre);
        formData.append("prompt", prompt);
        formData.append("moods", JSON.stringify([mood]));
        formData.append("vocalType", vocalType);
        formData.append("language", language);
        formData.append("isPublic", isPublic ? "true" : "false");
        formData.append("audioFile", audioFile);

        const res = await fetch("/api/admin/tracks/demo", {
          method: "POST",
          body: formData,
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || "Erreur upload");

        if (notify) notify("✨ Morceau audio démo importé et publié à l'accueil !");
      } else {
        // Création avec Génération IA Suno V6
        const payload = {
          title: title || `Démo ${genre}`,
          genre,
          prompt,
          moods: [mood],
          vocalType,
          language,
          isPublic,
          generateWithAI: true,
        };

        const res = await fetch("/api/admin/tracks/demo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || "Erreur génération");

        if (notify) notify("🚀 Génération IA Suno V6 démarrée ! Elle apparaîtra à l'accueil une fois prête.");
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      if (notify) notify(`Erreur création : ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      position="fixed"
      inset="0"
      bg="rgba(15, 23, 42, 0.6)"
      backdropFilter="blur(6px)"
      zIndex="70"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p="4"
    >
      <Box
        bg="paper.0"
        maxW="540px"
        w="100%"
        rounded="3xl"
        p={{ base: "5", sm: "7" }}
        boxShadow="2xl"
        border="1px solid"
        borderColor="paper.200"
        maxH="90vh"
        overflowY="auto"
      >
        <Flex justify="space-between" align="center" mb="5">
          <HStack gap="2.5">
            <Box
              boxSize="9"
              rounded="xl"
              bg="brand.violetTint"
              color="brand.violetDeep"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <LuMusic size={18} />
            </Box>
            <Stack gap="0">
              <Text fontFamily="heading" fontWeight="800" fontSize="lg" color="ink.900">
                Créer une Musique Démo
              </Text>
              <Text fontSize="xs" color="ink.500">
                Visible et audible directement sur la page d'accueil
              </Text>
            </Stack>
          </HStack>

          <IconButton
            size="sm"
            variant="ghost"
            rounded="full"
            aria-label="Fermer"
            onClick={onClose}
          >
            <LuX size={16} />
          </IconButton>
        </Flex>

        <form onSubmit={handleSubmit}>
          <Stack gap="4">
            {/* Choix du mode : IA vs Upload direct */}
            <Box p="1" bg="paper.100" rounded="2xl" display="flex">
              <Button
                type="button"
                flex="1"
                size="sm"
                rounded="xl"
                variant={mode === "ai" ? "solid" : "ghost"}
                bg={mode === "ai" ? "brand.violetDeep" : "transparent"}
                color={mode === "ai" ? "white" : "ink.700"}
                onClick={() => setMode("ai")}
              >
                <LuSparkles size={14} /> Génération IA Suno V6
              </Button>
              <Button
                type="button"
                flex="1"
                size="sm"
                rounded="xl"
                variant={mode === "upload" ? "solid" : "ghost"}
                bg={mode === "upload" ? "brand.violetDeep" : "transparent"}
                color={mode === "upload" ? "white" : "ink.700"}
                onClick={() => setMode("upload")}
              >
                <LucideUploadCloud size={14} /> Upload Audio (MP3/WAV)
              </Button>
            </Box>

            {/* Titre */}
            <Stack gap="1">
              <Text fontSize="xs" fontWeight="700" color="ink.700">
                Titre de la musique
              </Text>
              <Input
                placeholder="Ex: Dakar Summer Vibe"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                rounded="xl"
                fontSize="sm"
              />
            </Stack>

            {/* Genre & Ambiance */}
            <SimpleGrid columns={2} gap="3">
              <Stack gap="1">
                <Text fontSize="xs" fontWeight="700" color="ink.700">
                  Genre musical
                </Text>
                <Box
                  as="select"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  w="100%"
                  h="38px"
                  px="3"
                  rounded="xl"
                  fontSize="sm"
                  bg="paper.50"
                  border="1px solid"
                  borderColor="paper.300"
                  color="ink.800"
                  outline="none"
                >
                  <option value="Afrobeat">Afrobeat</option>
                  <option value="Pop">Pop</option>
                  <option value="Lo-fi & Soul">Lo-fi & Soul</option>
                  <option value="Rap & Trap">Rap & Trap</option>
                  <option value="Électro">Électro</option>
                  <option value="R&B">R&B</option>
                  <option value="Acoustique">Acoustique</option>
                </Box>
              </Stack>

              <Stack gap="1">
                <Text fontSize="xs" fontWeight="700" color="ink.700">
                  Ambiance
                </Text>
                <Box
                  as="select"
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  w="100%"
                  h="38px"
                  px="3"
                  rounded="xl"
                  fontSize="sm"
                  bg="paper.50"
                  border="1px solid"
                  borderColor="paper.300"
                  color="ink.800"
                  outline="none"
                >
                  <option value="Joyeux">Joyeux / Solaire</option>
                  <option value="Énergique">Énergique / Festif</option>
                  <option value="Relaxant">Relaxant / Chill</option>
                  <option value="Romantique">Romantique</option>
                  <option value="Épique">Épique</option>
                  <option value="Nostalgique">Nostalgique</option>
                </Box>
              </Stack>
            </SimpleGrid>

            {/* Voix & Langue */}
            <SimpleGrid columns={2} gap="3">
              <Stack gap="1">
                <Text fontSize="xs" fontWeight="700" color="ink.700">
                  Voix
                </Text>
                <Box
                  as="select"
                  value={vocalType}
                  onChange={(e) => setVocalType(e.target.value)}
                  w="100%"
                  h="38px"
                  px="3"
                  rounded="xl"
                  fontSize="sm"
                  bg="paper.50"
                  border="1px solid"
                  borderColor="paper.300"
                  color="ink.800"
                  outline="none"
                >
                  <option value="female">Voix Féminine</option>
                  <option value="male">Voix Masculine</option>
                  <option value="instrumental">Instrumental Pur</option>
                </Box>
              </Stack>

              <Stack gap="1">
                <Text fontSize="xs" fontWeight="700" color="ink.700">
                  Langue
                </Text>
                <Box
                  as="select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  w="100%"
                  h="38px"
                  px="3"
                  rounded="xl"
                  fontSize="sm"
                  bg="paper.50"
                  border="1px solid"
                  borderColor="paper.300"
                  color="ink.800"
                  outline="none"
                >
                  <option value="Français">Français</option>
                  <option value="Anglais">Anglais</option>
                  <option value="Espagnol">Espagnol</option>
                  <option value="Lingala">Lingala</option>
                  <option value="Wolof">Wolof</option>
                </Box>
              </Stack>
            </SimpleGrid>

            {/* Prompt / Description */}
            <Stack gap="1">
              <Text fontSize="xs" fontWeight="700" color="ink.700">
                Description du morceau
              </Text>
              <Textarea
                placeholder="Ex: Une chanson rythmée pour les vacances d'été, avec guitare soukous et percussions solaires..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rounded="xl"
                fontSize="sm"
                rows={3}
              />
            </Stack>

            {/* Upload de fichier audio si mode upload */}
            {mode === "upload" && (
              <Box
                p="4"
                rounded="2xl"
                border="2px dashed"
                borderColor={audioFile ? "brand.violetDeep" : "paper.300"}
                bg="paper.50"
                textAlign="center"
              >
                <input
                  type="file"
                  accept="audio/mp3,audio/wav,audio/ogg,audio/mpeg"
                  id="admin-audio-upload"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    if (e.target.files?.[0]) setAudioFile(e.target.files[0]);
                  }}
                />
                <label htmlFor="admin-audio-upload" style={{ cursor: "pointer", width: "100%", display: "block" }}>
                  <Stack align="center" gap="1">
                    <LucideUploadCloud size={24} color="#8b5cf6" />
                    <Text fontSize="xs" fontWeight="600" color="ink.800">
                      {audioFile ? `Fichier sélectionné : ${audioFile.name}` : "Cliquez pour sélectionner un fichier MP3 ou WAV"}
                    </Text>
                    <Text fontSize="10px" color="ink.400">
                      Taille maximale recommandée : 15 Mo
                    </Text>
                  </Stack>
                </label>
              </Box>
            )}

            {/* Publication Accueil Toggle */}
            <HStack
              justify="space-between"
              p="3"
              rounded="xl"
              bg="brand.violetTint"
              cursor="pointer"
              onClick={() => setIsPublic(!isPublic)}
            >
              <Stack gap="0">
                <Text fontSize="xs" fontWeight="700" color="brand.violetDeep">
                  🌟 Publier sur la page d'accueil
                </Text>
                <Text fontSize="10px" color="ink.600">
                  Cette musique sera immédiatement écoutable dans la section Exemples et le Hero.
                </Text>
              </Stack>
              <Box
                boxSize="5"
                rounded="md"
                bg={isPublic ? "brand.violetDeep" : "white"}
                border="1px solid"
                borderColor="brand.violetDeep"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="white"
              >
                {isPublic && <LuCheck size={14} />}
              </Box>
            </HStack>

            {/* Boutons d'action */}
            <Flex justify="flex-end" gap="2" mt="2">
              <Button size="sm" variant="ghost" rounded="xl" onClick={onClose} disabled={isSubmitting}>
                Annuler
              </Button>
              <Button
                size="sm"
                rounded="xl"
                bg="brand.violetDeep"
                color="white"
                type="submit"
                loading={isSubmitting}
                _hover={{ opacity: 0.9 }}
              >
                {mode === "ai" ? "Lancer la génération démo" : "Enregistrer et publier"}
              </Button>
            </Flex>
          </Stack>
        </form>
      </Box>
    </Box>
  );
}
