/**
 * @file apps/studio/src/features/pages/validation/validate.ts
 * @layer hooks/admin/pages
 *
 * @description
 * Helpers et hooks de validation UI pour les pages (erreurs légères et warnings).
 *
 * @remarks
 * - Validation métier assurée par le domaine (Zod + use-cases serveur).
 * - Ici : UX uniquement (warnings, détection de doublons, incohérences mineures).
 * - Source UI : PageFormValues (schéma RHF).
 */

import { useMemo } from "react";

import { PAGE_TITLE } from "@compoz/core/constants/limits/pages";
import type { SiteIndexDTO } from "@compoz/core/domain/site/dto";
import { normalizeSlug } from "@compoz/core/domain/slug/utils";
import type { PageFormValues } from "@compoz/validation/pages/page-form";

/* ─────────────────────────── Types ─────────────────────────── */

export type PageWarningKey = "slugNotNormalized" | "titleLooksThin";

/* ─────────────────────────── Warnings (PURE + hook) ─────────────────────────── */

/**
 * Calcule les warnings UI associés aux valeurs du formulaire Page.
 */
export function computePageWarnings(values: PageFormValues): PageWarningKey[] {
  const out = new Set<PageWarningKey>();

  const title = (values.title ?? "").trim();
  const slug = (values.slug ?? "").trim();

  const normalized = normalizeSlug(slug);
  if (normalized && normalized !== slug) out.add("slugNotNormalized");

  // UX : warning “titre un peu léger” (le form garantit déjà min/max)
  if (title && title.length <= Math.max(4, PAGE_TITLE.MIN)) {
    out.add("titleLooksThin");
  }

  return Array.from(out);
}

/**
 * Hook retournant les warnings UI d’une page à partir des valeurs courantes (form).
 */
export function usePageUiWarnings(values: PageFormValues): PageWarningKey[] {
  return useMemo(() => computePageWarnings(values), [values]);
}

/* ───────────────────────────── Helper doublons (Set) ───────────────────────────── */

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
  const set = new Set<string>();
  if (!index) return set;

  for (const p of index.pages) {
    if (currentPageId && p.id === currentPageId) continue;
    if (p.slug) set.add(p.slug);
  }

  return set;
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
