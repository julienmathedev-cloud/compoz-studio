/**
 * @file packages/core/src/domain/pages/use-cases/helpers/apply-page-defaults.ts
 * @layer core/domain/pages/use-cases/helpers
 * @description Helpers that apply default values to page-related payloads.
 */

import type { PageSitemap } from "@compoz/core/domain/pages/entities/page";

/** Returns a complete sitemap object with no undefined field. */
export function applySitemapDefaults(p?: Partial<PageSitemap>): PageSitemap {
  return {
    include: p?.include ?? true,
    changefreq: p?.changefreq ?? "weekly",
    priority: p?.priority ?? 0.7,
  };
}
