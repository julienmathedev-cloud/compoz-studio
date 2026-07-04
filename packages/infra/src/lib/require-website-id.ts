/**
 * @file packages/infra/src/lib/require-website-id.ts
 * @layer infra/lib
 *
 * @description
 * Normalise et exige un `websiteId` infra.
 *
 * @remarks
 * - Ne fournit aucun fallback implicite.
 * - Échoue vite si le scope Website est absent.
 * - Le fallback éventuel doit être décidé plus haut : session, resolver public,
 *   ou configuration explicite.
 */

export function requireWebsiteId(input: unknown, context: string): string {
  const websiteId = String(input ?? "").trim();

  if (!websiteId) {
    throw new Error(`${context}: websiteId is required.`);
  }

  return websiteId;
}
