/**
 * Utilitaire client pour déclencher le téléchargement d'une musique
 * Fonctionne à 100% sur mobile et bureau, sans ouvrir de player dans un nouvel onglet.
 *
 * @param {Object} track Objet morceau contenant { id, title, audioUrl }
 */
export async function downloadTrackAudio(track) {
  if (!track) return;

  const rawTitle = track.title || "melostars-track";
  const cleanTitle =
    rawTitle
      .replace(/[^\w\s\u00C0-\u017F-]/gi, "")
      .trim()
      .replace(/\s+/g, "_")
      .slice(0, 60) || "track";
  const filename = `${cleanTitle}.mp3`;

  // 1. Priorité : Utiliser l'endpoint serveur officiel /api/tracks/[id]/download
  // Cet endpoint renvoie toujours l'en-tête 'Content-Disposition: attachment'
  if (track.id) {
    const downloadEndpoint = `/api/tracks/${track.id}/download`;
    const link = document.createElement("a");
    link.href = downloadEndpoint;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // 2. Si aucun id n'est fourni mais que audioUrl existe
  if (track.audioUrl) {
    // Si c'est un chemin relatif ou de même origine
    const isRelative = track.audioUrl.startsWith("/");
    if (isRelative) {
      const sep = track.audioUrl.includes("?") ? "&" : "?";
      const directUrl = `${track.audioUrl}${sep}download=1&filename=${encodeURIComponent(filename)}`;
      const link = document.createElement("a");
      link.href = directUrl;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // Pour les URLs externes (ex: Suno CDN direct), tenter un fetch blob pour forcer le téléchargement
    try {
      const res = await fetch(track.audioUrl);
      if (res.ok) {
        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 3000);
        return;
      }
    } catch (_) {}

    // Fallback direct
    const link = document.createElement("a");
    link.href = track.audioUrl;
    link.setAttribute("download", filename);
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export default downloadTrackAudio;
