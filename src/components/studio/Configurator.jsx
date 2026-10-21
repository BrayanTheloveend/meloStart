"use client";

import { useState } from "react";
import { Badge, Box, Button, Flex, HStack, Slider, Stack, Switch, Text, Textarea } from "@chakra-ui/react";
import { LuFileText, LuSparkles, LuWandSparkles, LuZap } from "react-icons/lu";
import { durations, genres, moods } from "@/data/content";
import { accent } from "@/theme/system";

/** Titre de bloc de formulaire. */
function Label({ children, hint }) {
  return (
    <Flex justify="space-between" align="baseline" mb="3">
      <Text fontFamily="ui" fontWeight="600" color="ink.900">
        {children}
      </Text>
      {hint && (
        <Text fontSize="sm" color="ink.500">
          {hint}
        </Text>
      )}
    </Flex>
  );
}

/** Pastille sélectionnable (genre, humeur, durée). */
function Chip({ active, children, ...rest }) {
  return (
    <Button
      size="sm"
      rounded="full"
      fontFamily="ui"
      fontWeight="500"
      aria-pressed={active}
      color={active ? "brand.violetDeep" : "ink.500"}
      bg={active ? "brand.violetTint" : "paper.50"}
      borderWidth="1px"
      borderColor={active ? "brand.violetDeep" : "paper.300"}
      _hover={{ bg: active ? "brand.violetTint" : "paper.100", color: "ink.900" }}
      transition="all 0.2s"
      {...rest}
    >
      {children}
    </Button>
  );
}

const MAX_MOODS = 3;

