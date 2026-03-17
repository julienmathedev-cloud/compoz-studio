/**
 * @file packages/ui/src/pages/mappers/page-shape.ts
 * @layer ui/pages/mappers
 *
 * @description
 * Mapper "shared runtime" pour les pages :
 * - DTO domaine -> valeurs frontières stables (utilisées par le renderer public + preview)
 *
 * @remarks
 * Ici on ne garde que ce qui peut servir à site + studio (preview),
 * sans rien d’orienté "form admin" (intent DTO, normalisations d’inputs, etc.).
 */

import type { PageDTO } from "@compoz/core/domain/pages/dto";
import type { PageFormValues } from "@compoz/validation/pages/page-form";

/* -------------------------------------------------------------------------- */
/* Defaults (frontière)                                                       */
/* -------------------------------------------------------------------------- */

const DEFAULT_SITEMAP: NonNullable<PageFormValues["sitemap"]> = {
  include: true,
  priority: null,
  changefreq: null,
};

function normalizePageSlug(input: string): string {
  const slug = (input ?? "").trim();
  return slug === "home" ? "/" : slug;
}

/* -------------------------------------------------------------------------- */
/* Domain (DTO) -> Shape frontière (safe)                                     */
/* -------------------------------------------------------------------------- */

/**
 * Convertit une `PageDTO` en shape frontière stable (basée sur tes types Zod).
 *
 * @remarks
 * - Utilisable côté site + preview (studio).
 * - Pas d’intents API ici.
 * - Le cas `slug === "home"` est normalisé en "/" (convention runtime).
 */
export function toPageShapeFromDTO(
  page: PageDTO | null | undefined,
  slugFallback?: string,
): PageFormValues {
  const fallbackSlug = normalizePageSlug(slugFallback ?? "");

  if (!page) {
    return {
      name: "",
      seoTitle: "",
      parentId: null,
      slug: fallbackSlug,
      sitemap: { ...DEFAULT_SITEMAP },
      paginationEnabled: false,
    };
  }

  const slug = normalizePageSlug(page.slug ?? fallbackSlug);

  return {
    name: page.name ?? "",
    seoTitle: page.seoTitle ?? "",
    parentId: page.parentId ?? null,
    slug,
    sitemap: {
      include: page.sitemap?.include ?? DEFAULT_SITEMAP.include,
      priority: page.sitemap?.priority ?? DEFAULT_SITEMAP.priority,
      changefreq: page.sitemap?.changefreq ?? DEFAULT_SITEMAP.changefreq,
    },
    paginationEnabled: page.paginationEnabled ?? false,
  };
}
