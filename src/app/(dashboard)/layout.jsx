"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Container,
  Flex,
  HStack,
  IconButton,
  Image,
  Input,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  LuActivity,
  LuArrowUpRight,
  LuBell,
  LuCheckCircle2,
  LuChevronRight,
  LuCompass,
  LuCpu,
  LuCreditCard,
  LuHouse,
  LuLayers,
  LuLayoutDashboard,
  LuLogOut,
  LuMusic,
  LuSearch,
  LuServer,
  LuSettings,
  LuShieldAlert,
  LuSparkles,
  LuUsers,
  LuZap,
} from "react-icons/lu";

import Logo from "@/components/common/Logo";
import GlowBackground from "@/components/common/GlowBackground";
import { accent } from "@/theme/system";

const NAV_GROUPS = [
  {
    title: "PILOTAGE & CONTENU",
    items: [
      {
        href: "/dashboard",
        icon: LuLayoutDashboard,
        label: "Vue d'ensemble",
        badge: null,
      },
      {
        href: "/dashboard/users",
        icon: LuUsers,
        label: "Utilisateurs",
        badge: null,
      },
      {
        href: "/dashboard/tracks",
        icon: LuMusic,
        label: "Musiques & IA",
        badge: null,
        badgeColor: "brand.violet",
      },
    ],
  },
  {
    title: "FINANCES & INFRASTRUCTURE",
    items: [
      {
        href: "/dashboard/transactions",
        icon: LuCreditCard,
        label: "Transactions Stripe",
        badge: null,
      },
      {
        href: "/dashboard/vps",
        icon: LuCpu,
        label: "Métriques VPS Hostinger",
        badge: null,
        badgeColor: "purple.600",
      },
      {
        href: "/dashboard/system",
        icon: LuServer,
        label: "Santé BullMQ & Redis",
        badge: "BullMQ",
        badgeColor: "green.500",
      },
      {
        href: "/dashboard/settings",
        icon: LuSettings,
        label: "Configuration & IA",
        badge: null,
      },
    ],
  },
];

