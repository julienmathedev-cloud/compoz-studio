/**
 * @file apps/studio/src/features/pages/validation/validate.ts
 * @layer hooks/studio/pages
 *
 * @description
 * Helpers et hooks de validation UI pour les pages (warnings UX légers).
 *
 * @remarks
 * - Validation métier assurée par le domaine (Zod + use-cases serveur).
 * - Ici : UX uniquement (warnings, détection de doublons, incohérences mineures).
 * - Source UI : `PageFormValues` (schéma RHF).
 */

import { useMemo } from "react";

import { PAGE_TITLE } from "@compoz/core/constants/limits/pages";
import type { SiteIndexDTO } from "@compoz/core/domain/site/dto";
import { normalizeSlug } from "@compoz/core/domain/slug/utils";
import type { PageFormValues } from "@compoz/validation/pages/page-form";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type PageWarningKey = "slugNotNormalized" | "titleLooksThin";

/* -------------------------------------------------------------------------- */
/* Warnings UI                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Calcule les warnings UI associés aux valeurs du formulaire Page.
 */
export function computePageWarnings(values: PageFormValues): PageWarningKey[] {
  const warnings = new Set<PageWarningKey>();

  const title = String(values.title ?? "").trim();
  const slug = String(values.slug ?? "").trim();

  const normalizedSlug = normalizeSlug(slug);
  if (normalizedSlug && normalizedSlug !== slug) {
    warnings.add("slugNotNormalized");
  }

  // UX : warning “titre un peu léger” (le form garantit déjà min / max).
  if (title && title.length <= Math.max(4, PAGE_TITLE.MIN)) {
    warnings.add("titleLooksThin");
  }

  return Array.from(warnings);
}

/**
 * Hook retournant les warnings UI d’une page à partir des valeurs courantes du form.
 */
export function usePageUiWarnings(values: PageFormValues): PageWarningKey[] {
  return useMemo(() => computePageWarnings(values), [values]);
}

/* -------------------------------------------------------------------------- */
/* Helper slugs                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Construit un ensemble de slugs existants pour la détection de doublons.
 *
 * @remarks
 * On exclut la page courante par `id` (plus robuste que par slug),
 * car le slug peut changer pendant l’édition.
 */
export function buildSlugSet(
  index: SiteIndexDTO | null | undefined,
  currentPageId?: string,
): ReadonlySet<string> {
  const slugs = new Set<string>();
  if (!index) return slugs;

  for (const page of index.pages) {
    if (currentPageId && page.id === currentPageId) continue;

    const slug = String(page.slug ?? "").trim();
    if (!slug) continue;

    slugs.add(slug);
  }

  return slugs;
}

/**
 * Hook retournant un `Set` mémoïsé de slugs existants.
 */
export function useSlugSet(
  index: SiteIndexDTO | null | undefined,
  currentPageId?: string,
): ReadonlySet<string> {
  return useMemo(
    () => buildSlugSet(index, currentPageId),
    [index, currentPageId],
  );
}
