/**
 * @file packages/core/src/domain/site/defaults/identity.ts
 * @layer core/domain/site/defaults
 * @description Default site identity settings.
 * @remarks
 * Keep this file declarative: no visual fallback or runtime logic belongs here.
 */

import type { IdentitySettings } from "@compoz/core/domain/site/entities/identity";

export const DEFAULT_IDENTITY_SETTINGS: IdentitySettings = {
  siteName: "Compoz",
  tagline: null,
  logo: null,
  faviconUrl: null,
};
