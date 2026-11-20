"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import NextLink from "next/link";
import {
  Badge,
  Box,
  Button,
  HStack,
  IconButton,
  Input,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  LuArrowLeft,
  LuArrowRight,
  LuCheck,
  LuEye,
  LuEyeOff,
  LuLock,
  LuShieldAlert,
} from "react-icons/lu";

function ResetPasswordFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isInvalidLink = !token || !email;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue lors de la réinitialisation.");
      }

      setSuccess(true);
    } catch (err) {
      setError(err?.message || "Une erreur inattendue est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      p={{ base: "6", sm: "8" }}
      rounded="3xl"
      bg="paper.0"
      borderWidth="1px"
      borderColor="paper.200"
      boxShadow="0 20px 45px -12px rgba(0, 0, 0, 0.08), 0 2px 10px rgba(124, 58, 237, 0.04)"
    >
      <Stack gap="6">
        {/* En-tête */}
        <Stack gap="1.5" textAlign="center">
          <HStack justify="center" gap="1.5">
            <Badge
              px="2.5"
              py="1"
              rounded="full"
              bg="brand.violetTint"
              color="brand.violetDeep"
              fontFamily="ui"
              fontSize="2xs"
              fontWeight="700"
            >
              Sécurité du compte
            </Badge>
          </HStack>
          <Text
            fontFamily="heading"
            fontWeight="800"
            fontSize={{ base: "2xl", sm: "3xl" }}
            color="ink.900"
            letterSpacing="-0.03em"
          >
            Nouveau mot de passe
          </Text>
          <Text fontSize="sm" color="ink.500" fontFamily="ui">
            {email ? (
              <>Pour le compte <b>{email}</b></>
            ) : (
              "Choisissez un mot de passe sécurisé"
            )}
          </Text>
        </Stack>

        {/* Cas : Lien invalide ou incomplet */}
        {isInvalidLink ? (
          <Stack gap="4" textAlign="center" py="3">
            <Box
              p="4"
              rounded="2xl"
              bg="red.50"
              borderWidth="1px"
              borderColor="red.200"
            >
              <HStack justify="center" color="red.600" mb="2">
                <LuShieldAlert size={26} />
              </HStack>
              <Text fontWeight="700" fontSize="sm" color="red.800" mb="1">
                Lien de réinitialisation invalide
              </Text>
              <Text fontSize="xs" color="red.700" fontFamily="ui">
                Ce lien semble incomplet ou expiré. Veuillez faire une nouvelle demande.
              </Text>
            </Box>

            <NextLink href="/login">
              <Button
                w="full"
                h="11"
                rounded="full"
                variant="outline"
                borderColor="paper.300"
                fontFamily="ui"
                fontWeight="600"
                fontSize="xs"
              >
                <LuArrowLeft size={14} style={{ marginRight: "6px" }} /> Retour à la connexion
              </Button>
            </NextLink>
          </Stack>
        ) : success ? (
          /* Cas : Succès */
          <Stack gap="4" textAlign="center" py="3">
            <Box
              p="5"
              rounded="2xl"
              bg="brand.violetTint"
              borderWidth="1.5px"
              borderColor="brand.violetDeep"
            >
              <HStack justify="center" color="brand.violetDeep" mb="2">
                <Box
                  boxSize="9"
                  rounded="full"
                  bg="white"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  boxShadow="0 4px 12px rgba(124, 58, 237, 0.15)"
                >
                  <LuCheck size={22} strokeWidth={3} />
                </Box>
              </HStack>
              <Text fontFamily="heading" fontWeight="700" fontSize="base" color="ink.900" mb="1">
                Mot de passe mis à jour !
              </Text>
              <Text fontSize="xs" color="ink.600" fontFamily="ui">
                Vous pouvez dès à présent vous connecter avec votre nouveau mot de passe.
              </Text>
            </Box>

            <Button
              onClick={() => router.push("/login")}
              h="12"
              rounded="full"
              color="white"
              bg="linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)"
              _hover={{
                transform: "translateY(-1px)",
                boxShadow: "0 8px 24px rgba(124, 58, 237, 0.4)",
              }}
              fontFamily="ui"
              fontWeight="700"
              fontSize="sm"
              boxShadow="0 4px 18px rgba(124, 58, 237, 0.3)"
            >
              Se connecter maintenant <LuArrowRight size={16} style={{ marginLeft: "6px" }} />
            </Button>
          </Stack>
        ) : (
          /* Formulaire de saisie */
          <Box as="form" onSubmit={handleSubmit}>
            <Stack gap="4">
              {/* Champ Nouveau mot de passe */}
              <Box>
                <Text
                  as="label"
                  htmlFor="new-password"
                  fontFamily="ui"
                  fontWeight="600"
                  fontSize="xs"
                  color="ink.700"
                  mb="1.5"
                  display="block"
                >
                  Nouveau mot de passe
                </Text>
                <Box position="relative">
                  <Box
                    position="absolute"
                    left="3.5"
                    top="50%"
                    zIndex={10}
                    transform="translateY(-50%)"
                    color="ink.400"
                    pointerEvents="none"
                  >
                    <LuLock size={18} />
                  </Box>
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Au moins 6 caractères"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    h="12"
                    pl="10"
                    pr="11"
                    rounded="xl"
                    bg="paper.50"
                    borderColor="paper.200"
                    fontSize="sm"
                    fontFamily="ui"
                    color="ink.900"
                    _focusVisible={{
                      borderColor: "brand.violetDeep",
                      boxShadow: "0 0 0 1px #7c3aed",
                      bg: "paper.0",
                    }}
                  />
                  <IconButton
                    type="button"
                    aria-label={showPassword ? "Masquer" : "Afficher"}
                    variant="ghost"
                    size="sm"
                    position="absolute"
                    right="2"
                    top="50%"
                    transform="translateY(-50%)"
                    color="ink.400"
                    _hover={{ color: "ink.900" }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <LuEyeOff size={17} /> : <LuEye size={17} />}
                  </IconButton>
                </Box>
              </Box>

              {/* Champ Confirmer le mot de passe */}
              <Box>
                <Text
                  as="label"
                  htmlFor="confirm-password"
                  fontFamily="ui"
                  fontWeight="600"
                  fontSize="xs"
                  color="ink.700"
                  mb="1.5"
                  display="block"
                >
                  Confirmer le mot de passe
                </Text>
                <Box position="relative">
                  <Box
                    position="absolute"
                    left="3.5"
                    top="50%"
                    zIndex={10}
                    transform="translateY(-50%)"
                    color="ink.400"
                    pointerEvents="none"
                  >
                    <LuLock size={18} />
                  </Box>
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Répétez le mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    h="12"
                    pl="10"
                    pr="11"
                    rounded="xl"
                    bg="paper.50"
                    borderColor="paper.200"
                    fontSize="sm"
                    fontFamily="ui"
                    color="ink.900"
                    _focusVisible={{
                      borderColor: "brand.violetDeep",
                      boxShadow: "0 0 0 1px #7c3aed",
                      bg: "paper.0",
                    }}
                  />
                  <IconButton
                    type="button"
                    aria-label={showConfirmPassword ? "Masquer" : "Afficher"}
                    variant="ghost"
                    size="sm"
                    position="absolute"
                    right="2"
                    top="50%"
                    transform="translateY(-50%)"
                    color="ink.400"
                    _hover={{ color: "ink.900" }}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <LuEyeOff size={17} /> : <LuEye size={17} />}
                  </IconButton>
                </Box>
              </Box>

              {/* Message d'erreur */}
              {error && (
                <Text fontSize="2xs" color="red.500" fontFamily="ui">
                  {error}
                </Text>
              )}

              {/* Bouton de soumission */}
              <Button
                type="submit"
                disabled={loading}
                h="12"
                rounded="full"
                color="white"
                bg="linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)"
                _hover={{
                  transform: "translateY(-1px)",
                  boxShadow: "0 8px 24px rgba(124, 58, 237, 0.4)",
                }}
                _active={{ transform: "scale(0.99)" }}
                fontFamily="ui"
                fontWeight="700"
                fontSize="sm"
                boxShadow="0 4px 18px rgba(124, 58, 237, 0.3)"
                transition="all 0.2s ease"
                mt="1"
              >
                <HStack gap="2">
                  {loading ? (
                    <>
                      <Spinner size="sm" color="white" />
                      <Text>Mise à jour...</Text>
                    </>
                  ) : (
                    <>
                      <Text>Mettre à jour mon mot de passe</Text>
                      <LuArrowRight size={16} />
                    </>
                  )}
                </HStack>
              </Button>

              <Box textAlign="center" pt="1">
                <NextLink href="/login">
                  <Text
                    fontSize="xs"
                    color="ink.500"
                    fontFamily="ui"
                    _hover={{ color: "brand.violetDeep", textDecoration: "underline" }}
                    cursor="pointer"
                  >
                    Retour à la page de connexion
                  </Text>
                </NextLink>
              </Box>
            </Stack>
          </Box>
        )}
      </Stack>
    </Box>
  );
}

export default function ResetPasswordForm() {
  return (
    <Suspense
      fallback={
        <Box p="10" textAlign="center">
          <Spinner size="lg" color="brand.violetDeep" />
        </Box>
      }
    >
      <ResetPasswordFormInner />
    </Suspense>
  );
}

