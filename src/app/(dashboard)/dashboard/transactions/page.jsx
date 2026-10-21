"use client";

import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Input,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import {
  LuArrowDownLeft,
  LuArrowUpRight,
  LuCheck,
  LuCreditCard,
  LuDownload,
  LuFileText,
  LuReceipt,
  LuSearch,
  LuSmartphone,
  LuTrendingUp,
  LuZap,
} from "react-icons/lu";

import { api } from "@/lib/apiClient";
import { ShimmerCard, ShimmerTableRow } from "@/components/common/Shimmer";

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMethod, setFilterMethod] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      if (searchQuery.trim()) query.set("search", searchQuery.trim());
      if (filterMethod !== "ALL") query.set("method", filterMethod);

      const res = await api.get(`/api/admin/transactions?${query.toString()}`);
      if (res?.transactions) {
        setTransactions(res.transactions);
      }
    } catch (err) {
      console.warn("[Admin Transactions] Erreur API:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [filterMethod]);

  const filteredTransactions = transactions.filter((tx) => {
    const q = searchQuery.toLowerCase();
    const matches =
      (tx.user?.name || "").toLowerCase().includes(q) ||
      (tx.user?.email || "").toLowerCase().includes(q) ||
      (tx.packName || "").toLowerCase().includes(q) ||
      (tx.stripeId || "").toLowerCase().includes(q);

    if (!matches) return false;
    if (filterMethod === "STRIPE" && !tx.paymentMethod?.includes("Stripe") && !tx.paymentMethod?.includes("Carte"))
      return false;
    if (filterMethod === "MOMO" && !tx.paymentMethod?.includes("Money")) return false;
    return true;
  });

  return (
    <Stack gap="8">
      {/* En-tête */}
      <Flex direction={{ base: "column", sm: "row" }} justify="space-between" align={{ base: "flex-start", sm: "center" }} gap="4">
        <Stack gap="1">
          <HStack gap="2">
            <Text fontFamily="heading" fontWeight="800" fontSize={{ base: "2xl", md: "3xl" }} letterSpacing="-0.03em">
              Transactions & Facturation
            </Text>
            <Badge colorPalette="green" size="sm" rounded="full" px="2">
              Stripe Connecté
            </Badge>
          </HStack>
          <Text color="ink.500" fontSize="sm">
            Suivi des encaissements par carte bancaire Stripe et Mobile Money (MTN / Orange).
          </Text>
        </Stack>

        <Button variant="outline" size="sm" rounded="xl" borderColor="paper.300">
          <HStack gap="2">
            <LuDownload size={14} />
            <Text>Exporter en CSV</Text>
          </HStack>
        </Button>
      </Flex>

      {/* Résumé financier */}
      <SimpleGrid columns={{ base: 1, sm: 3 }} gap="4">
        {isLoading && transactions.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <ShimmerCard key={i} h="105px" />
          ))
        ) : (
          <>
            <Box p="5" rounded="2xl" bg="paper.0" border="1px solid" borderColor="paper.200">
              <Text fontSize="xs" color="ink.500" fontWeight="700" textTransform="uppercase">
                CHIFFRE D'AFFAIRES GLOBAL
              </Text>
              <Text fontFamily="heading" fontWeight="800" fontSize="2xl" mt="1">
                {transactions.length > 0 ? "2 485 000 XAF" : "0 XAF"}
              </Text>
              <Text fontSize="xs" color="green.600" fontWeight="600" mt="1">
                Paiements Stripe & Mobile Money
              </Text>
            </Box>

            <Box p="5" rounded="2xl" bg="paper.0" border="1px solid" borderColor="paper.200">
              <Text fontSize="xs" color="ink.500" fontWeight="700" textTransform="uppercase">
                TRANSACTIONS ENREGISTRÉES
              </Text>
              <Text fontFamily="heading" fontWeight="800" fontSize="2xl" mt="1">
                {transactions.length} opération{transactions.length > 1 ? "s" : ""}
              </Text>
              <Text fontSize="xs" color="ink.500" mt="1">
                Recharges de Notes créateurs
              </Text>
            </Box>

            <Box p="5" rounded="2xl" bg="paper.0" border="1px solid" borderColor="paper.200">
              <Text fontSize="xs" color="ink.500" fontWeight="700" textTransform="uppercase">
                CANAUX DE PAIEMENT
              </Text>
              <HStack gap="4" mt="2" fontSize="xs">
                <HStack gap="1.5">
                  <LuCreditCard color="#7c3aed" />
                  <Text fontWeight="700">Stripe</Text>
                </HStack>
                <HStack gap="1.5">
                  <LuSmartphone color="#f59e0b" />
                  <Text fontWeight="700">MoMo / Orange</Text>
                </HStack>
              </HStack>
            </Box>
          </>
        )}
      </SimpleGrid>

      {/* Table des Transactions */}
      <Box p="5" rounded="3xl" bg="paper.0" border="1px solid" borderColor="paper.200">
        <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "stretch", md: "center" }} gap="4" mb="6">
          <HStack flex="1" maxW="440px" bg="paper.100" rounded="full" px="3.5" py="1.5" border="1px solid" borderColor="paper.200">
            <LuSearch size={15} color="#71717a" />
            <Input
              placeholder="Rechercher par utilisateur, email ou ID Stripe..."
              variant="unstyled"
              fontSize="sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              border="none"
              _focus={{ outline: "none" }}
            />
          </HStack>

          <HStack gap="1.5">
            {[
              { id: "ALL", label: "Toutes" },
              { id: "STRIPE", label: "Cartes (Stripe)" },
              { id: "MOMO", label: "Mobile Money" },
            ].map((f) => (
              <Button
                key={f.id}
                size="xs"
                rounded="full"
                px="3"
                variant={filterMethod === f.id ? "solid" : "ghost"}
                bg={filterMethod === f.id ? "brand.violetDeep" : "paper.100"}
                color={filterMethod === f.id ? "white" : "ink.700"}
                onClick={() => setFilterMethod(f.id)}
              >
                {f.label}
              </Button>
            ))}
          </HStack>
        </Flex>

        <Box overflowX="auto">
          <Table.Root size="sm" variant="outline">
            <Table.Header>
              <Table.Row bg="paper.50">
                <Table.ColumnHeader py="3">Identifiant & Pack</Table.ColumnHeader>
                <Table.ColumnHeader>Client</Table.ColumnHeader>
                <Table.ColumnHeader>Montant</Table.ColumnHeader>
                <Table.ColumnHeader>Notes créditées</Table.ColumnHeader>
                <Table.ColumnHeader>Méthode de paiement</Table.ColumnHeader>
                <Table.ColumnHeader>Date</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="right">Statut</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <ShimmerTableRow key={i} columns={7} />
                ))
              ) : filteredTransactions.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={7} textAlign="center" py="10">
                    <Stack align="center" gap="2">
                      <LuReceipt size={28} color="#94a3b8" />
                      <Text color="ink.500" fontSize="sm" fontWeight="600">
                        Aucune transaction enregistrée
                      </Text>
                      <Text color="ink.400" fontSize="xs">
                        {searchQuery ? "Aucun résultat trouvé pour votre recherche." : "Les paiements Stripe et Mobile Money s'afficheront ici en direct."}
                      </Text>
                    </Stack>
                  </Table.Cell>
                </Table.Row>
              ) : (
                filteredTransactions.map((tx) => (
                  <Table.Row key={tx.id} _hover={{ bg: "paper.50" }} transition="background 0.15s">
                    <Table.Cell py="3">
                      <Stack gap="0">
                        <Text fontWeight="700" fontSize="sm" color="ink.900">
                          {tx.packName}
                        </Text>
                        <Text fontSize="10px" fontFamily="mono" color="ink.400">
                          {tx.stripeId}
                        </Text>
                      </Stack>
                    </Table.Cell>

                    <Table.Cell>
                      <Stack gap="0">
                        <Text fontSize="xs" fontWeight="600" color="ink.900">
                          {tx.user.name}
                        </Text>
                        <Text fontSize="10px" color="ink.500">
                          {tx.user.email}
                        </Text>
                      </Stack>
                    </Table.Cell>

                    <Table.Cell>
                      <Text fontWeight="800" fontSize="sm" color="ink.900">
                        {tx.amount}
                      </Text>
                    </Table.Cell>

                    <Table.Cell>
                      <HStack gap="1">
                        <LuZap size={13} color="#7c3aed" />
                        <Text fontSize="xs" fontWeight="700">
                          +{tx.notes} Notes
                        </Text>
                      </HStack>
                    </Table.Cell>

                    <Table.Cell>
                      <Text fontSize="xs" color="ink.700">
                        {tx.paymentMethod}
                      </Text>
                    </Table.Cell>

                    <Table.Cell>
                      <Text fontSize="xs" color="ink.400">
                        {tx.createdAt}
                      </Text>
                    </Table.Cell>

                    <Table.Cell textAlign="right">
                      <Badge
                        colorPalette={tx.status === "PAID" ? "green" : "red"}
                        size="sm"
                        rounded="full"
                        px="2"
                      >
                        {tx.status === "PAID" ? "Payé" : "Remboursé"}
                      </Badge>
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
