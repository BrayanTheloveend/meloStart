"use client";

import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/react";
import {
  LuCheck,
  LuCpu,
  LuDollarSign,
  LuLock,
  LuSave,
  LuSettings,
  LuShieldAlert,
  LuWandSparkles,
  LuZap,
} from "react-icons/lu";

import { api } from "@/lib/apiClient";
import PricingSettingsManager from "@/components/admin/PricingSettingsManager";

const DEFAULT_SETTINGS = {
  costPerSong: 2,
  signupBonusNotes: 10,
  maxDurationSeconds: 180,
  defaultVocalType: "female",
  aiProvider: "suno_v6",
  maintenanceMode: false,
  allowRegistrations: true,
  freeTrialEnabled: true,
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const notify = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    api
      .get("/api/admin/settings")
      .then((res) => {
        if (res?.settings && Object.keys(res.settings).length > 0) {
          setSettings((prev) => ({
            ...prev,
            trackCostNotes: parseInt(res.settings.cost_per_track || prev.trackCostNotes, 10),
            signupBonusNotes: parseInt(res.settings.initial_signup_credits || prev.signupBonusNotes, 10),
            maintenanceMode: res.settings.maintenance_mode === "true",
            aiProvider: res.settings.ai_provider || prev.aiProvider,
          }));
        }
      })
      .catch((err) => console.warn("[Admin Settings] Erreur API:", err.message));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.post("/api/admin/settings", {
        cost_per_track: settings.trackCostNotes,
        initial_signup_credits: settings.signupBonusNotes,
        maintenance_mode: String(settings.maintenanceMode),
        ai_provider: settings.aiProvider,
      });
      notify("Paramètres sauvegardés avec succès en base de données.");
    } catch (err) {
      notify("Erreur lors de la sauvegarde : " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Stack gap="8">
      {toastMessage && (
        <Box
          position="fixed"
          bottom="6"
          right="6"
          zIndex="60"
          bg="ink.900"
          color="white"
          px="4"
          py="3"
          rounded="2xl"
          boxShadow="2xl"
          display="flex"
          alignItems="center"
          gap="2"
        >
          <LuCheck color="#10b981" />
          <Text fontSize="sm" fontWeight="600">
            {toastMessage}
          </Text>
        </Box>
      )}

      {/* En-tête */}
      <Flex direction={{ base: "column", sm: "row" }} justify="space-between" align={{ base: "flex-start", sm: "center" }} gap="4">
        <Stack gap="1">
          <HStack gap="2">
            <Text fontFamily="heading" fontWeight="800" fontSize={{ base: "2xl", md: "3xl" }} letterSpacing="-0.03em">
              Paramètres & Configuration de l'IA
            </Text>
            <Badge colorPalette="purple" size="sm" rounded="full" px="2">
              Contrôles Globaux
            </Badge>
          </HStack>
          <Text color="ink.500" fontSize="sm">
            Réglez les barèmes économiques en Notes, le fournisseur IA et le mode maintenance.
          </Text>
        </Stack>

        <Button
          size="sm"
          rounded="xl"
          bg="brand.violetDeep"
          color="white"
          onClick={handleSave}
          loading={isSaving}
        >
          <HStack gap="2">
            <LuSave size={14} />
            <Text>Enregistrer les modifications</Text>
          </HStack>
        </Button>
      </Flex>

      {/* 1. Barème Économique & Crédits */}
      <Box p="6" rounded="3xl" bg="paper.0" border="1px solid" borderColor="paper.200">
        <HStack gap="2.5" mb="4">
          <Box p="2" rounded="xl" bg="brand.violetTint" color="brand.violetDeep">
            <LuZap size={18} />
          </Box>
          <Text fontFamily="heading" fontWeight="700" fontSize="lg">
            Règles Économiques des Notes melostars
          </Text>
        </HStack>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap="6">
          <Stack gap="2">
            <Text fontSize="sm" fontWeight="600" color="ink.800">
              Coût en Notes par musique générée
            </Text>
            <Text fontSize="xs" color="ink.500">
              Nombre de notes débitées de manière atomique à chaque création. (Actuellement : {settings.costPerSong} Notes)
            </Text>
            <Input
              type="number"
              min={1}
              max={10}
              value={settings.costPerSong}
              onChange={(e) => setSettings({ ...settings, costPerSong: Number(e.target.value) })}
              rounded="xl"
              bg="paper.50"
              maxW="200px"
            />
          </Stack>

          <Stack gap="2">
            <Text fontSize="sm" fontWeight="600" color="ink.800">
              Notes offertes à l'inscription (Bonus de bienvenue)
            </Text>
            <Text fontSize="xs" color="ink.500">
              Solde initial accordé aux nouveaux utilisateurs inscrits (Actuellement : {settings.signupBonusNotes} Notes).
            </Text>
            <Input
              type="number"
              min={0}
              max={50}
              value={settings.signupBonusNotes}
              onChange={(e) => setSettings({ ...settings, signupBonusNotes: Number(e.target.value) })}
              rounded="xl"
              bg="paper.50"
              maxW="200px"
            />
          </Stack>
        </SimpleGrid>
      </Box>

      {/* 2. Grille Tarifaire & Packs de Notes (CRUD & Live Sync) */}
      <PricingSettingsManager onNotify={notify} />

      {/* 3. Moteur IA & Pipeline Audio */}
      <Box p="6" rounded="3xl" bg="paper.0" border="1px solid" borderColor="paper.200">
        <HStack gap="2.5" mb="4">
          <Box p="2" rounded="xl" bg="cyan.50" color="brand.cyanDeep">
            <LuCpu size={18} />
          </Box>
          <Text fontFamily="heading" fontWeight="700" fontSize="lg">
            Configuration du Pipeline IA
          </Text>
        </HStack>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap="6">
          <Stack gap="2">
            <Text fontSize="sm" fontWeight="600" color="ink.800">
              Mode d'exécution du moteur IA
            </Text>
            <Text fontSize="xs" color="ink.500">
              Basculez entre le mode Production (API IA externe) et le mode Simulation pour tests sans coût API.
            </Text>
            <HStack gap="3" mt="1">
              <Button
                size="sm"
                variant={settings.aiGenerationMode === "production" ? "solid" : "outline"}
                bg={settings.aiGenerationMode === "production" ? "brand.violetDeep" : undefined}
                color={settings.aiGenerationMode === "production" ? "white" : "ink.700"}
                rounded="xl"
                onClick={() => setSettings({ ...settings, aiGenerationMode: "production" })}
              >
                Production (API réelle)
              </Button>
              <Button
                size="sm"
                variant={settings.aiGenerationMode === "simulation" ? "solid" : "outline"}
                bg={settings.aiGenerationMode === "simulation" ? "brand.violetDeep" : undefined}
                color={settings.aiGenerationMode === "simulation" ? "white" : "ink.700"}
                rounded="xl"
                onClick={() => setSettings({ ...settings, aiGenerationMode: "simulation" })}
              >
                Simulation (Démo)
              </Button>
            </HStack>
          </Stack>

          <Stack gap="2">
            <Text fontSize="sm" fontWeight="600" color="ink.800">
              Durée maximale autorisée par musique
            </Text>
            <Text fontSize="xs" color="ink.500">
              Limite maximale de composition sonore en secondes (ex: 180s = 3 minutes).
            </Text>
            <Input
              type="number"
              min={30}
              max={300}
              step={30}
              value={settings.maxDurationSeconds}
              onChange={(e) => setSettings({ ...settings, maxDurationSeconds: Number(e.target.value) })}
              rounded="xl"
              bg="paper.50"
              maxW="200px"
            />
          </Stack>
        </SimpleGrid>
      </Box>

      {/* 3. Maintenance & Sécurité */}
      <Box p="6" rounded="3xl" bg="paper.0" border="1px solid" borderColor="paper.200">
        <HStack gap="2.5" mb="4">
          <Box p="2" rounded="xl" bg="red.50" color="red.600">
            <LuLock size={18} />
          </Box>
          <Text fontFamily="heading" fontWeight="700" fontSize="lg">
            Mode Maintenance & Accès
          </Text>
        </HStack>

        <Stack gap="4">
          <Flex justify="space-between" align="center" p="4" rounded="2xl" bg="paper.50" border="1px solid" borderColor="paper.200">
            <Stack gap="0.5">
              <Text fontSize="sm" fontWeight="700" color="ink.900">
                Mode Maintenance de la Plateforme
              </Text>
              <Text fontSize="xs" color="ink.500">
                Suspend temporairement les générations de musique sans déconnecter les utilisateurs existants.
              </Text>
            </Stack>
            <Button
              size="sm"
              variant={settings.maintenanceMode ? "solid" : "outline"}
              colorPalette={settings.maintenanceMode ? "red" : "gray"}
              rounded="xl"
              onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
            >
              {settings.maintenanceMode ? "Activé (En pause)" : "Désactivé (En ligne)"}
            </Button>
          </Flex>

          <Flex justify="space-between" align="center" p="4" rounded="2xl" bg="paper.50" border="1px solid" borderColor="paper.200">
            <Stack gap="0.5">
              <Text fontSize="sm" fontWeight="700" color="ink.900">
                Autoriser les nouvelles inscriptions
              </Text>
              <Text fontSize="xs" color="ink.500">
                Permet aux nouveaux utilisateurs de créer un compte via /register ou NextAuth.
              </Text>
            </Stack>
            <Button
              size="sm"
              variant={settings.allowRegistrations ? "solid" : "outline"}
              colorPalette={settings.allowRegistrations ? "green" : "red"}
              rounded="xl"
              onClick={() => setSettings({ ...settings, allowRegistrations: !settings.allowRegistrations })}
            >
              {settings.allowRegistrations ? "Ouvert à tous" : "Fermé"}
            </Button>
          </Flex>
        </Stack>
      </Box>
    </Stack>
  );
}
