/**
 * @file packages/ui/src/lib/tenant-id.ts
 * @layer ui/lib/tenancy
 *
 * @description
 * Helpers UI/app pour normaliser un `tenantId` (tenant-scoping).
 *
 * @remarks
 * - UI-only : trim + lowercase pour éviter les collisions de cache et les variations de casing.
 * - Pas de fallback : si vide => null (les callers décident : throw / return null).
 * - À utiliser dans les query keys React Query, loaders app, et helpers client.
 */

/** Normalise un tenantId (trim + lowercase). Retourne `null` si vide. */
export function toTenantId(input: unknown): string | null {
  const tid = String(input ?? "")
    .trim()
    .toLowerCase();

  return tid ? tid : null;
}

/** Variante stricte : throw si tenantId vide (utile dans les hooks). */
export function requireTenantId(input: unknown, where = "tenantId"): string {
  const tid = toTenantId(input);
  if (!tid) {
    throw new Error(`Missing ${where}`);
  }
  return tid;
}
