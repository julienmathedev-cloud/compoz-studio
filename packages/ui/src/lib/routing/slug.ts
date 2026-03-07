/**
 * @file packages/ui/src/lib/routing/slug.ts
 * @layer ui/lib/routing
 *
 * @description
 * Helpers UI/app pour normaliser des slugs et des entrées liées aux slugs.
 *
 * @remarks
 * - UI-only : trim / transformations ergonomiques (intent).
 * - Ne lower-case pas : la normalisation canonique du slug doit vivre dans le domaine/validation.
 */

import { SITE_PATH } from "@compoz/core/constants/web/paths";
import { HOME_SLUG } from "@compoz/core/domain/slug/constants";

/** Normalise un slug “value” (unknown) → string non vide, sinon `null`. */
export function toSlug(input: unknown): string | null {
  const s = String(input ?? "").trim();
  return s ? s : null;
}

/**
 * Normalise une liste de slugs (unknown) :
 * - si pas array → []
 * - trim + filter non vide
 * - exclut HOME_SLUG (home est gérée par "/")
 */
export function toSlugsList(input: unknown): string[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((x) => String(x ?? "").trim())
    .filter(Boolean)
    .filter((s) => s !== HOME_SLUG);
}

/**
 * Normalise une saisie UI pour un intent “slug” :
 * - "" si vide
 * - "/" conservé (home)
 * - sinon strip des leading slashes ("/contact" -> "contact")
 */
export function toSlugIntentInput(raw: string | null | undefined): string {
  const s = String(raw ?? "").trim();
  if (!s) return "";

  // "/" = home (cas spécial)
  if (s === SITE_PATH.home) return HOME_SLUG;

  return s.replace(/^\/+/, "");
}
