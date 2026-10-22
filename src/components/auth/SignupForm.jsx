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
  LuArrowRight,
  LuCheck,
  LuEye,
  LuEyeOff,
  LuLock,
  LuMail,
  LuSparkles,
  LuUser,
  LuZap,
} from "react-icons/lu";
import { signIn, getSession } from "next-auth/react";
import GoogleButton from "./GoogleButton";
import { api } from "@/lib/apiClient";
import { accent } from "@/theme/system";

export default function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSuccess = async () => {
    setLoading(true);
    setSuccess(true);
    const session = await getSession();
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
    const callback = searchParams?.get("callbackUrl");
    const destination = serverRole === "ADMIN" ? "/dashboard" : (callback || "/onboarding");
    setTimeout(() => {
      window.location.href = destination;
    }, 400);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setError("Veuillez renseigner une adresse email valide.");
      return;
    }

    if (!password || password.length < 6) {
      setError("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }

    setLoading(true);

    try {
      // 1. Inscription via API backend
      await api.post("/api/auth/register", {
        name: cleanName || cleanEmail.split("@")[0],
        email: cleanEmail,
        password,
      });

      // 2. Connexion automatique immédiate de la session utilisateur
      const signInRes = await signIn("credentials", {
        email: cleanEmail,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        throw new Error(signInRes.error);
      }

      // Synchronisation du localStorage de confort
      try {
        localStorage.setItem(
          "melostars_user",
          JSON.stringify({
            email: cleanEmail,
            name: cleanName || cleanEmail.split("@")[0],
            provider: "credentials",
            createdAt: new Date().toISOString(),
          })
        );
      } catch (_) {}

      const session = await getSession();
      const serverRole = session?.user?.role || "USER";

      setSuccess(true);

      // 3. Redirection automatique : l'ADMIN va directement au dashboard sans passer par l'onboarding
      const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const callbackParam = searchParams?.get("callbackUrl");

      let destination = "/onboarding";
      if (serverRole === "ADMIN") {
        destination = "/dashboard";
      } else if (callbackParam && !callbackParam.startsWith("/dashboard") && !callbackParam.startsWith("/admin")) {
        destination = callbackParam;
      }

      setTimeout(() => {
        window.location.href = destination;
      }, 600);
    } catch (err) {
      setError(err?.message || "Une erreur est survenue lors de l'inscription.");
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
              gap="1"
            >
              <LuZap size={12} /> Inscription rapide • 10 Notes offertes
            </Badge>
          </HStack>
          <Text
            fontFamily="heading"
            fontWeight="800"
            fontSize={{ base: "2xl", sm: "3xl" }}
            color="ink.900"
            letterSpacing="-0.03em"
          >
            Créer un compte
          </Text>
          <Text fontSize="sm" color="ink.500" fontFamily="ui">
            Commencez à composer vos musiques personnalisées
          </Text>
        </Stack>

        {/* 1. Connexion Google en 1 clic */}
        <GoogleButton
          label="S'inscrire avec Google"
          onSuccess={handleGoogleSuccess}
        />

        {/* Séparateur élégant */}
        <Flex align="center" gap="3">
          <Box flex="1" h="1px" bg="paper.200" />
          <Text fontSize="2xs" color="ink.400" fontFamily="ui" textTransform="uppercase" letterSpacing="wider">
            ou avec vos identifiants
          </Text>
          <Box flex="1" h="1px" bg="paper.200" />
        </Flex>

        {/* 2. Formulaire d'inscription */}
        {success ? (
          <Box
            p="5"
            rounded="2xl"
            bg="brand.violetTint"
            borderWidth="1.5px"
            borderColor="brand.violetDeep"
            textAlign="center"
          >
            <HStack justify="center" color="brand.violetDeep" mb="2">
              <Box boxSize="8" rounded="full" bg="white" display="flex" alignItems="center" justifyContent="center">
                <LuCheck size={20} strokeWidth={3} />
              </Box>
            </HStack>
            <Text fontFamily="heading" fontWeight="700" fontSize="sm" color="ink.900" mb="1">
              Bienvenue sur melostars !
            </Text>
            <Text fontSize="xs" color="ink.600" fontFamily="ui">
              Vos 10 Notes ont été créditées. Redirection vers le studio...
            </Text>
          </Box>
        ) : (
          <Box as="form" onSubmit={handleSubmit}>
            <Stack gap="3.5">
              {/* Nom / Pseudo */}
              <Box>
                {/* <Text
                  as="label"
                  htmlFor="signup-name"
                  fontFamily="ui"
                  fontWeight="600"
                  fontSize="xs"
                  color="ink.700"
                  mb="1"
                  display="block"
                >
                  Prénom ou nom d&apos;artiste
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
                    <LuUser size={17} />
                  </Box>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Ex: Sarah ou DJ Nova"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    h="11"
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
                </Box> */}
              </Box>

              {/* Email */}
              <Box>
                <Text
                  as="label"
                  htmlFor="signup-email"
                  fontFamily="ui"
                  fontWeight="600"
                  fontSize="xs"
                  color="ink.700"
                  mb="1"
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
                    <LuMail size={17} />
                  </Box>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="nom@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    h="11"
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

              {/* Mot de passe */}
              <Box>
                <Text
                  as="label"
                  htmlFor="signup-password"
                  fontFamily="ui"
                  fontWeight="600"
                  fontSize="xs"
                  color="ink.700"
                  mb="1"
                  display="block"
                >
                  Mot de passe (au moins 6 caractères)
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
                    <LuLock size={17} />
                  </Box>
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    h="11"
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
                    position="absolute"
                    right="2"
                    top="50%"
                    transform="translateY(-50%)"
                    variant="ghost"
                    size="xs"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Masquer" : "Afficher"}
                    color="ink.400"
                  >
                    {showPassword ? <LuEyeOff size={16} /> : <LuEye size={16} />}
                  </IconButton>
                </Box>
              </Box>

              {/* Message d'erreur */}
              {error && (
                <Box p="2.5" rounded="xl" bg="red.50" borderWidth="1px" borderColor="red.200">
                  <Text fontSize="xs" color="red.600" fontFamily="ui" fontWeight="600">
                    {error}
                  </Text>
                </Box>
              )}

              <Button
                type="submit"
                disabled={loading}
                h="12"
                mt="1"
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
              >
                <HStack gap="2">
                  {loading && (
                    <>
                      <Spinner size="sm" color="white" />
                      <Text>Création du compte...</Text>
                    </>
                  ) }
                </HStack>
              </Button>
            </Stack>
          </Box>
        )}

        {/* 3. Lien vers la page de connexion */}
        <Box pt="2" borderTopWidth="1px" borderColor="paper.150" textAlign="center">
          <Text fontSize="xs" color="ink.500" fontFamily="ui">
            Vous avez déjà un compte ?{" "}
            <NextLink href="/login">
              <Text
                as="span"
                fontWeight="700"
                color="brand.violetDeep"
                _hover={{ textDecoration: "underline" }}
                cursor="pointer"
              >
                Se connecter
              </Text>
            </NextLink>
          </Text>
        </Box>
      </Stack>
    </Box>
  );
}
