/**
 * @file packages/core/src/constants/social/social-kinds.ts
 * @layer core/constants/social
 * @description Réseaux sociaux supportés + guard.
 */

export const SOCIAL_KINDS = [
  "behance",
  "dribbble",
  "email",
  "facebook",
  "github",
  "instagram",
  "linkedin",
  "pinterest",
  "soundcloud",
  "spotify",
  "tiktok",
  "website",
  "x",
  "youtube",
] as const;

export type SocialKind = (typeof SOCIAL_KINDS)[number];

export const SOCIAL_KIND_EMAIL = "email" as const;
export const SOCIAL_KIND_WEBSITE = "website" as const;

export const DEFAULT_SOCIAL_KIND: SocialKind = SOCIAL_KIND_WEBSITE;
