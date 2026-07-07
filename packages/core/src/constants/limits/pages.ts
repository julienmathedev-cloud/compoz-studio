/**
 * @file packages/core/src/constants/limits/pages.ts
 * @layer core/constants/limits
 *
 * @description
 * Domain limits for page settings.
 */
export const PAGE_NAME = { MIN: 2, MAX: 80 } as const;
export const PAGE_SEO_TITLE = { MAX: 80 } as const;
export const PAGE_SEO_DESCRIPTION = { MAX: 180 } as const;
