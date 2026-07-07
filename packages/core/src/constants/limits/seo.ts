/**
 * @file packages/core/src/constants/limits/seo.ts
 * @layer core/constants/limits
 * @description Business limits for SEO-related metadata.
 */
export const SEO = {
  TITLE: { MIN: 2, MAX: 80 },
  DESCRIPTION: { MIN: 0, MAX: 300 },
  TITLE_TEMPLATE: { MIN: 2, MAX: 120 },
  IMAGE_ALT: { MAX: 100 },
  ROBOTS: { MIN: 0, MAX: 255 },

  OPEN_GRAPH: {
    DEFAULT_IMAGE_URL: { MIN: 1, MAX: 512 },
    IMAGE_ALT: { MIN: 1, MAX: 120 },
    DESCRIPTION: { MIN: 0, MAX: 300 },
  },

  TWITTER: {
    CARD: { MIN: 1, MAX: 120 },
    SITE: { MIN: 1, MAX: 120 },
    CREATOR: { MIN: 1, MAX: 120 },
  },
} as const;
