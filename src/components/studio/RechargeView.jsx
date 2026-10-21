"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  HStack,
  IconButton,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  LuArrowLeft,
  LuArrowRight,
  LuCheck,
  LuCreditCard,
  LuLock,
  LuPlus,
  LuShieldCheck,
  LuSmartphone,
  LuSparkles,
  LuWandSparkles,
  LuZap,
} from "react-icons/lu";

import Logo from "@/components/common/Logo";
import { plans } from "@/data/content";
import { accent } from "@/theme/system";
import { useStudio } from "@/context/StudioContext";
import { api } from "@/lib/apiClient";

export default function RechargeView() {
  const router = useRouter();
  let studio = null;
  try {
    studio = useStudio();
  } catch (_) {}

  // Solde actuel
  const [notes, setNotes] = useState(studio?.notes ?? 6);
  // Étape du workflow : 1 = Choix du plan (Radio), 2 = Paiement, 3 = Confirmation succès
  const [step, setStep] = useState(1);
  // Plans disponibles synchronisés avec la base de données
  const [availablePlans, setAvailablePlans] = useState(plans);
  // Plan sélectionné (par défaut le plan Créateur le plus populaire)
  const [selectedPlanName, setSelectedPlanName] = useState("Créateur");
  // Méthode de paiement : "momo" (Mobile Money) ou "card" (Carte bancaire)
  const [paymentMethod, setPaymentMethod] = useState("momo");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [creditedNotes, setCreditedNotes] = useState(0);

  // Synchronisation dynamique des offres de tarification en direct depuis l'API
  useEffect(() => {
    api
      .get("/api/pricing")
      .then((res) => {
        if (res?.plans && res.plans.length > 0) {
          setAvailablePlans(res.plans);
          const popular = res.plans.find((p) => p.popular) || res.plans[0];
          if (popular) {
            setSelectedPlanName((prev) =>
              res.plans.some((p) => p.name === prev) ? prev : popular.name
            );
          }
        }
      })
      .catch((err) => console.warn("[RechargeView] Utilisation des plans locaux :", err.message));
  }, []);

  // Charger le solde depuis localStorage ou studio
  useEffect(() => {
    if (studio?.notes !== undefined) {
      setNotes(studio.notes);
    } else {
      try {
        const stored = localStorage.getItem("melostars_notes");
        if (stored !== null) {
          setNotes(parseInt(stored, 10));
        }
      } catch (_) {}
    }
  }, [studio?.notes]);

  const selectedPlan =
    availablePlans.find((p) => p.name === selectedPlanName || p.id === selectedPlanName) ||
    availablePlans[1] ||
    availablePlans[0] ||
    plans[0];

  const handleProceedToPayment = () => {
    setStep(2);
  };

  const handleConfirmPayment = async () => {
    setIsProcessing(true);

    if (paymentMethod === "card") {
      try {
        const packMap = {
          "Découverte": "pack_decouverte",
          "Pack Découverte": "pack_decouverte",
          "Créateur": "pack_createur",
          "Pack Créateur": "pack_createur",
          "Studio": "pack_studio",
          "Studio Pro": "pack_studio",
          "Pack Studio Pro": "pack_studio",
        };
        const packId = selectedPlan.id || packMap[selectedPlan.name] || "pack_createur";

        const res = await api.post("/api/stripe/checkout", { packId });
        if (res?.url && !res.mock) {
          window.location.href = res.url;
          return;
        }
      } catch (err) {
        console.warn("[RechargeView] Redirection Stripe, simulation locale:", err.message);
      }
    }

    // Simulation Mobile Money ou validation locale
    setTimeout(() => {
      const planNotes = Number(selectedPlan.notes ?? selectedPlan.note ?? 4);
      const newTotal = notes + planNotes;
      setNotes(newTotal);
      setCreditedNotes(planNotes);
      if (studio?.updateNotes) {
        studio.updateNotes(newTotal);
      } else {
        try {
          localStorage.setItem("melostars_notes", newTotal.toString());
        } catch (_) {}
      }
      setIsProcessing(false);
      setStep(3);
    }, 900);
  };

  return (
    <Box minH="100dvh" bg="paper.50" color="ink.900" py={{ base: "4", sm: "6", md: "10" }}>
      <Container maxW="xl" px={{ base: "4", sm: "6" }}>
        {/* BARRE DE RETOUR ET LOGO */}
        <Flex align="center" justify="space-between" mb={{ base: "6", md: "8" }}>
          <IconButton
            asChild
            size="sm"
            variant="ghost"
            rounded="full"
            color="ink.700"
            _hover={{ bg: "paper.200" }}
            aria-label="Retour au Studio"
          >
            <NextLink href="/studio">
              <LuArrowLeft size={18} />
            </NextLink>
          </IconButton>

          <Logo size="sm" />

          {/* Solde actuel */}
          <HStack
            gap="1.5"
            px="3"
            py="1"
            rounded="full"
            bg="brand.violetTint"
            borderWidth="1px"
            borderColor="brand.violet"
            color="brand.violetDeep"
            fontSize="xs"
            fontFamily="ui"
            fontWeight="700"
          >
            <Text>{notes} Notes</Text>
          </HStack>
        </Flex>

        {/* CONTENEUR PRINCIPAL DE LA PAGE */}
        <Box
          bg="paper.0"
          rounded="3xl"
          borderWidth="1px"
          borderColor="paper.200"
          boxShadow="0 15px 40px -10px rgba(0, 0, 0, 0.07)"
          p={{ base: "5", sm: "7", md: "9" }}
        >
          {/* ÉTAPE 1 : CHOIX DU PLAN (FORMAT RADIO ÉPURÉ, IDÉAL MOBILE) */}
          {step === 1 && (
            <Stack gap="6">
              {/* Titre et Explication */}
              <Stack gap="1.5" textAlign="center">
                <HStack justify="center" gap="1.5" color="brand.violetDeep" fontSize="xs" fontWeight="700" fontFamily="ui">
                  <LuZap size={14} />
                  <Text textTransform="uppercase" letterSpacing="0.05em">Recharge de Crédits</Text>
                </HStack>
                <Text
                  fontFamily="heading"
                  fontWeight="900"
                  fontSize={{ base: "2xl", sm: "3xl" }}
                  color="ink.900"
                  letterSpacing="-0.03em"
                >
                  Choisissez votre pack
                </Text>
                <Text fontSize="xs" color="ink.500" maxW="md" mx="auto">
                  Il faut <b>2 Notes</b> pour générer 1 musique complète par IA (paroles, mélodie et chant inclus).
                </Text>
              </Stack>

              {/* LISTE DE SÉLECTION SOUS FORME DE RADIO SIMPLE (PAS DE TABLEAUX COMPLEXES) */}
              <Stack gap="3">
                {availablePlans.map((p) => {
                  const isSelected = selectedPlanName === p.name || selectedPlanName === p.id;
                  const planNotes = Number(p.notes ?? p.note ?? 4);
                  const songsCount = Math.floor(planNotes / 2);
                  const priceLabel = p.price === 0 ? "Gratuit" : `${p.price.toLocaleString()} ${p.currency || "FCFA"}`;

                  return (
                    <Box
                      key={p.id || p.name}
                      as="button"
                      type="button"
                      onClick={() => setSelectedPlanName(p.name)}
                      p={{ base: "4", sm: "5" }}
                      rounded="2xl"
                      textAlign="left"
                      borderWidth="2px"
                      borderColor={isSelected ? "brand.violetDeep" : "paper.200"}
                      bg={isSelected ? "brand.violetTint" : "paper.0"}
                      boxShadow={isSelected ? "0 8px 24px rgba(124, 58, 237, 0.12)" : "none"}
                      _hover={{ borderColor: isSelected ? "brand.violetDeep" : "paper.350", transform: "translateY(-1px)" }}
                      transition="all 0.2s"
                      cursor="pointer"
                      w="full"
                    >
                      <Flex align="center" justify="space-between" gap="3">
                        {/* Radio circle et infos */}
                        <HStack gap={{ base: "3", sm: "4" }} align="center">
                          {/* Cercle Radio personnalisé */}
                          <Box
                            boxSize="5"
                            rounded="full"
                            borderWidth="2px"
                            borderColor={isSelected ? "brand.violetDeep" : "paper.350"}
                            bg={isSelected ? "brand.violetDeep" : "paper.0"}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            color="white"
                            flexShrink={0}
                          >
                            {isSelected && <LuCheck size={12} strokeWidth={3} />}
                          </Box>

                          {/* Nom et nombre de crédits */}
                          <Stack gap="0.5">
                            <HStack gap="2" align="center">
                              <Text fontFamily="heading" fontWeight="800" fontSize={{ base: "sm", sm: "md" }} color="ink.900">
                                {p.name}
                              </Text>
                              {p.popular && (
                                <Badge
                                  px="2"
                                  py="0.5"
                                  rounded="full"
                                  bg="brand.violetDeep"
                                  color="white"
                                  fontSize="2xs"
                                  fontFamily="ui"
                                  fontWeight="700"
                                >
                                Populaire
                                </Badge>
                              )}
                            </HStack>
                            <Text fontSize="xs" color="ink.500">
                              <b style={{ color: "#7c3aed" }}>{planNotes} Notes</b> • Soit {songsCount} chanson{songsCount > 1 ? "s" : ""}
                            </Text>
                          </Stack>
                        </HStack>

                        {/* Prix à droite */}
                        <Text
                          fontFamily="heading"
                          fontWeight="900"
                          fontSize={{ base: "md", sm: "lg" }}
                          color={isSelected ? "brand.violetDeep" : "ink.900"}
                          whiteSpace="nowrap"
                        >
                          {priceLabel}
                        </Text>
                      </Flex>
                    </Box>
                  );
                })}
              </Stack>

              {/* BOUTON SUIVANT */}
              <Button
                size="lg"
                rounded="full"
                color="white"
                background={accent.primary}
                onClick={handleProceedToPayment}
                _hover={{ transform: "translateY(-1px)", boxShadow: "0 8px 25px rgba(124, 58, 237, 0.4)" }}
                fontFamily="ui"
                fontWeight="700"
                fontSize="sm"
                gap="2"
                w="full"
                h="12"
              >
                Suivant : Procéder au paiement <LuArrowRight size={16} />
              </Button>
            </Stack>
          )}

          {/* ÉTAPE 2 : PAIEMENT SIMPLE ET SÉCURISÉ */}
          {step === 2 && (
            <Stack gap="6">
              {/* En-tête de paiement */}
              <Flex align="center" justify="space-between">
                <Button
                  size="xs"
                  variant="ghost"
                  rounded="full"
                  onClick={() => setStep(1)}
                  color="ink.500"
                  fontFamily="ui"
                >
                  <LuArrowLeft size={14} /> Changer de plan
                </Button>
                <Badge px="2.5" py="1" rounded="full" bg="paper.100" color="ink.600" fontSize="2xs">
                  Étape 2 sur 2
                </Badge>
              </Flex>

              {/* Récapitulatif du choix */}
              <Box p="4" rounded="2xl" bg="brand.violetTint" borderWidth="1.5px" borderColor="brand.violetDeep">
                <Flex justify="space-between" align="center">
                  <Stack gap="0.5">
                    <Text fontSize="2xs" fontFamily="ui" fontWeight="700" color="brand.violetDeep" textTransform="uppercase">
                      Pack sélectionné
                    </Text>
                    <Text fontFamily="heading" fontWeight="800" fontSize="md" color="ink.900">
                      Pack {selectedPlan.name}
                    </Text>
                    <Text fontSize="xs" color="ink.600">
                      Crédite <b>+{selectedPlan.note} Notes</b> ({Math.floor(selectedPlan.note / 2)} musiques)
                    </Text>
                  </Stack>
                  <Text fontFamily="heading" fontWeight="900" fontSize="2xl" color="brand.violetDeep">
                    {selectedPlan.price.toLocaleString()} FCFA
                  </Text>
                </Flex>
              </Box>

              {/* Méthode de paiement */}
              <Stack gap="3">
                <Text fontSize="xs" fontFamily="ui" fontWeight="700" color="ink.700">
                  Choisissez votre moyen de paiement :
                </Text>

                <HStack gap="3">
                  {/* Option Mobile Money */}
                  <Box
                    as="button"
                    type="button"
                    flex="1"
                    p="3.5"
                    rounded="2xl"
                    borderWidth="2px"
                    borderColor={paymentMethod === "momo" ? "brand.violetDeep" : "paper.200"}
                    bg={paymentMethod === "momo" ? "brand.violetTint" : "paper.0"}
                    onClick={() => setPaymentMethod("momo")}
                    cursor="pointer"
                    textAlign="center"
                  >
                    <HStack justify="center" gap="1.5" mb="1" color={paymentMethod === "momo" ? "brand.violetDeep" : "ink.700"}>
                      <LuSmartphone size={16} />
                      <Text fontFamily="ui" fontWeight="700" fontSize="xs">
                        Mobile Money
                      </Text>
                    </HStack>
                    <Text fontSize="2xs" color="ink.500">
                      Wave, Orange, MTN, MoMo
                    </Text>
                  </Box>

                  {/* Option Carte Bancaire */}
                  <Box
                    as="button"
                    type="button"
                    flex="1"
                    p="3.5"
                    rounded="2xl"
                    borderWidth="2px"
                    borderColor={paymentMethod === "card" ? "brand.violetDeep" : "paper.200"}
                    bg={paymentMethod === "card" ? "brand.violetTint" : "paper.0"}
                    onClick={() => setPaymentMethod("card")}
                    cursor="pointer"
                    textAlign="center"
                  >
                    <HStack justify="center" gap="1.5" mb="1" color={paymentMethod === "card" ? "brand.violetDeep" : "ink.700"}>
                      <LuCreditCard size={16} />
                      <Text fontFamily="ui" fontWeight="700" fontSize="xs">
                        Carte bancaire
                      </Text>
                    </HStack>
                    <Text fontSize="2xs" color="ink.500">
                      Visa, Mastercard
                    </Text>
                  </Box>
                </HStack>

                {/* Champ selon moyen de paiement */}
                {paymentMethod === "momo" ? (
                  <Stack gap="1.5" mt="2">
                    <Text fontSize="2xs" fontFamily="ui" fontWeight="600" color="ink.500">
                      Numéro de téléphone Wave / Orange / MTN :
                    </Text>
                    <Input
                      placeholder="+225 07 00 00 00 00"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      rounded="xl"
                      h="11"
                      fontSize="sm"
                      borderColor="paper.300"
                    />
                  </Stack>
                ) : (
                  <Stack gap="2" mt="2">
                    <Input
                      placeholder="Numéro de carte (4xxx xxxx xxxx xxxx)"
                      rounded="xl"
                      h="11"
                      fontSize="sm"
                      borderColor="paper.300"
                    />
                    <HStack gap="2">
                      <Input placeholder="MM/AA" rounded="xl" h="10" fontSize="xs" borderColor="paper.300" />
                      <Input placeholder="CVC" rounded="xl" h="10" fontSize="xs" borderColor="paper.300" />
                    </HStack>
                  </Stack>
                )}
              </Stack>

              {/* Bouton de confirmation de paiement */}
              <Button
                size="lg"
                rounded="full"
                color="white"
                background={accent.primary}
                onClick={handleConfirmPayment}
                loading={isProcessing}
                loadingText="Traitement sécurisé..."
                _hover={{ transform: "translateY(-1px)", boxShadow: "0 8px 25px rgba(124, 58, 237, 0.4)" }}
                fontFamily="ui"
                fontWeight="700"
                fontSize="sm"
                gap="2"
                w="full"
                h="12"
              >
                <LuLock size={15} /> Payer {selectedPlan.price.toLocaleString()} FCFA & Créditer
              </Button>
            </Stack>
          )}

          {/* ÉTAPE 3 : CONFIRMATION SUCCÈS */}
          {step === 3 && (
            <Stack gap="6" textAlign="center" py="4">
              <Box
                boxSize="16"
                rounded="full"
                bg="green.100"
                color="green.600"
                display="flex"
                alignItems="center"
                justifyContent="center"
                mx="auto"
                boxShadow="0 8px 24px rgba(34, 197, 94, 0.25)"
              >
                <LuCheck size={32} strokeWidth={3} />
              </Box>

              <Stack gap="1.5">
                <Text fontFamily="heading" fontWeight="900" fontSize="2xl" color="ink.900">
                  Recharge effectuée avec succès !
                </Text>
                <Text fontSize="sm" color="ink.600">
                  Votre compte a été crédité de <b style={{ color: "#7c3aed" }}>+{creditedNotes} Notes</b>.
                </Text>
                <HStack justify="center" gap="2" mt="2">
                  <Badge px="3" py="1" rounded="full" bg="brand.violetTint" color="brand.violetDeep" fontSize="sm" fontWeight="700">
                    Nouveau solde : {notes} Notes
                  </Badge>
                </HStack>
              </Stack>

              <Stack gap="2.5" pt="2">
                <Button
                  size="md"
                  rounded="full"
                  color="white"
                  background={accent.primary}
                  onClick={() => router.push("/studio/create")}
                  fontFamily="ui"
                  fontWeight="700"
                  gap="2"
                >
                  <LuWandSparkles size={16} /> Composer une musique maintenant
                </Button>

                <Button
                  size="md"
                  variant="outline"
                  rounded="full"
                  borderColor="paper.300"
                  color="ink.700"
                  onClick={() => router.push("/studio/profil")}
                  fontFamily="ui"
                >
                  Voir mon Profil
                </Button>
              </Stack>
            </Stack>
          )}
        </Box>

        {/* MENTIONS DE SÉCURITÉ EN BAS */}
        <HStack justify="center" gap="4" mt="6" color="ink.400" fontSize="2xs" fontFamily="ui" wrap="wrap">
          <HStack gap="1">
            <LuShieldCheck size={13} />
            <Text>Paiement 100% sécurisé</Text>
          </HStack>
          <Text>•</Text>
          <HStack gap="1">
            <LuZap size={13} />
            <Text>Crédit instantané</Text>
          </HStack>
          <Text>•</Text>
          <Text>Notes valables sans limite de temps</Text>
        </HStack>
      </Container>
    </Box>
  );
}
