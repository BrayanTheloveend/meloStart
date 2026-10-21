/**
 * melostars - Architecture Asynchrone Sans Redis
 * 
 * L'application utilise désormais une architecture asynchrone découplée par
 * Webhooks Suno API et Polling client via PostgreSQL (Prisma).
 * Redis n'est plus requis sur le serveur VPS.
 */

// Client factice résilient au cas où un script hérité tenterait d'appeler redis
export const redis = {
  status: "DISABLED",
  isRedisDisabled: true,
  ping: async () => "PONG",
  get: async () => null,
  set: async () => "OK",
  del: async () => 0,
  quit: async () => "OK",
  disconnect: () => {},
  on: () => {},
};

export function createRedisClient() {
  return redis;
}

export default redis;