/** Formulaire de configuration : description, genre, humeur, tempo, durée, options. */
export default function Configurator({ config, setConfig, onGenerate, busy, notes = 0, onOpenRecharge }) {
  const [lyricsMode, setLyricsMode] = useState("auto"); // "auto" (IA) | "custom" (personnalisé)

  const set = (patch) => setConfig((c) => ({ ...c, ...patch }));

  const toggleMood = (m) =>
    set({
      moods: config.moods.includes(m)
        ? config.moods.filter((x) => x !== m)
        : config.moods.length < MAX_MOODS
        ? [...config.moods, m]
        : config.moods,
    });

  const hasEnoughNotes = notes >= 2;
  const hasMinDescription = config.description.trim().length >= 8 || (lyricsMode === "custom" && config.customLyrics?.trim().length >= 10);
  const canGenerate = hasMinDescription && hasEnoughNotes && !busy;

  return (
    <Stack gap="8" p={{ base: "5", md: "8" }} rounded="3xl" bg="paper.100" borderWidth="1px" borderColor="paper.300">
      {/* En-tête du configurateur avec rappel du solde */}
      <Flex justify="space-between" align="center" wrap="wrap" gap="2" pb="2" borderBottomWidth="1px" borderColor="paper.200">
        <HStack gap="2">
          <Text fontFamily="heading" fontWeight="800" fontSize="lg" color="ink.900">
            Workflow de Création IA
          </Text>
          <Badge bg="brand.violetTint" color="brand.violetDeep" size="sm" rounded="full" px="2">
            2 Notes
          </Badge>
        </HStack>

        <HStack gap="2">
          <Text fontSize="xs" color="ink.500">
            Votre solde : <b>{notes} Note{notes > 1 ? "s" : ""}</b>
          </Text>
          {notes < 2 && (
            <Button size="2xs" rounded="full" color="white" background={accent.primary} onClick={onOpenRecharge}>
              <LuZap size={11} /> Recharger
            </Button>
          )}
        </HStack>
      </Flex>

      {/* Description de la musique */}
      <Box>
        <Flex justify="space-between" align="center" mb="2">
          <Label hint={`${config.description.length}/400`}>Décrivez la musique de vos rêves</Label>
        </Flex>

        <Textarea
          value={config.description}
          onChange={(e) => set({ description: e.target.value })}
          maxLength={400}
          rows={3}
          resize="none"
          placeholder="Ex. Une chanson festive afrobeat pour l'anniversaire d'Amina, avec des cuivres entraînants et un refrain joyeux."
          bg="paper.0"
          borderColor="paper.300"
          rounded="xl"
          _focusVisible={{ borderColor: "brand.violet", boxShadow: "0 0 0 1px #8b5cf6" }}
        />
      </Box>

      {/* Mode de paroles (Généré par IA ou écrites par vous) */}
      <Box p="4" rounded="2xl" bg="paper.50" borderWidth="1px" borderColor="paper.200">
        <Flex justify="space-between" align="center" mb="3">
          <Text fontFamily="ui" fontWeight="600" fontSize="sm" color="ink.900">
            Paroles de la chanson
          </Text>
          <HStack gap="1" bg="paper.200" p="1" rounded="full">
            <Button
              size="xs"
              rounded="full"
              variant={lyricsMode === "auto" ? "solid" : "ghost"}
              bg={lyricsMode === "auto" ? "paper.0" : "transparent"}
              color={lyricsMode === "auto" ? "ink.900" : "ink.500"}
              boxShadow={lyricsMode === "auto" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"}
              onClick={() => setLyricsMode("auto")}
            >
              <LuSparkles size={12} /> Écrites par l&apos;IA
            </Button>
            <Button
              size="xs"
              rounded="full"
              variant={lyricsMode === "custom" ? "solid" : "ghost"}
              bg={lyricsMode === "custom" ? "paper.0" : "transparent"}
              color={lyricsMode === "custom" ? "ink.900" : "ink.500"}
              boxShadow={lyricsMode === "custom" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"}
              onClick={() => setLyricsMode("custom")}
            >
              <LuFileText size={12} /> Mes propres paroles
            </Button>
          </HStack>
        </Flex>

        {lyricsMode === "custom" && (
          <Textarea
            value={config.customLyrics || ""}
            onChange={(e) => set({ customLyrics: e.target.value })}
            rows={4}
            placeholder="[Couplet 1]&#10;Écrivez vos couplets ici...&#10;&#10;[Refrain]&#10;Écrivez votre refrain ici..."
            bg="paper.0"
            borderColor="paper.300"
            rounded="xl"
            fontSize="xs"
            fontFamily="monospace"
          />
        )}
      </Box>

      {/* Choix du genre musical */}
      <Box>
        <Label>Genre musical principal</Label>
        <Flex gap="2" wrap="wrap">
          {genres.slice(0, 14).map((g) => (
            <Chip key={g} active={config.genre === g} onClick={() => set({ genre: g })}>
              {g}
            </Chip>
          ))}
        </Flex>
      </Box>

      {/* Choix des humeurs */}
      <Box>
        <Label hint={`${config.moods.length}/${MAX_MOODS} choisies`}>Humeur & Ambiance</Label>
        <Flex gap="2" wrap="wrap">
          {moods.map((m) => (
            <Chip key={m} active={config.moods.includes(m)} onClick={() => toggleMood(m)}>
              {m}
            </Chip>
          ))}
        </Flex>
      </Box>

      {/* Tempo */}
      <Box>
        <Label hint={`${config.tempo} BPM`}>Tempo & Rythme</Label>
        <Slider.Root min={60} max={180} step={1} value={[config.tempo]} onValueChange={(e) => set({ tempo: e.value[0] })} aria-label={["Tempo"]}>
          <Slider.Control>
            <Slider.Track bg="paper.300" h="2">
              <Slider.Range background={accent.primary} />
            </Slider.Track>
            <Slider.Thumb index={0} boxSize="5" bg="white" borderWidth="2px" borderColor="brand.violetDeep">
              <Slider.HiddenInput />
            </Slider.Thumb>
          </Slider.Control>
        </Slider.Root>
        <Flex justify="space-between" mt="2" fontSize="xs" color="ink.400">
          <Text>Lent (Ballade)</Text>
          <Text>Rapide (Club / Danse)</Text>
        </Flex>
      </Box>

      {/* Durée */}
      <Box>
        <Label>Durée du morceau</Label>
        <Flex gap="2" wrap="wrap">
          {durations.map((d) => (
            <Chip key={d.value} active={config.duration === d.value} onClick={() => set({ duration: d.value })}>
              {d.label}
            </Chip>
          ))}
        </Flex>
      </Box>

      {/* Options Voix et Paroles */}
      <Stack gap="3">
        {[
          { key: "vocals", label: "Voix chantée (désactiver pour une version 100% instrumentale)" },
        ].map((o) => (
          <Switch.Root key={o.key} checked={config[o.key]} onCheckedChange={(e) => set({ [o.key]: e.checked })} colorPalette="purple">
            <Switch.HiddenInput />
            <Switch.Control />
            <Switch.Label fontFamily="ui" color="ink.700" fontSize="sm">
              {o.label}
            </Switch.Label>
          </Switch.Root>
        ))}
      </Stack>

      {/* Pied de formulaire avec bouton d'action et coût en Notes */}
      <HStack justify="space-between" gap="4" wrap="wrap" pt="2" borderTopWidth="1px" borderColor="paper.200">
        <HStack gap="1.5">
          <Text fontSize="lg">🎵</Text>
          <Box>
            <Text fontSize="xs" fontFamily="ui" fontWeight="700" color="ink.900">
              Coût de génération : 2 Notes
            </Text>
            <Text fontSize="2xs" color={hasEnoughNotes ? "ink.400" : "red.500"}>
              {hasEnoughNotes ? `Solde après création : ${notes - 2} Notes` : `Solde insuffisant (${notes} Notes disponibles)`}
            </Text>
          </Box>
        </HStack>

        {!hasEnoughNotes ? (
          <Button
            size="lg"
            rounded="full"
            px="7"
            fontFamily="ui"
            fontWeight="700"
            color="white"
            background={accent.primary}
            onClick={onOpenRecharge}
            _hover={{ transform: "translateY(-1px)", boxShadow: "0 6px 20px rgba(124, 58, 237, 0.3)" }}
            transition="all 0.2s"
          >
            <LuZap /> Recharger des Notes (2 requises)
          </Button>
        ) : (
          <Button
            size="xl"
            rounded="full"
            px="8"
            fontFamily="ui"
            fontWeight="600"
            color="white"
            background={accent.primary}
            disabled={!canGenerate}
            opacity={canGenerate ? 1 : 0.5}
            onClick={onGenerate}
            _hover={{ transform: canGenerate ? "translateY(-2px)" : "none", boxShadow: "0 6px 20px rgba(124, 58, 237, 0.35)" }}
            transition="all 0.25s"
          >
            <LuWandSparkles /> {busy ? "Création IA en cours…" : "Générer ma musique (2 Notes)"}
          </Button>
        )}
      </HStack>
    </Stack>
  );
}
