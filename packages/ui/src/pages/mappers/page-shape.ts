/**
 * @file packages/ui/src/pages/mappers/page-shape.ts
 * @layer ui/pages/mappers
 *
 * @description
 * Maps page DTOs to stable runtime page shapes shared by site rendering and Studio preview.
 *
 * @remarks
 * Admin form intents and input normalization stay outside this boundary mapper.
 */

import type { PageDTO } from "@compoz/core/domain/pages/dto";
import type { PageFormValues } from "@compoz/validation/pages/page-form";

const DEFAULT_SITEMAP: NonNullable<PageFormValues["sitemap"]> = {
  include: true,
  priority: null,
  changefreq: null,
};

function normalizePageSlug(input: string): string {
  const slug = (input ?? "").trim();
  return slug === "home" ? "/" : slug;
}

/** Converts the domain `home` slug convention to the runtime root path shape. */
export function toPageShapeFromDTO(
  page: PageDTO | null | undefined,
  slugFallback?: string,
): PageFormValues {
  const fallbackSlug = normalizePageSlug(slugFallback ?? "");

  if (!page) {
    return {
      name: "",
      seoTitle: null,
      seoDescription: null,
      parentId: null,
      slug: fallbackSlug,
      sitemap: { ...DEFAULT_SITEMAP },
      paginationEnabled: false,
    };
  }

  const slug = normalizePageSlug(page.slug ?? fallbackSlug);

  return {
    name: page.name,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    parentId: page.parentId,
    slug,
    sitemap: page.sitemap
      ? {
          include: page.sitemap.include,
          priority: page.sitemap.priority,
          changefreq: page.sitemap.changefreq,
        }
      : null,
    paginationEnabled: page.paginationEnabled,
  };
}
