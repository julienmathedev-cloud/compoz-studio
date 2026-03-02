/**
 * @file packages/core/src/domain/pages/helpers/resolve-page-id-from-index.ts
 * @layer core/domain/pages/helpers
 *
 * @description
 * Helpers purs
 */

function normalizePublicSlug(input: string): string {
  const raw = String(input ?? "").trim();
  if (!raw) return "";
  if (raw === "/") return "home";
  const s = raw.replace(/^\/+/, "");
  if (s === "home") return "home";
  return s;
}

export function resolvePageIdFromIndex(args: {
  slug: string;
  index:
    | { pages?: ReadonlyArray<{ id: string; slug: string }> }
    | null
    | undefined;
}): string | null {
  const slug = normalizePublicSlug(args.slug);
  if (!slug) return null;

  const pages = args.index?.pages ?? [];
  const match = pages.find((p) => p.slug === slug);
  return match?.id ?? null;
}
