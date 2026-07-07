/**
 * @file packages/ui/src/lib/website-id.ts
 * @layer ui/lib/website
 * @description UI helper for normalizing website ids used by client-side code.
 * @remarks
 * UI normalization trims and lowercases only; callers decide whether a missing scope disables work or throws.
 */
export function toWebsiteId(input: unknown): string | null {
  const websiteId = String(input ?? "")
    .trim()
    .toLowerCase();

  return websiteId ? websiteId : null;
}

export function requireWebsiteId(input: unknown, where = "websiteId"): string {
  const websiteId = toWebsiteId(input);

  if (!websiteId) {
    throw new Error(`Missing ${where}`);
  }

  return websiteId;
}
