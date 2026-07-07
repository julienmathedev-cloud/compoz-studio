/**
 * @file packages/ui/src/lib/routing/slug.ts
 * @layer ui/lib/routing
 * @description UI slug helpers for intent inputs and slug lists.
 * @remarks
 * UI-only transformations trim and adapt user input; canonical slug normalization belongs to domain validation.
 */

import { SITE_PATH } from "@compoz/core/constants/web/paths";
import { HOME_SLUG } from "@compoz/core/domain/slug/constants";

export function toSlug(input: unknown): string | null {
  const s = String(input ?? "").trim();
  return s ? s : null;
}

export function toSlugsList(input: unknown): string[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((x) => String(x ?? "").trim())
    .filter(Boolean)
    .filter((s) => s !== HOME_SLUG);
}

/** Converts root-relative UI input to the slug intent expected by the app. */
export function toSlugIntentInput(raw: string | null | undefined): string {
  const s = String(raw ?? "").trim();
  if (!s) return "";

  // The root path represents the home slug in editor inputs.
  if (s === SITE_PATH.home) return HOME_SLUG;

  return s.replace(/^\/+/, "");
}
