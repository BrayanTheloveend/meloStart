"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Dialog,
  Flex,
  HStack,
  IconButton,
  Input,
  Portal,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import {
  LuBan,
  LuCheck,
  LuChevronDown,
  LuKey,
  LuMoreHorizontal,
  LuPlus,
  LuSearch,
  LuShieldAlert,
  LuShieldCheck,
  LuSparkles,
  LuTrash2,
  LuUserCheck,
  LuUserMinus,
  LuUserPlus,
  LuUsers,
  LuZap,
} from "react-icons/lu";

import { api } from "@/lib/apiClient";
import { formatMetric } from "@/lib/formatters";
import { ShimmerCard, ShimmerTableRow } from "@/components/common/Shimmer";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL"); // ALL, ADMIN, USER, SUSPENDED
  const [selectedUser, setSelectedUser] = useState(null);
  const [creditAmount, setCreditAmount] = useState(10);
  const [notification, setNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      if (searchQuery.trim()) query.set("search", searchQuery.trim());
      if (roleFilter !== "ALL") {
        if (roleFilter === "SUSPENDED") {
          query.set("status", "SUSPENDED");
        } else {
          query.set("role", roleFilter);
        }
      }

      const res = await api.get(`/api/admin/users?${query.toString()}`);
      if (res?.users) {
        setUsers(res.users);
      }
    } catch (err) {
      console.warn("[Admin Users] Erreur API:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const handleSearchSubmit = (e) => {
    if (e.key === "Enter") {
      loadUsers();
    }
  };

  // Filtrage local en temps réel
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      (u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q);

    if (!matchesQuery) return false;
    if (roleFilter === "ADMIN") return u.role === "ADMIN";
    if (roleFilter === "USER") return u.role === "USER" && u.status !== "SUSPENDED";
    if (roleFilter === "SUSPENDED") return u.status === "SUSPENDED";
    return true;
  });

  // Action : Créditer des notes
  const handleAddCredits = async (userId, amount) => {
    setActionLoadingId(userId);
    try {
      await api.patch(`/api/admin/users/${userId}`, {
        creditAdjustment: amount,
        reason: "Ajustement administratif console",
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, credits: u.credits + amount } : u))
      );
      setSelectedUser(null);
      showNotification(`+${amount} Notes ajoutées avec succès.`);
    } catch (err) {
      showNotification(`Erreur : ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Action : Basculer rôle (Admin / User)
  const handleToggleRole = async (userId) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    const newRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    setActionLoadingId(userId);
    try {
      await api.patch(`/api/admin/users/${userId}`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      showNotification(`Rôle mis à jour : ${newRole}.`);
    } catch (err) {
      showNotification(`Erreur : ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Action : Suspendre / Réactiver
  const handleToggleStatus = async (userId) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    const newStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setActionLoadingId(userId);
    try {
      await api.patch(`/api/admin/users/${userId}`, { status: newStatus });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
      );
      showNotification(`Compte ${newStatus === "ACTIVE" ? "réactivé" : "suspendu"}.`);
    } catch (err) {
      showNotification(`Erreur : ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Action : Supprimer définitivement
  const handleDeleteUser = async (userId) => {
    if (!confirm("Voulez-vous vraiment supprimer cet utilisateur ? Cette action est irréversible.")) return;
    setActionLoadingId(userId);
    try {
      await api.delete(`/api/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      showNotification("Compte utilisateur supprimé avec succès.");
    } catch (err) {
      showNotification(`Erreur : ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <Stack gap="8">
      {/* Toast Notification */}
      {notification && (
        <Box
          position="fixed"
          bottom="6"
          right="6"
          zIndex="50"
          bg="ink.900"
          color="white"
          px="4"
          py="3"
          rounded="2xl"
          boxShadow="xl"
          display="flex"
          alignItems="center"
          gap="2"
        >
          <LuCheck color="#10b981" />
          <Text fontSize="sm" fontWeight="600">
            {notification}
          </Text>
        </Box>
      )}

      {/* En-tête de la page */}
      <Flex direction={{ base: "column", sm: "row" }} justify="space-between" align={{ base: "flex-start", sm: "center" }} gap="4">
        <Stack gap="1">
          <HStack gap="2">
            <Text fontFamily="heading" fontWeight="800" fontSize={{ base: "2xl", md: "3xl" }} letterSpacing="-0.03em">
              Gestion des Utilisateurs
            </Text>
            <Badge colorPalette="blue" size="sm" rounded="full" px="2">
              {users.length} membres
            </Badge>
          </HStack>
          <Text color="ink.500" fontSize="sm">
            Visualisez les comptes, créditez des Notes manuellement et gérez les permissions d'accès.
          </Text>
        </Stack>
      </Flex>

      {/* Résumé chiffré */}
      <SimpleGrid columns={{ base: 1, sm: 3 }} gap="4">
        {isLoading && users.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <ShimmerCard key={i} h="80px" />
          ))
        ) : (
          <>
            <Box p="4" rounded="2xl" bg="paper.0" border="1px solid" borderColor="paper.200">
              <Text fontSize="xs" color="ink.500" fontWeight="600">TOTAL CRÉDITS EN CIRCULATION</Text>
              <HStack gap="2" mt="1">
                <LuZap color="#7c3aed" />
                <Text fontFamily="heading" fontWeight="800" fontSize="xl" title={String(users.reduce((acc, u) => acc + (u.credits || 0), 0))}>
                  {formatMetric(users.reduce((acc, u) => acc + (u.credits || 0), 0))} Notes
                </Text>
              </HStack>
            </Box>

            <Box p="4" rounded="2xl" bg="paper.0" border="1px solid" borderColor="paper.200">
              <Text fontSize="xs" color="ink.500" fontWeight="600">TITRES GÉNÉRÉS PAR LES UTILISATEURS</Text>
              <HStack gap="2" mt="1">
                <LuSparkles color="#06b6d4" />
                <Text fontFamily="heading" fontWeight="800" fontSize="xl" title={String(users.reduce((acc, u) => acc + (u.totalTracks || 0), 0))}>
                  {formatMetric(users.reduce((acc, u) => acc + (u.totalTracks || 0), 0))} Musiques
                </Text>
              </HStack>
            </Box>

            <Box p="4" rounded="2xl" bg="paper.0" border="1px solid" borderColor="paper.200">
              <Text fontSize="xs" color="ink.500" fontWeight="600">ADMINISTRATEURS ACTIFS</Text>
              <HStack gap="2" mt="1">
                <LuShieldCheck color="#10b981" />
                <Text fontFamily="heading" fontWeight="800" fontSize="xl">
                  {users.filter((u) => u.role === "ADMIN").length} Super Admins
                </Text>
              </HStack>
            </Box>
          </>
        )}
      </SimpleGrid>

      {/* Filtres et Barre de recherche */}
      <Box p="5" rounded="3xl" bg="paper.0" border="1px solid" borderColor="paper.200">
        <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "stretch", md: "center" }} gap="4" mb="6">
          <HStack flex="1" maxW="400px" bg="paper.100" rounded="full" px="3.5" py="1.5" border="1px solid" borderColor="paper.200">
            <LuSearch size={15} color="#71717a" />
            <Input
              placeholder="Rechercher par nom ou email..."
              variant="unstyled"
              fontSize="sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              border="none"
              _focus={{ outline: "none" }}
            />
          </HStack>

          {/* Onglets de filtrage */}
          <HStack gap="1.5" wrap="wrap">
            {[
              { id: "ALL", label: "Tous" },
              { id: "ADMIN", label: "Admins" },
              { id: "USER", label: "Utilisateurs" },
              { id: "SUSPENDED", label: "Suspendus" },
            ].map((tab) => (
              <Button
                key={tab.id}
                size="xs"
                rounded="full"
                px="3"
                variant={roleFilter === tab.id ? "solid" : "ghost"}
                bg={roleFilter === tab.id ? "brand.violetDeep" : "paper.100"}
                color={roleFilter === tab.id ? "white" : "ink.700"}
                onClick={() => setRoleFilter(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </HStack>
        </Flex>

        {/* Tableau des utilisateurs */}
        <Box overflowX="auto">
          <Table.Root size="sm" variant="outline">
            <Table.Header>
              <Table.Row bg="paper.50">
                <Table.ColumnHeader py="3">Utilisateur</Table.ColumnHeader>
                <Table.ColumnHeader>Rôle</Table.ColumnHeader>
                <Table.ColumnHeader>Solde Notes</Table.ColumnHeader>
                <Table.ColumnHeader>Musiques créées</Table.ColumnHeader>
                <Table.ColumnHeader>Total Dépensé</Table.ColumnHeader>
                <Table.ColumnHeader>Statut</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="right">Actions rapides</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <ShimmerTableRow key={i} columns={7} />
                ))
              ) : filteredUsers.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={7} textAlign="center" py="10">
                    <Stack align="center" gap="2">
                      <LuUsers size={28} color="#94a3b8" />
                      <Text color="ink.500" fontSize="sm" fontWeight="600">
                        Aucun utilisateur trouvé
                      </Text>
                      <Text color="ink.400" fontSize="xs">
                        {searchQuery ? "Aucun utilisateur ne correspond à votre recherche." : "Les utilisateurs inscrits apparaîtront ici."}
                      </Text>
                    </Stack>
                  </Table.Cell>
                </Table.Row>
              ) : (
                filteredUsers.map((u) => (
                <Table.Row key={u.id} _hover={{ bg: "paper.50" }} transition="background 0.15s">
                  {/* Profil */}
                  <Table.Cell py="3">
                    <HStack gap="3">
                      <Avatar.Root size="sm" rounded="full">
                        <Avatar.Fallback name={u.name} />
                        {u.avatar && <Avatar.Image src={u.avatar} />}
                      </Avatar.Root>
                      <Stack gap="0">
                        <Text fontWeight="700" fontSize="sm" color="ink.900">
                          {u.name}
                        </Text>
                        <Text fontSize="xs" color="ink.500">
                          {u.email}
                        </Text>
                      </Stack>
                    </HStack>
                  </Table.Cell>

                  {/* Rôle */}
                  <Table.Cell>
                    <Badge
                      size="sm"
                      rounded="full"
                      px="2"
                      bg={u.role === "ADMIN" ? "brand.violetTint" : "paper.200"}
                      color={u.role === "ADMIN" ? "brand.violetDeep" : "ink.700"}
                    >
                      {u.role}
                    </Badge>
                  </Table.Cell>

                  {/* Solde Notes */}
                  <Table.Cell>
                    <HStack gap="1">
                      <LuZap size={13} color="#7c3aed" />
                      <Text fontWeight="700" fontSize="sm">
                        {u.credits} Notes
                      </Text>
                    </HStack>
                  </Table.Cell>

                  {/* Musiques créées */}
                  <Table.Cell>
                    <Text fontSize="sm" color="ink.700">
                      {u.totalTracks} titres
                    </Text>
                  </Table.Cell>

                  {/* Dépensé */}
                  <Table.Cell>
                    <Text fontSize="sm" fontWeight="600" color="ink.800">
                      {u.totalSpent}
                    </Text>
                  </Table.Cell>

                  {/* Statut */}
                  <Table.Cell>
                    <Badge
                      colorPalette={u.status === "ACTIVE" ? "green" : "red"}
                      size="sm"
                      rounded="full"
                      px="2"
                    >
                      {u.status === "ACTIVE" ? "Actif" : "Suspendu"}
                    </Badge>
                  </Table.Cell>

                  {/* Actions */}
                  <Table.Cell textAlign="right">
                    <HStack gap="1.5" justify="flex-end">
                      {/* Bouton créditer */}
                      <Button
                        size="xs"
                        variant="subtle"
                        rounded="full"
                        colorPalette="purple"
                        onClick={() => setSelectedUser(u)}
                      >
                        <HStack gap="1">
                          <LuPlus size={12} />
                          <Text>Notes</Text>
                        </HStack>
                      </Button>

                      {/* Changer rôle */}
                      <Button
                        size="xs"
                        variant="ghost"
                        rounded="full"
                        onClick={() => handleToggleRole(u.id)}
                        title={u.role === "ADMIN" ? "Rétrograder en utilisateur" : "Promouvoir Admin"}
                      >
                        <LuKey size={13} />
                      </Button>

                      {/* Suspendre */}
                      <Button
                        size="xs"
                        variant="ghost"
                        rounded="full"
                        colorPalette={u.status === "ACTIVE" ? "red" : "green"}
                        onClick={() => handleToggleStatus(u.id)}
                        loading={actionLoadingId === u.id}
                        title={u.status === "ACTIVE" ? "Suspendre l'utilisateur" : "Réactiver le compte"}
                      >
                        {u.status === "ACTIVE" ? <LuBan size={13} /> : <LuCheck size={13} />}
                      </Button>

                      {/* Supprimer définitivement */}
                      <IconButton
                        aria-label="Supprimer définitivement"
                        size="xs"
                        variant="ghost"
                        rounded="full"
                        colorPalette="red"
                        onClick={() => handleDeleteUser(u.id)}
                        loading={actionLoadingId === u.id}
                        title="Supprimer définitivement"
                      >
                        <LuTrash2 size={13} />
                      </IconButton>
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
            </Table.Body>
          </Table.Root>
        </Box>
      </Box>

      {/* Modal / Boîte d'action pour créditer des Notes */}
      {selectedUser && (
        <Box
          position="fixed"
          top="0"
          left="0"
          w="100vw"
          h="100vh"
          bg="rgba(0,0,0,0.5)"
          zIndex="60"
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="4"
        >
          <Box bg="paper.0" p="6" rounded="3xl" maxW="420px" w="full" boxShadow="2xl">
            <Stack gap="4">
              <HStack justify="space-between">
                <Text fontFamily="heading" fontWeight="700" fontSize="lg">
                  Créditer des Notes
                </Text>
                <Button size="xs" variant="ghost" rounded="full" onClick={() => setSelectedUser(null)}>
                  ✕
                </Button>
              </HStack>

              <Text fontSize="sm" color="ink.600">
                Ajouter des crédits au solde de <strong>{selectedUser.name}</strong> ({selectedUser.email}).
                Solde actuel : <strong>{selectedUser.credits} Notes</strong>.
              </Text>

              <HStack gap="2">
                {[5, 10, 20, 50].map((amt) => (
                  <Button
                    key={amt}
                    size="sm"
                    variant={creditAmount === amt ? "solid" : "outline"}
                    bg={creditAmount === amt ? "brand.violetDeep" : undefined}
                    color={creditAmount === amt ? "white" : "ink.700"}
                    rounded="xl"
                    flex="1"
                    onClick={() => setCreditAmount(amt)}
                  >
                    +{amt}
                  </Button>
                ))}
              </HStack>

              <Flex justify="flex-end" gap="2" mt="2">
                <Button variant="ghost" size="sm" rounded="xl" onClick={() => setSelectedUser(null)}>
                  Annuler
                </Button>
                <Button
                  size="sm"
                  rounded="xl"
                  bg="brand.violetDeep"
                  color="white"
                  onClick={() => handleAddCredits(selectedUser.id, creditAmount)}
                >
                  Confirmer (+{creditAmount} Notes)
                </Button>
              </Flex>
            </Stack>
          </Box>
        </Box>
      )}
    </Stack>
  );
}
