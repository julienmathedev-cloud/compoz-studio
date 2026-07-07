/**
 * @file packages/infra/src/lib/require-website-id.ts
 * @layer infra/lib
 * @description Normalizes and requires an infra-scoped website id.
 * @remarks
 * No implicit fallback is allowed here; fallback decisions belong to sessions, public resolvers, or explicit configuration.
 */

export function requireWebsiteId(input: unknown, context: string): string {
  const websiteId = String(input ?? "").trim();

  if (!websiteId) {
    throw new Error(`${context}: websiteId is required.`);
  }

  return websiteId;
}
