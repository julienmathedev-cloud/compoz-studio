/**
 * @file packages/ui/src/pages/mappers/page-shape.ts
 * @layer ui-mappers/pages
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

/* -------------------------------------------------------------------------- */
/* Domain (DTO) -> Shape frontière (safe)                                      */
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
  if (!page) {
    return {
      title: "",
      parentId: null,
      slug: (slugFallback ?? "").trim(),
      sitemap: DEFAULT_SITEMAP,
      paginationEnabled: false,
    };
  }

  const slug = (page.slug ?? slugFallback ?? "").trim();

  return {
    title: page.title ?? "",
    parentId: page.parentId ?? null,
    slug: slug === "home" ? "/" : slug,
    sitemap: {
      include: page.sitemap?.include ?? DEFAULT_SITEMAP.include,
      priority: page.sitemap?.priority ?? DEFAULT_SITEMAP.priority,
      changefreq: page.sitemap?.changefreq ?? DEFAULT_SITEMAP.changefreq,
    },
    paginationEnabled: page.paginationEnabled ?? false,
  };
}
