/**
 * @file packages/core/src/domain/site/entities/social.ts
 * @layer core/domain/site/entities
 * @description Canonical social link settings for a site.
 * @remarks
 * Item order is persisted and must be preserved by UI and repository adapters.
 */

import type { SocialKind } from "@compoz/core/constants/social/social-kinds";
import type { BrandedHref } from "@compoz/core/domain/urls/href";

export interface SocialItem {
  id: string;
  kind: SocialKind;
  /** Domain-normalized link target. */
  href: BrandedHref;
}

export interface SocialSettings {
  /** Source-of-truth display order. */
  items: ReadonlyArray<SocialItem>;
}
