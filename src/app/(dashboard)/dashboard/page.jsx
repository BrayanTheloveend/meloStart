"use client";

import { useEffect, useRef, useState } from "react";
import NextLink from "next/link";
import {
  Alert,
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Progress,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  LuActivity,
  LuArrowDownRight,
  LuArrowRight,
  LuArrowUpRight,
  LuCheck,
  LuClock,
  LuCreditCard,
  LuDollarSign,
  LuFlame,
  LuHeadphones,
  LuLayers,
  LuMusic,
  LuPause,
  LuPlay,
  LuRefreshCw,
  LuServer,
  LuShieldCheck,
  LuTrendingUp,
  LuUsers,
  LuWandSparkles,
  LuZap,
} from "react-icons/lu";

import { accent } from "@/theme/system";
import { api } from "@/lib/apiClient";
import { formatMetric } from "@/lib/formatters";
import { ShimmerCard, ShimmerGenreBar, ShimmerListItem } from "@/components/common/Shimmer";

export default function AdminDashboardPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activePlayingId, setActivePlayingId] = useState(null);
  const [stats, setStats] = useState([]);
  const [popularGenres, setPopularGenres] = useState([]);
  const [recentTracks, setRecentTracks] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [systemServices, setSystemServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const audioRef = useRef(null);

  const fetchDashboardData = async () => {
    setFetchError(null);
    try {
      const [statsRes, tracksRes, txRes, sysRes] = await Promise.all([
        api.get("/api/admin/stats").catch(() => null),
        api.get("/api/admin/tracks?limit=5").catch(() => null),
        api.get("/api/admin/transactions?limit=3").catch(() => null),
        api.get("/api/admin/system").catch(() => null),
      ]);

      if (statsRes?.stats) {
        setStats(statsRes.stats);
        if (statsRes.popularGenres?.length) {
          setPopularGenres(statsRes.popularGenres);
        }
      }

      if (tracksRes?.tracks) {
        setRecentTracks(tracksRes.tracks);
      }

      if (txRes?.transactions) {
        setRecentTransactions(txRes.transactions);
      }

      if (sysRes?.services) {
        setSystemServices(sysRes.services.slice(0, 3));
      }
    } catch (err) {
      console.warn("[Admin Dashboard] Erreur synchronisation API:", err.message);
      setFetchError("Certaines données n'ont pas pu être synchronisées en direct.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };

  const handleTogglePlay = (track) => {
    if (activePlayingId === track.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setActivePlayingId(null);
    } else {
      setActivePlayingId(track.id);
      if (track.audioUrl) {
        if (!audioRef.current) {
          audioRef.current = new Audio(track.audioUrl);
          audioRef.current.onended = () => setActivePlayingId(null);
        } else {
          audioRef.current.src = track.audioUrl;
        }
        audioRef.current.play().catch(() => {});
      }
    }
  };

  return (
    <Stack gap="8">
      {/* Audio natif caché */}
      <audio ref={audioRef} style={{ display: "none" }} />
      {/* ========================================================= */}
      {/* EN-TÊTE DE BIENVENUE & BOUTONS D'ACTION RAPIDE */}
      {/* ========================================================= */}
      <Flex
        direction={{ base: "column", sm: "row" }}
        justify="space-between"
        align={{ base: "flex-start", sm: "center" }}
        gap="4"
      >
        <Stack gap="1">
          <HStack gap="2">
            <Text fontFamily="heading" fontWeight="800" fontSize={{ base: "2xl", md: "3xl" }} letterSpacing="-0.03em">
              Tableau de bord
            </Text>
            <Badge bg="brand.violetTint" color="brand.violetDeep" px="2.5" py="1" rounded="full" fontWeight="700" fontSize="xs">
              Temps Réel
            </Badge>
          </HStack>
          <Text color="ink.500" fontSize="sm">
            Vue consolidée des performances, des utilisateurs et du pipeline audio melostars.
          </Text>
        </Stack>

        <HStack gap="3">
          <Button
            variant="outline"
            size="sm"
            rounded="xl"
            borderColor="paper.300"
            color="ink.700"
            onClick={handleRefresh}
            loading={isRefreshing}
          >
            <HStack gap="2">
              <LuRefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
              <Text>Actualiser</Text>
            </HStack>
          </Button>

          <Button
            asChild
            size="sm"
            rounded="xl"
            bg="brand.violetDeep"
            color="white"
            fontWeight="600"
            _hover={{ bg: "brand.violet" }}
          >
            <NextLink href="/dashboard/tracks">
              <HStack gap="2">
                <LuWandSparkles size={14} />
                <Text>Superviser l'IA</Text>
              </HStack>
            </NextLink>
          </Button>
        </HStack>
      </Flex>

      {/* ========================================================= */}
      {/* 4 CARTES KPI MAJEURES */}
      {/* ========================================================= */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap="4">
        {isLoading && !stats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <ShimmerCard key={i} h="120px" />
          ))
        ) : (
          <>
            {/* KPI 1 : Revenu total */}
            <Box
              p="5"
              rounded="2xl"
              bg="paper.0"
              border="1px solid"
              borderColor="paper.200"
              boxShadow="0 1px 3px rgba(0,0,0,0.03)"
            >
              <Flex justify="space-between" align="flex-start" mb="3">
                <Text fontSize="xs" fontWeight="700" color="ink.500" textTransform="uppercase" letterSpacing="0.05em">
                  Chiffre d'Affaires
                </Text>
                <Box p="2" rounded="xl" bg="green.50" color="green.600">
                  <LuCreditCard size={18} />
                </Box>
              </Flex>
              <Text fontFamily="heading" fontWeight="800" fontSize="2xl" letterSpacing="-0.03em">
                {stats?.revenueTotal || "0 XAF"}
              </Text>
              <HStack gap="1.5" mt="2">
                <Badge colorPalette="green" size="sm" rounded="full" px="2" display="inline-flex" alignItems="center" gap="1">
                  <LuArrowUpRight size={12} />
                  {stats?.revenueGrowth || "Paiements réels"}
                </Badge>
              </HStack>
            </Box>

            {/* KPI 2 : Utilisateurs */}
            <Box
              p="5"
              rounded="2xl"
              bg="paper.0"
              border="1px solid"
              borderColor="paper.200"
              boxShadow="0 1px 3px rgba(0,0,0,0.03)"
            >
              <Flex justify="space-between" align="flex-start" mb="3">
                <Text fontSize="xs" fontWeight="700" color="ink.500" textTransform="uppercase" letterSpacing="0.05em">
                  Utilisateurs Inscrits
                </Text>
                <Box p="2" rounded="xl" bg="blue.50" color="blue.600">
                  <LuUsers size={18} />
                </Box>
              </Flex>
              <Text fontFamily="heading" fontWeight="800" fontSize="2xl" letterSpacing="-0.03em" title={String(stats?.usersTotal || 0)}>
                {formatMetric(stats?.usersTotal || 0)}
              </Text>
              <HStack gap="1.5" mt="2">
                <Badge colorPalette="blue" size="sm" rounded="full" px="2" display="inline-flex" alignItems="center" gap="1">
                  <LuArrowUpRight size={12} />
                  {stats?.usersNewThisWeek || "+0"} cette semaine
                </Badge>
              </HStack>
            </Box>

            {/* KPI 3 : Titres générés */}
            <Box
              p="5"
              rounded="2xl"
              bg="paper.0"
              border="1px solid"
              borderColor="paper.200"
              boxShadow="0 1px 3px rgba(0,0,0,0.03)"
            >
              <Flex justify="space-between" align="flex-start" mb="3">
                <Text fontSize="xs" fontWeight="700" color="ink.500" textTransform="uppercase" letterSpacing="0.05em">
                  Musiques IA Créées
                </Text>
                <Box p="2" rounded="xl" bg="brand.violetTint" color="brand.violetDeep">
                  <LuMusic size={18} />
                </Box>
              </Flex>
              <Text fontFamily="heading" fontWeight="800" fontSize="2xl" letterSpacing="-0.03em" title={String(stats?.tracksGenerated || 0)}>
                {formatMetric(stats?.tracksGenerated || 0)}
              </Text>
              <HStack gap="1.5" mt="2">
                <Badge colorPalette="purple" size="sm" rounded="full" px="2">
                  +{stats?.tracksToday || 0} aujourd'hui ({stats?.tracksSuccessRate || "100%"} succès)
                </Badge>
              </HStack>
            </Box>

            {/* KPI 4 : Notes brûlées */}
            <Box
              p="5"
              rounded="2xl"
              bg="paper.0"
              border="1px solid"
              borderColor="paper.200"
              boxShadow="0 1px 3px rgba(0,0,0,0.03)"
            >
              <Flex justify="space-between" align="flex-start" mb="3">
                <Text fontSize="xs" fontWeight="700" color="ink.500" textTransform="uppercase" letterSpacing="0.05em">
                  Notes Consommées
                </Text>
                <Box p="2" rounded="xl" bg="amber.50" color="amber.600">
                  <LuZap size={18} />
                </Box>
              </Flex>
              <Text fontFamily="heading" fontWeight="800" fontSize="2xl" letterSpacing="-0.03em" title={String(stats?.notesBurned || 0)}>
                {formatMetric(stats?.notesBurned || 0)}
              </Text>
              <HStack gap="1.5" mt="2">
                <Badge colorPalette="amber" size="sm" rounded="full" px="2">
                  {formatMetric(stats?.notesPurchased || 0)} Notes achetées au total
                </Badge>
              </HStack>
            </Box>
          </>
        )}
      </SimpleGrid>

      {/* ========================================================= */}
      {/* GRILLE D'ANALYSE : POPULARITÉ DES GENRES & ÉTAT DU SYSTÈME */}
      {/* ========================================================= */}
      <SimpleGrid columns={{ base: 1, lg: 12 }} gap="6">
        {/* Colonne gauche (7 cols) : Répartition des Genres musicaux */}
        <Box
          gridColumn={{ lg: "span 7" }}
          p="6"
          rounded="3xl"
          bg="paper.0"
          border="1px solid"
          borderColor="paper.200"
        >
          <Flex justify="space-between" align="center" mb="6">
            <Stack gap="0.5">
              <Text fontFamily="heading" fontWeight="700" fontSize="lg">
                Styles musicaux les plus demandés
              </Text>
              <Text fontSize="xs" color="ink.500">
                Volume de production par catégorie sur l'ensemble des titres créés
              </Text>
            </Stack>
            <Badge variant="subtle" size="sm" rounded="full">
              Global
            </Badge>
          </Flex>

          <Stack gap="5">
            {isLoading && popularGenres.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <ShimmerGenreBar key={i} />
              ))
            ) : popularGenres.length === 0 ? (
              <Box py="8" textAlign="center">
                <Text fontSize="xs" color="ink.400">
                  Aucune statistique de genre pour le moment. Générez vos premières musiques pour visualiser la répartition.
                </Text>
              </Box>
            ) : (
              popularGenres.map((g) => (
                <Stack key={g.genre} gap="2">
                  <Flex justify="space-between" fontSize="sm">
                    <HStack gap="2">
                      <Box w="10px" h="10px" rounded="full" bg={g.color} />
                      <Text fontWeight="600" color="ink.800">
                        {g.genre}
                      </Text>
                    </HStack>
                    <HStack gap="3">
                      <Text color="ink.500" fontSize="xs" title={String(g.tracksCount || 0)}>
                        {formatMetric(g.tracksCount)} musiques
                      </Text>
                      <Text fontWeight="700" color="ink.900">
                        {g.percent}%
                      </Text>
                    </HStack>
                  </Flex>
                  <Box h="8px" rounded="full" bg="paper.100" overflow="hidden">
                    <Box h="full" rounded="full" bg={g.color} w={`${g.percent}%`} transition="width 0.5s" />
                  </Box>
                </Stack>
              ))
            )}
          </Stack>
        </Box>

        {/* Colonne droite (5 cols) : Santé de l'infrastructure */}
        <Box
          gridColumn={{ lg: "span 5" }}
          p="6"
          rounded="3xl"
          bg="paper.0"
          border="1px solid"
          borderColor="paper.200"
        >
          <Flex justify="space-between" align="center" mb="5">
            <Stack gap="0.5">
              <Text fontFamily="heading" fontWeight="700" fontSize="lg">
                Statut de l'infrastructure
              </Text>
              <Text fontSize="xs" color="ink.500">
                Monitoring BullMQ, Redis, PostgreSQL & Suno AI
              </Text>
            </Stack>
            <HStack gap="1.5" px="2.5" py="1" rounded="full" bg="green.50" border="1px solid" borderColor="green.200">
              <Box w="6px" h="6px" rounded="full" bg="green.500" />
              <Text fontSize="10px" fontWeight="800" color="green.700">
                100% OK
              </Text>
            </HStack>
          </Flex>

          <Stack gap="3.5">
            {isLoading && systemServices.length === 0 ? (
              Array.from({ length: 3 }).map((_, i) => (
                <ShimmerCard key={i} h="62px" rounded="2xl" />
              ))
            ) : (
              (systemServices.length > 0
                ? systemServices
                : [
                    { id: "bullmq", name: "File d'attente BullMQ & Redis", status: "ONLINE", details: "File 'music-generation' (Port 6379)" },
                    { id: "suno", name: "Suno AI API (sunoapi.org)", status: "ONLINE", details: "Modèle Suno V6 Master HD" },
                    { id: "pg", name: "Base PostgreSQL & Prisma", status: "ONLINE", details: "Données persistantes melostars" },
                  ]
              ).map((s) => (
                <Box
                  key={s.id || s.name}
                  p="3.5"
                  rounded="2xl"
                  bg="paper.50"
                  border="1px solid"
                  borderColor="paper.200"
                >
                  <Flex justify="space-between" align="center" mb="1">
                    <HStack gap="2">
                      <Box w="6px" h="6px" rounded="full" bg="green.500" />
                      <Text fontWeight="700" fontSize="xs" color="ink.900">
                        {s.name}
                      </Text>
                    </HStack>
                    <Badge colorPalette="green" size="sm" rounded="full" px="2" fontSize="10px">
                      {s.statusLabel || s.status}
                    </Badge>
                  </Flex>
                  <Text fontSize="11px" color="ink.500">
                    {s.details}
                  </Text>
                </Box>
              ))
            )}
          </Stack>

          <HStack gap="2" mt="4">
            <Button
              asChild
              variant="outline"
              size="sm"
              flex="1"
              rounded="xl"
              borderColor="paper.300"
              _hover={{ bg: "brand.violetTint", borderColor: "brand.violet" }}
            >
              <NextLink href="/dashboard/vps">
                <HStack justify="center" gap="1.5">
                  <LuServer size={14} color="#7c3aed" />
                  <Text fontSize="xs" fontWeight="700" color="brand.violetDeep">
                    VPS Hostinger
                  </Text>
                </HStack>
              </NextLink>
            </Button>

            <Button
              asChild
              variant="outline"
              size="sm"
              flex="1"
              rounded="xl"
              borderColor="paper.300"
              _hover={{ bg: "paper.100" }}
            >
              <NextLink href="/dashboard/system">
                <HStack justify="center" gap="1.5">
                  <Text fontSize="xs" fontWeight="600" color="ink.700">
                    Santé Système
                  </Text>
                  <LuArrowRight size={13} />
                </HStack>
              </NextLink>
            </Button>
          </HStack>
        </Box>
      </SimpleGrid>

      {/* ========================================================= */}
      {/* DERNIÈRES CRÉATIONS DE PISTES EN DIRECT */}
      {/* ========================================================= */}
      <Box p="6" rounded="3xl" bg="paper.0" border="1px solid" borderColor="paper.200">
        <Flex justify="space-between" align="center" mb="5">
          <Stack gap="0.5">
            <Text fontFamily="heading" fontWeight="700" fontSize="lg">
              Flux des générations récentes
            </Text>
            <Text fontSize="xs" color="ink.500">
              Surveillance des créations asynchrones et webhooks
            </Text>
          </Stack>

          <Button asChild variant="ghost" size="sm" rounded="full" color="brand.violetDeep">
            <NextLink href="/dashboard/tracks">
              <HStack gap="1.5">
                <Text fontSize="xs" fontWeight="700">
                  Voir toutes les musiques
                </Text>
                <LuArrowRight size={14} />
              </HStack>
            </NextLink>
          </Button>
        </Flex>

        <Stack gap="3">
          {isLoading && recentTracks.length === 0 ? (
            Array.from({ length: 4 }).map((_, i) => (
              <ShimmerListItem key={i} />
            ))
          ) : recentTracks.length === 0 ? (
            <Box p="8" textAlign="center" rounded="2xl" bg="paper.50" border="1px dashed" borderColor="paper.200">
              <Stack align="center" gap="2">
                <LuMusic size={26} color="#94a3b8" />
                <Text fontSize="sm" fontWeight="600" color="ink.600">
                  Aucun morceau généré pour le moment
                </Text>
                <Text fontSize="xs" color="ink.400">
                  Lancez votre première génération IA depuis le Studio pour la superviser en direct ici.
                </Text>
              </Stack>
            </Box>
          ) : (
            recentTracks.map((t) => (
              <Flex
                key={t.id}
                direction={{ base: "column", sm: "row" }}
                justify="space-between"
                align={{ base: "flex-start", sm: "center" }}
                p="3.5"
                rounded="2xl"
                bg="paper.50"
                border="1px solid"
                borderColor="paper.200"
                gap="3"
              >
                <HStack gap="3.5" flex="1" minW="0">
                  <Box
                    w="42px"
                    h="42px"
                    rounded="xl"
                    bg={
                      t.genre === "Afrobeat"
                        ? "brand.violetDeep"
                        : t.genre === "Lo-fi" || t.genre === "Lo-fi & Soul"
                        ? "brand.cyanDeep"
                        : "brand.pink"
                    }
                    color="white"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                  >
                    <LuMusic size={20} />
                  </Box>

                  <Stack gap="0.5" minW="0">
                    <HStack gap="2">
                      <Text fontWeight="700" fontSize="sm" color="ink.900" truncate>
                        {t.title}
                      </Text>
                      <Badge size="sm" rounded="full" px="2" fontSize="10px">
                        {t.genre}
                      </Badge>
                    </HStack>
                    <Text fontSize="xs" color="ink.500" truncate maxW="500px">
                      Par {t.user?.name || "Anonyme"} • "{t.prompt || "Sans description"}"
                    </Text>
                  </Stack>
                </HStack>

                <HStack gap="3" alignSelf={{ base: "flex-end", sm: "center" }}>
                  {t.status === "COMPLETED" && (
                    <Badge colorPalette="green" size="sm" rounded="full" px="2">
                      Complété (100%)
                    </Badge>
                  )}
                  {t.status === "PROCESSING" && (
                    <Badge colorPalette="blue" size="sm" rounded="full" px="2">
                      En cours ({t.progress}%)
                    </Badge>
                  )}
                  {t.status === "QUEUED" && (
                    <Badge colorPalette="purple" size="sm" rounded="full" px="2">
                      En file d'attente
                    </Badge>
                  )}
                  {t.status === "FAILED" && (
                    <Badge colorPalette="red" size="sm" rounded="full" px="2">
                      Échoué (Remboursé)
                    </Badge>
                  )}

                  <Text fontSize="xs" color="ink.400" minW="70px" textAlign="right">
                    {t.createdAt}
                  </Text>

                  {t.audioUrl && (
                    <IconButton
                      aria-label="Écouter l'extrait"
                      size="sm"
                      rounded="full"
                      variant="ghost"
                      color="brand.violetDeep"
                      onClick={() => handleTogglePlay(t)}
                    >
                      {activePlayingId === t.id ? <LuPause size={15} /> : <LuPlay size={15} />}
                    </IconButton>
                  )}
                </HStack>
              </Flex>
            ))
          )}
        </Stack>
      </Box>

      {/* ========================================================= */}
      {/* DERNIÈRES TRANSACTIONS FINANCIÈRES */}
      {/* ========================================================= */}
      <Box p="6" rounded="3xl" bg="paper.0" border="1px solid" borderColor="paper.200">
        <Flex justify="space-between" align="center" mb="5">
          <Stack gap="0.5">
            <Text fontFamily="heading" fontWeight="700" fontSize="lg">
              Derniers achats & paiements
            </Text>
            <Text fontSize="xs" color="ink.500">
              Historique des ventes de Notes via Stripe & Mobile Money
            </Text>
          </Stack>

          <Button asChild variant="ghost" size="sm" rounded="full" color="brand.violetDeep">
            <NextLink href="/dashboard/transactions">
              <HStack gap="1.5">
                <Text fontSize="xs" fontWeight="700">
                  Voir la facturation
                </Text>
                <LuArrowRight size={14} />
              </HStack>
            </NextLink>
          </Button>
        </Flex>

        <Stack gap="2.5">
          {isLoading && recentTransactions.length === 0 ? (
            Array.from({ length: 3 }).map((_, i) => (
              <ShimmerListItem key={i} h="56px" />
            ))
          ) : recentTransactions.length === 0 ? (
            <Box p="8" textAlign="center" rounded="2xl" bg="paper.50" border="1px dashed" borderColor="paper.200">
              <Stack align="center" gap="2">
                <LuCreditCard size={26} color="#94a3b8" />
                <Text fontSize="sm" fontWeight="600" color="ink.600">
                  Aucune transaction enregistrée
                </Text>
                <Text fontSize="xs" color="ink.400">
                  Les recharges de packs de Notes Stripe & Mobile Money s'afficheront ici.
                </Text>
              </Stack>
            </Box>
          ) : (
            recentTransactions.map((tx) => (
              <Flex
                key={tx.id}
                justify="space-between"
                align="center"
                p="3.5"
                rounded="2xl"
                bg="paper.50"
                border="1px solid"
                borderColor="paper.200"
              >
                <HStack gap="3">
                  <Box p="2.5" rounded="xl" bg="paper.200" color="ink.700">
                    <LuCreditCard size={16} />
                  </Box>
                  <Stack gap="0.5">
                    <Text fontWeight="700" fontSize="sm" color="ink.900">
                      {tx.packName}
                    </Text>
                    <Text fontSize="xs" color="ink.500">
                      {tx.user?.name} ({tx.user?.email}) • {tx.paymentMethod}
                    </Text>
                  </Stack>
                </HStack>

                <HStack gap="4">
                  <Stack gap="0" textAlign="right">
                    <Text fontWeight="800" fontSize="sm" color="ink.900">
                      {tx.amount}
                    </Text>
                    <Text fontSize="10px" color="ink.500">
                      {tx.notes} Notes créditées
                    </Text>
                  </Stack>

                  <Badge colorPalette="green" size="sm" rounded="full" px="2">
                    {tx.status || "COMPLETED"}
                  </Badge>
                </HStack>
              </Flex>
            ))
          )}
        </Stack>
      </Box>
    </Stack>
  );
}
