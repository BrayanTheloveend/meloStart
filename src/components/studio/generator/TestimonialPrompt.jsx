"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Input,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import {
  LuCheck,
  LuMessageSquareHeart,
  LuSparkles,
  LuStar,
  LuX,
} from "react-icons/lu";

/**
 * Infobulle interactive invitant l'utilisateur à donner un avis après la génération d'un morceau.
 * L'avis est enregistré en base de données et affiché dans la section Testimonials de la landing page.
 */
export default function TestimonialPrompt({ trackId, trackTitle }) {
  const { data: session } = useSession();

  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const storageKey = trackId ? `pretymelo_reviewed_${trackId}` : "pretymelo_reviewed_latest";

  useEffect(() => {
    // Apparition élégante après 2.5 secondes si l'utilisateur n'a pas déjà donné son avis
    const timer = setTimeout(() => {
      try {
        const alreadyReviewed = localStorage.getItem(storageKey);
        if (alreadyReviewed) return;
      } catch (_) {}

      setIsOpen(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, [storageKey]);

  const handleDismiss = () => {
    setIsOpen(false);
    setIsDismissed(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || text.trim().length < 5) {
      setError("Merci de rédiger un court commentaire (au moins 5 caractères).");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          text: text.trim(),
          name: session?.user?.name || "Créateur pretymelo",
          role: role.trim() || "Créateur pretymelo",
          trackId: trackId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue lors de l'envoi.");
      }

      setSubmitted(true);
      try {
        localStorage.setItem(storageKey, "true");
      } catch (_) {}

      // Fermeture douce après remerciement
      setTimeout(() => {
        setIsOpen(false);
        setIsDismissed(true);
      }, 3000);
    } catch (err) {
      setError(err?.message || "Impossible d'envoyer votre avis pour le moment.");
    } finally {
      setLoading(false);
    }
  };

  if (isDismissed && !isOpen) return null;

  return (
    <Box
      position="fixed"
      bottom={{ base: "4", sm: "6" }}
      right={{ base: "4", sm: "6" }}
      zIndex="50"
      maxW={{ base: "calc(100vw - 32px)", sm: "360px" }}
      w="full"
      pointerEvents="auto"
      style={{
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        transform: isOpen ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
        opacity: isOpen ? 1 : 0,
      }}
    >
      <Box
        p="5"
        rounded="2xl"
        bg="rgba(255, 255, 255, 0.98)"
        backdropFilter="blur(20px)"
        borderWidth="1.5px"
        borderColor="brand.violetDeep"
        boxShadow="0 20px 45px -10px rgba(124, 58, 237, 0.25), 0 4px 16px rgba(0, 0, 0, 0.08)"
      >
        {/* Bouton de fermeture */}
        <IconButton
          aria-label="Fermer l'infobulle"
          size="xs"
          variant="ghost"
          position="absolute"
          top="3"
          right="3"
          color="slate.400"
          _hover={{ color: "slate.700", bg: "slate.100" }}
          onClick={handleDismiss}
          rounded="full"
        >
          <LuX size={15} />
        </IconButton>

        {submitted ? (
          /* Écran de remerciement */
          <Stack gap="3" textAlign="center" py="2">
            <Flex
              boxSize="10"
              rounded="full"
              bg="brand.violetTint"
              color="brand.violetDeep"
              align="center"
              justify="center"
              mx="auto"
            >
              <LuCheck size={22} strokeWidth={3} />
            </Flex>
            <Stack gap="1">
              <Text fontFamily="heading" fontWeight="800" fontSize="sm" color="slate.900">
                Merci pour votre avis !
              </Text>
              <Text fontSize="xs" color="slate.600">
                Votre retour a bien été enregistré et enrichira les témoignages de pretymelo.
              </Text>
            </Stack>
          </Stack>
        ) : (
          /* Formulaire d'avis */
          <Box as="form" onSubmit={handleSubmit}>
            <Stack gap="3.5">
              {/* En-tête de l'infobulle */}
              <HStack gap="2" pr="6">
                <Box
                  boxSize="7"
                  rounded="full"
                  bg="purple.50"
                  color="purple.700"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  <LuSparkles size={14} />
                </Box>
                <Box>
                  <Text fontFamily="heading" fontWeight="800" fontSize="xs" color="slate.900" lineHeight="1.2">
                    Votre avis nous intéresse !
                  </Text>
                  <Text fontSize="2xs" color="slate.500">
                    Que pensez-vous de cette création ?
                  </Text>
                </Box>
              </HStack>

              {/* Étoiles interactives */}
              <Flex justify="center" gap="1" py="0.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = hoverRating ? star <= hoverRating : star <= rating;
                  return (
                    <Box
                      key={star}
                      as="button"
                      type="button"
                      p="1"
                      cursor="pointer"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      color={active ? "#f59e0b" : "#cbd5e1"}
                      transition="transform 0.15s ease, color 0.15s ease"
                      _hover={{ transform: "scale(1.2)" }}
                    >
                      <LuStar size={20} fill={active ? "currentColor" : "none"} strokeWidth={active ? 0 : 2} />
                    </Box>
                  );
                })}
              </Flex>

              {/* Champ Commentaire */}
              <Box>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Partagez votre expérience (paroles, voix, mélodie...)"
                  fontSize="xs"
                  rows={2}
                  rounded="xl"
                  bg="slate.50"
                  borderColor="slate.200"
                  _focusVisible={{
                    borderColor: "brand.violetDeep",
                    boxShadow: "0 0 0 1px #7c3aed",
                    bg: "white",
                  }}
                  p="2.5"
                  resize="none"
                />
              </Box>

              {/* Rôle ou Métier (optionnel) */}
              <Box>
                <Input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Votre profil (ex: Vidéaste, Mariée, Musicien...)"
                  fontSize="2xs"
                  h="8"
                  rounded="lg"
                  bg="slate.50"
                  borderColor="slate.200"
                  _focusVisible={{
                    borderColor: "brand.violetDeep",
                    boxShadow: "0 0 0 1px #7c3aed",
                    bg: "white",
                  }}
                  px="2.5"
                />
              </Box>

              {error && (
                <Text fontSize="2xs" color="red.500" textAlign="center">
                  {error}
                </Text>
              )}

              {/* Bouton de soumission */}
              <Button
                type="submit"
                disabled={loading}
                size="sm"
                h="9"
                rounded="full"
                color="white"
                bg="linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)"
                _hover={{
                  transform: "translateY(-1px)",
                  boxShadow: "0 6px 18px rgba(124, 58, 237, 0.35)",
                }}
                _active={{ transform: "scale(0.98)" }}
                fontWeight="700"
                fontSize="xs"
                w="full"
              >
                {loading ? "Envoi en cours..." : "Publier mon avis"}
              </Button>
            </Stack>
          </Box>
        )}
      </Box>
    </Box>
  );
}
