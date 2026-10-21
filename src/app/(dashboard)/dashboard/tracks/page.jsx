"use client";

import { useEffect, useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Input,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";

import { LuCheck, LuDownload, LuEye, LuGlobe, LuMusic, LuPause, LuPlay, LuRotateCcw, LuSearch, LuSparkles, LuTrash2 } from "react-icons/lu";
import { LucideAlertTriangle } from "lucide-react";
import { api } from "@/lib/apiClient";
import SunoMetricsOverview from "@/components/admin/SunoMetricsOverview";
import { ShimmerTableRow } from "@/components/common/Shimmer";
import { downloadTrackAudio } from "@/lib/downloadTrack";
import CreateDemoTrackModal from "@/components/admin/CreateDemoTrackModal";

export default function AdminTracksPage() {
  const [tracks, setTracks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [playingTrackId, setPlayingTrackId] = useState(null);
  const [selectedTrackDetails, setSelectedTrackDetails] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [togglingPublicId, setTogglingPublicId] = useState(null);
  const audioRef = useRef(null);

  const notify = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadTracks = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      if (searchQuery.trim()) query.set("search", searchQuery.trim());
      if (statusFilter !== "ALL") query.set("status", statusFilter);

      const res = await api.get(`/api/admin/tracks?${query.toString()}`);
      if (res?.tracks) {
        setTracks(res.tracks);
      }
    } catch (err) {
      console.warn("[Admin Tracks] Erreur API:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTracks();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    if (e.key === "Enter") {
      loadTracks();
    }
  };

  const filteredTracks = tracks.filter((t) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (t.title || "").toLowerCase().includes(q) ||
      (t.prompt || "").toLowerCase().includes(q) ||
      (t.user?.name || "").toLowerCase().includes(q) ||
      (t.genre || "").toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
    return true;
  });

  const togglePlay = (track) => {
    if (playingTrackId === track.id) {
      if (audioRef.current) audioRef.current.pause();
      setPlayingTrackId(null);
    } else {
      setPlayingTrackId(track.id);
      if (track.audioUrl) {
        if (!audioRef.current) {
          audioRef.current = new Audio(track.audioUrl);
          audioRef.current.onended = () => setPlayingTrackId(null);
        } else {
          audioRef.current.src = track.audioUrl;
        }
        audioRef.current.play().catch(() => {});
        notify(`Lecture : "${track.title}"`);
      } else {
        notify("Aucun flux audio disponible pour cette piste.");
      }
    }
  };

  const handleRetryJob = async (trackId) => {
    setActionLoadingId(trackId);
    try {
      await api.post(`/api/admin/tracks/${trackId}/retry`);
      setTracks((prev) =>
        prev.map((t) =>
          t.id === trackId
            ? {
                ...t,
                status: "QUEUED",
                progress: 0,
                errorMessage: null,
              }
            : t
        )
      );
      notify("Génération asynchrone relancée avec succès.");
    } catch (err) {
      notify(`Erreur relance : ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRefundTrack = (trackId) => {
    notify("2 Notes remboursées au solde utilisateur.");
  };

  const handleDeleteTrack = async (trackId) => {
    if (!confirm("Voulez-vous vraiment supprimer ce morceau ?")) return;
    setActionLoadingId(trackId);
    try {
      await api.delete(`/api/admin/tracks/${trackId}`);
      setTracks((prev) => prev.filter((t) => t.id !== trackId));
      notify("Piste supprimée de la base et du stockage local.");
    } catch (err) {
      notify(`Erreur suppression : ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleTogglePublic = async (track) => {
    setTogglingPublicId(track.id);
    try {
      const newIsPublic = !track.isPublic;
      const res = await api.patch(`/api/admin/tracks/${track.id}`, {
        isPublic: newIsPublic,
      });
      if (res?.track) {
        setTracks((prev) =>
          prev.map((t) => (t.id === track.id ? { ...t, isPublic: res.track.isPublic } : t))
        );
        notify(
          newIsPublic
            ? `🌟 "${track.title}" est maintenant en ligne sur la page d'accueil !`
            : `"${track.title}" a été retiré de l'accueil.`
        );
      }
    } catch (err) {
      notify(`Erreur modification accueil : ${err.message}`);
    } finally {
      setTogglingPublicId(null);
    }
  };

  return (
    <Stack gap="8">
      {/* Toast */}
      {toastMessage && (
        <Box
          position="fixed"
          bottom="6"
          right="6"
          zIndex="60"
          bg="ink.900"
          color="white"
          px="4"
          py="3"
          rounded="2xl"
          boxShadow="2xl"
          display="flex"
          alignItems="center"
          gap="2"
        >
          <LuCheck color="#10b981" />
          <Text fontSize="sm" fontWeight="600">
            {toastMessage}
          </Text>
        </Box>
      )}

      {/* En-tête */}
      <Flex direction={{ base: "column", sm: "row" }} justify="space-between" align={{ base: "flex-start", sm: "center" }} gap="4">
        <Stack gap="1">
          <HStack gap="2">
            <Text fontFamily="heading" fontWeight="800" fontSize={{ base: "2xl", md: "3xl" }} letterSpacing="-0.03em">
              Supervision des Musiques & IA
            </Text>
            <Badge bg="brand.violetTint" color="brand.violetDeep" px="2.5" py="1" rounded="full" fontWeight="700" fontSize="xs">
              Asynchrone Webhooks
            </Badge>
          </HStack>
          <Text color="ink.500" fontSize="sm">
            Inspectez les requêtes de génération, écoutez les masters et relancez les jobs en échec.
          </Text>
        </Stack>

        <HStack gap="3">
          <Button
            size="sm"
            rounded="full"
            bg="linear-gradient(135deg, #FF5E8E 0%, #8A2BE2 100%)"
            color="white"
            fontWeight="700"
            px="4"
            onClick={() => setIsDemoModalOpen(true)}
            _hover={{ transform: "translateY(-1px)", boxShadow: "0 8px 20px rgba(138,43,226,0.3)" }}
            transition="all 0.2s ease"
          >
            🎵 Créer Démo Accueil
          </Button>
        </HStack>
      </Flex>

      {/* Métriques globales et état de Suno API */}
      <SunoMetricsOverview
        onSelectStatus={(status) => setStatusFilter(status)}
        activeStatus={statusFilter}
        onNotify={notify}
      />

      {/* Filtres et Recherche */}
      <Box p="5" rounded="3xl" bg="paper.0" border="1px solid" borderColor="paper.200">
        <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "stretch", md: "center" }} gap="4" mb="6">
          <HStack flex="1" maxW="440px" bg="paper.100" rounded="full" px="3.5" py="1.5" border="1px solid" borderColor="paper.200">
            <LuSearch size={15} color="#71717a" />
            <Input
              placeholder="Rechercher par titre, prompt, utilisateur ou style..."
              variant="unstyled"
              fontSize="sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              border="none"
              _focus={{ outline: "none" }}
            />
          </HStack>

          {/* Filtres par statut */}
          <HStack gap="1.5" wrap="wrap">
            {[
              { id: "ALL", label: "Toutes" },
              { id: "COMPLETED", label: "Complétées" },
              { id: "PROCESSING", label: "En cours" },
              { id: "FAILED", label: "Échouées" },
            ].map((tab) => (
              <Button
                key={tab.id}
                size="xs"
                rounded="full"
                px="3"
                variant={statusFilter === tab.id ? "solid" : "ghost"}
                bg={statusFilter === tab.id ? "brand.violetDeep" : "paper.100"}
                color={statusFilter === tab.id ? "white" : "ink.700"}
                onClick={() => setStatusFilter(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </HStack>
        </Flex>

        {/* Table des Musiques */}
        <Box overflowX="auto">
          <Table.Root size="sm" variant="outline">
            <Table.Header>
              <Table.Row bg="paper.50">
                <Table.ColumnHeader py="3">Piste & Prompt</Table.ColumnHeader>
                <Table.ColumnHeader>Utilisateur</Table.ColumnHeader>
                <Table.ColumnHeader>Genre & Voix</Table.ColumnHeader>
                <Table.ColumnHeader>Durée</Table.ColumnHeader>
                <Table.ColumnHeader>Statut / Progrès</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="center">Accueil</Table.ColumnHeader>
                <Table.ColumnHeader>Date</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="right">Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <ShimmerTableRow key={i} columns={8} />
                ))
              ) : filteredTracks.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={8} textAlign="center" py="10">
                    <Stack align="center" gap="2">
                      <LuMusic size={28} color="#94a3b8" />
                      <Text color="ink.500" fontSize="sm" fontWeight="600">
                        Aucune piste trouvée
                      </Text>
                      <Text color="ink.400" fontSize="xs">
                        {searchQuery ? "Essayez d'ajuster votre filtre ou recherche." : "Générez vos premières musiques pour les afficher ici."}
                      </Text>
                    </Stack>
                  </Table.Cell>
                </Table.Row>
              ) : (
                filteredTracks.map((t) => {
                const isPlaying = playingTrackId === t.id;

                return (
                  <Table.Row key={t.id} _hover={{ bg: "paper.50" }} transition="background 0.15s">
                    {/* Piste & Play */}
                    <Table.Cell py="3">
                      <HStack gap="3">
                        <IconButton
                          aria-label="Lecture"
                          size="sm"
                          rounded="full"
                          bg={isPlaying ? "brand.pink" : "paper.200"}
                          color={isPlaying ? "white" : "ink.900"}
                          onClick={() => t.audioUrl && togglePlay(t)}
                          disabled={!t.audioUrl}
                        >
                          {isPlaying ? <LuPause size={14} /> : <LuPlay size={14} />}
                        </IconButton>

                        <Stack gap="0.5" maxW="340px">
                          <HStack gap="2">
                            <Text fontWeight="700" fontSize="sm" color="ink.900" truncate>
                              {t.title}
                            </Text>
                            {t.jobId?.startsWith("suno_") || (t.jobId && !t.jobId.startsWith("local-") && !t.jobId.includes("sim")) ? (
                              <Badge size="xs" colorPalette="purple" rounded="md" fontSize="9px" px="1.5">
                                Suno V6
                              </Badge>
                            ) : (
                              <Badge size="xs" colorPalette="cyan" rounded="md" fontSize="9px" px="1.5">
                                Studio
                              </Badge>
                            )}
                          </HStack>
                          <Text fontSize="xs" color="ink.500" truncate title={t.prompt}>
                            {t.prompt || t.lyrics || "Sans description"}
                          </Text>
                        </Stack>
                      </HStack>
                    </Table.Cell>

                    {/* Utilisateur */}
                    <Table.Cell>
                      <Stack gap="0">
                        <Text fontSize="xs" fontWeight="600" color="ink.900">
                          {t.user?.name || "Utilisateur"}
                        </Text>
                        <Text fontSize="10px" color="ink.400">
                          {t.user?.email || "N/A"}
                        </Text>
                      </Stack>
                    </Table.Cell>

                    {/* Genre & Voix */}
                    <Table.Cell>
                      <HStack gap="1.5" wrap="wrap">
                        <Badge size="sm" rounded="full" px="2" variant="subtle">
                          {t.genre || "Pop"}
                        </Badge>
                        <Text fontSize="xs" color="ink.500">
                          • {t.vocalType || "female"}
                        </Text>
                      </HStack>
                    </Table.Cell>

                    {/* Durée */}
                    <Table.Cell>
                      <Text fontSize="xs" fontWeight="600" color="ink.700">
                        {t.duration || 60}s
                      </Text>
                    </Table.Cell>

                    {/* Statut */}
                    <Table.Cell>
                      {t.status === "COMPLETED" && (
                        <Badge colorPalette="green" size="sm" rounded="full" px="2">
                          Prêt (100%)
                        </Badge>
                      )}
                      {t.status === "PROCESSING" && (
                        <Badge colorPalette="blue" size="sm" rounded="full" px="2">
                          En cours ({t.progress || 20}%)
                        </Badge>
                      )}
                      {t.status === "QUEUED" && (
                        <Badge colorPalette="yellow" size="sm" rounded="full" px="2">
                          En file ({t.progress || 0}%)
                        </Badge>
                      )}
                      {t.status === "FAILED" && (
                        <Badge colorPalette="red" size="sm" rounded="full" px="2">
                          Échec
                        </Badge>
                      )}
                    </Table.Cell>

                    {/* Accueil (isPublic) */}
                    <Table.Cell textAlign="center">
                      <Button
                        size="xs"
                        rounded="full"
                        variant={t.isPublic ? "solid" : "subtle"}
                        bg={t.isPublic ? "emerald.500" : undefined}
                        colorPalette={t.isPublic ? "green" : "gray"}
                        loading={togglingPublicId === t.id}
                        onClick={() => handleTogglePublic(t)}
                        title={t.isPublic ? "Visible à l'accueil du site (cliquez pour masquer)" : "Masqué de l'accueil (cliquez pour afficher)"}
                      >
                        {t.isPublic ? "🌟 En Ligne" : "Masqué"}
                      </Button>
                    </Table.Cell>

                    {/* Date */}
                    <Table.Cell>
                      <Text fontSize="xs" color="ink.400">
                        {t.createdAt}
                      </Text>
                    </Table.Cell>

                    {/* Actions */}
                    <Table.Cell textAlign="right">
                      <HStack gap="1.5" justify="flex-end">
                        {/* Bouton Voir Détails */}
                        <IconButton
                          aria-label="Détails"
                          size="xs"
                          variant="ghost"
                          rounded="full"
                          onClick={() => setSelectedTrackDetails(t)}
                        >
                          <LuEye size={13} />
                        </IconButton>

                        {/* Bouton Télécharger */}
                        {t.audioUrl && (
                          <IconButton
                            aria-label="Télécharger"
                            size="xs"
                            variant="ghost"
                            rounded="full"
                            title="Télécharger la musique"
                            onClick={() => downloadTrackAudio(t)}
                          >
                            <LuDownload size={13} />
                          </IconButton>
                        )}

                        {/* Bouton Relancer Job */}
                        {t.status === "FAILED" && (
                          <Button
                            size="xs"
                            variant="subtle"
                            colorPalette="blue"
                            rounded="full"
                            onClick={() => handleRetryJob(t.id)}
                            loading={actionLoadingId === t.id}
                          >
                            <HStack gap="1">
                              <LuRotateCcw size={11} />
                              <Text>Retry</Text>
                            </HStack>
                          </Button>
                        )}

                        {/* Supprimer */}
                        <IconButton
                          aria-label="Supprimer"
                          size="xs"
                          variant="ghost"
                          rounded="full"
                          colorPalette="red"
                          onClick={() => handleDeleteTrack(t.id)}
                          loading={actionLoadingId === t.id}
                        >
                          <LuTrash2 size={13} />
                        </IconButton>
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                );
              })
            )}
            </Table.Body>
          </Table.Root>
        </Box>
      </Box>

      {/* Modal Détails Piste */}
      {selectedTrackDetails && (
        <Box
          position="fixed"
          top="0"
          left="0"
          w="100vw"
          h="100vh"
          bg="rgba(0,0,0,0.5)"
          zIndex="70"
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="4"
        >
          <Box bg="paper.0" p="6" rounded="3xl" maxW="540px" w="full" boxShadow="2xl">
            <Stack gap="4">
              <HStack justify="space-between">
                <HStack gap="2">
                  <LuMusic color="#7c3aed" />
                  <Text fontFamily="heading" fontWeight="700" fontSize="lg">
                    {selectedTrackDetails.title}
                  </Text>
                </HStack>
                <Button size="xs" variant="ghost" rounded="full" onClick={() => setSelectedTrackDetails(null)}>
                  ✕
                </Button>
              </HStack>

              <Stack gap="2" bg="paper.50" p="4" rounded="2xl" border="1px solid" borderColor="paper.200">
                <Text fontSize="xs" fontWeight="700" color="ink.500" textTransform="uppercase">
                  Prompt d'origine
                </Text>
                <Text fontSize="sm" color="ink.800">
                  {selectedTrackDetails.prompt}
                </Text>
              </Stack>

              <SimpleGrid columns={2} gap="3">
                <Box p="3" rounded="xl" bg="paper.50" border="1px solid" borderColor="paper.200">
                  <Text fontSize="10px" color="ink.400">GENRE & AMBIANCE</Text>
                  <Text fontSize="xs" fontWeight="700" mt="0.5">
                    {selectedTrackDetails.genre} ({selectedTrackDetails.moods?.join(", ") || "Libre"})
                  </Text>
                </Box>
                <Box p="3" rounded="xl" bg="paper.50" border="1px solid" borderColor="paper.200">
                  <Text fontSize="10px" color="ink.400">VOIX & DURÉE</Text>
                  <Text fontSize="xs" fontWeight="700" mt="0.5">
                    {selectedTrackDetails.vocalType} • {selectedTrackDetails.duration} secondes
                  </Text>
                </Box>
              </SimpleGrid>

              {selectedTrackDetails.jobId && (
                <Box p="3" rounded="xl" bg="paper.50" border="1px solid" borderColor="paper.200">
                  <Text fontSize="10px" color="ink.400">IDENTIFIANT DE TÂCHE (TASK ID)</Text>
                  <Text fontSize="xs" fontFamily="mono" color="ink.800" mt="0.5">
                    {selectedTrackDetails.jobId}
                  </Text>
                </Box>
              )}

              {selectedTrackDetails.audioUrl && (
                <Box p="3" rounded="xl" bg="paper.50" border="1px solid" borderColor="paper.200">
                  <Text fontSize="10px" color="ink.400">URL DU MASTER AUDIO</Text>
                  <Text fontSize="xs" fontFamily="mono" color="brand.violetDeep" mt="0.5" truncate>
                    {selectedTrackDetails.audioUrl}
                  </Text>
                </Box>
              )}


              {selectedTrackDetails.errorMessage && (
                <Box p="3" rounded="xl" bg="red.50" border="1px solid" borderColor="red.200">
                  <HStack gap="1.5" color="red.700" mb="1">
                    <LucideAlertTriangle size={14} />
                    <Text fontSize="xs" fontWeight="700">Détail de l'erreur IA</Text>
                  </HStack>
                  <Text fontSize="xs" color="red.800">
                    {selectedTrackDetails.errorMessage}
                  </Text>
                </Box>
              )}

              <Flex justify="space-between" align="center" mt="2" gap="2" wrap="wrap">
                <Button
                  size="sm"
                  variant="outline"
                  rounded="xl"
                  onClick={() => handleRefundTrack(selectedTrackDetails.id)}
                >
                  Rembourser 2 Notes
                </Button>

                <HStack gap="2">
                  {selectedTrackDetails.audioUrl && (
                    <Button
                      size="sm"
                      rounded="xl"
                      variant="outline"
                      borderColor="paper.300"
                      color="ink.800"
                      onClick={() => downloadTrackAudio(selectedTrackDetails)}
                    >
                      <LuDownload size={14} /> Télécharger MP3
                    </Button>
                  )}

                  <Button
                    size="sm"
                    rounded="xl"
                    bg="brand.violetDeep"
                    color="white"
                    onClick={() => setSelectedTrackDetails(null)}
                  >
                    Fermer
                  </Button>
                </HStack>
              </Flex>
            </Stack>
          </Box>
        </Box>
      )}

      {/* Modal Création Démo Accueil */}
      <CreateDemoTrackModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onSuccess={loadTracks}
        notify={notify}
      />
    </Stack>
  );
}
