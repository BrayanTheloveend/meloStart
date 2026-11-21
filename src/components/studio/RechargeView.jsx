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
  Image,
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
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

const MotionImage = motion.create ? motion.create(Image) : motion(Image);


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
  const MotionImage = motion.create ? motion.create(Image) : motion(Image);


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
  // Configuration des frais opérateur (CamPay 2%)
  const [feeSettings, setFeeSettings] = useState({ passFeesToCustomer: true, feePercentage: 2 });
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
  const [failureType, setFailureType] = useState(null);
  const [creditedNotes, setCreditedNotes] = useState(0);

  const pollingRef = useRef(null);

  // Synchronisation dynamique des offres de tarification depuis la base de données
  useEffect(() => {
    api
      .get("/api/pricing")
      .then((res) => {
        if (res?.feeSettings) {
          setFeeSettings(res.feeSettings);
        }
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
            setFailureType(data.failureReason || (data.isInsufficientFunds ? "INSUFFICIENT_FUNDS" : null));
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

  // Déclenchement de confettis festifs lors de la confirmation du succès (Étape 3)
  useEffect(() => {
    if (step === 3) {
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#7c3aed", "#8b5cf6", "#10b981", "#fbbf24", "#ec4899", "#38bdf8"],
        });
        const t1 = setTimeout(() => {
          confetti({
            particleCount: 45,
            angle: 60,
            spread: 55,
            origin: { x: 0.2, y: 0.65 },
            colors: ["#7c3aed", "#10b981", "#fbbf24"],
          });
        }, 220);
        const t2 = setTimeout(() => {
          confetti({
            particleCount: 45,
            angle: 120,
            spread: 55,
            origin: { x: 0.8, y: 0.65 },
            colors: ["#7c3aed", "#10b981", "#fbbf24"],
          });
        }, 360);

        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
        };
      } catch (_) {}
    }
  }, [step]);

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
          setFailureType(data.failureReason || (data.isInsufficientFunds ? "INSUFFICIENT_FUNDS" : null));
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

  // Calcul transparent des montants et frais opérateur
  const basePrice = selectedPlan ? Number(selectedPlan.price || selectedPlan.amount || 0) : 0;
  const feePercentage = Number(feeSettings?.feePercentage ?? 2);
  const passFeesToCustomer = Boolean(feeSettings?.passFeesToCustomer);
  const feeAmount = (passFeesToCustomer && feePercentage > 0)
    ? Math.round(basePrice * (feePercentage / 100))
    : 0;
  const totalPrice = basePrice + feeAmount;

  const handleProceedToPayment = () => {
    if (!selectedPlan) return;
    setStep(2);
  };

  const handleConfirmPayment = async () => {
    setPaymentError("");
    setFailureType(null);

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
      console.error("🔴 [RechargeView Collect Error Log]:", err);
      const isTechnicalError =
        err.message?.includes("Code") ||
        err.message?.includes("Unauthorized") ||
        err.message?.includes("CamPay") ||
        err.message?.includes("Token");

      const opLabel = selectedOperator === "mtn" ? "MTN MoMo" : "Orange Money";
      setPaymentError(
        isTechnicalError
          ? `Le service ${opLabel} est momentanément indisponible ou subit des perturbations réseau. Veuillez réessayer dans quelques instants.`
          : (err.message || `Impossible de joindre l'opérateur ${opLabel}.`)
      );
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

              {/* LISTE DE SÉLECTION : SHIMMERS PENDANT LE CHARGEMENT, SINON PLANS DE LA DB */}
              {isLoadingPlans ? (
                <Stack gap="3">
                  {[1, 2, 3].map((idx) => (
                    <Box
                      key={idx}
                      p={{ base: "4", sm: "5" }}
                      rounded="2xl"
                      borderWidth="2px"
                      borderColor="paper.200"
                      bg="paper.0"
                      w="full"
                    >
                      <Flex align="center" justify="space-between" gap="3">
                        <HStack gap={{ base: "3", sm: "4" }} align="center" flex="1">
                          <ShimmerCircle size="20px" />
                          <Stack gap="2" flex="1">
                            <HStack gap="2">
                              <Shimmer h="16px" w="120px" rounded="md" />
                              {idx === 2 && <Shimmer h="16px" w="60px" rounded="full" />}
                            </HStack>
                            <Shimmer h="12px" w="180px" rounded="md" />
                          </Stack>
                        </HStack>
                        <Shimmer h="20px" w="80px" rounded="md" />
                      </Flex>
                    </Box>
                  ))}
                </Stack>
              ) : availablePlans.length === 0 ? (
                <Box p="6" rounded="2xl" bg="paper.100" textAlign="center" color="ink.600">
                  <Text fontSize="sm" fontWeight="700" color="ink.800">
                    Aucun pack de recharge disponible
                  </Text>
                  <Text fontSize="xs" color="ink.500" mt="1">
                    Les tarifs sont en cours de configuration dans la base de données.
                  </Text>
                </Box>
              ) : (
                <Stack gap="3">
                  {availablePlans.map((p) => {
                    const isSelected = selectedPlanName === p.name || selectedPlanName === p.id;
                    const planNotes = Number(p.notes ?? p.note ?? 4);
                    const songsCount = Math.floor(planNotes / 2);
                    const priceLabel = p.price === 0 ? "Gratuit" : `${Number(p.price).toLocaleString()} ${p.currency || "FCFA"}`;

                    return (
                      <Box
                        key={p.id || p.name}
                        as="button"
                        type="button"
                        onClick={() => setSelectedPlanName(p.id || p.name)}
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
              )}

              {/* BOUTON SUIVANT */}
              <Button
                size="lg"
                rounded="full"
                color="white"
                background={accent.primary}
                onClick={handleProceedToPayment}
                disabled={isLoadingPlans || !selectedPlan}
                loading={isLoadingPlans}
                loadingText="Chargement des tarifs..."
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
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <Stack gap="5" textAlign="center" py="4">
                    {/* Conteneur avec ondes radar pulsantes et téléphone au centre */}
                    <Box position="relative" w="140px" h="140px" mx="auto" my="2" display="flex" alignItems="center" justifyContent="center">
                      {/* Onde 1 */}
                      <motion.div
                        style={{
                          position: "absolute",
                          width: "100%",
                          height: "100%",
                          borderRadius: "50%",
                          backgroundColor: "#7c3aed",
                        }}
                        animate={{
                          scale: [1, 1.45, 1.9],
                          opacity: [0.35, 0.15, 0],
                        }}
                        transition={{
                          duration: 2.4,
                          repeat: Infinity,
                          ease: "easeOut",
                        }}
                      />
                      {/* Onde 2 avec décalage */}
                      <motion.div
                        style={{
                          position: "absolute",
                          width: "100%",
                          height: "100%",
                          borderRadius: "50%",
                          backgroundColor: "#a855f7",
                        }}
                        animate={{
                          scale: [1, 1.35, 1.7],
                          opacity: [0.3, 0.1, 0],
                        }}
                        transition={{
                          duration: 2.4,
                          repeat: Infinity,
                          delay: 0.8,
                          ease: "easeOut",
                        }}
                      />
                      {/* Cercle central élégant avec téléphone */}
                      <motion.div
                        style={{
                          position: "relative",
                          zIndex: 2,
                          width: "104px",
                          height: "104px",
                          borderRadius: "50%",
                          background: "radial-gradient(circle, #f5f3ff 0%, #ede9fe 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.25)",
                          border: "2px solid #ddd6fe",
                        }}
                        animate={{
                          y: [-3, 3, -3],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <Image
                          src="/assets/payment-1.png"
                          w="76px"
                          h="auto"
                          alt="Paiement en attente"
                          objectFit="contain"
                        />
                      </motion.div>
                    </Box>

                    {/* Badge d'état dynamique avec voyant pulsant */}
                    <Stack gap="2">
                      <HStack justify="center" gap="2">
                        
                      </HStack>

                      <Text fontFamily="heading" fontWeight="900" fontSize="xl" color="ink.900">
                        Vérifiez votre téléphone
                      </Text>

                      <Text fontSize="sm" color="ink.600" maxW="sm" mx="auto">
                        Une demande de débit de{" "}
                        <b style={{ color: "#7c3aed" }}>
                          {totalPrice.toLocaleString()} FCFA
                        </b>{" "}
                        a été envoyée au <b>{phoneNumber}</b>.
                      </Text>

                      {/* Loader élégant : 3 points oscillants */}
                      <HStack justify="center" gap="1.5" my="1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              backgroundColor: "#7c3aed",
                            }}
                            animate={{
                              scale: [0.8, 1.4, 0.8],
                              opacity: [0.4, 1, 0.4],
                            }}
                            transition={{
                              duration: 1.2,
                              repeat: Infinity,
                              delay: i * 0.2,
                              ease: "easeInOut",
                            }}
                          />
                        ))}
                      </HStack>

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

                      {/* <Button
                        size="xs"
                        variant="ghost"
                        rounded="full"
                        color="ink.500"
                        alignSelf="center"
                        mt="1"
                        onClick={handleCancelWaitingPin}
                        fontFamily="ui"
                      >
                        Annuler ou changer de numéro
                      </Button> */}
                    </Stack>
                  </Stack>
                </motion.div>
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

                  {/* Récapitulatif simple et intuitif */}
                  <Box
                    p="4"
                    rounded="2xl"
                    bg="brand.violetTint"
                    borderWidth="1px"
                    borderColor="paper.300"
                  >
                    <Flex
                      justify="space-between"
                      align={{ base: "flex-start", sm: "center" }}
                      flexDir={{ base: "column", sm: "row" }}
                      gap="3"
                    >
                      <Stack gap="1">
                        <HStack gap="2" align="center">
                          <Text fontFamily="heading" fontWeight="800" fontSize="md" color="ink.900">
                            {selectedPlan ? selectedPlan.name : "Pack"}
                          </Text>
                          <Badge
                            px="2.5"
                            py="0.5"
                            rounded="full"
                            bg="brand.violetDeep"
                            color="white"
                            fontSize="2xs"
                            fontWeight="700"
                          >
                            +{selectedPlan ? (selectedPlan.notes ?? selectedPlan.note) : 0} Notes
                          </Badge>
                        </HStack>
                        <Text fontSize="xs" color="ink.600">
                          Permet de créer environ <b>{Math.floor(((selectedPlan?.notes ?? selectedPlan?.note) || 0) / 2)} musiques complètes</b>
                        </Text>
                      </Stack>

                      <Stack gap="0" align={{ base: "flex-start", sm: "flex-end" }} textAlign={{ base: "left", sm: "right" }}>
                        <Text fontFamily="heading" fontWeight="900" fontSize="2xl" color="brand.violetDeep" lineHeight="1">
                          {totalPrice.toLocaleString()} FCFA
                        </Text>
                        {passFeesToCustomer && feeAmount > 0 ? (
                          <Text fontSize="2xs" color="ink.500" mt="1">
                            Pack {basePrice.toLocaleString()} + {feeAmount.toLocaleString()} FCFA frais ({feePercentage}%)
                          </Text>
                        ) : (
                          !passFeesToCustomer&& <Badge px="2" py="0.5" rounded="full" bg="green.100" color="green.700" fontSize="2xs" fontWeight="700" mt="1">
                            Frais offerts par MeloStar
                          </Badge>
                        )}
                      </Stack>
                    </Flex>
                  </Box>

                  {/* Message d'erreur précis (ex: Solde insuffisant, code PIN erroné, etc.) */}
                  {paymentError && (
                    <Box
                      p="4"
                      rounded="2xl"
                      bg={failureType === "INSUFFICIENT_FUNDS" ? "#fff7ed" : "red.50"}
                      borderWidth="1.5px"
                      borderColor={failureType === "INSUFFICIENT_FUNDS" ? "#fdba74" : "red.200"}
                      color={failureType === "INSUFFICIENT_FUNDS" ? "#9a3412" : "red.700"}
                    >
                      <HStack gap="3" align="start">
                        <LucideAlertCircle
                          size={20}
                          style={{
                            flexShrink: 0,
                            marginTop: "2px",
                            color: failureType === "INSUFFICIENT_FUNDS" ? "#ea580c" : "#dc2626",
                          }}
                        />
                        <Stack gap="1">
                          <Text fontSize="xs" fontWeight="800">
                            {failureType === "INSUFFICIENT_FUNDS" ? "Solde mobile insuffisant" : "Échec de validation"}
                          </Text>
                          <Text fontSize="xs" lineHeight="1.5">
                            {paymentError}
                          </Text>
                          {failureType === "INSUFFICIENT_FUNDS" && (
                            <Text fontSize="2xs" color="ink.600" mt="1">
                              💡 <b>Conseil :</b> Rechargez votre compte {selectedOperator === "mtn" ? "MTN MoMo" : "Orange Money"} d&apos;au moins {totalPrice.toLocaleString()} FCFA ou choisissez l&apos;autre opérateur ci-dessous.
                            </Text>
                          )}
                        </Stack>
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
                        borderWidth="1px"
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
                        borderWidth="1px"
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
                        {/* <Badge
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
                        </Badge> */}
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
                     Payer {totalPrice.toLocaleString()} FCFA ({selectedOperator === "mtn" ? "MTN MoMo" : "Orange Money"})
                  </Button>
                </>
              )}
            </Stack>
          )}

          {/* ÉTAPE 3 : CONFIRMATION SUCCÈS (ANIMÉE & ÉPURÉE) */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              <Stack gap="6" textAlign="center" py="4">
                {/* Icône CHECK animée avec halo de victoire */}
                <Box position="relative" w="76px" h="76px" mx="auto" display="flex" alignItems="center" justifyContent="center">
                  {/* Halo d'onde vert */}
                  <motion.div
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      backgroundColor: "#22c55e",
                    }}
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: [1, 1.5, 1.8], opacity: [0.6, 0.2, 0] }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />

                  {/* Cercle Checkmark pop-in avec rotation spring */}
                  <motion.div
                    style={{
                      position: "relative",
                      zIndex: 2,
                      width: "72px",
                      height: "72px",
                      borderRadius: "50%",
                      backgroundColor: "#dcfce7",
                      color: "#16a34a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 10px 25px -5px rgba(22, 163, 74, 0.35)",
                      border: "2.5px solid #86efac",
                    }}
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 280,
                      damping: 18,
                      delay: 0.1,
                    }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 350, damping: 20, delay: 0.25 }}
                    >
                      <LuCheck size={38} strokeWidth={3.5} />
                    </motion.div>
                  </motion.div>
                </Box>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <Stack gap="1.5">
                    <Text fontFamily="heading" fontWeight="900" fontSize="2xl" color="ink.900">
                      Recharge effectuée avec succès !
                    </Text>
                    <Text fontSize="sm" color="ink.600">
                      Votre compte a été crédité de <b style={{ color: "#7c3aed" }}>+{creditedNotes} Notes</b>.
                    </Text>
                    <HStack justify="center" gap="2" mt="2">
                      <Badge
                        px="3.5"
                        py="1.5"
                        rounded="full"
                        bg="brand.violetTint"
                        color="brand.violetDeep"
                        fontSize="sm"
                        fontWeight="700"
                        border="1px solid #ddd6fe"
                        boxShadow="0 2px 8px rgba(124, 58, 237, 0.1)"
                      >
                        Nouveau solde : {notes} Notes
                      </Badge>
                    </HStack>
                  </Stack>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.35 }}
                >
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
                      _hover={{ transform: "translateY(-1px)", boxShadow: "0 8px 25px rgba(124, 58, 237, 0.4)" }}
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
                      _hover={{ bg: "paper.50" }}
                    >
                      Voir mon Profil
                    </Button>
                  </Stack>
                </motion.div>
              </Stack>
            </motion.div>
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
