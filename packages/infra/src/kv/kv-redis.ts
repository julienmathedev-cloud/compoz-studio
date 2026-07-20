/****
 * @file packages/infra/src/kv/kv-redis.ts
 * @layer infra/kv
 * @description Shared Redis helpers for KV repositories.
 * @remarks
 * Supports both Vercel KV and Upstash Redis REST environment variable names.
 */

import { Redis } from "@upstash/redis";

let _redisSingleton: Redis | null = null;

export function getUpstashRedis(): Redis {
  if (_redisSingleton) return _redisSingleton;

  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new Error(
      "Missing Redis env. Expected KV_REST_API_URL/KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN).",
    );
  }

  _redisSingleton = new Redis({ url, token });

  return _redisSingleton;
}

/** Parses Redis JSON responses returned either as objects, JSON strings, or primitives. */
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
