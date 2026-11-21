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
  Table,
  Text,
} from "@chakra-ui/react";
import {
  LuAlertCircle,
  LuArrowUpRight,
  LuCheck,
  LuClock,
  LuDownload,
  LuReceipt,
  LuRefreshCw,
  LuSearch,
  LuSmartphone,
  LuTrendingUp,
  LuWallet,
  LuX,
  LuZap,
} from "react-icons/lu";

import { api } from "@/lib/apiClient";
import { ShimmerCard, ShimmerTableRow } from "@/components/common/Shimmer";

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [metrics, setMetrics] = useState({
    totalCollected: 0,
    totalBalance: 0,
    mtnBalance: 0,
    orangeBalance: 0,
    currency: "XAF",
    isLiveCampay: false,
    successfulCount: 0,
    pendingCount: 0,
    failedCount: 0,
    totalCount: 0,
    successRate: "100%",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [operatorFilter, setOperatorFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    const query = new URLSearchParams();
    if (searchQuery.trim()) query.set("search", searchQuery.trim());
    if (statusFilter !== "ALL") query.set("status", statusFilter);
    if (operatorFilter !== "ALL") query.set("operator", operatorFilter);

    api
      .get(`/api/admin/transactions?${query.toString()}`)
      .then((res) => {
        if (isCancelled) return;
        if (res?.transactions) {
          setTransactions(res.transactions);
        }
        if (res?.metrics) {
          setMetrics(res.metrics);
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        console.warn("[Admin Transactions] Erreur API :", err.message);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [searchQuery, statusFilter, operatorFilter]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const query = new URLSearchParams();
      if (searchQuery.trim()) query.set("search", searchQuery.trim());
      if (statusFilter !== "ALL") query.set("status", statusFilter);
      if (operatorFilter !== "ALL") query.set("operator", operatorFilter);

      const res = await api.get(`/api/admin/transactions?${query.toString()}`);
      if (res?.transactions) {
        setTransactions(res.transactions);
      }
      if (res?.metrics) {
        setMetrics(res.metrics);
      }
    } catch (err) {
      console.warn("[Admin Transactions] Erreur refresh :", err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusBadge = (status, failureReason) => {
    switch (status) {
      case "SUCCESSFUL":
        return (
          <Badge bg="green.50" color="green.700" border="1px solid" borderColor="green.200" size="sm" rounded="full" px="2.5" py="0.5">
            <HStack gap="1">
              <LuCheck size={12} />
              <Text fontWeight="700">Réussi</Text>
            </HStack>
          </Badge>
        );
      case "PENDING":
        return (
          <Badge bg="yellow.50" color="yellow.800" border="1px solid" borderColor="yellow.300" size="sm" rounded="full" px="2.5" py="0.5">
            <HStack gap="1">
              <LuClock size={12} />
              <Text fontWeight="700">En attente USSD</Text>
            </HStack>
          </Badge>
        );
      case "FAILED":
        return (
          <Stack gap="0.5" align="flex-end">
            <Badge bg="red.50" color="red.700" border="1px solid" borderColor="red.200" size="sm" rounded="full" px="2.5" py="0.5">
              <HStack gap="1">
                <LuX size={12} />
                <Text fontWeight="700">Échoué</Text>
              </HStack>
            </Badge>
            {failureReason && (
              <Text fontSize="10px" color="red.600" maxW="180px" textAlign="right" lineHeight="1.2">
                {failureReason.length > 50 ? `${failureReason.slice(0, 50)}...` : failureReason}
              </Text>
            )}
          </Stack>
        );
      case "EXPIRED":
        return (
          <Badge bg="gray.100" color="gray.700" border="1px solid" borderColor="gray.300" size="sm" rounded="full" px="2.5" py="0.5">
            <HStack gap="1">
              <LuClock size={12} />
              <Text fontWeight="700">Expiré</Text>
            </HStack>
          </Badge>
        );
      default:
        return (
          <Badge size="sm" rounded="full" px="2">
            {status}
          </Badge>
        );
    }
  };

  const getOperatorBadge = (operator) => {
    const isMtn = (operator || "").toUpperCase().includes("MTN");
    const isOrange = (operator || "").toUpperCase().includes("ORANGE");

    if (isMtn) {
      return (
        <Badge bg="#fef9c3" color="#854d0e" border="1px solid #facc15" size="sm" rounded="full" px="2" py="0.5" fontWeight="700">
          MTN MoMo
        </Badge>
      );
    }
    if (isOrange) {
      return (
        <Badge bg="#ffedd5" color="#9a3412" border="1px solid #fb923c" size="sm" rounded="full" px="2" py="0.5" fontWeight="700">
          Orange Money
        </Badge>
      );
    }
    return (
      <Badge bg="paper.100" color="ink.600" size="sm" rounded="full" px="2">
        Mobile Money
      </Badge>
    );
  };

  return (
    <Stack gap="8">
      {/* En-tête */}
      <Flex direction={{ base: "column", sm: "row" }} justify="space-between" align={{ base: "flex-start", sm: "center" }} gap="4">
        <Stack gap="1">
          <HStack gap="2">
            <Text fontFamily="heading" fontWeight="800" fontSize={{ base: "2xl", md: "3xl" }} letterSpacing="-0.03em">
              Transactions & Encaissements
            </Text>
            <Badge
              bg={metrics.isLiveCampay ? "green.50" : "blue.50"}
              color={metrics.isLiveCampay ? "green.700" : "blue.700"}
              border="1px solid"
              borderColor={metrics.isLiveCampay ? "green.300" : "blue.300"}
              size="sm"
              rounded="full"
              px="2.5"
              fontWeight="700"
            >
              {metrics.isLiveCampay ? "CamPay Live" : "CamPay Intégré"}
            </Badge>
          </HStack>
          <Text color="ink.500" fontSize="sm">
            Suivi officiel des transactions et du solde marchand Mobile Money (MTN Cameroon & Orange Cameroun).
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
        </HStack>
      </Flex>

      {/* Résumé financier & Métriques CamPay */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap="4">
        {isLoading && transactions.length === 0 ? (
          Array.from({ length: 4 }).map((_, i) => (
            <ShimmerCard key={i} h="120px" />
          ))
        ) : (
          <>
            {/* KPI 1 : Solde marchand CamPay API */}
            <Box p="5" rounded="2xl" bg="paper.0" border="1px solid" borderColor="paper.200" boxShadow="0 1px 3px rgba(0,0,0,0.02)">
              <Flex justify="space-between" align="flex-start" mb="2">
                <Text fontSize="xs" color="ink.500" fontWeight="700" textTransform="uppercase" letterSpacing="0.05em">
                  Solde Marchand CamPay
                </Text>
                <Box p="2" rounded="xl" bg="brand.violetTint" color="brand.violetDeep">
                  <LuWallet size={16} />
                </Box>
              </Flex>
              <Text fontFamily="heading" fontWeight="900" fontSize="2xl" color="brand.violetDeep">
                {Number(metrics.totalBalance).toLocaleString("fr-FR")} XAF
              </Text>
              <Text fontSize="2xs" color="ink.500" mt="1.5" fontWeight="600">
                MTN: {Number(metrics.mtnBalance).toLocaleString("fr-FR")} XAF • Orange: {Number(metrics.orangeBalance).toLocaleString("fr-FR")} XAF
              </Text>
            </Box>

            {/* KPI 2 : Total collecté confirmé */}
            <Box p="5" rounded="2xl" bg="paper.0" border="1px solid" borderColor="paper.200" boxShadow="0 1px 3px rgba(0,0,0,0.02)">
              <Flex justify="space-between" align="flex-start" mb="2">
                <Text fontSize="xs" color="ink.500" fontWeight="700" textTransform="uppercase" letterSpacing="0.05em">
                  Total Collecté (Validé)
                </Text>
                <Box p="2" rounded="xl" bg="green.50" color="green.600">
                  <LuArrowUpRight size={16} />
                </Box>
              </Flex>
              <Text fontFamily="heading" fontWeight="900" fontSize="2xl" color="green.700">
                {Number(metrics.totalCollected).toLocaleString("fr-FR")} XAF
              </Text>
              <Text fontSize="2xs" color="green.600" mt="1.5" fontWeight="600">
                {metrics.successfulCount} transaction{metrics.successfulCount > 1 ? "s" : ""} validée{metrics.successfulCount > 1 ? "s" : ""}
              </Text>
            </Box>

            {/* KPI 3 : Taux de succès */}
            <Box p="5" rounded="2xl" bg="paper.0" border="1px solid" borderColor="paper.200" boxShadow="0 1px 3px rgba(0,0,0,0.02)">
              <Flex justify="space-between" align="flex-start" mb="2">
                <Text fontSize="xs" color="ink.500" fontWeight="700" textTransform="uppercase" letterSpacing="0.05em">
                  Taux de Succès
                </Text>
                <Box p="2" rounded="xl" bg="blue.50" color="blue.600">
                  <LuTrendingUp size={16} />
                </Box>
              </Flex>
              <Text fontFamily="heading" fontWeight="900" fontSize="2xl" color="ink.900">
                {metrics.successRate}
              </Text>
              <Text fontSize="2xs" color="ink.500" mt="1.5">
                Sur {metrics.totalCount} commande{metrics.totalCount > 1 ? "s" : ""} au total
              </Text>
            </Box>

            {/* KPI 4 : En attente & Échecs */}
            <Box p="5" rounded="2xl" bg="paper.0" border="1px solid" borderColor="paper.200" boxShadow="0 1px 3px rgba(0,0,0,0.02)">
              <Flex justify="space-between" align="flex-start" mb="2">
                <Text fontSize="xs" color="ink.500" fontWeight="700" textTransform="uppercase" letterSpacing="0.05em">
                  En Attente & Échecs
                </Text>
                <Box p="2" rounded="xl" bg="yellow.50" color="yellow.700">
                  <LuSmartphone size={16} />
                </Box>
              </Flex>
              <HStack gap="3" align="baseline">
                <Text fontFamily="heading" fontWeight="900" fontSize="2xl" color="yellow.700">
                  {metrics.pendingCount}
                </Text>
                <Text fontSize="xs" color="ink.400">
                  en cours
                </Text>
                <Text fontFamily="heading" fontWeight="900" fontSize="2xl" color="red.600" ml="2">
                  {metrics.failedCount}
                </Text>
                <Text fontSize="xs" color="ink.400">
                  échec{metrics.failedCount > 1 ? "s" : ""}
                </Text>
              </HStack>
              <Text fontSize="2xs" color="ink.500" mt="1.5">
                Alertes solde insuffisant ou timeout
              </Text>
            </Box>
          </>
        )}
      </SimpleGrid>

      {/* Table des Transactions & Filtres */}
      <Box p="5" rounded="3xl" bg="paper.0" border="1px solid" borderColor="paper.200">
        <Flex direction={{ base: "column", lg: "row" }} justify="space-between" align={{ base: "stretch", lg: "center" }} gap="4" mb="6">
          {/* Barre de recherche */}
          <HStack flex="1" maxW={{ lg: "400px" }} bg="paper.100" rounded="full" px="3.5" py="1.5" border="1px solid" borderColor="paper.200">
            <LuSearch size={15} color="#71717a" />
            <Input
              placeholder="Rechercher par référence, téléphone, client ou pack..."
              variant="unstyled"
              fontSize="xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              border="none"
              _focus={{ outline: "none" }}
            />
          </HStack>

          {/* Filtres par statut et opérateur */}
          <Flex wrap="wrap" gap="2" align="center">
            {/* Filtre statut */}
            <HStack gap="1">
              {[
                { id: "ALL", label: "Tous les statuts" },
                { id: "SUCCESSFUL", label: "Réussi" },
                { id: "PENDING", label: "En attente" },
                { id: "FAILED", label: "Échoué" },
              ].map((f) => (
                <Button
                  key={f.id}
                  size="xs"
                  rounded="full"
                  px="3"
                  variant={statusFilter === f.id ? "solid" : "ghost"}
                  bg={statusFilter === f.id ? "brand.violetDeep" : "paper.100"}
                  color={statusFilter === f.id ? "white" : "ink.700"}
                  onClick={() => setStatusFilter(f.id)}
                >
                  {f.label}
                </Button>
              ))}
            </HStack>

            {/* Filtre opérateur */}
            <HStack gap="1" pl={{ lg: "2" }} borderLeftWidth={{ lg: "1px" }} borderColor="paper.200">
              {[
                { id: "ALL", label: "Opérateurs" },
                { id: "MTN", label: "MTN" },
                { id: "ORANGE", label: "Orange" },
              ].map((f) => (
                <Button
                  key={f.id}
                  size="xs"
                  rounded="full"
                  px="2.5"
                  variant={operatorFilter === f.id ? "solid" : "subtle"}
                  bg={operatorFilter === f.id ? "ink.900" : "paper.100"}
                  color={operatorFilter === f.id ? "white" : "ink.600"}
                  onClick={() => setOperatorFilter(f.id)}
                >
                  {f.label}
                </Button>
              ))}
            </HStack>
          </Flex>
        </Flex>

        {/* Tableau */}
        <Box overflowX="auto">
          <Table.Root size="sm" variant="outline">
            <Table.Header>
              <Table.Row bg="paper.50">
                <Table.ColumnHeader py="3">Référence & Date</Table.ColumnHeader>
                <Table.ColumnHeader>Client & Téléphone</Table.ColumnHeader>
                <Table.ColumnHeader>Pack & Notes</Table.ColumnHeader>
                <Table.ColumnHeader>Montant net</Table.ColumnHeader>
                <Table.ColumnHeader>Opérateur</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="right">Statut CamPay</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <ShimmerTableRow key={i} columns={6} />
                ))
              ) : transactions.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={6} textAlign="center" py="10">
                    <Stack align="center" gap="2">
                      <LuReceipt size={28} color="#94a3b8" />
                      <Text color="ink.500" fontSize="sm" fontWeight="600">
                        Aucune transaction trouvée
                      </Text>
                      <Text color="ink.400" fontSize="xs">
                        {searchQuery || statusFilter !== "ALL" || operatorFilter !== "ALL"
                          ? "Aucune opération ne correspond aux filtres appliqués."
                          : "Les encaissements MTN MoMo et Orange Money s'afficheront ici en direct."}
                      </Text>
                    </Stack>
                  </Table.Cell>
                </Table.Row>
              ) : (
                transactions.map((tx) => (
                  <Table.Row key={tx.id} _hover={{ bg: "paper.50" }} transition="background 0.15s">
                    {/* Référence & Date */}
                    <Table.Cell py="3">
                      <Stack gap="0">
                        <Text fontFamily="mono" fontSize="xs" fontWeight="700" color="ink.900">
                          {tx.reference ? `${tx.reference.slice(0, 16)}...` : tx.externalReference}
                        </Text>
                        <Text fontSize="10px" color="ink.400">
                          {new Date(tx.createdAt).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </Stack>
                    </Table.Cell>

                    {/* Client & Téléphone */}
                    <Table.Cell>
                      <Stack gap="0">
                        <Text fontSize="xs" fontWeight="600" color="ink.900">
                          {tx.user?.name || "Client anonyme"}
                        </Text>
                        <HStack gap="1" fontSize="10px" color="ink.500">
                          <LuSmartphone size={10} />
                          <Text fontFamily="mono">
                            {tx.phone || tx.user?.email || "Numéro non renseigné"}
                          </Text>
                        </HStack>
                      </Stack>
                    </Table.Cell>

                    {/* Pack & Notes */}
                    <Table.Cell>
                      <HStack gap="1.5">
                        <Text fontSize="xs" fontWeight="700" color="ink.900">
                          {tx.packId || "Pack"}
                        </Text>
                        <Badge bg="brand.violetTint" color="brand.violetDeep" size="xs" rounded="full" px="1.5">
                          +{tx.notes} Notes
                        </Badge>
                      </HStack>
                    </Table.Cell>

                    {/* Montant & Frais */}
                    <Table.Cell>
                      <Stack gap="0">
                        <Text fontWeight="800" fontSize="xs" color="ink.900">
                          {Number(tx.amount).toLocaleString("fr-FR")} {tx.currency}
                        </Text>
                        {tx.feeAmount > 0 && (
                          <Text fontSize="10px" color="ink.400">
                            dont +{tx.feeAmount} XAF frais (2%)
                          </Text>
                        )}
                      </Stack>
                    </Table.Cell>

                    {/* Opérateur */}
                    <Table.Cell>
                      {getOperatorBadge(tx.operator)}
                    </Table.Cell>

                    {/* Statut CamPay */}
                    <Table.Cell textAlign="right">
                      {getStatusBadge(tx.status, tx.failureReason)}
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>
        </Box>
      </Box>
    </Stack>
  );
}
