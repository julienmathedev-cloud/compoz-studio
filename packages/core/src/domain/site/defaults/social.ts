/**
 * @file packages/core/src/domain/site/defaults/social.ts
 * @layer core/domain/site/defaults
 * @description Default social link settings.
 * @remarks
 * Keep this file declarative: social links are configured by the user.
 */

import type { SocialSettings } from "@compoz/core/domain/site/entities/social";

export const DEFAULT_SOCIAL_SETTINGS: SocialSettings = {
  items: [],
};