export default function AdminDashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSignOut = async () => {
    try {
      localStorage.removeItem("melostars_user");
      localStorage.removeItem("melostars_username");
      sessionStorage.clear();
    } catch (_) {}
    await signOut({ callbackUrl: "/login" });
  };

  // Redirection stricte côté client si non authentifié ou non ADMIN
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.replace("/studio?denied=admin_required");
    }
  }, [status, session, pathname, router]);

  // Écran de transition pendant la validation des droits
  if (status === "loading" || status === "unauthenticated" || session?.user?.role !== "ADMIN") {
    return (
      <Flex minH="100dvh" bg="paper.50" align="center" justify="center" direction="column" gap="4">
        <Spinner size="xl" color="brand.violetDeep" />
        <Text fontSize="sm" color="ink.600" fontFamily="ui" fontWeight="600">
          Vérification des accès administrateur...
        </Text>
      </Flex>
    );
  }

  const adminName = session?.user?.name || "Administrateur";
  const adminEmail = session?.user?.email || "admin@melostars.com";

  return (
    <Box minH="100dvh" bg="paper.50" color="ink.900" display="flex" position="relative">
      <GlowBackground intensity={0.12} />

      {/* ========================================================= */}
      {/* SIDEBAR ADMIN FIXE (GAUCHE) */}
      {/* ========================================================= */}
      <Box
        as="aside"
        w={{ base: "72px", lg: "280px" }}
        flexShrink={0}
        bg="paper.0"
        borderRight="1px solid"
        borderColor="paper.200"
        h="100dvh"
        maxH="100dvh"
        position="sticky"
        top="0"
        alignSelf="flex-start"
        zIndex="30"
        display="flex"
        flexDirection="column"
        overflow="hidden"
        transition="width 0.2s"
      >
        {/* En-tête Sidebar : Logo & Badge Admin */}
        <Box px={{ base: "3", lg: "6" }} py="5" borderBottom="1px solid" borderColor="paper.200" flexShrink={0}>
          <HStack justify={{ base: "center", lg: "space-between" }} align="center">
            <Box display={{ base: "none", lg: "block" }}>
              <Logo />
            </Box>
            <Box display={{ base: "block", lg: "none" }}>
              <Image src="/assets/logo.png" alt="melostars" width={'35px'} height={'35px'} />
            </Box>

            <Badge
              display={{ base: "none", lg: "inline-flex" }}
              bg="brand.violetTint"
              color="brand.violetDeep"
              px="2.5"
              py="1"
              rounded="full"
              fontWeight="800"
              fontSize="10px"
              letterSpacing="0.05em"
              border="1px solid"
              borderColor="rgba(124, 58, 237, 0.25)"
            >
              ADMIN
            </Badge>
          </HStack>
        </Box>

        {/* Liens de navigation avec défilement interne fluide */}
        <Box
          flex="1"
          minH="0"
          py="6"
          px={{ base: "2", lg: "4" }}
          overflowY="auto"
          overscrollBehavior="contain"
          css={{
            scrollbarWidth: "thin",
            scrollbarColor: "var(--chakra-colors-paper-300, #e2e8f0) transparent",
            "&::-webkit-scrollbar": { width: "4px" },
            "&::-webkit-scrollbar-thumb": {
              background: "rgba(0, 0, 0, 0.12)",
              borderRadius: "10px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              background: "rgba(0, 0, 0, 0.2)",
            },
          }}
        >
          <Stack gap="6">
            {NAV_GROUPS.map((group) => (
              <Stack key={group.title} gap="1.5">
                <Text
                  display={{ base: "none", lg: "block" }}
                  px="3"
                  fontSize="10px"
                  fontWeight="800"
                  letterSpacing="0.08em"
                  color="ink.400"
                  fontFamily="ui"
                >
                  {group.title}
                </Text>

                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Button
                      key={item.href}
                      asChild
                      variant="ghost"
                      size="md"
                      justifyContent={{ base: "center", lg: "flex-start" }}
                      px={{ base: "2", lg: "3.5" }}
                      py="2.5"
                      rounded="xl"
                      fontFamily="ui"
                      fontWeight={isActive ? "700" : "500"}
                      color={isActive ? "brand.violetDeep" : "ink.700"}
                      bg={isActive ? "brand.violetTint" : "transparent"}
                      border={isActive ? "1px solid" : "1px solid transparent"}
                      borderColor={isActive ? "rgba(124, 58, 237, 0.25)" : "transparent"}
                      _hover={{
                        bg: isActive ? "brand.violetTint" : "paper.100",
                        color: "ink.900",
                      }}
                      title={item.label}
                    >
                      <NextLink href={item.href}>
                        <HStack justify="space-between" w="full" gap="3">
                          <HStack gap="3">
                            <Icon size={18} color={isActive ? "#7c3aed" : "currentColor"} />
                            <Text display={{ base: "none", lg: "block" }} fontSize="sm">
                              {item.label}
                            </Text>
                          </HStack>

                          {item.badge && (
                            <Badge
                              display={{ base: "none", lg: "inline-flex" }}
                              size="xs"
                              rounded="full"
                              px="2"
                              py="0.5"
                              bg={item.badgeColor === "purple.600" ? "purple.50" : item.badgeColor === "green.500" ? "green.50" : "brand.violetTint"}
                              color={item.badgeColor || "brand.violetDeep"}
                              border="1px solid"
                              borderColor={item.badgeColor === "green.500" ? "green.200" : "purple.200"}
                              fontWeight="700"
                              fontSize="10px"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </HStack>
                      </NextLink>
                    </Button>
                  );
                })}
              </Stack>
            ))}
          </Stack>
        </Box>

        {/* Pied de sidebar : Statut système et retour au studio */}
        <Box p={{ base: "2", lg: "4" }} borderTop="1px solid" borderColor="paper.200" flexShrink={0}>
          <Box
            display={{ base: "none", lg: "block" }}
            p="3.5"
            rounded="2xl"
            bg="paper.100"
            border="1px solid"
            borderColor="paper.200"
            mb="3"
          >
            <HStack gap="2" mb="1">
              <Box w="8px" h="8px" rounded="full" bg="green.500" />
              <Text fontSize="xs" fontWeight="700" color="ink.900">
                Systèmes en ligne
              </Text>
            </HStack>
            <Text fontSize="11px" color="ink.500">
              PostgreSQL, BullMQ & Redis opérationnels.
            </Text>
          </Box>

          {/* <Button
            asChild
            variant="outline"
            size="sm"
            w="full"
            rounded="xl"
            borderColor="paper.300"
            color="ink.700"
            _hover={{ bg: "paper.100", color: "ink.900" }}
          >
            <NextLink href="/studio">
              <HStack justify={{ base: "center", lg: "space-between" }} w="full">
                <HStack gap="2">
                  <LuCompass size={15} />
                  <Text display={{ base: "none", lg: "block" }} fontSize="xs" fontWeight="600">
                    Ouvrir le Studio
                  </Text>
                </HStack>
                <Box display={{ base: "none", lg: "block" }}>
                  <LuArrowUpRight size={14} />
                </Box>
              </HStack>
            </NextLink>
          </Button> */}

          <Button
            variant="ghost"
            size="sm"
            w="full"
            mt="2"
            rounded="xl"
            color="red.600"
            _hover={{ bg: "red.50", color: "red.700" }}
            onClick={handleSignOut}
            title="Se déconnecter"
          >
            <HStack justify={{ base: "center", lg: "flex-start" }} w="full" gap="2.5">
              <LuLogOut size={16} />
              <Text display={{ base: "none", lg: "block" }} fontSize="xs" fontWeight="600">
                Déconnexion
              </Text>
            </HStack>
          </Button>
        </Box>
      </Box>

      {/* ========================================================= */}
      {/* CONTENU PRINCIPAL + TOPBAR */}
      {/* ========================================================= */}
      <Box flex="1" minW="0" display="flex" flexDirection="column">
        {/* Topbar Administrateur */}
        <Box
          as="header"
          position="sticky"
          top="0"
          zIndex="20"
          bg="rgba(255, 255, 255, 0.88)"
          backdropFilter="blur(16px)"
          borderBottom="1px solid"
          borderColor="paper.200"
          px={{ base: "4", md: "8" }}
          py="3"
        >
          <Flex justify="space-between" align="center" gap="4">
            {/* Barre de recherche globale admin */}
            <Text>{' '}</Text>
            {/* <HStack
              flex="1"
              maxW="480px"
              bg="paper.100"
              rounded="full"
              px="4"
              py="2"
              border="1px solid"
              borderColor="paper.200"
              _focusWithin={{ borderColor: "brand.violet", bg: "paper.0" }}
              transition="all 0.2s"
            >
              <LuSearch size={16} color="#71717a" />
              <Input
                placeholder="Rechercher utilisateur, ID musique, transaction..."
                variant="unstyled"
                fontSize="sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                border="none"
                _focus={{ outline: "none" }}
              />
            </HStack> */}

            {/* Actions à droite : Santé, Alertes, Profil Admin */}
            <HStack gap="3">
              {/* Badge d'état de production */}
              <HStack
                display={{ base: "none", sm: "flex" }}
                px="3"
                py="1.5"
                rounded="full"
                bg="green.50"
                border="1px solid"
                borderColor="green.200"
                gap="2"
              >
                <Box w="6px" h="6px" rounded="full" bg="green.500" />
                <Text fontSize="xs" fontWeight="700" color="green.700">
                  Worker IA Actif
                </Text>
              </HStack>

              {/* Bouton de notifications */}
              <Box position="relative">
                <IconButton
                  aria-label="Notifications"
                  variant="ghost"
                  rounded="full"
                  size="sm"
                  color="ink.600"
                  _hover={{ bg: "paper.100" }}
                >
                  <LuBell size={18} />
                </IconButton>
                <Box
                  position="absolute"
                  top="1"
                  right="1"
                  w="8px"
                  h="8px"
                  rounded="full"
                  bg="brand.pink"
                  border="2px solid white"
                />
              </Box>

              {/* Avatar Super Admin */}
              <HStack
                gap="2.5"
                pl="2"
                borderLeft="1px solid"
                borderColor="paper.200"
              >
                <Avatar.Root size="sm" rounded="full">
                  <Avatar.Fallback name={adminName} />
                  <Avatar.Image src={session?.user?.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"} />
                </Avatar.Root>
                <Box display={{ base: "none", md: "block" }} textAlign="left">
                  <Text fontSize="xs" fontWeight="700" lineHeight="1.2">
                    {adminName}
                  </Text>
                  <Text fontSize="10px" color="ink.500" lineHeight="1">
                    Administrateur
                  </Text>
                </Box>
              </HStack>

              {/* Bouton de déconnexion rapide */}
              <Button
                variant="outline"
                size="sm"
                rounded="full"
                borderColor="paper.300"
                color="red.600"
                _hover={{ bg: "red.50", borderColor: "red.200" }}
                onClick={handleSignOut}
                fontFamily="ui"
                fontSize="xs"
                fontWeight="600"
                px="3"
                title="Déconnexion"
              >
                <HStack gap="1.5">
                  <LuLogOut size={14} />
                  <Text display={{ base: "none", md: "inline" }}>Déconnexion</Text>
                </HStack>
              </Button>
            </HStack>
          </Flex>
        </Box>

        {/* Corps de la page */}
        <Box as="main" flex="1" p={{ base: "4", md: "8" }} maxW="1600px" w="full" mx="auto">
          {children}
        </Box>
      </Box>
    </Box>
  );
}
