/**
 * @file packages/infra/src/tenancy/normalize-tenant-id.ts
 * @layer infra/tenancy
 *
 * @description
 * Normalise un `tenantId` infra (KV/FS factories & repositories).
 *
 * @remarks
 * - Retourne une valeur non vide.
 * - Fallback par défaut : "default".
 * - Heuristique infra (pas du domaine) : le domaine peut imposer d'autres règles.
 */

export type NormalizeTenantIdOptions = Readonly<{
  /** Fallback si input vide. Par défaut: "default". */
  fallback?: string;
  /** Applique un lowerCase (par défaut: false). */
  lowerCase?: boolean;
}>;

export function normalizeTenantId(
  input: unknown,
  options: NormalizeTenantIdOptions = {},
): string {
  const fallback = String(options.fallback ?? "default").trim() || "default";

  const raw = String(input ?? "").trim();
  if (!raw) return fallback;

  return options.lowerCase ? raw.toLowerCase() : raw;
}
