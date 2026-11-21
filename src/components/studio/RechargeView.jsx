"use client";

import { useEffect, useState, useRef } from "react";
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
  LuExternalLink,
  LuLock,
  LuPlus,
  LuRefreshCw,
  LuShieldCheck,
  LuSmartphone,
  LuSparkles,
  LuWandSparkles,
  LuZap,
} from "react-icons/lu";

import Logo from "@/components/common/Logo";
import { Shimmer, ShimmerCircle } from "@/components/common/Shimmer";
import { accent } from "@/theme/system";
import { useStudio } from "@/context/StudioContext";
import { api } from "@/lib/apiClient";
import { LucideAlertCircle } from "lucide-react";

// Helper client : Détection de l'opérateur camerounais
function getClientCarrier(phone) {
  if (!phone) return null;
  const clean = phone.replace(/[^\d]/g, "");
  const suffix = clean.startsWith("237") ? clean.slice(3) : clean;
  if (suffix.startsWith("67") || suffix.startsWith("68") || /^(65[0-4])/.test(suffix)) {
    return { name: "MTN MoMo", color: "#854d0e", bg: "#fef9c3", border: "#facc15" };
  }
  if (suffix.startsWith("69") || /^(65[5-9])/.test(suffix)) {
    return { name: "Orange Money", color: "#9a3412", bg: "#ffedd5", border: "#fb923c" };
  }
  if (suffix.length >= 2) {
    return { name: "Mobile Money", color: "#6d28d9", bg: "#f5f3ff", border: "#c4b5fd" };
  }
  return null;
}

