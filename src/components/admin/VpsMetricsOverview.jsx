"use client";

import { useEffect, useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Input,
  Progress,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import {
  LuActivity,
  LuArrowDown,
  LuArrowUp,
  LuArrowUpRight,
  LuCheck,
  LuChevronDown,
  LuClock,
  LuCoins,
  LuCopy,
  LuCpu,
  LuDatabase,
  LuDownload,
  LuExternalLink,
  LuFlame,
  LuGlobe,
  LuHardDrive,
  LuLayers,
  LuLock,
  LuPlay,
  LuPower,
  LuRefreshCw,
  LuRotateCcw,
  LuSearch,
  LuServer,
  LuShieldAlert,
  LuShieldCheck,
  LuSlidersHorizontal,
  LuTerminal,
  LuTrash2,
  LuWifi,
  LuZap,
} from "react-icons/lu";

import { api } from "@/lib/apiClient";
import { formatMetric } from "@/lib/formatters";
import { ShimmerCard } from "@/components/common/Shimmer";
import { LucideAlertTriangle, LucideCheckCircle2 } from "lucide-react";

export default function VpsMetricsOverview() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(10); // secondes (0 = pause)
  const [toastMessage, setToastMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Filtres logs
  const [logFilter, setLogFilter] = useState("ALL");
  const [logSearch, setLogSearch] = useState("");
  const [autoScrollLogs, setAutoScrollLogs] = useState(true);
  const terminalEndRef = useRef(null);

  // Modals & Panels
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showRebootModal, setShowRebootModal] = useState(false);
  const [rebootConfirmationText, setRebootConfirmationText] = useState("");
  const [copiedIp, setCopiedIp] = useState(false);

  // Configuration Hostinger Form
  const [configForm, setConfigForm] = useState({
    apiToken: "",
    vpsId: "vps-784291",
    datacenter: "Paris, France (FR-01)",
    plan: "Hostinger KVM 2",
    publicIp: "185.193.124.62",
    ipv6: "2a02:4780:11:1042::1",
    cpuThreshold: 85,
    ramThreshold: 90,
    diskThreshold: 85,
  });
  const [isTestingToken, setIsTestingToken] = useState(false);
  const [tokenTestFeedback, setTokenTestFeedback] = useState(null);

  const notify = (msg, type = "success") => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadMetrics = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await api.get("/api/admin/vps");
      if (res?.success) {
        setData(res);
        if (res.hostinger) {
          setConfigForm((prev) => ({
            ...prev,
            vpsId: res.hostinger.vpsId || prev.vpsId,
            datacenter: res.hostinger.datacenter || prev.datacenter,
            plan: res.hostinger.plan || prev.plan,
            publicIp: res.hostinger.publicIp || prev.publicIp,
            ipv6: res.hostinger.ipv6 || prev.ipv6,
          }));
        }
      }
    } catch (err) {
      console.warn("[VpsMetricsOverview] Erreur chargement:", err.message);
      if (isManual) {
        notify("Erreur lors de la synchronisation des métriques VPS.", "error");
      }
    } finally {
      setIsLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  // Gestion du timer de rafraîchissement automatique
  useEffect(() => {
    if (!autoRefreshInterval || autoRefreshInterval <= 0) return;
    const interval = setInterval(() => {
      loadMetrics(false);
    }, autoRefreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshInterval]);

  // Scroll automatique du terminal
  useEffect(() => {
    if (autoScrollLogs && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [data?.logs, autoScrollLogs]);

  // Copie de l'IP dans le presse-papier
  const handleCopyIp = (ip) => {
    if (!ip) return;
    navigator.clipboard.writeText(ip);
    setCopiedIp(true);
    notify(`Adresse IP ${ip} copiée dans le presse-papier.`);
    setTimeout(() => setCopiedIp(false), 2500);
  };

  // Actions de contrôle
  const handleExecuteAction = async (action, payload = {}) => {
    setActionLoading(action);
    try {
      const res = await api.post("/api/admin/vps", { action, payload });
      if (res?.success) {
        notify(res.message || "Action exécutée avec succès.");
        await loadMetrics(false);
      } else {
        notify(res?.error || "Erreur lors de l'exécution de l'action.", "error");
      }
    } catch (err) {
      notify(`Erreur: ${err.message}`, "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Test du token Hostinger
  const handleTestHostingerToken = async () => {
    setIsTestingToken(true);
    setTokenTestFeedback(null);
    try {
      const res = await api.post("/api/admin/vps", {
        action: "test_hostinger_connection",
        payload: { apiToken: configForm.apiToken },
      });
      if (res?.success) {
        setTokenTestFeedback({ type: "success", text: res.message });
      } else {
        setTokenTestFeedback({ type: "error", text: res.error || "Token non reconnu par Hostinger Cloud." });
      }
    } catch (err) {
      setTokenTestFeedback({ type: "error", text: err.message });
    } finally {
      setIsTestingToken(false);
    }
  };

  // Sauvegarde configuration Hostinger
  const handleSaveConfig = async () => {
    setActionLoading("save_config");
    try {
      const res = await api.post("/api/admin/vps", {
        action: "save_hostinger_config",
        payload: configForm,
      });
      if (res?.success) {
        notify("Configuration Hostinger Cloud enregistrée.");
        setShowConfigModal(false);
        await loadMetrics(false);
      } else {
        notify(res?.error || "Erreur de sauvegarde", "error");
      }
    } catch (err) {
      notify(`Erreur: ${err.message}`, "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Exécution du reboot confirmé
  const handleConfirmReboot = async () => {
    if (rebootConfirmationText.trim().toUpperCase() !== "REBOOT") {
      notify("Veuillez saisir 'REBOOT' pour confirmer l'ordre.", "error");
      return;
    }
    setShowRebootModal(false);
    setRebootConfirmationText("");
    await handleExecuteAction("reboot_vps", { reason: "Redémarrage ordonné par l'administrateur meloStart" });
  };

  // Export des logs en fichier texte
  const handleExportLogs = () => {
    if (!data?.logs?.length) return;
    const textContent = data.logs
      .map((l) => `[${l.timestamp}] [${l.service}] [${l.level}] ${l.message}`)
      .join("\n");
    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vps_hostinger_logs_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    notify("Fichier de logs téléchargé avec succès.");
  };

  // Données filtrées pour les logs
  const filteredLogs = (data?.logs || []).filter((l) => {
    if (logFilter !== "ALL" && !l.service.toUpperCase().includes(logFilter.toUpperCase())) {
      return false;
    }
    if (logSearch.trim()) {
      const q = logSearch.toLowerCase();
      return (
        l.message.toLowerCase().includes(q) ||
        l.service.toLowerCase().includes(q) ||
        l.level.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const cpu = data?.metrics?.cpu || { usagePercent: 24, coreCount: 2, model: "Hostinger KVM AMD EPYC", cores: [] };
  const memory = data?.metrics?.memory || { totalGb: 8, usedGb: 2.8, freeGb: 5.2, cachedGb: 1.4, usagePercent: 35 };
  const disk = data?.metrics?.disk || { totalGb: 100, usedGb: 34.8, freeGb: 65.2, usagePercent: 35, breakdown: [] };
  const hostinger = data?.hostinger || {};
  const server = data?.server || {};

  // Détection des alertes de seuil
  const isCpuCritical = cpu.usagePercent >= configForm.cpuThreshold;
  const isRamCritical = memory.usagePercent >= configForm.ramThreshold;
  const isDiskCritical = disk.usagePercent >= configForm.diskThreshold;
  const hasCriticalAlert = isCpuCritical || isRamCritical || isDiskCritical;

  return (
    <Stack gap="7" position="relative">
      {/* ========================================================= */}
      {/* BANDEAU TOAST NOTIFICATION FLOTTANT */}
      {/* ========================================================= */}
      {toastMessage && (
        <Box
          position="fixed"
          top="24px"
          right="24px"
          zIndex="1000"
          bg={toastMessage.type === "error" ? "red.600" : "ink.900"}
          color="white"
          px="5"
          py="3.5"
          rounded="2xl"
          boxShadow="0 10px 30px rgba(0,0,0,0.25)"
          display="flex"
          alignItems="center"
          gap="3"
          animation="fadeIn 0.2s ease-out"
        >
          {toastMessage.type === "error" ? <LucideAlertTriangle size={18} /> : <LucideCheckCircle2 size={18} />}
          <Text fontSize="sm" fontWeight="600">
            {toastMessage.text}
          </Text>
        </Box>
      )}

      {/* ========================================================= */}
      {/* EN-TÊTE PRINCIPAL : TITRE, BADGE CLOUD & BOUTONS D'ACTION */}
      {/* ========================================================= */}
      <Flex
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        align={{ base: "flex-start", md: "center" }}
        gap="4"
        bg="paper.0"
        p={{ base: "5", lg: "6" }}
        rounded="2xl"
        border="1px solid"
        borderColor="paper.200"
        boxShadow="0 1px 3px rgba(0,0,0,0.02)"
      >
        <Stack gap="1.5">
          <HStack gap="3" flexWrap="wrap">
            <Box
              w="36px"
              h="36px"
              rounded="xl"
              bg="brand.violetTint"
              color="brand.violetDeep"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <LuServer size={20} />
            </Box>
            <Text fontFamily="heading" fontWeight="800" fontSize={{ base: "xl", md: "2xl" }} letterSpacing="-0.03em">
              Serveur VPS Hostinger
            </Text>
            <Badge
              bg="green.50"
              color="green.700"
              px="2.5"
              py="1"
              rounded="full"
              fontWeight="700"
              fontSize="xs"
              display="inline-flex"
              alignItems="center"
              gap="1.5"
              border="1px solid"
              borderColor="green.200"
            >
              <Box w="7px" h="7px" rounded="full" bg="green.500" className="animate-pulse" />
              {server.status || "EN LIGNE"}
            </Badge>

            <Badge
              bg="purple.50"
              color="purple.700"
              px="2.5"
              py="1"
              rounded="full"
              fontWeight="700"
              fontSize="xs"
              border="1px solid"
              borderColor="purple.200"
            >
              {hostinger.plan || "Hostinger KVM 2"}
            </Badge>
          </HStack>

          <Text color="ink.500" fontSize="sm">
            Supervision temps réel, contrôle des ressources hardware, services de la stack meloStart et actions système.
          </Text>
        </Stack>

        {/* Contrôles interactifs d'actualisation et d'action */}
        <HStack gap="2.5" flexWrap="wrap">
          {/* Sélecteur de rafraîchissement auto */}
          <HStack
            bg="paper.100"
            px="2.5"
            py="1"
            rounded="xl"
            border="1px solid"
            borderColor="paper.200"
            gap="1.5"
          >
            <LuActivity size={14} color="#7c3aed" />
            <Text fontSize="xs" fontWeight="600" color="ink.600">
              Auto:
            </Text>
            {[
              { label: "5s", val: 5 },
              { label: "10s", val: 10 },
              { label: "30s", val: 30 },
              { label: "Pause", val: 0 },
            ].map((opt) => (
              <Button
                key={opt.val}
                size="2xs"
                variant={autoRefreshInterval === opt.val ? "solid" : "ghost"}
                bg={autoRefreshInterval === opt.val ? "brand.violetDeep" : "transparent"}
                color={autoRefreshInterval === opt.val ? "white" : "ink.700"}
                rounded="lg"
                px="2"
                h="22px"
                fontSize="11px"
                fontWeight="700"
                onClick={() => {
                  setAutoRefreshInterval(opt.val);
                  notify(`Rafraîchissement automatique réglé sur : ${opt.label}`);
                }}
              >
                {opt.label}
              </Button>
            ))}
          </HStack>

          {/* Bouton d'actualisation manuelle */}
          <Button
            variant="outline"
            size="sm"
            rounded="xl"
            borderColor="paper.300"
            color="ink.700"
            onClick={() => loadMetrics(true)}
            loading={isRefreshing}
            _hover={{ bg: "paper.100" }}
          >
            <HStack gap="2">
              <LuRefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
              <Text fontSize="xs">Actualiser</Text>
            </HStack>
          </Button>

          {/* Bouton Configuration Hostinger Cloud */}
          <Button
            variant="outline"
            size="sm"
            rounded="xl"
            borderColor="paper.300"
            color="ink.700"
            onClick={() => setShowConfigModal(true)}
            _hover={{ bg: "paper.100" }}
          >
            <HStack gap="2">
              <LuSlidersHorizontal size={14} />
              <Text fontSize="xs">Configuration</Text>
            </HStack>
          </Button>

          {/* Bouton Redémarrer le VPS */}
          <Button
            size="sm"
            rounded="xl"
            bg="red.600"
            color="white"
            _hover={{ bg: "red.700" }}
            onClick={() => setShowRebootModal(true)}
          >
            <HStack gap="2">
              <LuPower size={14} />
              <Text fontSize="xs" fontWeight="700">
                Redémarrer VPS
              </Text>
            </HStack>
          </Button>
        </HStack>
      </Flex>

      {/* ========================================================= */}
      {/* BANDEAU D'ALERTE DE RESSOURCE CRITIQUE (SI DÉPASSEMENT) */}
      {/* ========================================================= */}
      {hasCriticalAlert && (
        <Box
          p="4"
          rounded="2xl"
          bg="red.50"
          border="1px solid"
          borderColor="red.300"
          color="red.900"
        >
          <HStack justify="space-between" align="center" flexWrap="wrap" gap="2">
            <HStack gap="3">
              <Box p="2" rounded="xl" bg="red.100" color="red.700">
                <LucideAlertTriangle size={20} />
              </Box>
              <Stack gap="0.5">
                <Text fontWeight="800" fontSize="sm">
                  Attention : Surcharge détectée sur votre VPS Hostinger
                </Text>
                <Text fontSize="xs" color="red.700">
                  {isCpuCritical && `• CPU à ${cpu.usagePercent}% (seuil: ${configForm.cpuThreshold}%) `}
                  {isRamCritical && `• RAM à ${memory.usagePercent}% (seuil: ${configForm.ramThreshold}%) `}
                  {isDiskCritical && `• Disque NVMe à ${disk.usagePercent}% (seuil: ${configForm.diskThreshold}%)`}
                </Text>
              </Stack>
            </HStack>
            <Button
              size="xs"
              colorPalette="red"
              variant="solid"
              rounded="xl"
              onClick={() => handleExecuteAction("purge_ram")}
              loading={actionLoading === "purge_ram"}
            >
              Vider le cache d'urgence
            </Button>
          </HStack>
        </Box>
      )}

      {/* ========================================================= */}
      {/* BANDEAU CARACTÉRISTIQUES HOSTINGER & LOCALISATION */}
      {/* ========================================================= */}
      <Box
        p="4"
        bg="paper.0"
        rounded="2xl"
        border="1px solid"
        borderColor="paper.200"
      >
        <SimpleGrid columns={{ base: 2, sm: 3, lg: 6 }} gap="4">
          {/* Datacenter */}
          <Stack gap="1">
            <Text fontSize="11px" fontWeight="700" color="ink.400" textTransform="uppercase">
              Datacenter Hostinger
            </Text>
            <HStack gap="1.5">
              <Text fontSize="sm">🇫🇷</Text>
              <Text fontSize="sm" fontWeight="700" color="ink.800" isTruncated>
                {hostinger.datacenter || "Paris (FR-01)"}
              </Text>
            </HStack>
          </Stack>

          {/* IPv4 Publique */}
          <Stack gap="1">
            <Text fontSize="11px" fontWeight="700" color="ink.400" textTransform="uppercase">
              Adresse IPv4
            </Text>
            <HStack gap="1.5">
              <Text fontSize="sm" fontWeight="700" color="brand.violetDeep" fontFamily="mono">
                {hostinger.publicIp || "185.193.124.62"}
              </Text>
              <IconButton
                size="2xs"
                variant="ghost"
                aria-label="Copier IP"
                onClick={() => handleCopyIp(hostinger.publicIp || "185.193.124.62")}
              >
                {copiedIp ? <LuCheck size={12} color="#16a34a" /> : <LuCopy size={12} />}
              </IconButton>
            </HStack>
          </Stack>

          {/* Distribution & Noyau */}
          <Stack gap="1">
            <Text fontSize="11px" fontWeight="700" color="ink.400" textTransform="uppercase">
              Système & Noyau
            </Text>
            <Text fontSize="sm" fontWeight="700" color="ink.800" isTruncated title={server.distro}>
              {server.distro || "Ubuntu 22.04 LTS"}
            </Text>
          </Stack>

          {/* Uptime */}
          <Stack gap="1">
            <Text fontSize="11px" fontWeight="700" color="ink.400" textTransform="uppercase">
              Temps d'activité (Uptime)
            </Text>
            <HStack gap="1.5">
              <LuClock size={14} color="#7c3aed" />
              <Text fontSize="sm" fontWeight="700" color="ink.800">
                {server.uptime?.formatted || "0j 0h 0m"}
              </Text>
            </HStack>
          </Stack>

          {/* Virtualisation */}
          <Stack gap="1">
            <Text fontSize="11px" fontWeight="700" color="ink.400" textTransform="uppercase">
              Architecture
            </Text>
            <Text fontSize="sm" fontWeight="700" color="ink.800">
              KVM • x86_64
            </Text>
          </Stack>

          {/* Snapshots Sauvegardes */}
          <Stack gap="1">
            <Text fontSize="11px" fontWeight="700" color="ink.400" textTransform="uppercase">
              Snapshots Hostinger
            </Text>
            <HStack gap="1.5">
              <Badge colorPalette="green" size="sm" rounded="full">
                {hostinger.snapShotsCount || 2} Actifs
              </Badge>
              <Text fontSize="xs" color="ink.500">
                ({hostinger.lastSnapshotDate || "Récents"})
              </Text>
            </HStack>
          </Stack>
        </SimpleGrid>
      </Box>

      {/* ========================================================= */}
      {/* 4 GRANDES JAUGES HARDWARE : CPU, RAM, NVMe & BANDE PASSANTE */}
      {/* ========================================================= */}
      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap="5">
        {/* CARTE 1 : CPU / PROCESSEUR */}
        <Box
          p="5"
          rounded="2xl"
          bg="paper.0"
          border="1px solid"
          borderColor={isCpuCritical ? "red.400" : "paper.200"}
          boxShadow="0 1px 3px rgba(0,0,0,0.02)"
          position="relative"
          overflow="hidden"
        >
          <Flex justify="space-between" align="flex-start" mb="3">
            <Stack gap="0.5">
              <Text fontSize="xs" fontWeight="700" color="ink.500" textTransform="uppercase" letterSpacing="0.05em">
                Charge Processeur
              </Text>
              <Text fontSize="11px" color="ink.400" isTruncated maxW="180px">
                {cpu.model}
              </Text>
            </Stack>
            <Box p="2.5" rounded="xl" bg="purple.50" color="brand.violetDeep">
              <LuCpu size={20} />
            </Box>
          </Flex>

          <HStack align="baseline" gap="2" mb="2">
            <Text fontFamily="heading" fontWeight="800" fontSize="3xl" letterSpacing="-0.03em">
              {cpu.usagePercent}%
            </Text>
            <Text fontSize="xs" color="ink.500" fontWeight="600">
              sur {cpu.coreCount} vCPU @ {cpu.speed}
            </Text>
          </HStack>

          {/* Jauge globale de charge */}
          <Box w="full" h="8px" bg="paper.200" rounded="full" overflow="hidden" mb="3">
            <Box
              h="full"
              w={`${cpu.usagePercent}%`}
              bg={cpu.usagePercent > 80 ? "red.500" : cpu.usagePercent > 60 ? "orange.500" : "brand.violetDeep"}
              rounded="full"
              transition="width 0.4s ease-out"
            />
          </Box>

          {/* Détail par Cœur vCPU */}
          <Stack gap="2" pt="2" borderTop="1px solid" borderColor="paper.100">
            <Text fontSize="11px" fontWeight="700" color="ink.400" textTransform="uppercase">
              Répartition par cœur
            </Text>
            <SimpleGrid columns={cpu.coreCount > 2 ? 4 : 2} gap="2">
              {(cpu.cores || []).map((core) => (
                <Box key={core.id} p="2" bg="paper.50" rounded="xl" border="1px solid" borderColor="paper.200">
                  <Flex justify="space-between" align="center" mb="1">
                    <Text fontSize="10px" fontWeight="700" color="ink.600">
                      Core {core.id}
                    </Text>
                    <Text fontSize="10px" fontWeight="800" color="brand.violetDeep">
                      {core.usagePercent}%
                    </Text>
                  </Flex>
                  <Box w="full" h="4px" bg="paper.200" rounded="full" overflow="hidden">
                    <Box
                      h="full"
                      w={`${core.usagePercent}%`}
                      bg={core.usagePercent > 80 ? "red.500" : "brand.violet"}
                      rounded="full"
                    />
                  </Box>
                </Box>
              ))}
            </SimpleGrid>

            {/* Load Average */}
            <HStack justify="space-between" pt="1" fontSize="11px" color="ink.500">
              <Text fontWeight="600">Load Average :</Text>
              <Text fontFamily="mono" fontWeight="700">
                {cpu.loadAvg?.join(" • ") || "0.42 • 0.38 • 0.31"}
              </Text>
            </HStack>
          </Stack>
        </Box>

        {/* CARTE 2 : MÉMOIRE RAM & SWAP */}
        <Box
          p="5"
          rounded="2xl"
          bg="paper.0"
          border="1px solid"
          borderColor={isRamCritical ? "red.400" : "paper.200"}
          boxShadow="0 1px 3px rgba(0,0,0,0.02)"
        >
          <Flex justify="space-between" align="flex-start" mb="3">
            <Stack gap="0.5">
              <Text fontSize="xs" fontWeight="700" color="ink.500" textTransform="uppercase" letterSpacing="0.05em">
                Mémoire Vive (RAM)
              </Text>
              <Text fontSize="11px" color="ink.400">
                {memory.usedGb} Go utilisés sur {memory.totalGb} Go
              </Text>
            </Stack>
            <Box p="2.5" rounded="xl" bg="blue.50" color="blue.600">
              <LuActivity size={20} />
            </Box>
          </Flex>

          <HStack align="baseline" gap="2" mb="2">
            <Text fontFamily="heading" fontWeight="800" fontSize="3xl" letterSpacing="-0.03em">
              {memory.usagePercent}%
            </Text>
            <Text fontSize="xs" color="ink.500" fontWeight="600">
              {memory.freeGb} Go libres
            </Text>
          </HStack>

          {/* Jauge RAM composite */}
          <Box w="full" h="8px" bg="paper.200" rounded="full" overflow="hidden" mb="3">
            <Box
              h="full"
              w={`${memory.usagePercent}%`}
              bg={memory.usagePercent > 85 ? "red.500" : "blue.500"}
              rounded="full"
              transition="width 0.4s ease-out"
            />
          </Box>

          <Stack gap="2.5" pt="2" borderTop="1px solid" borderColor="paper.100">
            <Flex justify="space-between" fontSize="11px" color="ink.600">
              <Text>Cache & Tampons noyau :</Text>
              <Text fontWeight="700">{memory.cachedGb} Go</Text>
            </Flex>
            <Flex justify="space-between" fontSize="11px" color="ink.600">
              <Text>Partition Swap (2 Go) :</Text>
              <Text fontWeight="700">
                {memory.swap?.usedGb} Go ({memory.swap?.usagePercent}%)
              </Text>
            </Flex>
            <Flex justify="space-between" fontSize="11px" color="ink.600">
              <Text>Processus Next.js meloStart :</Text>
              <Text fontWeight="700">{memory.nodeProcess?.rssMb} Mo RSS</Text>
            </Flex>

            {/* Bouton d'action pour purger le cache RAM */}
            <Button
              size="xs"
              variant="outline"
              borderColor="paper.300"
              color="ink.800"
              rounded="xl"
              mt="1"
              w="full"
              onClick={() => handleExecuteAction("purge_ram")}
              loading={actionLoading === "purge_ram"}
              _hover={{ bg: "paper.100" }}
            >
              <HStack gap="1.5">
                <LuRotateCcw size={12} />
                <Text fontSize="11px" fontWeight="700">
                  Vider Cache RAM (drop_caches)
                </Text>
              </HStack>
            </Button>
          </Stack>
        </Box>

        {/* CARTE 3 : DISQUE NVMe SSD */}
        <Box
          p="5"
          rounded="2xl"
          bg="paper.0"
          border="1px solid"
          borderColor={isDiskCritical ? "red.400" : "paper.200"}
          boxShadow="0 1px 3px rgba(0,0,0,0.02)"
        >
          <Flex justify="space-between" align="flex-start" mb="3">
            <Stack gap="0.5">
              <Text fontSize="xs" fontWeight="700" color="ink.500" textTransform="uppercase" letterSpacing="0.05em">
                Stockage NVMe SSD
              </Text>
              <Text fontSize="11px" color="ink.400">
                {disk.usedGb} Go occupés sur {disk.totalGb} Go
              </Text>
            </Stack>
            <Box p="2.5" rounded="xl" bg="cyan.50" color="cyan.600">
              <LuHardDrive size={20} />
            </Box>
          </Flex>

          <HStack align="baseline" gap="2" mb="2">
            <Text fontFamily="heading" fontWeight="800" fontSize="3xl" letterSpacing="-0.03em">
              {disk.usagePercent}%
            </Text>
            <Text fontSize="xs" color="green.600" fontWeight="700">
              {disk.freeGb} Go disponibles
            </Text>
          </HStack>

          {/* Jauge SSD */}
          <Box w="full" h="8px" bg="paper.200" rounded="full" overflow="hidden" mb="3">
            <Box
              h="full"
              w={`${disk.usagePercent}%`}
              bg={disk.usagePercent > 85 ? "red.500" : "cyan.500"}
              rounded="full"
              transition="width 0.4s ease-out"
            />
          </Box>

          <Stack gap="2.5" pt="2" borderTop="1px solid" borderColor="paper.100">
            <Flex justify="space-between" fontSize="11px" color="ink.600">
              <Text>Vitesse de lecture NVMe :</Text>
              <Text fontWeight="700">~{disk.readSpeedMbs} Mo/s</Text>
            </Flex>
            <Flex justify="space-between" fontSize="11px" color="ink.600">
              <Text>Vitesse d'écriture NVMe :</Text>
              <Text fontWeight="700">~{disk.writeSpeedMbs} Mo/s</Text>
            </Flex>
            <Flex justify="space-between" fontSize="11px" color="ink.600">
              <Text>IOPS estimées :</Text>
              <Text fontWeight="700">{formatMetric(disk.iops || 12500)} IOPS</Text>
            </Flex>

            {/* Bouton pour nettoyer logs et fichiers temp */}
            <Button
              size="xs"
              variant="outline"
              borderColor="paper.300"
              color="ink.800"
              rounded="xl"
              mt="1"
              w="full"
              onClick={() => handleExecuteAction("clean_temp_files")}
              loading={actionLoading === "clean_temp_files"}
              _hover={{ bg: "paper.100" }}
            >
              <HStack gap="1.5">
                <LuTrash2 size={12} />
                <Text fontSize="11px" fontWeight="700">
                  Nettoyer Fichiers Temp & Logs
                </Text>
              </HStack>
            </Button>
          </Stack>
        </Box>

        {/* CARTE 4 : RÉSEAU & BANDE PASSANTE HOSTINGER */}
        <Box
          p="5"
          rounded="2xl"
          bg="paper.0"
          border="1px solid"
          borderColor="paper.200"
          boxShadow="0 1px 3px rgba(0,0,0,0.02)"
        >
          <Flex justify="space-between" align="flex-start" mb="3">
            <Stack gap="0.5">
              <Text fontSize="xs" fontWeight="700" color="ink.500" textTransform="uppercase" letterSpacing="0.05em">
                Bande Passante Mensuelle
              </Text>
              <Text fontSize="11px" color="ink.400">
                {hostinger.bandwidth?.usedGb} Go / {hostinger.bandwidth?.totalGb} Go inclus
              </Text>
            </Stack>
            <Box p="2.5" rounded="xl" bg="green.50" color="green.600">
              <LuWifi size={20} />
            </Box>
          </Flex>

          <HStack align="baseline" gap="2" mb="2">
            <Text fontFamily="heading" fontWeight="800" fontSize="3xl" letterSpacing="-0.03em">
              {hostinger.bandwidth?.percent || 20.9}%
            </Text>
            <Text fontSize="xs" color="ink.500" fontWeight="600">
              consommés ce mois-ci
            </Text>
          </HStack>

          {/* Jauge Bande Passante */}
          <Box w="full" h="8px" bg="paper.200" rounded="full" overflow="hidden" mb="3">
            <Box
              h="full"
              w={`${hostinger.bandwidth?.percent || 20}%`}
              bg="green.500"
              rounded="full"
              transition="width 0.4s ease-out"
            />
          </Box>

          <Stack gap="2.5" pt="2" borderTop="1px solid" borderColor="paper.100">
            <Flex justify="space-between" fontSize="11px" color="ink.600">
              <HStack gap="1">
                <LuArrowDown size={12} color="#16a34a" />
                <Text>Débit Descendant (In) :</Text>
              </HStack>
              <Text fontWeight="700">{hostinger.bandwidth?.currentInSpeedKbs || 184} Ko/s</Text>
            </Flex>
            <Flex justify="space-between" fontSize="11px" color="ink.600">
              <HStack gap="1">
                <LuArrowUp size={12} color="#2563eb" />
                <Text>Débit Montant (Out) :</Text>
              </HStack>
              <Text fontWeight="700">{hostinger.bandwidth?.currentOutSpeedKbs || 342} Ko/s</Text>
            </Flex>

            {/* Latence Passerelle */}
            <Flex justify="space-between" fontSize="11px" color="ink.600">
              <Text>Passerelle Hostinger :</Text>
              <Badge colorPalette="green" size="sm" rounded="full">
                8 ms
              </Badge>
            </Flex>

            {/* Bouton de test latence réseau */}
            <Button
              size="xs"
              variant="outline"
              borderColor="paper.300"
              color="ink.800"
              rounded="xl"
              mt="1"
              w="full"
              onClick={() => handleExecuteAction("test_ping")}
              loading={actionLoading === "test_ping"}
              _hover={{ bg: "paper.100" }}
            >
              <HStack gap="1.5">
                <LuZap size={12} />
                <Text fontSize="11px" fontWeight="700">
                  Tester la Latence Réseau
                </Text>
              </HStack>
            </Button>
          </Stack>
        </Box>
      </SimpleGrid>

      {/* ========================================================= */}
      {/* SECTION RÉPARTITION DU DISQUE & TEST DE LATENCE EN DIRECT */}
      {/* ========================================================= */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap="5">
        {/* Ventilation détaillée du stockage disque */}
        <Box
          p="5"
          rounded="2xl"
          bg="paper.0"
          border="1px solid"
          borderColor="paper.200"
        >
          <HStack justify="space-between" align="center" mb="4">
            <HStack gap="2">
              <LuHardDrive size={18} color="#0e7490" />
              <Text fontWeight="800" fontSize="sm" fontFamily="heading">
                Ventilation de l'espace NVMe ({disk.usedGb} Go utilisés)
              </Text>
            </HStack>
            <Badge bg="paper.100" color="ink.700" px="2" py="0.5" rounded="lg" fontSize="10px">
              Partitions Linux
            </Badge>
          </HStack>

          {/* Barre segmentée visuelle */}
          <Box w="full" h="10px" bg="paper.200" rounded="full" overflow="hidden" display="flex" mb="4">
            {(disk.breakdown || []).map((item, idx) => (
              <Box
                key={idx}
                h="full"
                w={`${(item.sizeGb / disk.totalGb) * 100}%`}
                bg={item.color}
                title={`${item.name}: ${item.sizeGb} Go`}
              />
            ))}
          </Box>

          <Stack gap="2.5">
            {(disk.breakdown || []).map((item, idx) => (
              <Flex key={idx} justify="space-between" align="center" fontSize="xs">
                <HStack gap="2">
                  <Box w="8px" h="8px" rounded="full" bg={item.color} />
                  <Text color="ink.800" fontWeight="600">
                    {item.name}
                  </Text>
                </HStack>
                <HStack gap="2">
                  <Text color="ink.500">
                    {((item.sizeGb / disk.totalGb) * 100).toFixed(1)}%
                  </Text>
                  <Text fontWeight="800" color="ink.900" fontFamily="mono">
                    {item.sizeGb} Go
                  </Text>
                </HStack>
              </Flex>
            ))}
          </Stack>
        </Box>

        {/* Latences Réseau vers les endpoints majeurs */}
        <Box
          p="5"
          rounded="2xl"
          bg="paper.0"
          border="1px solid"
          borderColor="paper.200"
        >
          <HStack justify="space-between" align="center" mb="4">
            <HStack gap="2">
              <LuGlobe size={18} color="#16a34a" />
              <Text fontWeight="800" fontSize="sm" fontFamily="heading">
                Sondes de Connectivité & Latences Réseau
              </Text>
            </HStack>
            <Badge colorPalette="green" size="sm" rounded="full">
              4/4 Nœuds Connectés
            </Badge>
          </HStack>

          <Stack gap="3">
            {(data?.metrics?.network?.latencies || [
              { name: "Hostinger Passerelle FR01", latencyMs: 8, status: "EXCELLENT" },
              { name: "Cloudflare DNS (1.1.1.1)", latencyMs: 12, status: "EXCELLENT" },
              { name: "Google Global DNS (8.8.8.8)", latencyMs: 14, status: "GOOD" },
              { name: "Suno AI API Gateway", latencyMs: 78, status: "GOOD" },
            ]).map((node, i) => (
              <Flex
                key={i}
                p="3"
                bg="paper.50"
                rounded="xl"
                border="1px solid"
                borderColor="paper.200"
                justify="space-between"
                align="center"
              >
                <HStack gap="2.5">
                  <Box w="8px" h="8px" rounded="full" bg="green.500" />
                  <Text fontSize="xs" fontWeight="700" color="ink.800">
                    {node.name}
                  </Text>
                </HStack>

                <HStack gap="2">
                  <Badge
                    bg={node.latencyMs < 30 ? "green.50" : "orange.50"}
                    color={node.latencyMs < 30 ? "green.700" : "orange.700"}
                    border="1px solid"
                    borderColor={node.latencyMs < 30 ? "green.200" : "orange.200"}
                    size="sm"
                    rounded="lg"
                    fontFamily="mono"
                    fontWeight="800"
                  >
                    {node.latencyMs} ms
                  </Badge>
                  <Text fontSize="11px" color="ink.500" fontWeight="600">
                    {node.latencyMs < 20 ? "Ultra-rapide" : "Stable"}
                  </Text>
                </HStack>
              </Flex>
            ))}
          </Stack>
        </Box>
      </SimpleGrid>

      {/* ========================================================= */}
      {/* SUPERVISION & CONTRÔLE DES SERVICES meloStart SUR LE VPS */}
      {/* ========================================================= */}
      <Box
        p={{ base: "5", lg: "6" }}
        rounded="2xl"
        bg="paper.0"
        border="1px solid"
        borderColor="paper.200"
      >
        <Flex justify="space-between" align="center" mb="5" flexWrap="wrap" gap="2">
          <Stack gap="0.5">
            <HStack gap="2">
              <LuLayers size={18} color="#7c3aed" />
              <Text fontWeight="800" fontSize="base" fontFamily="heading">
                Stack Logicielle & Services meloStart sur le VPS
              </Text>
            </HStack>
            <Text fontSize="xs" color="ink.500">
              Contrôlez l'état de santé, la mémoire et redémarrez les daemons critiques.
            </Text>
          </Stack>

          <Badge bg="brand.violetTint" color="brand.violetDeep" px="3" py="1" rounded="full" fontWeight="700" fontSize="xs">
            6 Services Actifs
          </Badge>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="4">
          {(data?.services || []).map((srv) => {
            const isOnline = srv.status === "ONLINE";

            return (
              <Box
                key={srv.id}
                p="4"
                rounded="2xl"
                bg="paper.50"
                border="1px solid"
                borderColor="paper.200"
                transition="all 0.2s"
                _hover={{ borderColor: "paper.300", bg: "paper.0" }}
              >
                <Flex justify="space-between" align="flex-start" mb="3">
                  <Stack gap="0.5">
                    <Text fontWeight="800" fontSize="sm" color="ink.900">
                      {srv.name}
                    </Text>
                    {srv.port && (
                      <Text fontSize="11px" color="ink.400" fontFamily="mono">
                        Port(s): {srv.port}
                      </Text>
                    )}
                  </Stack>

                  <Badge
                    bg={isOnline ? "green.50" : "orange.50"}
                    color={isOnline ? "green.700" : "orange.700"}
                    border="1px solid"
                    borderColor={isOnline ? "green.200" : "orange.200"}
                    size="sm"
                    rounded="full"
                    display="inline-flex"
                    alignItems="center"
                    gap="1"
                  >
                    <Box w="6px" h="6px" rounded="full" bg={isOnline ? "green.500" : "orange.500"} />
                    {srv.status}
                  </Badge>
                </Flex>

                {/* Métadonnées contextuelles du service */}
                <Stack gap="1.5" mb="4" fontSize="11px" color="ink.600">
                  {srv.id === "nextjs" && (
                    <>
                      <Flex justify="space-between">
                        <Text>PID Processus :</Text>
                        <Text fontWeight="700" fontFamily="mono">{srv.pid}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text>Mémoire Node.js :</Text>
                        <Text fontWeight="700">{srv.memoryMb} Mo</Text>
                      </Flex>
                    </>
                  )}

                  {srv.id === "postgresql" && (
                    <>
                      <Flex justify="space-between">
                        <Text>Latence ping DB :</Text>
                        <Text fontWeight="700" color="green.600">{srv.latencyMs} ms</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text>Taille base PostgreSQL :</Text>
                        <Text fontWeight="700">{srv.dbSizeFormatted}</Text>
                      </Flex>
                    </>
                  )}

                  {srv.id === "async_engine" && (
                    <>
                      <Flex justify="space-between">
                        <Text>Mode d'exécution :</Text>
                        <Text fontWeight="700" color="green.600">{srv.mode}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text>Pistes en cours (Polling) :</Text>
                        <Text fontWeight="700" color="brand.violetDeep">{srv.activeJobs} active(s)</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text>Webhooks finalisés :</Text>
                        <Text fontWeight="700">{srv.completedJobs} titres</Text>
                      </Flex>
                    </>
                  )}

                  {srv.id === "storage" && (
                    <>
                      <Flex justify="space-between">
                        <Text>Répertoire :</Text>
                        <Text fontWeight="700" fontFamily="mono">{srv.port}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text>Format :</Text>
                        <Text fontWeight="700">{srv.mode}</Text>
                      </Flex>
                    </>
                  )}

                  {srv.id === "nginx" && (
                    <>
                      <Flex justify="space-between">
                        <Text>Certificat Let's Encrypt :</Text>
                        <Text fontWeight="700" color="green.600">Valide ({srv.sslDaysRemaining}j restants)</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text>Protocole :</Text>
                        <Text fontWeight="700">{srv.protocol}</Text>
                      </Flex>
                    </>
                  )}

                  {srv.id === "security" && (
                    <>
                      <Flex justify="space-between">
                        <Text>IP bloquées (Fail2Ban) :</Text>
                        <Text fontWeight="700" color="red.600">{srv.bannedIpsCount} adresses</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text>Dernière inspection :</Text>
                        <Text fontWeight="700">{srv.lastScan}</Text>
                      </Flex>
                    </>
                  )}
                </Stack>

                {/* Bouton d'action sur le service */}
                {srv.canRestart && (
                  <Button
                    size="xs"
                    w="full"
                    variant="outline"
                    borderColor="paper.300"
                    color="ink.800"
                    rounded="xl"
                    onClick={() => handleExecuteAction("restart_service", { serviceId: srv.id })}
                    loading={actionLoading === "restart_service"}
                    _hover={{ bg: "paper.100" }}
                  >
                    <HStack gap="1.5">
                      <LuRefreshCw size={12} />
                      <Text fontSize="11px" fontWeight="700">
                        Relancer {srv.id.toUpperCase()}
                      </Text>
                    </HStack>
                  </Button>
                )}
              </Box>
            );
          })}
        </SimpleGrid>
      </Box>

      {/* ========================================================= */}
      {/* TABLEAU DES PROCESSUS ACTIFS (TOP PROCESSES SUR LE VPS) */}
      {/* ========================================================= */}
      <Box
        p={{ base: "5", lg: "6" }}
        rounded="2xl"
        bg="paper.0"
        border="1px solid"
        borderColor="paper.200"
      >
        <Flex justify="space-between" align="center" mb="4" flexWrap="wrap" gap="2">
          <HStack gap="2">
            <LuCpu size={18} color="#7c3aed" />
            <Text fontWeight="800" fontSize="base" fontFamily="heading">
              Gestionnaire des Processus VPS (Top CPU & RAM)
            </Text>
          </HStack>

          <Button
            size="xs"
            variant="outline"
            rounded="xl"
            borderColor="paper.300"
            color="ink.700"
            onClick={() => loadMetrics(true)}
            _hover={{ bg: "paper.100" }}
          >
            <HStack gap="1.5">
              <LuRefreshCw size={12} />
              <Text fontSize="11px">Rafraîchir les processus</Text>
            </HStack>
          </Button>
        </Flex>

        <Box overflowX="auto">
          <Table.Root size="sm" variant="outline">
            <Table.Header>
              <Table.Row bg="paper.50">
                <Table.ColumnHeader fontSize="11px" fontWeight="800" color="ink.600">
                  PID
                </Table.ColumnHeader>
                <Table.ColumnHeader fontSize="11px" fontWeight="800" color="ink.600">
                  COMMANDE / PROCESSUS
                </Table.ColumnHeader>
                <Table.ColumnHeader fontSize="11px" fontWeight="800" color="ink.600">
                  UTILISATEUR
                </Table.ColumnHeader>
                <Table.ColumnHeader fontSize="11px" fontWeight="800" color="ink.600" textAlign="right">
                  % CPU
                </Table.ColumnHeader>
                <Table.ColumnHeader fontSize="11px" fontWeight="800" color="ink.600" textAlign="right">
                  % RAM
                </Table.ColumnHeader>
                <Table.ColumnHeader fontSize="11px" fontWeight="800" color="ink.600" textAlign="center">
                  STATUT
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {(data?.processes || []).map((proc) => (
                <Table.Row key={proc.pid} _hover={{ bg: "paper.50" }}>
                  <Table.Cell fontFamily="mono" fontSize="11px" fontWeight="700" color="ink.600">
                    {proc.pid}
                  </Table.Cell>
                  <Table.Cell fontSize="xs" fontWeight="700" color="ink.900">
                    {proc.name}
                  </Table.Cell>
                  <Table.Cell fontSize="xs" color="ink.500">
                    {proc.user}
                  </Table.Cell>
                  <Table.Cell fontSize="xs" fontWeight="700" color="brand.violetDeep" textAlign="right">
                    {proc.cpuPercent}%
                  </Table.Cell>
                  <Table.Cell fontSize="xs" fontWeight="700" color="blue.600" textAlign="right">
                    {proc.memPercent}%
                  </Table.Cell>
                  <Table.Cell textAlign="center">
                    <Badge colorPalette="green" size="xs" rounded="full">
                      {proc.status}
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      </Box>

      {/* ========================================================= */}
      {/* TERMINAL & CONSOLE DES LOGS EN DIRECT */}
      {/* ========================================================= */}
      <Box
        p={{ base: "5", lg: "6" }}
        rounded="2xl"
        bg="paper.0"
        border="1px solid"
        borderColor="paper.200"
      >
        <Flex justify="space-between" align={{ base: "flex-start", sm: "center" }} mb="4" flexWrap="wrap" gap="3">
          <HStack gap="2.5">
            <Box p="2" rounded="xl" bg="paper.100" color="ink.900">
              <LuTerminal size={18} />
            </Box>
            <Stack gap="0.5">
              <Text fontWeight="800" fontSize="base" fontFamily="heading">
                Console des Logs Système & Événements Serveur
              </Text>
              <Text fontSize="xs" color="ink.500">
                Flux en direct de l'activité du serveur Hostinger et des daemons meloStart.
              </Text>
            </Stack>
          </HStack>

          <HStack gap="2">
            <Button
              size="xs"
              variant="outline"
              borderColor="paper.300"
              color="ink.700"
              rounded="xl"
              onClick={handleExportLogs}
              _hover={{ bg: "paper.100" }}
            >
              <HStack gap="1.5">
                <LuDownload size={12} />
                <Text fontSize="11px">Exporter (.txt)</Text>
              </HStack>
            </Button>

            <Button
              size="xs"
              variant={autoScrollLogs ? "solid" : "outline"}
              bg={autoScrollLogs ? "brand.violetDeep" : "transparent"}
              color={autoScrollLogs ? "white" : "ink.700"}
              borderColor="paper.300"
              rounded="xl"
              onClick={() => setAutoScrollLogs(!autoScrollLogs)}
            >
              Auto-Scroll: {autoScrollLogs ? "ON" : "OFF"}
            </Button>
          </HStack>
        </Flex>

        {/* Barre de filtres et recherche dans les logs */}
        <Flex justify="space-between" align="center" mb="3" flexWrap="wrap" gap="2">
          <HStack gap="1.5" flexWrap="wrap">
            {[
              { id: "ALL", label: "Tous" },
              { id: "HOSTINGER", label: "Hostinger" },
              { id: "NEXT", label: "Next.js" },
              { id: "POSTGRES", label: "PostgreSQL" },
              { id: "WEBHOOK", label: "Webhooks & Polling" },
              { id: "SECURITY", label: "Sécurité" },
            ].map((f) => (
              <Button
                key={f.id}
                size="2xs"
                variant={logFilter === f.id ? "solid" : "subtle"}
                bg={logFilter === f.id ? "ink.900" : "paper.100"}
                color={logFilter === f.id ? "white" : "ink.700"}
                rounded="lg"
                px="2.5"
                h="24px"
                fontSize="11px"
                fontWeight="700"
                onClick={() => setLogFilter(f.id)}
              >
                {f.label}
              </Button>
            ))}
          </HStack>

          <Box maxW="240px" w="full">
            <Input
              size="xs"
              rounded="xl"
              placeholder="Filtrer les messages..."
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              bg="paper.50"
              borderColor="paper.300"
            />
          </Box>
        </Flex>

        {/* Fenêtre terminal UNIX sombre */}
        <Box
          bg="#0f172a"
          color="#f8fafc"
          p="4"
          rounded="xl"
          maxH="320px"
          overflowY="auto"
          fontFamily="mono"
          fontSize="11px"
          lineHeight="1.7"
          border="1px solid #1e293b"
        >
          {filteredLogs.length === 0 ? (
            <Text color="#64748b" fontStyle="italic">
              Aucun événement ne correspond à ce filtre.
            </Text>
          ) : (
            filteredLogs.map((log, index) => {
              const isError = log.level === "ERROR" || log.message.toLowerCase().includes("fail");
              const isWarn = log.level === "WARN";
              const isSuccess = log.level === "SUCCESS";

              const color = isError
                ? "#f87171"
                : isWarn
                ? "#fbbf24"
                : isSuccess
                ? "#4ade80"
                : "#94a3b8";

              return (
                <Flex key={log.id || index} gap="2" align="baseline">
                  <Text color="#64748b" flexShrink={0}>
                    [{new Date(log.timestamp).toLocaleTimeString("fr-FR")}]
                  </Text>
                  <Text color="#38bdf8" fontWeight="700" flexShrink={0}>
                    [{log.service}]
                  </Text>
                  <Text color={color} wordBreak="break-word">
                    {log.message}
                  </Text>
                </Flex>
              );
            })
          )}
          <div ref={terminalEndRef} />
        </Box>
      </Box>

      {/* ========================================================= */}
      {/* MODAL CONFIGURATION HOSTINGER CLOUD API */}
      {/* ========================================================= */}
      {showConfigModal && (
        <Box
          position="fixed"
          inset="0"
          zIndex="1100"
          bg="rgba(0, 0, 0, 0.45)"
          backdropFilter="blur(6px)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="4"
        >
          <Box
            bg="paper.0"
            w="full"
            maxW="560px"
            p="6"
            rounded="3xl"
            border="1px solid"
            borderColor="paper.200"
            boxShadow="0 20px 40px rgba(0,0,0,0.2)"
            animation="fadeIn 0.2s ease-out"
          >
            <Flex justify="space-between" align="center" mb="4">
              <HStack gap="2.5">
                <Box p="2" rounded="xl" bg="purple.50" color="brand.violetDeep">
                  <LuSlidersHorizontal size={18} />
                </Box>
                <Text fontWeight="800" fontSize="lg" fontFamily="heading">
                  Paramètres du VPS Hostinger
                </Text>
              </HStack>
              <Button size="xs" variant="ghost" onClick={() => setShowConfigModal(false)}>
                ✕
              </Button>
            </Flex>

            <Stack gap="4">
              {/* Token API */}
              <Stack gap="1.5">
                <Text fontSize="xs" fontWeight="700" color="ink.700">
                  Jeton API Hostinger (HOSTINGER_API_TOKEN)
                </Text>
                <Input
                  size="sm"
                  rounded="xl"
                  type="password"
                  placeholder="Collez votre jeton généré dans Hostinger hPanel..."
                  value={configForm.apiToken}
                  onChange={(e) => setConfigForm({ ...configForm, apiToken: e.target.value })}
                />
                <Text fontSize="11px" color="ink.400">
                  Disponible dans votre espace Hostinger : Profil &rarr; Paramètres du compte &rarr; API.
                </Text>
              </Stack>

              {/* Testeur de jeton */}
              {configForm.apiToken && (
                <Button
                  size="xs"
                  variant="outline"
                  borderColor="paper.300"
                  onClick={handleTestHostingerToken}
                  loading={isTestingToken}
                  alignSelf="flex-start"
                >
                  Tester la validité du jeton
                </Button>
              )}

              {tokenTestFeedback && (
                <Box
                  p="3"
                  rounded="xl"
                  bg={tokenTestFeedback.type === "success" ? "green.50" : "red.50"}
                  color={tokenTestFeedback.type === "success" ? "green.800" : "red.800"}
                  fontSize="xs"
                  fontWeight="600"
                >
                  {tokenTestFeedback.text}
                </Box>
              )}

              {/* VPS ID & Plan */}
              <SimpleGrid columns={2} gap="3">
                <Stack gap="1">
                  <Text fontSize="xs" fontWeight="700" color="ink.700">
                    ID VPS Hostinger
                  </Text>
                  <Input
                    size="sm"
                    rounded="xl"
                    value={configForm.vpsId}
                    onChange={(e) => setConfigForm({ ...configForm, vpsId: e.target.value })}
                  />
                </Stack>
                <Stack gap="1">
                  <Text fontSize="xs" fontWeight="700" color="ink.700">
                    Plan Souscrit
                  </Text>
                  <Input
                    size="sm"
                    rounded="xl"
                    value={configForm.plan}
                    onChange={(e) => setConfigForm({ ...configForm, plan: e.target.value })}
                  />
                </Stack>
              </SimpleGrid>

              {/* Datacenter & IP */}
              <SimpleGrid columns={2} gap="3">
                <Stack gap="1">
                  <Text fontSize="xs" fontWeight="700" color="ink.700">
                    Emplacement Datacenter
                  </Text>
                  <Input
                    size="sm"
                    rounded="xl"
                    value={configForm.datacenter}
                    onChange={(e) => setConfigForm({ ...configForm, datacenter: e.target.value })}
                  />
                </Stack>
                <Stack gap="1">
                  <Text fontSize="xs" fontWeight="700" color="ink.700">
                    Adresse IPv4 Publique
                  </Text>
                  <Input
                    size="sm"
                    rounded="xl"
                    value={configForm.publicIp}
                    onChange={(e) => setConfigForm({ ...configForm, publicIp: e.target.value })}
                  />
                </Stack>
              </SimpleGrid>

              {/* Seuils d'alertes */}
              <Stack gap="1" pt="2" borderTop="1px solid" borderColor="paper.200">
                <Text fontSize="xs" fontWeight="700" color="ink.700">
                  Seuils d'Alerte Critique (%)
                </Text>
                <SimpleGrid columns={3} gap="3">
                  <Box>
                    <Text fontSize="11px" color="ink.500">Seuil CPU :</Text>
                    <Input
                      size="xs"
                      rounded="lg"
                      type="number"
                      value={configForm.cpuThreshold}
                      onChange={(e) => setConfigForm({ ...configForm, cpuThreshold: Number(e.target.value) })}
                    />
                  </Box>
                  <Box>
                    <Text fontSize="11px" color="ink.500">Seuil RAM :</Text>
                    <Input
                      size="xs"
                      rounded="lg"
                      type="number"
                      value={configForm.ramThreshold}
                      onChange={(e) => setConfigForm({ ...configForm, ramThreshold: Number(e.target.value) })}
                    />
                  </Box>
                  <Box>
                    <Text fontSize="11px" color="ink.500">Seuil Disque :</Text>
                    <Input
                      size="xs"
                      rounded="lg"
                      type="number"
                      value={configForm.diskThreshold}
                      onChange={(e) => setConfigForm({ ...configForm, diskThreshold: Number(e.target.value) })}
                    />
                  </Box>
                </SimpleGrid>
              </Stack>

              <HStack justify="flex-end" gap="2.5" pt="3">
                <Button size="sm" variant="outline" rounded="xl" onClick={() => setShowConfigModal(false)}>
                  Annuler
                </Button>
                <Button
                  size="sm"
                  rounded="xl"
                  bg="brand.violetDeep"
                  color="white"
                  onClick={handleSaveConfig}
                  loading={actionLoading === "save_config"}
                >
                  Enregistrer
                </Button>
              </HStack>
            </Stack>
          </Box>
        </Box>
      )}

      {/* ========================================================= */}
      {/* MODAL DE SÉCURITÉ POUR LE REDÉMARRAGE DU VPS */}
      {/* ========================================================= */}
      {showRebootModal && (
        <Box
          position="fixed"
          inset="0"
          zIndex="1100"
          bg="rgba(0, 0, 0, 0.5)"
          backdropFilter="blur(6px)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="4"
        >
          <Box
            bg="paper.0"
            w="full"
            maxW="480px"
            p="6"
            rounded="3xl"
            border="1px solid"
            borderColor="red.200"
            boxShadow="0 20px 40px rgba(0,0,0,0.25)"
            animation="fadeIn 0.2s ease-out"
          >
            <HStack gap="3" mb="3">
              <Box p="2.5" rounded="xl" bg="red.50" color="red.600">
                <LuPower size={22} />
              </Box>
              <Text fontWeight="800" fontSize="lg" fontFamily="heading" color="red.700">
                Confirmer le Redémarrage du VPS
              </Text>
            </HStack>

            <Text fontSize="sm" color="ink.700" mb="4">
              Attention : Le redémarrage va interrompre momentanément les requêtes HTTP et les flux audio pendant environ 30 à 60 secondes.
            </Text>

            <Box p="3" rounded="xl" bg="red.50" border="1px solid" borderColor="red.200" mb="4">
              <Text fontSize="xs" fontWeight="700" color="red.900" mb="2">
                Pour valider cette action irréversible, tapez "REBOOT" ci-dessous :
              </Text>
              <Input
                size="sm"
                rounded="xl"
                bg="white"
                borderColor="red.300"
                placeholder="REBOOT"
                value={rebootConfirmationText}
                onChange={(e) => setRebootConfirmationText(e.target.value)}
              />
            </Box>

            <HStack justify="flex-end" gap="2.5">
              <Button size="sm" variant="outline" rounded="xl" onClick={() => setShowRebootModal(false)}>
                Annuler
              </Button>
              <Button
                size="sm"
                rounded="xl"
                bg="red.600"
                color="white"
                _hover={{ bg: "red.700" }}
                onClick={handleConfirmReboot}
                loading={actionLoading === "reboot_vps"}
                disabled={rebootConfirmationText.trim().toUpperCase() !== "REBOOT"}
              >
                Confirmer le Redémarrage
              </Button>
            </HStack>
          </Box>
        </Box>
      )}
    </Stack>
  );
}
