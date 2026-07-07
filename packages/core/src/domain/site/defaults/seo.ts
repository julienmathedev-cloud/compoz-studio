/**
 * @file packages/core/src/domain/site/defaults/seo.ts
 * @layer core/domain/site/defaults
 * @description Default SEO settings.
 * @remarks
 * Defaults are intentionally neutral and keep unpublished sites out of search indexes.
 */

import { TITLE_PLACEHOLDER } from "@compoz/core/constants/seo/seo";
import type { SeoSettings } from "@compoz/core/domain/site/entities/seo";

export const DEFAULT_SEO_SETTINGS: SeoSettings = {
  baseUrl: null,
  defaultTitle: "Compoz",
  titleTemplate: TITLE_PLACEHOLDER,
  defaultDescription: null,
  canonicalUrl: null,
  robots: "noindex,nofollow",
  openGraph: null,
  twitter: {
    card: "summary_large_image",
    site: null,
    creator: null,
  },
  structuredData: {
    enabled: false,
    entityType: "organization",
  },
};
