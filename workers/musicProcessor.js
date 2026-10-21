/**
 * melostars - Notice d'Architecture
 *
 * Ce worker BullMQ est désormais DÉPRÉCIÉ et DÉSACTIVÉ.
 * La plateforme melostars fonctionne désormais selon une architecture
 * 100% asynchrone par Webhook & Polling (Stateless, sans Redis) :
 *
 * 1. Création : POST /api/tracks/generate (appelle Suno API avec callBackUrl).
 * 2. Webhook : POST /api/webhooks/suno (réception des callbacks asynchrones).
 * 3. Polling  : GET  /api/tracks/[id] (synchronisation client et mise à jour dynamique).
 *
 * Aucun serveur Redis ou worker BullMQ n'a besoin d'être démarré.
 */

console.log("[meloStart] Architecture Asynchrone active (Webhook & Polling).");
console.log("[meloStart] Aucun worker BullMQ ni serveur Redis n'est requis.");
