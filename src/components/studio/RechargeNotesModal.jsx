"use client";

import { useEffect, useState } from "react";
import { Badge, Box, Button, Flex, Grid, HStack, IconButton, Stack, Text } from "@chakra-ui/react";
import { LuCheck, LuSparkles, LuX, LuZap } from "react-icons/lu";
import { plans } from "@/data/content";
import { accent } from "@/theme/system";
import { api } from "@/lib/apiClient";

export default function RechargeNotesModal({ isOpen, onClose, onRechargeSuccess, currentNotes = 0 }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [livePlans, setLivePlans] = useState(plans);

  useEffect(() => {
    if (isOpen) {
      api
        .get("/api/pricing")
        .then((res) => {
          if (res?.plans && res.plans.length > 0) {
            setLivePlans(res.plans);
          }
        })
        .catch((err) => console.warn("[RechargeModal] Plans en cache:", err.message));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePurchase = (plan) => {
    const planNotes = Number(plan.notes ?? plan.note ?? 4);
    setSelectedPlan(plan.name);
    // Simulation de recharge instantanée
    setTimeout(() => {
      onRechargeSuccess(planNotes, plan.name);
      setSuccessMsg(`Félicitations ! +${planNotes} Notes créditées avec succès.`);
      setTimeout(() => {
        setSuccessMsg("");
        setSelectedPlan(null);
        onClose();
      }, 1400);
    }, 600);
  };

  return (
    <Box position="fixed" inset="0" zIndex="100" display="flex" alignItems="center" justifyContent="center" p="4" bg="rgba(24, 24, 27, 0.65)" backdropFilter="blur(8px)">
      <Box
        w="full"
        maxW="4xl"
        maxH="90vh"
        overflowY="auto"
        bg="paper.0"
        rounded="3xl"
        borderWidth="1px"
        borderColor="paper.300"
        boxShadow="0 25px 60px -15px rgba(0, 0, 0, 0.3)"
        p={{ base: "6", md: "8" }}
        position="relative"
      >
        {/* Bouton fermer */}
        <Box position="absolute" top="6" right="6">
          <IconButton size="sm" variant="ghost" rounded="full" onClick={onClose} aria-label="Fermer">
            <LuX size={18} />
          </IconButton>
        </Box>

        {/* En-tête */}
        <Stack gap="2" mb="8" textAlign="center" align="center">
          <HStack
            px="3.5"
            py="1"
            rounded="full"
            bg="brand.violetTint"
            color="brand.violetDeep"
            fontFamily="ui"
            fontWeight="600"
            fontSize="xs"
            gap="2"
          >
            <LuZap size={14} />
            Solde actuel : <b>{currentNotes} Note{currentNotes > 1 ? "s" : ""}</b>
          </HStack>
          <Text fontFamily="heading" fontWeight="800" fontSize={{ base: "2xl", md: "3xl" }} letterSpacing="-0.03em" color="ink.900">
            Recharger vos Notes Musicales 🎵
          </Text>
          <Text fontSize="sm" color="ink.500" maxW="lg">
            Chaque chanson nécessite <b>2 Notes</b> pour être composée par l&apos;IA. Choisissez le pack ou le plan qui correspond à votre rythme créatif.
          </Text>
        </Stack>

        {successMsg && (
          <Box mb="6" p="4" rounded="2xl" bg="green.50" borderWidth="1px" borderColor="green.300" textAlign="center">
            <Text fontFamily="ui" fontWeight="700" color="green.700" fontSize="sm">
              ✨ {successMsg}
            </Text>
          </Box>
        )}

        {/* Grille des offres synchronisées dynamiquement */}
        <Grid templateColumns={{ base: "1fr", md: `repeat(${Math.min(livePlans.length, 3)}, 1fr)` }} gap="5">
          {livePlans.map((p) => {
            const planNotes = Number(p.notes ?? p.note ?? 4);
            const songCount = Math.floor(planNotes / 2);
            const isProcessing = selectedPlan === p.name;
            const priceText = p.price !== undefined ? `${p.price.toLocaleString()} ${p.currency || "XAF"}` : p.monthly ? `${p.monthly} €` : "Tarif disponible";

            return (
              <Box
                key={p.id || p.name}
                rounded="2xl"
                p="6"
                bg={p.popular ? "paper.0" : "paper.50"}
                borderWidth="2px"
                borderColor={p.popular ? "brand.violetDeep" : "paper.200"}
                boxShadow={p.popular ? "0 10px 30px rgba(124, 58, 237, 0.15)" : "none"}
                display="flex"
                flexDirection="column"
                justifyContent="space-between"
                position="relative"
              >
                {p.popular && (
                  <Box position="absolute" top="-3" right="6">
                    <Badge px="3" py="0.5" rounded="full" bg={accent.primary} color="white" fontWeight="700" fontSize="2xs">
                      {p.badge || "Le plus populaire"}
                    </Badge>
                  </Box>
                )}

                <Stack gap="4">
                  <Box>
                    <Text fontFamily="heading" fontWeight="800" fontSize="lg" color="ink.900">
                      {p.name}
                    </Text>
                    <Text fontSize="xs" color="ink.500" minH="32px">
                      {p.description}
                    </Text>
                  </Box>

                  {/* Mise en avant du nombre de Notes */}
                  <Box p="3" rounded="xl" bg="brand.violetTint" borderWidth="1px" borderColor="brand.violet">
                    <HStack justify="space-between" align="baseline">
                      <Text fontFamily="heading" fontWeight="800" fontSize="2xl" color="brand.violetDeep">
                        +{planNotes} Notes
                      </Text>
                      <Text fontFamily="ui" fontWeight="700" fontSize="xs" color="brand.violetDeep">
                        = {songCount} chansons
                      </Text>
                    </HStack>
                    <Text fontSize="2xs" color="ink.500" mt="0.5">
                      (Coût : 2 notes par chanson créée)
                    </Text>
                  </Box>

                  <Box>
                    <HStack align="baseline" gap="1">
                      <Text fontFamily="heading" fontWeight="800" fontSize="3xl" color="ink.900">
                        {priceText}
                      </Text>
                    </HStack>
                    <Text fontSize="2xs" color="ink.400">
                      Soit environ {Math.round((p.price || 2000) / (songCount || 1))} XAF par titre généré
                    </Text>
                  </Box>

                  {/* Fonctionnalités incluses */}
                  <Stack gap="2" pt="2" borderTopWidth="1px" borderColor="paper.200">
                    {p.features.slice(0, 4).map((f) => (
                      <HStack key={f} gap="2" align="flex-start" fontSize="xs" color="ink.700">
                        <Box color="brand.violetDeep" mt="0.5">
                          <LuCheck size={14} strokeWidth={2.5} />
                        </Box>
                        <Text lineHeight="short">{f}</Text>
                      </HStack>
                    ))}
                  </Stack>
                </Stack>

                <Button
                  mt="6"
                  size="md"
                  rounded="full"
                  fontFamily="ui"
                  fontWeight="600"
                  color={p.popular ? "white" : "ink.900"}
                  background={p.popular ? accent.primary : "paper.200"}
                  _hover={{
                    background: p.popular ? "#6d28d9" : "paper.300",
                    transform: "translateY(-1px)",
                  }}
                  transition="all 0.2s"
                  onClick={() => handlePurchase(p)}
                  disabled={isProcessing}
                  w="full"
                >
                  <LuSparkles /> {isProcessing ? "Recharge…" : `Obtenir +${planNotes} Notes`}
                </Button>
              </Box>
            );
          })}
        </Grid>
      </Box>
    </Box>
  );
}
