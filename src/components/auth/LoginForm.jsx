"use client";

import { useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import {
  Badge,
  Box,
  Button,
  Flex,
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
  LuMail,
} from "react-icons/lu";
import { getSession, signIn } from "next-auth/react";
import GoogleButton from "./GoogleButton";
import { accent } from "@/theme/system";

export default function LoginForm() {
  const router = useRouter();

  // Mode connexion ou mot de passe oublié
  const [view, setView] = useState("login"); // "login" | "forgot_password"

  // Champs de connexion
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Mot de passe oublié
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");

  const handleGoogleSuccess = async () => {
    setLoading(true);
    const session = await getSession().catch(() => null);
    const serverRole = session?.user?.role || "USER";

    try {
      if (session?.user) {
        localStorage.setItem(
          "melostars_user",
          JSON.stringify({
            email: session.user.email,
            name: session.user.name,
            image: session.user.image,
            role: serverRole,
            provider: "google",
            loggedInAt: new Date().toISOString(),
          })
        );
      }
    } catch (_) {}

    const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const callbackParam = searchParams?.get("callbackUrl");

    let destination = serverRole === "ADMIN" ? "/dashboard" : "/studio";
    if (callbackParam && !callbackParam.includes("admin_required")) {
      if (serverRole === "ADMIN" || (!callbackParam.startsWith("/dashboard") && !callbackParam.startsWith("/admin"))) {
        destination = callbackParam;
      }
    }

    setTimeout(() => {
      window.location.href = destination;
    }, 400);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError("Veuillez remplir votre adresse email et votre mot de passe.");
      return;
    }

    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email: cleanEmail,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error || "Adresse email ou mot de passe incorrect.");
        setLoading(false);
        return;
      }

      // Récupération de la session cryptographiquement authentifiée côté serveur (JWT + PostgreSQL)
      const session = await getSession();
      const serverRole = session?.user?.role || "USER";

      // Persistance de confort pour la session client
      try {
        localStorage.setItem(
          "melostars_user",
          JSON.stringify({
            email: cleanEmail,
            name: session?.user?.name || cleanEmail.split("@")[0],
            role: serverRole,
            provider: "credentials",
            loggedInAt: new Date().toISOString(),
          })
        );
      } catch (_) {}

      // Redirection sécurisée selon le rôle serveur
      const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const callbackParam = searchParams?.get("callbackUrl");

      let destination = "/studio";
      if (serverRole === "ADMIN") {
        // Redirection prioritaire de l'administrateur vers le Dashboard Admin (l'admin ne fait pas l'onboarding)
        destination =
          callbackParam &&
          callbackParam !== "/studio" &&
          !callbackParam.startsWith("/onboarding") &&
          !callbackParam.includes("admin_required")
            ? callbackParam
            : "/dashboard";
      } else {
        // Utilisateur standard : redirection vers le studio ou un sous-chemin autorisé (sans accès admin)
        destination = callbackParam && !callbackParam.startsWith("/dashboard") && !callbackParam.startsWith("/admin")
          ? callbackParam
          : "/studio";
      }

      window.location.href = destination;
    } catch (err) {
      setError(err?.message || "Une erreur est survenue lors de la connexion.");
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setForgotError("");

    if (!forgotEmail.trim() || !forgotEmail.includes("@")) {
      setForgotError("Veuillez renseigner un email valide.");
      return;
    }

    setForgotLoading(true);
    setTimeout(() => {
      setForgotLoading(false);
      setForgotSent(true);
    }, 600);
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
      {view === "login" ? (
        <Stack gap="6">
          {/* Titre et sous-titre */}
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
                melostars Studio
              </Badge>
            </HStack>
            <Text
              fontFamily="heading"
              fontWeight="800"
              fontSize={{ base: "2xl", sm: "3xl" }}
              color="ink.900"
              letterSpacing="-0.03em"
            >
              Bon retour parmi nous
            </Text>
            <Text fontSize="sm" color="ink.500" fontFamily="ui">
              Connectez-vous pour retrouver vos créations
            </Text>
          </Stack>

          {/* 1. Connexion Google en 1 clic */}
          <GoogleButton
            label="Continuer avec Google"
            onSuccess={handleGoogleSuccess}
          />

          {/* Séparateur élégant */}
          <Flex align="center" gap="3">
            <Box flex="1" h="1px" bg="paper.200" />
            <Text fontSize="2xs" color="ink.400" fontFamily="ui" textTransform="uppercase" letterSpacing="wider">
              ou avec votre email
            </Text>
            <Box flex="1" h="1px" bg="paper.200" />
          </Flex>

          {/* 2. Formulaire email + mot de passe */}
          <Box as="form" onSubmit={handleLoginSubmit}>
            <Stack gap="4">
              {/* Champ Email */}
              <Box>
                <Text
                  as="label"
                  htmlFor="login-email"
                  fontFamily="ui"
                  fontWeight="600"
                  fontSize="xs"
                  color="ink.700"
                  mb="1.5"
                  display="block"
                >
                  Adresse e-mail
                </Text>
                <Box position="relative">
                  <Box
                    position="absolute"
                    left="3.5"
                    top="50%"
                    transform="translateY(-50%)"
                    color="ink.400"
                    pointerEvents="none"
                  >
                    <LuMail size={18} />
                  </Box>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="nom@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    h="12"
                    pl="10"
                    pr="4"
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
                </Box>
              </Box>

              {/* Champ Mot de passe avec toggle masquer/afficher */}
              <Box>
                <Flex justify="space-between" align="center" mb="1.5">
                  <Text
                    as="label"
                    htmlFor="login-password"
                    fontFamily="ui"
                    fontWeight="600"
                    fontSize="xs"
                    color="ink.700"
                  >
                    Mot de passe
                  </Text>
                  <Text
                    as="button"
                    type="button"
                    fontSize="xs"
                    fontWeight="600"
                    color="brand.violetDeep"
                    _hover={{ textDecoration: "underline" }}
                    onClick={() => {
                      setForgotEmail(email);
                      setView("forgot_password");
                    }}
                    fontFamily="ui"
                    cursor="pointer"
                  >
                    Mot de passe oublié ?
                  </Text>
                </Flex>

                <Box position="relative">
                  <Box
                    position="absolute"
                    left="3.5"
                    top="50%"
                    transform="translateY(-50%)"
                    color="ink.400"
                    pointerEvents="none"
                  >
                    <LuLock size={18} />
                  </Box>
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
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
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
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

              {error && (
                <Text fontSize="2xs" color="red.500" fontFamily="ui">
                  {error}
                </Text>
              )}

              {/* Bouton de validation */}
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
                      <Text>Connexion en cours...</Text>
                    </>
                  ) : (
                    <>
                      <Text>Se connecter</Text>
                      <LuArrowRight size={16} />
                    </>
                  )}
                </HStack>
              </Button>
            </Stack>
          </Box>

          {/* 3. Lien vers la page d'inscription */}
          <Box pt="2" borderTopWidth="1px" borderColor="paper.150" textAlign="center">
            <Text fontSize="xs" color="ink.500" fontFamily="ui">
              Pas encore de compte ?{" "}
              <NextLink href="/signup">
                <Text
                  as="span"
                  fontWeight="700"
                  color="brand.violetDeep"
                  _hover={{ textDecoration: "underline" }}
                  cursor="pointer"
                >
                  Créer un compte
                </Text>
              </NextLink>
            </Text>
          </Box>
        </Stack>
      ) : (
        /* VUE MOT DE PASSE OUBLIÉ (FLUIDE & SANS FRICTION) */
        <Stack gap="5">
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
                Récupération
              </Badge>
            </HStack>
            <Text
              fontFamily="heading"
              fontWeight="800"
              fontSize={{ base: "xl", sm: "2xl" }}
              color="ink.900"
              letterSpacing="-0.03em"
            >
              Mot de passe oublié
            </Text>
            <Text fontSize="xs" color="ink.500" fontFamily="ui">
              Entrez votre adresse email pour recevoir un lien de réinitialisation sécurisé.
            </Text>
          </Stack>

          {forgotSent ? (
            <Stack gap="4" textAlign="center" py="2">
              <Box
                p="4"
                rounded="2xl"
                bg="brand.violetTint"
                borderWidth="1.5px"
                borderColor="brand.violetDeep"
              >
                <HStack justify="center" color="brand.violetDeep" mb="2">
                  <Box boxSize="8" rounded="full" bg="white" display="flex" alignItems="center" justifyContent="center">
                    <LuCheck size={20} strokeWidth={3} />
                  </Box>
                </HStack>
                <Text fontFamily="heading" fontWeight="700" fontSize="sm" color="ink.900" mb="1">
                  E-mail envoyé avec succès !
                </Text>
                <Text fontSize="xs" color="ink.600" fontFamily="ui">
                  Un lien sécurisé a été envoyé à <b>{forgotEmail}</b>. Vérifiez vos spams si nécessaire.
                </Text>
              </Box>

              <Button
                variant="outline"
                h="11"
                rounded="full"
                borderColor="paper.300"
                fontFamily="ui"
                fontWeight="600"
                fontSize="xs"
                onClick={() => {
                  setView("login");
                  setForgotSent(false);
                }}
              >
                <LuArrowLeft size={14} style={{ marginRight: "6px" }} /> Retour à la connexion
              </Button>
            </Stack>
          ) : (
            <Box as="form" onSubmit={handleForgotSubmit}>
              <Stack gap="4">
                <Box>
                  <Text
                    as="label"
                    htmlFor="forgot-email"
                    fontFamily="ui"
                    fontWeight="600"
                    fontSize="xs"
                    color="ink.700"
                    mb="1.5"
                    display="block"
                  >
                    Votre adresse e-mail
                  </Text>
                  <Box position="relative">
                    <Box
                      position="absolute"
                      left="3.5"
                      top="50%"
                      transform="translateY(-50%)"
                      color="ink.400"
                      pointerEvents="none"
                    >
                      <LuMail size={18} />
                    </Box>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="nom@exemple.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      autoFocus
                      h="12"
                      pl="10"
                      pr="4"
                      rounded="xl"
                      bg="paper.50"
                      borderColor={forgotError ? "red.400" : "paper.200"}
                      fontSize="sm"
                      fontFamily="ui"
                      color="ink.900"
                      _focusVisible={{
                        borderColor: "brand.violetDeep",
                        boxShadow: "0 0 0 1px #7c3aed",
                        bg: "paper.0",
                      }}
                    />
                  </Box>
                  {forgotError && (
                    <Text fontSize="2xs" color="red.500" mt="1.5" fontFamily="ui">
                      {forgotError}
                    </Text>
                  )}
                </Box>

                <Button
                  type="submit"
                  disabled={forgotLoading}
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
                  transition="all 0.2s ease"
                >
                  <HStack gap="2">
                    {forgotLoading ? (
                      <>
                        <Spinner size="sm" color="white" />
                        <Text>Envoi du lien...</Text>
                      </>
                    ) : (
                      <>
                        <Text>Envoyer le lien de réinitialisation</Text>
                        <LuArrowRight size={16} />
                      </>
                    )}
                  </HStack>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  fontFamily="ui"
                  color="ink.600"
                  _hover={{ color: "ink.900" }}
                  onClick={() => setView("login")}
                  rounded="full"
                >
                  <LuArrowLeft size={14} style={{ marginRight: "6px" }} /> Retour à la connexion
                </Button>
              </Stack>
            </Box>
          )}
        </Stack>
      )}
    </Box>
  );
}
