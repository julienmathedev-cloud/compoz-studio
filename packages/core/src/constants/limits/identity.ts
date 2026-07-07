/**
 * @file packages/core/src/constants/limits/identity.ts
 * @layer core/constants/limits
 *
 * @description
 * Domain limits for identity settings.
 */
export const IDENTITY_SITENAME = { MIN: 1, MAX: 80 } as const;
export const IDENTITY_TAGLINE = { MAX: 160 } as const;
export const IDENTITY_LOGOALT = { MIN: 1, MAX: 80 } as const;
