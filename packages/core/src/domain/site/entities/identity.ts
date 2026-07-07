/**
 * @file packages/core/src/domain/site/entities/identity.ts
 * @layer core/domain/site/entities
 * @description Canonical identity settings for a site.
 */

import type { Image } from "@compoz/core/domain/assets/entities/image";
import type { AssetUrlOrNull } from "@compoz/core/domain/urls/href";

export interface IdentitySettings {
  siteName: string;
  tagline: string | null;
  logo: Image | null;
  faviconUrl: AssetUrlOrNull;
  /** Optional legacy-safe media asset reference for uploaded favicons. */
  faviconMediaAssetId?: string;
}