export default function RechargeView() {
  const router = useRouter();
  const studio = useStudio();

  // Solde actuel
  const [notes, setNotes] = useState(() => {
    if (studio?.notes !== undefined) return studio.notes;
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("pretymelo_notes") || localStorage.getItem("melostars_notes");
        if (stored !== null) return parseInt(stored, 10);
      } catch (_) {}
    }
    return 6;
  });
  // Étape du workflow : 1 = Choix du plan (Radio), 2 = Paiement, 3 = Confirmation succès
  const [step, setStep] = useState(1);
  // Plans disponibles chargés dynamiquement depuis PostgreSQL (aucun mock)
  const [availablePlans, setAvailablePlans] = useState([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  // Plan sélectionné
  const [selectedPlanName, setSelectedPlanName] = useState("");
  // Opérateur Mobile Money sélectionné : "mtn" (MTN MoMo) ou "orange" (Orange Money)
  const [selectedOperator, setSelectedOperator] = useState("mtn");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isWaitingPin, setIsWaitingPin] = useState(false);
  const [waitingReference, setWaitingReference] = useState("");
  const [statusText, setStatusText] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [creditedNotes, setCreditedNotes] = useState(0);

  const pollingRef = useRef(null);

  // Synchronisation dynamique des offres de tarification depuis la base de données
  useEffect(() => {
    setIsLoadingPlans(true);
    api
      .get("/api/pricing")
      .then((res) => {
        if (res?.plans && res.plans.length > 0) {
          setAvailablePlans(res.plans);
          const popular = res.plans.find((p) => p.popular) || res.plans[0];
          if (popular) {
            setSelectedPlanName((prev) =>
              prev && res.plans.some((p) => p.name === prev || p.id === prev)
                ? prev
                : (popular.id || popular.name)
            );
          }
        } else {
          setAvailablePlans([]);
        }
      })
      .catch((err) => {
        console.warn("[RechargeView] Erreur lors du chargement des plans de la DB :", err.message);
        setAvailablePlans([]);
      })
      .finally(() => {
        setIsLoadingPlans(false);
      });
  }, []);

  // Détection d'un retour depuis un lien de paiement (?status=success&ref=...)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get("ref");
    const statusParam = urlParams.get("status");

    if (ref && (statusParam === "success" || !statusParam)) {
      const timer = setTimeout(async () => {
        setIsProcessing(true);
        try {
          const res = await fetch(`/api/campay/status?ref=${encodeURIComponent(ref)}`);
          const data = await res.json();
          if (data.status === "SUCCESSFUL") {
            setCreditedNotes(data.notes || 12);
            if (data.newBalance !== undefined) {
              setNotes(data.newBalance);
              if (studio?.updateNotes) studio.updateNotes(data.newBalance);
            }
            setStep(3);
          } else if (data.status === "FAILED") {
            setPaymentError(data.message || "Le paiement n'a pas pu être validé.");
            setStep(2);
          }
        } catch (_) {
        } finally {
          setIsProcessing(false);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [studio]);

  // Nettoyage de l'intervalle de polling
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Démarrer la surveillance du paiement USSD en temps réel
  const startPolling = (reference, planNotes) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    let attempts = 0;
    const maxAttempts = 40; // 40 x 3s = 2 minutes

    pollingRef.current = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(pollingRef.current);
        setPaymentError("Le délai de validation a expiré. Si vous avez bien saisi votre code PIN, vos Notes seront créditées automatiquement.");
        setIsWaitingPin(false);
        return;
      }

      try {
        const res = await fetch(`/api/campay/status?reference=${encodeURIComponent(reference)}`);
        const data = await res.json();

        if (data.status === "SUCCESSFUL") {
          clearInterval(pollingRef.current);
          const finalBalance = data.newBalance !== undefined ? data.newBalance : (notes + planNotes);
          setNotes(finalBalance);
          setCreditedNotes(data.notes || planNotes);
          if (studio?.updateNotes) {
            studio.updateNotes(finalBalance);
          }
          setIsWaitingPin(false);
          setStep(3);
        } else if (data.status === "FAILED") {
          clearInterval(pollingRef.current);
          setPaymentError(data.message || "La transaction a été refusée ou annulée sur votre téléphone.");
          setIsWaitingPin(false);
        } else {
          setStatusText("En attente de validation sur votre téléphone...");
        }
      } catch (_) {}
    }, 3000);
  };

  const handleCancelWaitingPin = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsWaitingPin(false);
    setWaitingReference("");
    setStatusText("");
  };

  // Synchroniser le solde lorsque studio.notes change
  useEffect(() => {
    if (studio?.notes !== undefined) {
      const timer = setTimeout(() => {
        setNotes(studio.notes);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [studio?.notes]);

  const selectedPlan =
    availablePlans.find((p) => p.name === selectedPlanName || p.id === selectedPlanName) ||
    availablePlans[0] ||
    null;

  const handleProceedToPayment = () => {
    if (!selectedPlan) return;
    setStep(2);
  };

  const handleConfirmPayment = async () => {
    setPaymentError("");

    if (!selectedPlan) {
      setPaymentError("Veuillez sélectionner un pack avant de valider.");
      return;
    }

    const packId = selectedPlan.id || selectedPlan.name;
    const planNotes = Number(selectedPlan.notes ?? selectedPlan.note ?? 4);

    // Paiement Direct USSD via CamPay (MTN MoMo ou Orange Money)
    const cleanPhone = phoneNumber.replace(/[^\d]/g, "");
    if (!cleanPhone || cleanPhone.length < 8) {
      setPaymentError(`Veuillez renseigner un numéro de téléphone ${selectedOperator === "mtn" ? "MTN MoMo" : "Orange Money"} valide (ex: 6XXXXXXXX).`);
      return;
    }

    setIsProcessing(true);

    try {
      const res = await fetch("/api/campay/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId, phone: phoneNumber }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Impossible d'initier le paiement direct.");
      }

      setIsWaitingPin(true);
      setWaitingReference(data.reference);
      setStatusText(data.message || "Demande envoyée sur votre téléphone. Veuillez valider avec votre code PIN.");
      setIsProcessing(false);

      // Lancement de la surveillance en temps réel (polling)
      startPolling(data.reference, planNotes);
    } catch (err) {
      setPaymentError(err.message || "Erreur lors de l'envoi de la demande Mobile Money.");
      setIsProcessing(false);
    }
  };

  const carrier = getClientCarrier(phoneNumber);

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
                  Il faut <b>2 Notes</b> pour générer 1 musique complète (paroles, mélodie et chant inclus).
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
            <Stack gap="5">
              {/* Si on est en attente de validation USSD Push */}
              {isWaitingPin ? (
                <Stack gap="5" textAlign="center" py="4">
                  {/* Icone animée USSD */}
                  <Box
                    boxSize="20"
                    rounded="full"
                    bg="brand.violetTint"
                    borderWidth="2px"
                    borderColor="brand.violetDeep"
                    color="brand.violetDeep"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    mx="auto"
                    position="relative"
                    boxShadow="0 8px 30px rgba(124, 58, 237, 0.2)"
                  >
                    <LuSmartphone size={34} />
                    <Box
                      position="absolute"
                      top="1"
                      right="1"
                      boxSize="3.5"
                      rounded="full"
                      bg="#22c55e"
                      borderWidth="2px"
                      borderColor="white"
                    />
                  </Box>

                  <Stack gap="2">
                    <HStack justify="center" gap="2">
                      <Badge
                        px="3"
                        py="1"
                        rounded="full"
                        bg="brand.violetTint"
                        color="brand.violetDeep"
                        fontSize="xs"
                        fontWeight="700"
                        display="inline-flex"
                        alignItems="center"
                        gap="1.5"
                      >
                        <LuRefreshCw size={13} className="spin" />
                        Demande envoyée
                      </Badge>
                      {carrier && (
                        <Badge
                          px="2.5"
                          py="1"
                          rounded="full"
                          fontSize="2xs"
                          fontWeight="700"
                          style={{
                            backgroundColor: carrier.bg,
                            color: carrier.color,
                            border: `1px solid ${carrier.border}`,
                          }}
                        >
                          {carrier.name}
                        </Badge>
                      )}
                    </HStack>

                    <Text fontFamily="heading" fontWeight="900" fontSize="xl" color="ink.900">
                      Vérifiez votre téléphone
                    </Text>

                    <Text fontSize="sm" color="ink.600" maxW="sm" mx="auto">
                      Une demande de débit de{" "}
                      <b style={{ color: "#7c3aed" }}>
                        {selectedPlan.price.toLocaleString()} FCFA
                      </b>{" "}
                      a été envoyée au <b>{phoneNumber}</b>.
                    </Text>

                    <Box
                      p="3.5"
                      rounded="2xl"
                      bg="paper.100"
                      borderWidth="1px"
                      borderColor="paper.300"
                      maxW="sm"
                      mx="auto"
                      textAlign="left"
                    >
                      <Text fontSize="xs" fontWeight="700" color="ink.800" mb="1.5">
                        Instructions de validation :
                      </Text>
                      <Text fontSize="2xs" color="ink.600" lineHeight="1.6">
                        1. Saisissez votre <b>code secret (PIN)</b> sur le pop-up USSD qui s&apos;affiche sur votre écran mobile.<br />
                        2. Si l&apos;invite n&apos;apparaît pas sous 10 secondes :<br />
                        &nbsp;&nbsp;• <b>MTN MoMo</b> : composez <b>*126#</b> pour valider la transaction en attente.<br />
                        &nbsp;&nbsp;• <b>Orange Money</b> : composez <b>#150*50#</b> pour autoriser le retrait.
                      </Text>
                    </Box>

                    {statusText && (
                      <Text fontSize="xs" color="brand.violetDeep" fontWeight="600">
                        {statusText}
                      </Text>
                    )}
                  </Stack>

                  <Button
                    size="sm"
                    variant="ghost"
                    rounded="full"
                    color="ink.500"
                    alignSelf="center"
                    onClick={handleCancelWaitingPin}
                    fontFamily="ui"
                  >
                    Annuler ou changer de numéro
                  </Button>
                </Stack>
              ) : (
                <>
                  {/* En-tête de paiement */}
                  <Flex align="center" justify="space-between">
                    <Button
                      size="xs"
                      variant="ghost"
                      rounded="full"
                      onClick={() => {
                        setPaymentError("");
                        setStep(1);
                      }}
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
                    <Flex justify="space-between" flexDir={{md: 'row', base: 'column'}} align={{md: "center", base: 'inherit'}}>
                      <Stack gap="0.5">
                        <Text fontSize="2xs" fontFamily="ui" fontWeight="700" color="brand.violetDeep" textTransform="uppercase">
                          Pack sélectionné
                        </Text>
                        <Text fontFamily="heading" fontWeight="800" fontSize="md" color="ink.900">
                          {selectedPlan.name}
                        </Text>
                        <Text fontSize="xs" color="ink.600">
                          Crédite <b>+{selectedPlan.notes ?? selectedPlan.note} Notes</b> ({Math.floor((selectedPlan.notes ?? selectedPlan.note) / 2)} musiques)
                        </Text>
                      </Stack>
                      <Text fontFamily="heading" fontWeight="900" fontSize="2xl" color="brand.violetDeep">
                        {selectedPlan.price.toLocaleString()} FCFA
                      </Text>
                    </Flex>
                  </Box>

                  {/* Message d'erreur s'il y en a */}
                  {paymentError && (
                    <Box p="3.5" rounded="xl" bg="red.50" borderWidth="1px" borderColor="red.200" color="red.700">
                      <HStack gap="2.5" align="start">
                        <LucideAlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                        <Text fontSize="xs" fontWeight="600">
                          {paymentError}
                        </Text>
                      </HStack>
                    </Box>
                  )}

                  {/* Choix de la méthode de paiement : uniquement MTN MoMo ou Orange Money */}
                  <Stack gap="3">
                    <Text fontSize="xs" fontFamily="ui" fontWeight="700" color="ink.700">
                      Choisir la méthode de paiement :
                    </Text>

                    <HStack gap="3">
                      {/* Option MTN MoMo */}
                      <Box
                        as="button"
                        type="button"
                        flex="1"
                        p="3.5"
                        rounded="2xl"
                        borderWidth="2px"
                        borderColor={selectedOperator === "mtn" ? "#ca8a04" : "paper.200"}
                        bg={selectedOperator === "mtn" ? "#fefce8" : "paper.0"}
                        onClick={() => {
                          setSelectedOperator("mtn");
                          setPaymentError("");
                        }}
                        cursor="pointer"
                        textAlign="center"
                        transition="all 0.15s ease"
                        _hover={{ borderColor: "#eab308" }}
                      >
                        <HStack justify="center" gap="2" mb="1">
                          <Box
                            as="img"
                            src="/assets/operateur/mtn.jpg"
                            alt="MTN MoMo"
                            boxSize="7"
                            rounded="md"
                            objectFit="cover"
                            boxShadow="0 1px 3px rgba(0,0,0,0.12)"
                          />
                          <Text fontFamily="ui" fontWeight="700" fontSize="xs" color={selectedOperator === "mtn" ? "#854d0e" : "ink.800"}>
                            MTN MoMo
                          </Text>
                        </HStack>
                        <Text fontSize="2xs" color="ink.500">
                          Mobile Money (*126#)
                        </Text>
                      </Box>

                      {/* Option Orange Money */}
                      <Box
                        as="button"
                        type="button"
                        flex="1"
                        p="3.5"
                        rounded="2xl"
                        borderWidth="2px"
                        borderColor={selectedOperator === "orange" ? "#ea580c" : "paper.200"}
                        bg={selectedOperator === "orange" ? "#fff7ed" : "paper.0"}
                        onClick={() => {
                          setSelectedOperator("orange");
                          setPaymentError("");
                        }}
                        cursor="pointer"
                        textAlign="center"
                        transition="all 0.15s ease"
                        _hover={{ borderColor: "#f97316" }}
                      >
                        <HStack justify="center" gap="2" mb="1">
                          <Box
                            as="img"
                            src="/assets/operateur/orange.webp"
                            alt="Orange Money"
                            boxSize="7"
                            rounded="md"
                            objectFit="cover"
                            boxShadow="0 1px 3px rgba(0,0,0,0.12)"
                          />
                          <Text fontFamily="ui" fontWeight="700" fontSize="xs" color={selectedOperator === "orange" ? "#9a3412" : "ink.800"}>
                            Orange Money
                          </Text>
                        </HStack>
                        <Text fontSize="2xs" color="ink.500">
                          Orange Money (#150#)
                        </Text>
                      </Box>
                    </HStack>

                    {/* Champ de saisie du numéro avec drapeau du Cameroun */}
                    <Stack gap="1.5" mt="1">
                      <Flex justify="space-between" align="center">
                        <Text fontSize="2xs" fontFamily="ui" fontWeight="600" color="ink.600">
                          {selectedOperator === "mtn" ? "Numéro MTN MoMo :" : "Numéro Orange Money :"}
                        </Text>
                        <Badge
                          px="2"
                          py="0.5"
                          rounded="full"
                          fontSize="2xs"
                          fontWeight="700"
                          style={{
                            backgroundColor: selectedOperator === "mtn" ? "#fef9c3" : "#ffedd5",
                            color: selectedOperator === "mtn" ? "#854d0e" : "#9a3412",
                            border: `1px solid ${selectedOperator === "mtn" ? "#facc15" : "#fb923c"}`,
                          }}
                        >
                          {selectedOperator === "mtn" ? "MTN Cameroon" : "Orange Cameroun"}
                        </Badge>
                      </Flex>

                      {/* Input avec préfixe et drapeau du Cameroun */}
                      <Flex
                        align="center"
                        borderWidth="1.5px"
                        borderColor="paper.300"
                        rounded="xl"
                        bg="white"
                        px="3"
                        h="11"
                        gap="2.5"
                        _focusWithin={{ borderColor: "brand.violetDeep", boxShadow: "0 0 0 1px #7c3aed" }}
                      >
                        <HStack gap="1.5" flexShrink={0} pr="2.5" borderRightWidth="1.5px" borderColor="paper.200">
                          <Box
                            as="img"
                            src="https://flagcdn.com/w40/cm.png"
                            alt="Drapeau du Cameroun"
                            w="5"
                            h="3.5"
                            rounded="xs"
                            objectFit="cover"
                            boxShadow="0 1px 2px rgba(0,0,0,0.12)"
                            onError={(e) => {
                              e.currentTarget.src = "/assets/operateur/cm.png";
                            }}
                          />
                          <Text fontSize="xs" fontWeight="700" color="ink.700" fontFamily="ui">
                            +237
                          </Text>
                        </HStack>

                        <Input
                          border="none"
                          outline="none"
                          p="0"
                          h="full"
                          _focus={{ boxShadow: "none", outline: "none" }}
                          placeholder={selectedOperator === "mtn" ? "677 00 00 00 ou 68..." : "699 00 00 00 ou 655..."}
                          value={phoneNumber}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPhoneNumber(val);
                            if (paymentError) setPaymentError("");
                            const clean = val.replace(/[^\d]/g, "");
                            const suffix = clean.startsWith("237") ? clean.slice(3) : clean;
                            if (suffix.startsWith("67") || suffix.startsWith("68") || /^(65[0-4])/.test(suffix)) {
                              setSelectedOperator("mtn");
                            } else if (suffix.startsWith("69") || /^(65[5-9])/.test(suffix)) {
                              setSelectedOperator("orange");
                            }
                          }}
                          fontSize="sm"
                        />
                      </Flex>

                      <Text fontSize="2xs" color="ink.500">
                        Une invite USSD directe s&apos;affichera sur votre écran pour taper votre code secret.
                      </Text>
                    </Stack>
                  </Stack>

                  {/* Bouton de confirmation de paiement direct */}
                  <Button
                    size="lg"
                    rounded="full"
                    color="white"
                    background={accent.primary}
                    onClick={handleConfirmPayment}
                    loading={isProcessing}
                    loadingText="Initialisation..."
                    _hover={{ transform: "translateY(-1px)", boxShadow: "0 8px 25px rgba(124, 58, 237, 0.4)" }}
                    fontFamily="ui"
                    fontWeight="700"
                    fontSize="sm"
                    gap="2"
                    w="full"
                    h="12"
                    mt="2"
                  >
                    <LuSmartphone size={16} /> Payer {selectedPlan.price.toLocaleString()} FCFA ({selectedOperator === "mtn" ? "MTN MoMo" : "Orange Money"})
                  </Button>
                </>
              )}
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
