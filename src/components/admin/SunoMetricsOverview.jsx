"use client";

import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Input,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { LuActivity, LuCheck, LuChevronDown, LuChevronUp, LuCoins, LuCpu, LuExternalLink, LuKey, LuMusic, LuRefreshCw, LuShieldAlert, LuTrendingUp } from "react-icons/lu";

import { api } from "@/lib/apiClient";
import { formatMetric } from "@/lib/formatters";
import { LucideAlertCircle } from "lucide-react";
import { Shimmer, ShimmerCard } from "@/components/common/Shimmer";

/**
 * Vue globale et métriques en direct du compte Suno API (sunoapi.org) pour le dashboard /dashboard/tracks.
 *
 * @param {Object} props
 * @param {Function} [props.onSelectStatus] - Callback pour filtrer la table des pistes (ex: "FAILED", "PROCESSING")
 * @param {string} [props.activeStatus] - Filtre de statut actif
 * @param {Function} [props.onNotify] - Callback de notification toast
 */
export default function SunoMetricsOverview({
  onSelectStatus,
  activeStatus = "ALL",
  onNotify,
}) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Gestion de la clé API
  const [inputApiKey, setInputApiKey] = useState("");
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keyFeedback, setKeyFeedback] = useState(null);

  const fetchSunoMetrics = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await api.get("/api/admin/suno");
      if (res?.success) {
        setData(res);
        if (isManual && onNotify) {
          onNotify("Métriques Suno API synchronisées avec succès.");
        }
      }
    } catch (err) {
      console.warn("[SunoMetricsOverview] Erreur chargement métriques:", err.message);
      if (isManual && onNotify) {
        onNotify(`Erreur synchronisation Suno API : ${err.message}`);
      }
    } finally {
      setIsLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSunoMetrics();
    // Rafraîchissement automatique toutes les 60 secondes
    const interval = setInterval(() => {
      fetchSunoMetrics(false);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleTestKey = async () => {
    if (!inputApiKey.trim()) {
      setKeyFeedback({
        type: "error",
        message: "Veuillez saisir une clé API Suno à tester.",
      });
      return;
    }

    setIsTestingKey(true);
    setKeyFeedback(null);
    try {
      const res = await api.post("/api/admin/suno", {
        action: "test_key",
        apiKey: inputApiKey.trim(),
      });

      if (res?.success) {
        setKeyFeedback({
          type: "success",
          message: res.message || "Clé valide !",
          credits: res.testResult?.credits,
          latency: res.testResult?.latencyMs,
        });
      } else {
        setKeyFeedback({
          type: "error",
          message: res?.message || "Clé non reconnue par l'API Suno.",
        });
      }
    } catch (err) {
      setKeyFeedback({
        type: "error",
        message: `Erreur lors du test : ${err.message}`,
      });
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleSaveKey = async () => {
    if (!inputApiKey.trim()) return;

    setIsSavingKey(true);
    try {
      const res = await api.post("/api/admin/suno", {
        apiKey: inputApiKey.trim(),
      });

      if (res?.success) {
        setData(res);
        setInputApiKey("");
        setKeyFeedback({
          type: "success",
          message: res.message || "Clé enregistrée avec succès.",
        });
        if (onNotify) onNotify("Nouvelle clé Suno API appliquée.");
      }
    } catch (err) {
      setKeyFeedback({
        type: "error",
        message: `Erreur sauvegarde : ${err.message}`,
      });
    } finally {
      setIsSavingKey(false);
    }
  };

  // Affichage shimmer pendant le premier chargement pour éviter tout glitch de fausses données
  if (isLoading && !data) {
    return (
      <Box
        rounded="3xl"
        p={{ base: "4", md: "6" }}
        bg="paper.0"
        border="1px solid"
        borderColor="paper.200"
        boxShadow="sm"
      >
        <Flex
          direction={{ base: "column", lg: "row" }}
          justify="space-between"
          align={{ base: "flex-start", lg: "center" }}
          gap="4"
          pb="5"
          borderBottom="1px solid"
          borderColor="paper.200"
        >
          <HStack gap="3" align="center">
            <Shimmer h="46px" w="46px" rounded="2xl" />
            <Stack gap="2">
              <Shimmer h="20px" w="240px" rounded="md" />
              <Shimmer h="13px" w="320px" rounded="md" />
            </Stack>
          </HStack>
          <HStack gap="2">
            <Shimmer h="30px" w="90px" rounded="xl" />
            <Shimmer h="30px" w="110px" rounded="xl" />
          </HStack>
        </Flex>
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap="4" mt="5">
          <ShimmerCard h="135px" />
          <ShimmerCard h="135px" />
          <ShimmerCard h="135px" />
          <ShimmerCard h="135px" />
        </SimpleGrid>
      </Box>
    );
  }

  const suno = data?.suno 

  const metrics = data?.platformMetrics || {
    totalTracks: 0,
    completedTracks: 0,
    processingTracks: 0,
    queuedTracks: 0,
    inQueueTotal: 0,
    failedTracks: 0,
    successRate: "100.0%",
    estimatedSunoCreditsConsumedTotal: 0,
  };

  const isExhausted = suno.creditsRemaining === 0;

  return (
    <Box
      rounded="3xl"
      p={{ base: "4", md: "6" }}
      bg="paper.0"
      border="1px solid"
      borderColor="paper.200"
      boxShadow="sm"
      position="relative"
      overflow="hidden"
    >

      
      {/* ========================================================= */}
      {/* 1. EN-TÊTE SUNO API : Statut Officiel, Latence, Actions   */}
      {/* ========================================================= */}
      <Flex
        direction={{ base: "column", lg: "row" }}
        justify="space-between"
        align={{ base: "flex-start", lg: "center" }}
        gap="4"
        pb="5"
        borderBottom="1px solid"
        borderColor="paper.200"
      >
        <HStack gap="3" align="center">

          <Stack gap="0.5">
            <HStack gap="2" wrap="wrap">
              <Text fontFamily="heading" fontWeight="800" fontSize={{ base: "md", md: "lg" }} color="ink.900">
                Suno AI Music API Engine
              </Text>

              {/* Badge d'état officiel */}
              <Badge
                bg={
                  suno.status === "ONLINE"
                    ? "green.50"
                    : suno.status === "EXHAUSTED"
                    ? "orange.50"
                    : "yellow.50"
                }
                color={
                  suno.status === "ONLINE"
                    ? "green.700"
                    : suno.status === "EXHAUSTED"
                    ? "orange.700"
                    : "yellow.800"
                }
                border="1px solid"
                borderColor={
                  suno.status === "ONLINE"
                    ? "green.200"
                    : suno.status === "EXHAUSTED"
                    ? "orange.200"
                    : "yellow.200"
                }
                px="2.5"
                py="0.5"
                rounded="full"
                fontSize="11px"
                fontWeight="700"
                display="inline-flex"
                alignItems="center"
                gap="1.5"
              >
                <Box
                  w="6px"
                  h="6px"
                  rounded="full"
                  bg={
                    suno.status === "ONLINE"
                      ? "green.500"
                      : suno.status === "EXHAUSTED"
                      ? "orange.500"
                      : "yellow.500"
                  }
                  animation="pulse 2s infinite"
                />
                {suno.statusLabel} ({suno.latencyMs})
              </Badge>

              <Badge
                bg="purple.50"
                color="brand.violetDeep"
                border="1px solid"
                borderColor="purple.200"
                px="2"
                py="0.5"
                rounded="full"
                fontSize="10px"
                fontWeight="800"
              >
                sunoapi.org v1
              </Badge>
            </HStack>

            <HStack gap="3" color="ink.500" fontSize="xs" wrap="wrap">
              <Text>
                Modèle par défaut :{" "}
                <Text as="span" fontWeight="700" color="ink.800">
                  {suno.activeModel}
                </Text>
              </Text>
              <Text>•</Text>
              <Text>
                Endpoint :{" "}
                <Text as="span" fontFamily="mono" color="ink.700">
                  api.sunoapi.org/api/v1
                </Text>
              </Text>
            </HStack>
          </Stack>
        </HStack>

        <HStack gap="2.5" w={{ base: "full", lg: "auto" }} justify={{ base: "flex-start", lg: "flex-end" }} wrap="wrap">
          {/* Lien externe vers sunoapi.org */}
          <Button
            as="a"
            href="https://sunoapi.org"
            target="_blank"
            rel="noopener noreferrer"
            size="xs"
            variant="ghost"
            rounded="xl"
            color="brand.violetDeep"
            _hover={{ bg: "brand.violetTint" }}
          >
            <HStack gap="1.5">
              <Text>Portail Suno</Text>
              <LuExternalLink size={12} />
            </HStack>
          </Button>

          {/* Diagnostic & Gestion des clés */}
          <Button
            size="xs"
            variant="outline"
            rounded="xl"
            borderColor="paper.300"
            color="ink.700"
            _hover={{ bg: "paper.100" }}
            onClick={() => setShowDiagnostics((prev) => !prev)}
          >
            <HStack gap="1.5">
              <LuKey size={13} color="#7c3aed" />
              <Text>Clé API & Modèles</Text>
              {showDiagnostics ? <LuChevronUp size={12} /> : <LuChevronDown size={12} />}
            </HStack>
          </Button>

          {/* Bouton de rafraîchissement / ping en direct */}
          <Button
            size="xs"
            rounded="xl"
            bg="blue.50"
            color="blue.500"
            border="1px solid"
            borderColor="blue.300"
            _hover={{ bg: "paper.200" }}
            onClick={() => fetchSunoMetrics(true)}
            loading={isRefreshing}
          >
            <HStack gap="1.5">
              <LuRefreshCw size={13} />
              <Text>Actualiser</Text>
            </HStack>
          </Button>
        </HStack>
      </Flex>

      {/* ========================================================= */}
      {/* 2. ALERTE SOLDE SUNO ÉPUISÉ (0 CRÉDIT)                     */}
      {/* ========================================================= */}
      {isExhausted && (
        <Box
          mt="4"
          p="3.5"
          rounded="2xl"
          bg="orange.50"
          border="1px solid"
          borderColor="orange.200"
          color="orange.900"
        >
          <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "flex-start", md: "center" }} gap="3">
            <HStack gap="2.5" align="flex-start">
              <Box color="orange.600" mt="0.5">
                <LucideAlertCircle size={18} />
              </Box>
              <Stack gap="0.5">
                <Text fontSize="xs" fontWeight="700">
                  Solde du compte Suno API à 0 crédit (sunoapi.org)
                </Text>
                <Text fontSize="2xs" color="orange.800">
                  Votre clé API Suno est validée, mais le solde officiel disponible est de <b>0 crédit</b>.
                  Le relais studio de secours local prend automatiquement en charge vos générations.
                  Pour activer la génération native sur les clusters Suno V6 (10 crédits/morceau), rechargez votre compte.
                </Text>
              </Stack>
            </HStack>

            <Button
              as="a"
              href="https://sunoapi.org"
              target="_blank"
              rel="noopener noreferrer"
              size="xs"
              rounded="xl"
              bg="orange.600"
              color="white"
              _hover={{ bg: "orange.700" }}
              flexShrink={0}
            >
              <HStack gap="1.5">
                <Text>Recharger sur sunoapi.org</Text>
                <LuExternalLink size={12} />
              </HStack>
            </Button>
          </Flex>
        </Box>
      )}

      {/* ========================================================= */}
      {/* 3. GRILLE DE CARTES KPI SUNO API                           */}
      {/* ========================================================= */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap="4" mt="5">
        {/* CARTE 1 : Solde Réel de Crédits Suno */}
        <Box
          p="4"
          rounded="2xl"
          bg={isExhausted ? "orange.50/40" : "paper.50"}
          border="1px solid"
          borderColor={isExhausted ? "orange.300" : "paper.200"}
          position="relative"
          transition="all 0.2s"
          _hover={{ transform: "translateY(-1px)", borderColor: "brand.violet" }}
        >
          <Flex justify="space-between" align="center" mb="1.5">
            <HStack gap="1.5">
              <LuCoins size={15} color="#7c3aed" />
              <Text fontSize="11px" fontWeight="700" color="ink.500" letterSpacing="0.04em">
                SOLDE COMPTE SUNO
              </Text>
            </HStack>
            <Badge
              rounded="full"
              bg={isExhausted ? "orange.100" : "brand.violetTint"}
              color={isExhausted ? "orange.800" : "brand.violetDeep"}
              px="2"
              py="0.5"
              fontSize="10px"
              fontWeight="800"
            >
              {isExhausted ? "0 dispo" : `${formatMetric(suno.creditsRemaining)} crédits`}
            </Badge>
          </Flex>

          <HStack align="baseline" gap="1" mt="1">
            <Text fontFamily="heading" fontWeight="800" fontSize="2xl" color={isExhausted ? "orange.700" : "ink.900"}>
              {formatMetric(suno.creditsRemaining)}
            </Text>
            <Text fontSize="xs" color="ink.500">
              crédits Suno
            </Text>
          </HStack>

          {/* Jauge visuelle */}
          <Box w="full" h="6px" bg="paper.200" rounded="full" mt="2.5" overflow="hidden">
            <Box
              h="full"
              w={isExhausted ? "0%" : `${Math.max(6, Math.min(100, suno.creditsPercent))}%`}
              bg={isExhausted ? "orange.500" : "linear-gradient(90deg, #7c3aed 0%, #06b6d4 100%)"}
              rounded="full"
              transition="width 0.4s ease"
            />
          </Box>

          <Text fontSize="11px" color="ink.500" mt="2">
            ≈ <b>{suno.songsRemaining}</b> titres générables ({suno.costPerSongCredits} crédits / titre Suno)
          </Text>
        </Box>

        {/* CARTE 2 : Titres Totaux Générés Plateforme */}
        <Box
          p="4"
          rounded="2xl"
          bg="paper.50"
          border="1px solid"
          borderColor={activeStatus === "COMPLETED" ? "green.400" : "paper.200"}
          cursor="pointer"
          transition="all 0.2s"
          _hover={{ transform: "translateY(-1px)", borderColor: "green.400", bg: "paper.100" }}
          onClick={() => onSelectStatus && onSelectStatus("COMPLETED")}
          title="Filtrer les pistes complétées"
        >
          <Flex justify="space-between" align="center" mb="1.5">
            <HStack gap="1.5">
              <LuMusic size={15} color="#10b981" />
              <Text fontSize="11px" fontWeight="700" color="ink.500" letterSpacing="0.04em">
                TITRES GÉNÉRÉS
              </Text>
            </HStack>
            <Badge rounded="full" bg="green.50" color="green.700" px="2" py="0.5" fontSize="10px" fontWeight="800">
              {formatMetric(metrics.completedTracks)} prêts
            </Badge>
          </Flex>

          <Text fontFamily="heading" fontWeight="800" fontSize="2xl" color="ink.900" mt="1">
            {formatMetric(metrics.totalTracks)}
          </Text>

          <HStack gap="1.5" mt="2.5" fontSize="11px" color="green.700">
            <LuTrendingUp size={13} />
            <Text fontWeight="600">Taux de succès : {metrics.successRate}</Text>
          </HStack>
        </Box>

        {/* CARTE 3 : Concurrence & File d'attente */}
        <Box
          p="4"
          rounded="2xl"
          bg="paper.50"
          border="1px solid"
          borderColor={activeStatus === "PROCESSING" ? "blue.400" : "paper.200"}
          cursor="pointer"
          transition="all 0.2s"
          _hover={{ transform: "translateY(-1px)", borderColor: "blue.400", bg: "paper.100" }}
          onClick={() => onSelectStatus && onSelectStatus("PROCESSING")}
          title="Filtrer les pistes en cours"
        >
          <Flex justify="space-between" align="center" mb="1.5">
            <HStack gap="1.5">
              <LuCpu size={15} color="#2563eb" />
              <Text fontSize="11px" fontWeight="700" color="ink.500" letterSpacing="0.04em">
                TRAITEMENT & FILES
              </Text>
            </HStack>
            <Badge rounded="full" bg="blue.50" color="blue.700" px="2" py="0.5" fontSize="10px" fontWeight="800">
              {metrics.inQueueTotal} actifs
            </Badge>
          </Flex>

          <Text fontFamily="heading" fontWeight="800" fontSize="2xl" color="blue.600" mt="1">
            {metrics.inQueueTotal} en cours
          </Text>

          <Text fontSize="11px" color="ink.500" mt="2.5">
            {metrics.processingTracks} en rendu Suno • {metrics.queuedTracks} en attente
          </Text>
        </Box>

        {/* CARTE 4 : Latence Suno API & Échecs */}
        <Box
          p="4"
          rounded="2xl"
          bg="paper.50"
          border="1px solid"
          borderColor={activeStatus === "FAILED" ? "red.400" : "paper.200"}
          cursor="pointer"
          transition="all 0.2s"
          _hover={{ transform: "translateY(-1px)", borderColor: "red.400", bg: "paper.100" }}
          onClick={() => onSelectStatus && onSelectStatus("FAILED")}
          title="Filtrer les pistes en échec"
        >
          <Flex justify="space-between" align="center" mb="1.5">
            <HStack gap="1.5">
              <LuShieldAlert size={15} color="#ef4444" />
              <Text fontSize="11px" fontWeight="700" color="ink.500" letterSpacing="0.04em">
                TÉLÉMÉTRIE & ÉCHECS
              </Text>
            </HStack>
            <Badge
              rounded="full"
              bg={metrics.failedTracks > 0 ? "red.50" : "paper.200"}
              color={metrics.failedTracks > 0 ? "red.700" : "ink.600"}
              px="2"
              py="0.5"
              fontSize="10px"
              fontWeight="800"
            >
              {metrics.failedTracks} échecs
            </Badge>
          </Flex>

          <Text fontFamily="heading" fontWeight="800" fontSize="2xl" color={metrics.failedTracks > 0 ? "red.600" : "ink.900"} mt="1">
            {suno.latencyMs}
          </Text>

          <HStack gap="1.5" mt="2.5" fontSize="11px" color="ink.500">
            <LuActivity size={13} />
            <Text>
              Rendu Suno V6 : <b>~{suno.averageGenerationTime}</b>
            </Text>
          </HStack>
        </Box>
      </SimpleGrid>

      {/* ========================================================= */}
      {/* 4. PANNEAU DE GESTION DE LA CLÉ API & MODÈLES (EXPANDABLE)*/}
      {/* ========================================================= */}
      {showDiagnostics && (
        <Box
          mt="4"
          p="5"
          rounded="2xl"
          bg="paper.100"
          border="1px solid"
          borderColor="paper.300"
        >
          <SimpleGrid columns={{ base: 1, lg: 2 }} gap="6">
            {/* Colonne 1 : Configuration & Test de la Clé API */}
            <Stack gap="3">
              <HStack gap="2">
                <LuKey size={16} color="#7c3aed" />
                <Text fontSize="sm" fontWeight="700" color="ink.900">
                  Configuration de la Clé Suno API (sunoapi.org)
                </Text>
              </HStack>

              <Text fontSize="xs" color="ink.600">
                Clé activement enregistrée :{" "}
                <Text as="span" fontFamily="mono" fontWeight="700" color="ink.900" bg="paper.0" px="2" py="0.5" rounded="md" border="1px solid" borderColor="paper.200">
                  {suno.apiKeyMasked}
                </Text>
              </Text>

              <Box>
                <Text fontSize="xs" fontWeight="600" color="ink.700" mb="1.5">
                  Nouvelle Clé API Suno :
                </Text>
                <Flex gap="2" direction={{ base: "column", sm: "row" }}>
                  <Input
                    placeholder="Collez votre clé sunoapi.org ici..."
                    fontSize="xs"
                    fontFamily="mono"
                    bg="paper.0"
                    rounded="xl"
                    border="1px solid"
                    borderColor="paper.300"
                    value={inputApiKey}
                    onChange={(e) => setInputApiKey(e.target.value)}
                    _focus={{ borderColor: "brand.violet" }}
                  />
                  <HStack gap="2" flexShrink={0}>
                    <Button
                      size="xs"
                      rounded="xl"
                      variant="outline"
                      borderColor="brand.violet"
                      color="brand.violetDeep"
                      loading={isTestingKey}
                      onClick={handleTestKey}
                    >
                      Tester
                    </Button>
                    <Button
                      size="xs"
                      rounded="xl"
                      bg="brand.violetDeep"
                      color="white"
                      loading={isSavingKey}
                      onClick={handleSaveKey}
                      _hover={{ bg: "brand.violet" }}
                    >
                      Enregistrer
                    </Button>
                  </HStack>
                </Flex>
              </Box>

              {/* Message de feedback du test */}
              {keyFeedback && (
                <Box
                  p="2.5"
                  rounded="xl"
                  bg={keyFeedback.type === "success" ? "green.50" : "red.50"}
                  border="1px solid"
                  borderColor={keyFeedback.type === "success" ? "green.200" : "red.200"}
                  color={keyFeedback.type === "success" ? "green.800" : "red.800"}
                  fontSize="xs"
                >
                  <HStack gap="2">
                    {keyFeedback.type === "success" ? <LuCheck size={14} /> : <LucideAlertCircle size={14} />}
                    <Text fontWeight="600">{keyFeedback.message}</Text>
                  </HStack>
                </Box>
              )}

              <Text fontSize="2xs" color="ink.500">
                Obtenez une clé API officielle sur{" "}
                <Text as="a" href="https://sunoapi.org/api-key" target="_blank" color="brand.violetDeep" textDecoration="underline">
                  sunoapi.org/api-key
                </Text>
                . Les requêtes sont transmises de manière sécurisée via HTTPS avec Bearer Token.
              </Text>
            </Stack>

            {/* Colonne 2 : Modèles Suno V6 supportés */}
            <Stack gap="3">
              <HStack gap="2">
                <LuCpu size={16} color="#10b981" />
                <Text fontSize="sm" fontWeight="700" color="ink.900">
                  Modèles Suno AI Pris en Charge
                </Text>
              </HStack>

              <Text fontSize="xs" color="ink.600">
                Notre API Next.js est directement interfacée avec les modèles de la spécification Suno :
              </Text>

              <SimpleGrid columns={{ base: 1, sm: 2 }} gap="2">
                {[
                  { id: "V6", tag: "Par Défaut", desc: "Voix naturelles HD, mastering complet", color: "purple" },
                  { id: "V6_WILD", tag: "Créatif", desc: "Styles audacieux et expérimental", color: "pink" },
                  { id: "V6_MINI", tag: "Rapide", desc: "Rendu instantané équilibré", color: "cyan" },
                  { id: "V4_5ALL", tag: "Long format", desc: "Morceaux structurés jusqu'à 8 min", color: "blue" },
                ].map((m) => (
                  <Box
                    key={m.id}
                    p="2.5"
                    rounded="xl"
                    bg="paper.0"
                    border="1px solid"
                    borderColor="paper.200"
                  >
                    <Flex justify="space-between" align="center" mb="1">
                      <Text fontSize="xs" fontWeight="800" color="ink.900">
                        {m.id}
                      </Text>
                      <Badge size="xs" colorPalette={m.color} rounded="md" fontSize="9px">
                        {m.tag}
                      </Badge>
                    </Flex>
                    <Text fontSize="2xs" color="ink.500">
                      {m.desc}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>

              <Text fontSize="2xs" color="ink.500">
                Spécification Suno API : 1 titre = 10 crédits Suno (2 clips stéréos générés).
              </Text>
            </Stack>
          </SimpleGrid>
        </Box>
      )}
    </Box>
  );
}
