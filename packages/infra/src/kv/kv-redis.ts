/**
 * @file packages/infra/src/kv/kv-redis.ts
 * @layer infra/kv
 * @description
 * Helpers Redis communs pour les repositories KV (Upstash / Vercel KV).
 *
 * Responsabilités :
 * - instancier un client Redis singleton
 * - parser les réponses JSON retournées par Redis
 */

import { Redis } from "@upstash/redis";

/* -------------------------------------------------------------------------- */
/* Redis singleton                                                            */
/* -------------------------------------------------------------------------- */

let _redisSingleton: Redis | null = null;

/**
 * Retourne le client Redis singleton.
 *
 * Contrat :
 * - lit les variables d’environnement KV_REST_API_URL / KV_REST_API_TOKEN
 * - fallback compatible UPSTASH_REDIS_REST_*
 */
export function getUpstashRedis(): Redis {
  if (_redisSingleton) return _redisSingleton;

  const url =
    process.env["KV_REST_API_URL"] ?? process.env["UPSTASH_REDIS_REST_URL"];

  const token =
    process.env["KV_REST_API_TOKEN"] ?? process.env["UPSTASH_REDIS_REST_TOKEN"];

  if (!url || !token) {
    throw new Error(
      "Missing Redis env. Expected KV_REST_API_URL/KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN).",
    );
  }

  _redisSingleton = new Redis({ url, token });

  return _redisSingleton;
}

/* -------------------------------------------------------------------------- */
/* JSON helpers                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Upstash peut renvoyer :
 *
 * - un objet JSON
 * - une string JSON
 * - une primitive
 *
 * Contrat :
 * - retourne un objet JSON exploitable
 * - sinon `null`
 */
export function parseRedisJson<T>(raw: unknown): T | null {
  if (raw == null) return null;

  if (typeof raw === "object") {
    return raw as T;
  }

  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return null;

    try {
      return JSON.parse(s) as T;
    } catch {
      return null;
    }
  }

  try {
    return JSON.parse(String(raw)) as T;
  } catch {
    return null;
  }
}
