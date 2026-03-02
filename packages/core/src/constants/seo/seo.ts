/**
 * @file packages/core/src/constants/seo/seo.ts
 * @description Constantes SEO (twitter cards, placeholder template).
 */

export const TWITTER_CARD_TYPES = ["summary", "summary_large_image"] as const;
export type TwitterCardType = (typeof TWITTER_CARD_TYPES)[number];

export const TITLE_PLACEHOLDER = "%s" as const;
export const TITLE_PLACEHOLDER_RE = /%s/;
