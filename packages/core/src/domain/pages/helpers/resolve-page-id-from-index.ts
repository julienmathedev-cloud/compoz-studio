/**
 * @file packages/core/src/domain/pages/helpers/resolve-page-id-from-index.ts
 * @layer core/domain/pages/helpers
 * @description Pure helper that resolves a page id from an id/slug index.
 * @remarks
 * Input slugs are normalized before lookup: `/` maps to `home`, and leading slashes are removed.
 */

import { SITE_PATH } from "@compoz/core/constants/web/paths";
import { HOME_SLUG } from "@compoz/core/domain/slug/constants";

function normalizeSiteSlug(input: string): string {
  const raw = String(input ?? "").trim();
  if (!raw) return "";

  // Public home path maps to the persisted home slug.
  if (raw === SITE_PATH.home) return HOME_SLUG;

  const s = raw.replace(/^\/+/, "");
  return s || "";
}

export function resolvePageIdFromIndex(args: {
  slug: string;
  index:
    | { pages?: ReadonlyArray<{ id: string; slug: string }> }
    | null
    | undefined;
}): string | null {
  const normalizedSlug = normalizeSiteSlug(args.slug);
  if (!normalizedSlug) return null;

  const pages = args.index?.pages ?? [];
  const match = pages.find((p) => p.slug === normalizedSlug);
  return match?.id ?? null;
}
