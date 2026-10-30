"use client";

import { useEffect, useRef, useState } from "react";
import NextLink from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  Avatar,
  Box,
  Button,
  Container,
  Flex,
  HStack,
  IconButton,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  LuChevronDown,
  LuLayoutDashboard,
  LuLogOut,
  LuMenu,
  LuMusic,
  LuSparkles,
  LuUser,
  LuX,
  LuZap,
} from "react-icons/lu";
import Logo from "@/components/common/Logo";
import { GoogleIcon } from "@/components/auth/GoogleButton";
import { navLinks } from "@/data/content";
import { accent } from "@/theme/system";

/** Header fixe, transparent puis flouté (backdrop-filter) dès qu'on scrolle. */
export default function Header() {
  const { data: session, status } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fermer le menu dropdown utilisateur quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  const isAuthenticated = status === "authenticated" && Boolean(session?.user);
  const user = session?.user;
  const userName = user?.name || "Créateur pretymelo";
  const userEmail = user?.email || "";
  const userImage = user?.image;
  const isGoogle = Boolean(userImage && userImage.includes("googleusercontent.com"));

  return (
    <Box
      as="header"
      position="fixed"
      top="0"
      insetX="0"
      zIndex="50"
      bg={scrolled || open ? "rgba(255,255,255,0.88)" : "transparent"}
      backdropFilter={scrolled || open ? "blur(18px) saturate(150%)" : "none"}
      borderBottomWidth="1px"
      borderColor={scrolled || open ? "paper.200" : "transparent"}
      transition="background .3s, border-color .3s"
    >
      <Container maxW="7xl">
        <Flex h="16" align="center" justify="space-between">
          <Logo />

          {/* Navigation desktop */}
          <HStack as="nav" gap="8" display={{ base: "none", lg: "flex" }} fontFamily="ui" fontSize="sm">
            {navLinks.map((l) => (
              <NextLink key={l.href} href={l.href}>
                <Box color="ink.500" _hover={{ color: "ink.900" }} transition="color .2s">
                  {l.label}
                </Box>
              </NextLink>
            ))}
          </HStack>

          <HStack gap="3">
            {isAuthenticated ? (
              <>
                {/* Bouton direct vers le Studio */}
                <Button
                  asChild
                  rounded="full"
                  size="sm"
                  fontFamily="ui"
                  fontWeight="600"
                  color="white"
                  background={accent.primary}
                  _hover={{ transform: "translateY(-1px)", boxShadow: "0 4px 16px rgba(124, 58, 237, 0.35)" }}
                  transition="all .25s"
                  display={{ base: "none", sm: "inline-flex" }}
                >
                  <NextLink href="/studio">
                    <HStack gap="1.5">
                      <LuSparkles size={14} />
                      <Text>Mon Studio</Text>
                    </HStack>
                  </NextLink>
                </Button>

                {/* Profil utilisateur & Photo Google */}
                <Box position="relative" ref={menuRef}>
                  <Button
                    variant="ghost"
                    size="sm"
                    rounded="full"
                    px={0}
                    borderWidth="0.9px"
                    borderColor={userMenuOpen ? "brand.violetDeep" : "paper.200"}
                    _hover={{ borderColor: "brand.violetDeep", bg: "paper.100" }}
                    onClick={() => setUserMenuOpen((v) => !v)}
                    aria-label="Menu profil utilisateur"
                    display="flex"
                    alignItems="center"
                    gap="2"
                    transition="all 0.2s"
                  >
                    <Avatar.Root size="sm" rounded="full">
                      <Avatar.Fallback name={userName} />
                      <Avatar.Image
                        src={userImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"}
                        alt={userName}
                        referrerPolicy="no-referrer"
                      />
                    </Avatar.Root>
                    <Box display={{ base: "none", md: "block" }} textAlign="left" maxW="110px">
                      <Text fontSize="xs" fontWeight="700" color="ink.900" truncate lineHeight="1.2">
                        {userName.split(" ")[0]}
                      </Text>
                      <Text fontSize="10px" color="ink.400" lineHeight="1">
                        {user?.role === "ADMIN" ? "Admin" : "Créateur"}
                      </Text>
                    </Box>
                    <Box display={{ base: "none", md: "inline-flex" }} color="ink.400">
                      <LuChevronDown size={14} />
                    </Box>
                  </Button>

                  {/* Menu déroulant élégant */}
                  {userMenuOpen && (
                    <Box
                      position="absolute"
                      right="0"
                      mt="2"
                      w="240px"
                      bg="paper.0"
                      rounded="2xl"
                      borderWidth="1px"
                      borderColor="paper.200"
                      boxShadow="0 14px 34px rgba(0, 0, 0, 0.12)"
                      p="2"
                      zIndex="60"
                      fontFamily="ui"
                      animation="fadeIn 0.15s ease-out"
                    >
                      {/* Entête avec photo & infos */}
                      <HStack gap="3" p="2.5" borderBottomWidth="1px" borderColor="paper.150">
                        <Avatar.Root size="md" rounded="xl">
                          <Avatar.Fallback name={userName} />
                          <Avatar.Image
                            src={userImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"}
                            alt={userName}
                            referrerPolicy="no-referrer"
                          />
                        </Avatar.Root>
                        <Box minW="0" flex="1">
                          <HStack gap="1">
                            <Text fontSize="xs" fontWeight="700" color="ink.900" truncate>
                              {userName}
                            </Text>
                            {isGoogle && (
                              <Box title="Compte Google connecté" display="inline-flex">
                                <GoogleIcon size={13} />
                              </Box>
                            )}
                          </HStack>
                          <Text fontSize="11px" color="ink.400" truncate>
                            {userEmail}
                          </Text>
                        </Box>
                      </HStack>

                      {/* Liens rapides */}
                      <Stack gap="0.5" py="1.5">
                        <NextLink href="/studio" onClick={() => setUserMenuOpen(false)}>
                          <HStack
                            gap="2.5"
                            px="3"
                            py="2"
                            rounded="xl"
                            fontSize="xs"
                            fontWeight="600"
                            color="ink.700"
                            _hover={{ bg: "brand.violetTint", color: "brand.violetDeep" }}
                            transition="all 0.15s"
                          >
                            <LuSparkles size={15} />
                            <Text>Studio IA</Text>
                          </HStack>
                        </NextLink>

                        <NextLink href="/studio/profil" onClick={() => setUserMenuOpen(false)}>
                          <HStack
                            gap="2.5"
                            px="3"
                            py="2"
                            rounded="xl"
                            fontSize="xs"
                            fontWeight="600"
                            color="ink.700"
                            _hover={{ bg: "brand.violetTint", color: "brand.violetDeep" }}
                            transition="all 0.15s"
                          >
                            <LuUser size={15} />
                            <Text>Mon Profil</Text>
                          </HStack>
                        </NextLink>

                        <NextLink href="/studio/recharge" onClick={() => setUserMenuOpen(false)}>
                          <HStack
                            gap="2.5"
                            px="3"
                            py="2"
                            rounded="xl"
                            fontSize="xs"
                            fontWeight="600"
                            color="ink.700"
                            _hover={{ bg: "brand.violetTint", color: "brand.violetDeep" }}
                            transition="all 0.15s"
                          >
                            <LuZap size={15} />
                            <Text>Recharger mes Notes</Text>
                          </HStack>
                        </NextLink>

                        {user?.role === "ADMIN" && (
                          <NextLink href="/dashboard" onClick={() => setUserMenuOpen(false)}>
                            <HStack
                              gap="2.5"
                              px="3"
                              py="2"
                              rounded="xl"
                              fontSize="xs"
                              fontWeight="600"
                              color="purple.700"
                              _hover={{ bg: "purple.50" }}
                              transition="all 0.15s"
                            >
                              <LuLayoutDashboard size={15} />
                              <Text>Console Admin</Text>
                            </HStack>
                          </NextLink>
                        )}
                      </Stack>

                      {/* Déconnexion */}
                      <Box pt="1.5" borderTopWidth="1px" borderColor="paper.150">
                        <Button
                          variant="ghost"
                          size="xs"
                          w="full"
                          justifyContent="flex-start"
                          rounded="xl"
                          color="red.600"
                          _hover={{ bg: "red.50" }}
                          px="3"
                          py="2"
                          onClick={() => {
                            setUserMenuOpen(false);
                            try {
                              localStorage.removeItem("pretymelo_user");
                              localStorage.removeItem("pretymelo_username");
                              localStorage.removeItem("melostars_user");
                              localStorage.removeItem("melostars_username");
                              sessionStorage.clear();
                            } catch (_) {}
                            signOut({ callbackUrl: "/" });
                          }}
                        >
                          <HStack gap="2.5">
                            <LuLogOut size={14} />
                            <Text fontWeight="600">Déconnexion</Text>
                          </HStack>
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Box>
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  display={{ base: "none", md: "inline-flex" }}
                  fontFamily="ui"
                  color="ink.700"
                  _hover={{ bg: "paper.200" }}
                >
                  <NextLink href="/login">Connexion</NextLink>
                </Button>
                <Button
                  asChild
                  rounded="full"
                  fontFamily="ui"
                  fontWeight="600"
                  color="white"
                  background={accent.primary}
                  _hover={{ transform: "translateY(-1px)" }}
                  transition="all .25s"
                >
                  <NextLink href="/onboarding">Démarrer</NextLink>
                </Button>
              </>
            )}

            <IconButton
              aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
              display={{ base: "inline-flex", lg: "none" }}
              variant="ghost"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <LuX /> : <LuMenu />}
            </IconButton>
          </HStack>
        </Flex>

        {/* Menu mobile */}
        {open && (
          <Stack pb="5" gap="2" display={{ base: "flex", lg: "none" }} fontFamily="ui">
            {isAuthenticated && (
              <HStack
                gap="3"
                p="3"
                rounded="2xl"
                bg="paper.100"
                borderWidth="1px"
                borderColor="paper.200"
                mb="1"
              >
                <Avatar.Root size="md" rounded="xl">
                  <Avatar.Fallback name={userName} />
                  <Avatar.Image
                    src={userImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"}
                    alt={userName}
                    referrerPolicy="no-referrer"
                  />
                </Avatar.Root>
                <Box minW="0" flex="1">
                  <HStack gap="1">
                    <Text fontSize="sm" fontWeight="700" color="ink.900" truncate>
                      {userName}
                    </Text>
                    {isGoogle && (
                      <Box title="Google" display="inline-flex">
                        <GoogleIcon size={13} />
                      </Box>
                    )}
                  </HStack>
                  <Text fontSize="xs" color="ink.400" truncate>
                    {userEmail}
                  </Text>
                </Box>
              </HStack>
            )}

            {navLinks.map((l) => (
              <NextLink key={l.href} href={l.href} onClick={() => setOpen(false)}>
                <Box py="2.5" color="ink.700" borderBottomWidth="1px" borderColor="paper.200">
                  {l.label}
                </Box>
              </NextLink>
            ))}

            {isAuthenticated ? (
              <Stack gap="2" pt="2">
                <Button asChild rounded="full" background={accent.primary} color="white">
                  <NextLink href="/studio" onClick={() => setOpen(false)}>
                    Accéder au Studio
                  </NextLink>
                </Button>
                <Button asChild variant="outline" rounded="full">
                  <NextLink href="/studio/profil" onClick={() => setOpen(false)}>
                    Mon Profil
                  </NextLink>
                </Button>
                <Button
                  variant="ghost"
                  color="red.600"
                  rounded="full"
                  onClick={() => {
                    setOpen(false);
                    try {
                      localStorage.removeItem("pretymelo_user");
                      localStorage.removeItem("pretymelo_username");
                      localStorage.removeItem("melostars_user");
                      localStorage.removeItem("melostars_username");
                      sessionStorage.clear();
                    } catch (_) {}
                    signOut({ callbackUrl: "/" });
                  }}
                >
                  <LuLogOut size={16} style={{ marginRight: 8 }} /> Déconnexion
                </Button>
              </Stack>
            ) : (
              <Button asChild variant="outline" mt="3" rounded="full">
                <NextLink href="/login" onClick={() => setOpen(false)}>
                  Connexion
                </NextLink>
              </Button>
            )}
          </Stack>
        )}
      </Container>
    </Box>
  );
}
