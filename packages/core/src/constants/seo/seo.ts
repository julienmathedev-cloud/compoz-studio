/**
 * @file packages/core/src/constants/seo/seo.ts
 * @layer core/constants/seo
 * @description SEO constants for Twitter cards and title templates.
 */

export const TWITTER_CARD_TYPES = ["summary", "summary_large_image"] as const;
export type TwitterCardType = (typeof TWITTER_CARD_TYPES)[number];

export const TITLE_PLACEHOLDER = "%s" as const;
export const TITLE_PLACEHOLDER_RE = /%s/;
