import Redis from "ioredis";

/**
 * Configuration et connexion Redis Singleton avec ioredis.
 *
 * NOTE CRITIQUE POUR BULLMQ :
 * `maxRetriesPerRequest: null` est strictement requis par BullMQ pour gérer les files d'attente bloquantes.
 */
const globalForRedis = globalThis;

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const redisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
  retryStrategy(times) {
    // Reconnexion exponentielle bornée à 5 secondes
    return Math.min(times * 200, 5000);
  },
};

export const redis =
  globalForRedis.redisInstance || new Redis(redisUrl, redisOptions);

redis.on("connect", () => {
  console.log("[Redis] Connexion établie avec succès.");
});

redis.on("error", (err) => {
  // Avertissement sans planter le serveur Next.js si Redis local n'est pas encore lancé
  console.warn("[Redis] Attention connexion:", err.message);
});

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redisInstance = redis;
}

/**
 * Crée une nouvelle instance dédiée de connexion Redis (utile pour BullMQ Workers).
 */
export function createRedisClient() {
  return new Redis(redisUrl, redisOptions);
}

export default redis;
