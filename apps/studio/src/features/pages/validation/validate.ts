/**
 * @file apps/studio/src/features/pages/validation/validate.ts
 * @layer studio/features/pages/validation
 *
 * @description
 * Lightweight Studio page form warnings and slug duplicate helpers.
 *
 * @remarks
 * - Blocking validation stays in Zod schemas and server use cases.
 * - Slug duplicate checks exclude the current page by id so edited slugs do not self-conflict.
 */

import { useMemo } from "react";

import { PAGE_NAME } from "@compoz/core/constants/limits/pages";
import type { SiteIndexDTO } from "@compoz/core/domain/site/dto";
import { normalizeSlug } from "@compoz/core/domain/slug/utils";
import type { PageFormValues } from "@compoz/validation/pages/page-form";

export type PageWarningKey = "slugNotNormalized" | "titleLooksThin";

/** Computes non-blocking warnings from page form values. */
export function computePageWarnings(values: PageFormValues): PageWarningKey[] {
  const warnings = new Set<PageWarningKey>();

  const name = String(values.name ?? "").trim();
  const slug = String(values.slug ?? "").trim();

  const normalizedSlug = normalizeSlug(slug);
  if (normalizedSlug && normalizedSlug !== slug) {
    warnings.add("slugNotNormalized");
  }

  // Technically valid, but likely too thin to be useful in navigation or SEO.
  if (name && name.length <= Math.max(4, PAGE_NAME.MIN)) {
    warnings.add("titleLooksThin");
  }

  return Array.from(warnings);
}

/** Memoizes page form warnings for form consumers. */
export function usePageUiWarnings(values: PageFormValues): PageWarningKey[] {
  return useMemo(() => computePageWarnings(values), [values]);
}

/** Builds existing slugs while excluding the current page by id, not by mutable slug. */
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

/** Memoizes existing slugs for duplicate checks. */
export function useSlugSet(
  index: SiteIndexDTO | null | undefined,
  currentPageId?: string,
): ReadonlySet<string> {
  return useMemo(
    () => buildSlugSet(index, currentPageId),
    [index, currentPageId],
  );
}
