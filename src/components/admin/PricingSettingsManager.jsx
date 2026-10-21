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
  Text,
  Textarea,
} from "@chakra-ui/react";
import {
  LuAlertCircle,
  LuCheck,
  LuCoins,
  LuEye,
  LuEyeOff,
  LuLayers,
  LuPencil,
  LuPlus,
  LuRotateCcw,
  LuSparkles,
  LuTag,
  LuTrash2,
  LuX,
  LuZap,
} from "react-icons/lu";

import { api } from "@/lib/apiClient";
import { formatMetric, formatCurrency } from "@/lib/formatters";
import { accent } from "@/theme/system";

const EMPTY_PLAN = {
  id: "",
  name: "",
  description: "",
  price: 2500,
  currency: "XAF",
  notes: 8,
  popular: false,
  badge: "",
  cta: "Choisir ce pack",
  features: [
    "8 Notes de création IA",
    "Génération en haute fidélité",
    "Export MP3 & WAV",
    "Licence commerciale incluse",
  ],
  isActive: true,
  sortOrder: 1,
};

export default function PricingSettingsManager({ onNotify }) {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null); // null si aucun formulaire ouvert
  const [isNewPlan, setIsNewPlan] = useState(false);
  const [featuresText, setFeaturesText] = useState("");

  const showToast = (msg) => {
    if (onNotify) onNotify(msg);
  };

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/api/admin/pricing");
      if (res?.plans) {
        setPlans(res.plans);
      }
    } catch (err) {
      console.error("[PricingManager] Erreur chargement:", err);
      showToast("Impossible de charger les plans : " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleOpenCreate = () => {
    const nextOrder = plans.length + 1;
    const defaultNew = {
      ...EMPTY_PLAN,
      id: `pack_custom_${Date.now()}`,
      sortOrder: nextOrder,
    };
    setEditingPlan(defaultNew);
    setFeaturesText(defaultNew.features.join("\n"));
    setIsNewPlan(true);
  };

  const handleOpenEdit = (plan) => {
    setEditingPlan({ ...plan });
    setFeaturesText(Array.isArray(plan.features) ? plan.features.join("\n") : "");
    setIsNewPlan(false);
  };

  const handleCloseModal = () => {
    setEditingPlan(null);
    setFeaturesText("");
    setIsNewPlan(false);
  };

  const handleSavePlan = async (e) => {
    if (e) e.preventDefault();
    if (!editingPlan) return;

    if (!editingPlan.name?.trim()) {
      showToast("Veuillez renseigner le nom du pack.");
      return;
    }

    if (!editingPlan.price && editingPlan.price !== 0) {
      showToast("Veuillez renseigner un tarif valide.");
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanFeatures = featuresText
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean);

      const payload = {
        ...editingPlan,
        name: editingPlan.name.trim(),
        description: editingPlan.description?.trim() || "",
        price: Number(editingPlan.price) || 0,
        notes: Number(editingPlan.notes) || 4,
        features: cleanFeatures,
        sortOrder: Number(editingPlan.sortOrder) || 1,
      };

      if (isNewPlan) {
        const res = await api.post("/api/admin/pricing", payload);
        if (res?.plans) setPlans(res.plans);
        showToast(`Nouveau pack '${payload.name}' ajouté avec succès !`);
      } else {
        const res = await api.put("/api/admin/pricing", payload);
        if (res?.plans) setPlans(res.plans);
        showToast(`Pack '${payload.name}' mis à jour avec succès !`);
      }

      handleCloseModal();
    } catch (err) {
      console.error("[PricingManager] Erreur sauvegarde:", err);
      showToast("Erreur lors de la sauvegarde : " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (plan) => {
    const newStatus = !plan.isActive;
    try {
      const res = await api.put("/api/admin/pricing", {
        id: plan.id,
        isActive: newStatus,
      });
      if (res?.plans) {
        setPlans(res.plans);
      } else {
        setPlans((prev) =>
          prev.map((p) => (p.id === plan.id ? { ...p, isActive: newStatus } : p))
        );
      }
      showToast(`Pack '${plan.name}' ${newStatus ? "activé" : "désactivé"}.`);
    } catch (err) {
      showToast("Erreur lors de l'activation/désactivation : " + err.message);
    }
  };

  const handleDeletePlan = async (plan) => {
    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer définitivement le pack '${plan.name}' ? Cette action est irréversible.`
      )
    ) {
      return;
    }

    try {
      const res = await api.delete(`/api/admin/pricing?id=${encodeURIComponent(plan.id)}`);
      if (res?.plans) {
        setPlans(res.plans);
      } else {
        setPlans((prev) => prev.filter((p) => p.id !== plan.id));
      }
      showToast(`Pack '${plan.name}' supprimé avec succès.`);
    } catch (err) {
      showToast("Erreur lors de la suppression : " + err.message);
    }
  };

  return (
    <Box p="6" rounded="3xl" bg="paper.0" border="1px solid" borderColor="paper.200" position="relative">
      {/* En-tête de la section Pricing */}
      <Flex
        direction={{ base: "column", sm: "row" }}
        justify="space-between"
        align={{ base: "flex-start", sm: "center" }}
        gap="4"
        mb="6"
      >
        <HStack gap="3">
          <Box p="2.5" rounded="2xl" bg="brand.violetTint" color="brand.violetDeep">
            <LuLayers size={22} />
          </Box>
          <Stack gap="0.5">
            <HStack gap="2">
              <Text fontFamily="heading" fontWeight="700" fontSize="lg">
                Grille Tarifaire & Packs de Notes
              </Text>
              <Badge bg="brand.violetTint" color="brand.violetDeep" px="2" py="0.5" rounded="full" fontSize="10px" fontWeight="700">
                Live Sync
              </Badge>
            </HStack>
            <Text fontSize="xs" color="ink.500">
              Gérez les prix, le volume de Notes accordées et les fonctionnalités affichées sur le site et le Studio.
            </Text>
          </Stack>
        </HStack>

        <HStack gap="2">
          <Button
            size="sm"
            variant="outline"
            rounded="xl"
            borderColor="paper.300"
            color="ink.700"
            onClick={fetchPlans}
            disabled={isLoading}
            title="Rafraîchir les plans"
          >
            <LuRotateCcw size={14} className={isLoading ? "animate-spin" : ""} />
          </Button>

          <Button
            size="sm"
            rounded="xl"
            bg="brand.violetDeep"
            color="white"
            onClick={handleOpenCreate}
            fontWeight="600"
            _hover={{ bg: "brand.violet" }}
          >
            <HStack gap="1.5">
              <LuPlus size={16} />
              <Text>Nouveau Pack</Text>
            </HStack>
          </Button>
        </HStack>
      </Flex>

      {/* Contenu : Liste des packs ou état de chargement */}
      {isLoading ? (
        <Flex py="12" justify="center" align="center" direction="column" gap="3">
          <Spinner size="md" color="brand.violetDeep" />
          <Text fontSize="xs" color="ink.500">
            Chargement de la grille tarifaire...
          </Text>
        </Flex>
      ) : plans.length === 0 ? (
        <Box p="8" textAlign="center" rounded="2xl" bg="paper.50" border="1px dashed" borderColor="paper.300">
          <Text fontSize="sm" fontWeight="600" color="ink.700" mb="2">
            Aucun pack tarifaire configuré
          </Text>
          <Text fontSize="xs" color="ink.500" mb="4">
            Créez votre première offre pour permettre à vos utilisateurs d'acheter des Notes.
          </Text>
          <Button size="sm" rounded="xl" bg="brand.violetDeep" color="white" onClick={handleOpenCreate}>
            <LuPlus size={15} /> Créer un premier pack
          </Button>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="4">
          {plans.map((p) => {
            const songsEstimate = Math.floor(p.notes / 2);
            return (
              <Box
                key={p.id}
                p="5"
                rounded="2xl"
                bg={p.popular ? "linear-gradient(135deg, rgba(124, 58, 237, 0.04) 0%, rgba(255, 255, 255, 0.9) 100%)" : "paper.50"}
                border="1.5px solid"
                borderColor={p.popular ? "brand.violetDeep" : p.isActive ? "paper.200" : "paper.300"}
                opacity={p.isActive ? 1 : 0.65}
                position="relative"
                display="flex"
                flexDirection="column"
                justifyContent="space-between"
                transition="all 0.2s"
                _hover={{
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.06)",
                  transform: "translateY(-2px)",
                }}
              >
                <Stack gap="3">
                  {/* Badge d'état & Tag Populaire */}
                  <Flex justify="space-between" align="center">
                    <HStack gap="1.5">
                      <Badge
                        size="sm"
                        rounded="full"
                        px="2"
                        py="0.5"
                        colorPalette={p.isActive ? "green" : "gray"}
                        fontSize="10px"
                        fontWeight="700"
                      >
                        {p.isActive ? "Actif en ligne" : "Masqué"}
                      </Badge>

                      {p.popular && (
                        <Badge
                          size="sm"
                          rounded="full"
                          px="2"
                          py="0.5"
                          bg="brand.pink"
                          color="white"
                          fontSize="10px"
                          fontWeight="700"
                        >
                          Populaire
                        </Badge>
                      )}
                    </HStack>

                    <Text fontSize="10px" color="ink.400" fontWeight="600">
                      Ordre #{p.sortOrder || 1}
                    </Text>
                  </Flex>

                  {/* Nom & Description */}
                  <Box>
                    <Text fontFamily="heading" fontWeight="800" fontSize="lg" color="ink.900">
                      {p.name}
                    </Text>
                    {p.badge && (
                      <Text fontSize="10px" color="brand.violetDeep" fontWeight="700" mt="0.5">
                        ✨ {p.badge}
                      </Text>
                    )}
                    <Text fontSize="xs" color="ink.500" mt="1" minH="32px">
                      {p.description || "Pack de crédits musicaux pour le studio."}
                    </Text>
                  </Box>

                  {/* Prix & Notes */}
                  <Box p="3" rounded="xl" bg="paper.0" border="1px solid" borderColor="paper.200">
                    <Flex justify="space-between" align="baseline">
                      <Text fontFamily="heading" fontWeight="800" fontSize="2xl" color="ink.900" letterSpacing="-0.03em">
                        {p.price?.toLocaleString()} {p.currency || "XAF"}
                      </Text>
                      <Badge bg="brand.violetTint" color="brand.violetDeep" px="2" py="1" rounded="full" fontWeight="700" fontSize="xs">
                        🎵 {p.notes} Notes
                      </Badge>
                    </Flex>
                    <Text fontSize="11px" color="ink.500" mt="1">
                      Équivaut à environ <b>{songsEstimate} chansons complètes</b> (2 notes / création)
                    </Text>
                  </Box>

                  {/* Liste des fonctionnalités */}
                  <Stack gap="1.5" py="1">
                    {(p.features || []).slice(0, 4).map((feat, idx) => (
                      <HStack key={idx} gap="2" align="flex-start" fontSize="xs" color="ink.700">
                        <Box color="brand.violetDeep" mt="0.5" flexShrink={0}>
                          <LuCheck size={13} />
                        </Box>
                        <Text lineHeight="1.3">{feat}</Text>
                      </HStack>
                    ))}
                    {(p.features || []).length > 4 && (
                      <Text fontSize="10px" color="ink.400" pl="5">
                        + {(p.features || []).length - 4} autre(s) avantage(s)...
                      </Text>
                    )}
                  </Stack>
                </Stack>

                {/* Actions : Modifier, Activer/Désactiver, Supprimer */}
                <Flex justify="space-between" align="center" pt="4" mt="4" borderTop="1px solid" borderColor="paper.200">
                  <HStack gap="1">
                    <IconButton
                      size="xs"
                      variant="ghost"
                      rounded="lg"
                      color="ink.600"
                      _hover={{ bg: "paper.200", color: "ink.900" }}
                      onClick={() => handleToggleActive(p)}
                      title={p.isActive ? "Désactiver temporairement ce pack" : "Activer ce pack"}
                      aria-label="Toggle statut"
                    >
                      {p.isActive ? <LuEye size={15} /> : <LuEyeOff size={15} />}
                    </IconButton>

                    <IconButton
                      size="xs"
                      variant="ghost"
                      rounded="lg"
                      color="red.600"
                      _hover={{ bg: "red.50", color: "red.700" }}
                      onClick={() => handleDeletePlan(p)}
                      title="Supprimer ce pack"
                      aria-label="Supprimer"
                    >
                      <LuTrash2 size={15} />
                    </IconButton>
                  </HStack>

                  <Button
                    size="xs"
                    variant="outline"
                    rounded="lg"
                    borderColor="paper.300"
                    color="brand.violetDeep"
                    _hover={{ bg: "brand.violetTint", borderColor: "brand.violetDeep" }}
                    onClick={() => handleOpenEdit(p)}
                  >
                    <HStack gap="1">
                      <LuPencil size={12} />
                      <Text fontWeight="600">Modifier</Text>
                    </HStack>
                  </Button>
                </Flex>
              </Box>
            );
          })}
        </SimpleGrid>
      )}

      {/* ========================================================= */}
      {/* MODAL / TIROIR D'ÉDITION ET CRÉATION DE PACK */}
      {/* ========================================================= */}
      {editingPlan && (
        <Box
          position="fixed"
          inset="0"
          zIndex="70"
          bg="rgba(15, 23, 42, 0.65)"
          backdropFilter="blur(8px)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="4"
        >
          <Box
            w="full"
            maxW="560px"
            maxH="90vh"
            overflowY="auto"
            bg="paper.0"
            rounded="3xl"
            p={{ base: "6", md: "7" }}
            border="1px solid"
            borderColor="paper.200"
            boxShadow="0 25px 60px -15px rgba(0, 0, 0, 0.25)"
            position="relative"
          >
            {/* En-tête modal */}
            <Flex justify="space-between" align="center" mb="5">
              <HStack gap="2.5">
                <Box p="2" rounded="xl" bg="brand.violetTint" color="brand.violetDeep">
                  <LuSparkles size={18} />
                </Box>
                <Text fontFamily="heading" fontWeight="800" fontSize="lg" color="ink.900">
                  {isNewPlan ? "Créer un nouveau pack de Notes" : `Modifier '${editingPlan.name}'`}
                </Text>
              </HStack>

              <IconButton
                size="sm"
                variant="ghost"
                rounded="full"
                color="ink.500"
                onClick={handleCloseModal}
                aria-label="Fermer"
              >
                <LuX size={18} />
              </IconButton>
            </Flex>

            {/* Formulaire */}
            <Stack as="form" gap="4" onSubmit={handleSavePlan}>
              <SimpleGrid columns={{ base: 1, sm: 2 }} gap="3">
                <Stack gap="1">
                  <Text fontSize="xs" fontWeight="700" color="ink.800">
                    Nom du pack *
                  </Text>
                  <Input
                    size="sm"
                    rounded="xl"
                    placeholder="Ex: Pack Découverte"
                    value={editingPlan.name}
                    onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                    required
                  />
                </Stack>

                <Stack gap="1">
                  <Text fontSize="xs" fontWeight="700" color="ink.800">
                    ID Technique unique
                  </Text>
                  <Input
                    size="sm"
                    rounded="xl"
                    placeholder="Ex: pack_createur"
                    value={editingPlan.id}
                    onChange={(e) => setEditingPlan({ ...editingPlan, id: e.target.value })}
                    disabled={!isNewPlan}
                  />
                </Stack>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, sm: 3 }} gap="3">
                <Stack gap="1">
                  <Text fontSize="xs" fontWeight="700" color="ink.800">
                    Tarif (Montant) *
                  </Text>
                  <Input
                    type="number"
                    min={0}
                    step={100}
                    size="sm"
                    rounded="xl"
                    placeholder="2500"
                    value={editingPlan.price}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                    required
                  />
                </Stack>

                <Stack gap="1">
                  <Text fontSize="xs" fontWeight="700" color="ink.800">
                    Devise
                  </Text>
                  <Input
                    size="sm"
                    rounded="xl"
                    placeholder="XAF"
                    value={editingPlan.currency}
                    onChange={(e) => setEditingPlan({ ...editingPlan, currency: e.target.value.toUpperCase() })}
                  />
                </Stack>

                <Stack gap="1">
                  <Text fontSize="xs" fontWeight="700" color="ink.800">
                    Nombre de Notes *
                  </Text>
                  <Input
                    type="number"
                    min={1}
                    size="sm"
                    rounded="xl"
                    placeholder="8"
                    value={editingPlan.notes}
                    onChange={(e) => setEditingPlan({ ...editingPlan, notes: Number(e.target.value) })}
                    required
                  />
                </Stack>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, sm: 2 }} gap="3">
                <Stack gap="1">
                  <Text fontSize="xs" fontWeight="700" color="ink.800">
                    Badge promo (Optionnel)
                  </Text>
                  <Input
                    size="sm"
                    rounded="xl"
                    placeholder="Ex: Le plus populaire, -20%"
                    value={editingPlan.badge || ""}
                    onChange={(e) => setEditingPlan({ ...editingPlan, badge: e.target.value })}
                  />
                </Stack>

                <Stack gap="1">
                  <Text fontSize="xs" fontWeight="700" color="ink.800">
                    Texte du bouton CTA
                  </Text>
                  <Input
                    size="sm"
                    rounded="xl"
                    placeholder="Ex: Choisir ce pack"
                    value={editingPlan.cta || ""}
                    onChange={(e) => setEditingPlan({ ...editingPlan, cta: e.target.value })}
                  />
                </Stack>
              </SimpleGrid>

              <Stack gap="1">
                <Text fontSize="xs" fontWeight="700" color="ink.800">
                  Description courte
                </Text>
                <Input
                  size="sm"
                  rounded="xl"
                  placeholder="Ex: Idéal pour créer vos 3 premières musiques."
                  value={editingPlan.description || ""}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                />
              </Stack>

              <Stack gap="1">
                <Flex justify="space-between" align="center">
                  <Text fontSize="xs" fontWeight="700" color="ink.800">
                    Avantages inclus (1 ligne par avantage)
                  </Text>
                  <Text fontSize="10px" color="ink.400">
                    Affichés avec une coche verte
                  </Text>
                </Flex>
                <Textarea
                  size="sm"
                  rows={4}
                  rounded="xl"
                  placeholder="8 Notes de création&#10;Export MP3 & WAV&#10;Licence commerciale incluse"
                  value={featuresText}
                  onChange={(e) => setFeaturesText(e.target.value)}
                />
              </Stack>

              {/* Options de visibilité & mise en avant */}
              <Box p="3" rounded="xl" bg="paper.50" border="1px solid" borderColor="paper.200">
                <SimpleGrid columns={{ base: 1, sm: 2 }} gap="3">
                  <HStack justify="space-between">
                    <Text fontSize="xs" fontWeight="600" color="ink.800">
                      Offre mise en avant (Populaire)
                    </Text>
                    <Button
                      size="2xs"
                      rounded="full"
                      variant={editingPlan.popular ? "solid" : "outline"}
                      bg={editingPlan.popular ? "brand.pink" : undefined}
                      color={editingPlan.popular ? "white" : "ink.600"}
                      onClick={() => setEditingPlan({ ...editingPlan, popular: !editingPlan.popular })}
                    >
                      {editingPlan.popular ? "Oui" : "Non"}
                    </Button>
                  </HStack>

                  <HStack justify="space-between">
                    <Text fontSize="xs" fontWeight="600" color="ink.800">
                      Pack actif en ligne
                    </Text>
                    <Button
                      size="2xs"
                      rounded="full"
                      variant={editingPlan.isActive ? "solid" : "outline"}
                      colorPalette={editingPlan.isActive ? "green" : "gray"}
                      onClick={() => setEditingPlan({ ...editingPlan, isActive: !editingPlan.isActive })}
                    >
                      {editingPlan.isActive ? "Visible" : "Masqué"}
                    </Button>
                  </HStack>
                </SimpleGrid>
              </Box>

              {/* Boutons d'action */}
              <HStack justify="flex-end" gap="2.5" pt="2">
                <Button size="sm" variant="outline" rounded="xl" onClick={handleCloseModal} disabled={isSubmitting}>
                  Annuler
                </Button>
                <Button
                  size="sm"
                  rounded="xl"
                  bg="brand.violetDeep"
                  color="white"
                  type="submit"
                  loading={isSubmitting}
                  fontWeight="600"
                >
                  <LuCheck size={14} />
                  {isNewPlan ? "Créer le pack" : "Enregistrer les modifications"}
                </Button>
              </HStack>
            </Stack>
          </Box>
        </Box>
      )}
    </Box>
  );
}
