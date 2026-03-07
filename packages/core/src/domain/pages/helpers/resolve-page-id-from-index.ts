/**
 * @file packages/core/src/domain/pages/helpers/resolve-page-id-from-index.ts
 * @layer core/domain/pages/helpers
 *
 * @description
 * Helper pur : résout l’id d’une page à partir d’un index (id/slug),
 * en normalisant le slug d’entrée ("/" => "home", suppression des slashes).
 */

import { SITE_PATH } from "@compoz/core/constants/web/paths";
import { HOME_SLUG } from "@compoz/core/domain/slug/constants";

function normalizeSiteSlug(input: string): string {
  const raw = String(input ?? "").trim();
  if (!raw) return "";

  // "/" => "home"
  if (raw === SITE_PATH.home) return HOME_SLUG;

  // "/about" => "about"
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
