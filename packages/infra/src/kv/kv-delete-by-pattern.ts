/**
 * @file packages/infra/src/kv/kv-delete-by-pattern.ts
 * @layer infra/kv
 * @description
 * Helper infra pour supprimer des clés KV à partir d’un pattern.
 *
 * @remarks
 * - Utilisé pour les opérations de cleanup ponctuelles (ex: sandboxes démo expirées).
 * - Repose sur `keys(pattern)` puis `del(...keys)`.
 * - Non destiné aux flows applicatifs fréquents.
 */

import { getUpstashRedis } from "@compoz/infra/kv/kv-redis";
import { kvCmd } from "@compoz/infra/kv/kv-telemetry";

type DeleteKeysByPatternResult = Readonly<{
  keysMatched: number;
  keysDeleted: number;
}>;

function normalizePattern(value: unknown): string {
  return String(value ?? "").trim();
}

export async function deleteKeysByPattern(
  pattern: string,
): Promise<DeleteKeysByPatternResult> {
  const normalizedPattern = normalizePattern(pattern);

  if (!normalizedPattern) {
    throw new Error("deleteKeysByPattern: pattern is required.");
  }

  const redis = getUpstashRedis();

  const keys = await kvCmd("kv.deleteByPattern.keys", "other", () =>
    redis.keys(normalizedPattern),
  );

  if (!Array.isArray(keys) || keys.length === 0) {
    return {
      keysMatched: 0,
      keysDeleted: 0,
    };
  }

  const deleted = await kvCmd("kv.deleteByPattern.del", "del", () =>
    redis.del(...keys),
  );

  return {
    keysMatched: keys.length,
    keysDeleted: typeof deleted === "number" ? deleted : 0,
  };
}
