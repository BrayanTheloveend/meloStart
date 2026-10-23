"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { sampleTracks } from "@/data/content";
import { api } from "@/lib/apiClient";

const StudioContext = createContext(null);

const initialConfig = {
  description: "",
  customLyrics: "",
  genre: "Afrobeat",
  moods: ["Joyeux"],
  lyrics: true,
  vocals: true,
  vocalType: "female",
};

export function StudioProvider({ children }) {
  const [notes, setNotes] = useState(6);
  const [library, setLibrary] = useState([]);
  const [config, setConfig] = useState(initialConfig);
  const [isLoadingStudio, setIsLoadingStudio] = useState(true);

  // Lecteur audio persistant
  const [activePlayerTrack, setActivePlayerTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seekTime, setSeekTime] = useState(null);

  const updateProgress = (cur, dur) => {
    setCurrentTime(cur);
    if (dur && !isNaN(dur) && dur > 0) setDuration(dur);
  };

  const seekTrack = (targetTime) => {
    setSeekTime(targetTime);
    setCurrentTime(targetTime);
  };

  // Fonction de resynchronisation des crédits
  const refreshUserCredits = async () => {
    try {
      const res = await api.get("/api/user/credits");
      if (res?.credits !== undefined) {
        setNotes(res.credits);
        try {
          localStorage.setItem("melostars_notes", String(res.credits));
        } catch (_) {}
      }
    } catch (_) {}
  };

  // Charger Notes et Bibliothèque depuis le serveur (avec fallback localStorage)
  useEffect(() => {
    // 1. Initialisation locale rapide
    try {
      const savedNotes = localStorage.getItem("melostars_notes");
      if (savedNotes !== null) {
        setNotes(parseInt(savedNotes, 10));
      }

      const savedLibrary = localStorage.getItem("melostars_library");
      if (savedLibrary) {
        setLibrary(JSON.parse(savedLibrary));
      }
    } catch (_) {}

    // 2. Synchronisation avec les APIs serveur
    Promise.all([
      api.get("/api/user/credits").catch(() => null),
      api.get("/api/tracks").catch(() => null),
    ])
      .then(([creditsRes, tracksRes]) => {
        if (creditsRes?.credits !== undefined) {
          setNotes(creditsRes.credits);
          try {
            localStorage.setItem("melostars_notes", String(creditsRes.credits));
          } catch (_) {}
        }

        if (tracksRes?.data) {
          setLibrary(tracksRes.data);
          try {
            localStorage.setItem("melostars_library", JSON.stringify(tracksRes.data));
          } catch (_) {}
        }
      })
      .finally(() => {
        setIsLoadingStudio(false);
      });
  }, []);

  const updateNotes = (newBalance) => {
    setNotes(newBalance);
    try {
      localStorage.setItem("melostars_notes", String(newBalance));
    } catch (_) {}
  };

  const addNotes = (amount) => {
    updateNotes(notes + amount);
  };

  const addTrack = (newTrack) => {
    const updated = [newTrack, ...library];
    setLibrary(updated);
    setActivePlayerTrack(newTrack);
    setIsPlaying(true);
    try {
      localStorage.setItem("melostars_library", JSON.stringify(updated));
    } catch (_) {}
    refreshUserCredits();
  };

  const toggleFavorite = async (trackId) => {
    const currentTrack = library.find((t) => t.id === trackId);
    const newFavoriteState = !currentTrack?.isFavorite;

    // Mise à jour optimiste
    const updated = library.map((t) => (t.id === trackId ? { ...t, isFavorite: newFavoriteState } : t));
    setLibrary(updated);
    try {
      localStorage.setItem("melostars_library", JSON.stringify(updated));
    } catch (_) {}

    if (activePlayerTrack?.id === trackId) {
      setActivePlayerTrack((prev) => (prev ? { ...prev, isFavorite: newFavoriteState } : null));
    }

    // Persistance API serveur
    try {
      await api.patch(`/api/tracks/${trackId}`, { isFavorite: newFavoriteState });
    } catch (err) {
      console.warn("[StudioContext] Échec persistance favori:", err.message);
    }
  };

  const togglePublic = async (trackId) => {
    const currentTrack = library.find((t) => t.id === trackId);
    if (!currentTrack) return;
    const newPublicState = !currentTrack.isPublic;

    // Mise à jour optimiste de la bibliothèque locale
    const updated = library.map((t) => (t.id === trackId ? { ...t, isPublic: newPublicState } : t));
    setLibrary(updated);
    try {
      localStorage.setItem("melostars_library", JSON.stringify(updated));
    } catch (_) {}

    if (activePlayerTrack?.id === trackId) {
      setActivePlayerTrack((prev) => (prev ? { ...prev, isPublic: newPublicState } : null));
    }

    // Persistance API serveur
    try {
      await api.patch(`/api/tracks/${trackId}`, { isPublic: newPublicState });
    } catch (err) {
      console.warn("[StudioContext] Échec persistance visibilité publique:", err.message);
    }
  };

  const deleteTrack = async (trackId) => {
    // Mise à jour optimiste
    const updated = library.filter((t) => t.id !== trackId);
    setLibrary(updated);
    try {
      localStorage.setItem("melostars_library", JSON.stringify(updated));
    } catch (_) {}

    if (activePlayerTrack?.id === trackId) {
      setActivePlayerTrack(null);
      setIsPlaying(false);
    }

    // Suppression API serveur
    try {
      await api.delete(`/api/tracks/${trackId}`);
    } catch (err) {
      console.warn("[StudioContext] Échec suppression API:", err.message);
    }
  };

  const playTrack = (track) => {
    if (activePlayerTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      setActivePlayerTrack(track);
      setIsPlaying(true);
      setCurrentTime(0);
      setDuration(Number(track.seconds || track.duration) || 60);
    }
  };

  const togglePlay = (forceState) => {
    setIsPlaying(typeof forceState === "boolean" ? forceState : !isPlaying);
  };

  const closePlayer = () => {
    setActivePlayerTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Fonction de resynchronisation des morceaux
  const refreshTracks = async () => {
    try {
      const res = await api.get("/api/tracks");
      if (res?.data) {
        setLibrary(res.data);
        try {
          localStorage.setItem("melostars_library", JSON.stringify(res.data));
        } catch (_) {}
      }
    } catch (_) {}
  };

  return (
    <StudioContext.Provider
      value={{
        notes,
        updateNotes,
        addNotes,
        library,
        isLoadingStudio,
        refreshUserCredits,
        refreshTracks,
        addTrack,
        toggleFavorite,
        togglePublic,
        deleteTrack,
        config,
        setConfig,
        activePlayerTrack,
        isPlaying,
        currentTime,
        duration,
        seekTime,
        updateProgress,
        seekTrack,
        playTrack,
        togglePlay,
        closePlayer,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error("useStudio doit être utilisé à l'intérieur d'un StudioProvider");
  }
  return context;
}
