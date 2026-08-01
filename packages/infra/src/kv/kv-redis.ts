/****
 * @file packages/infra/src/kv/kv-redis.ts
 * @layer infra/kv
 * @description Shared Redis helpers for KV repositories.
 * @remarks
 * Supports both Vercel KV and Upstash Redis REST environment variable names.
 */

import { Redis } from "@upstash/redis";

let _redisSingleton: Redis | null = null;

export type RedisRestCredentials = Readonly<{
  url: string;
  token: string;
}>;

function readEnvValue(
  env: Readonly<Record<string, string | undefined>>,
  key: string,
): string | undefined {
  const value = env[key]?.trim();

  return value || undefined;
}

/** Resolves one complete Redis REST credential family without mixing variables. */
export function resolveRedisRestCredentials(
  env: Readonly<Record<string, string | undefined>>,
): RedisRestCredentials {
  const kvUrl = readEnvValue(env, "KV_REST_API_URL");
  const kvToken = readEnvValue(env, "KV_REST_API_TOKEN");

  if (kvUrl || kvToken) {
    if (!kvUrl || !kvToken) {
      throw new Error(
        "Incomplete Redis KV configuration. Both KV_REST_API_URL and KV_REST_API_TOKEN are required.",
      );
    }

    return { url: kvUrl, token: kvToken };
  }

  const upstashUrl = readEnvValue(env, "UPSTASH_REDIS_REST_URL");
  const upstashToken = readEnvValue(env, "UPSTASH_REDIS_REST_TOKEN");

  if (upstashUrl || upstashToken) {
    if (!upstashUrl || !upstashToken) {
      throw new Error(
        "Incomplete Redis Upstash configuration. Both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required.",
      );
    }

    return { url: upstashUrl, token: upstashToken };
  }

  throw new Error(
    "Missing Redis configuration. Expected KV_REST_API_URL/KV_REST_API_TOKEN or UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN.",
  );
}

export function getUpstashRedis(): Redis {
  if (_redisSingleton) return _redisSingleton;

  const { url, token } = resolveRedisRestCredentials(process.env);

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
