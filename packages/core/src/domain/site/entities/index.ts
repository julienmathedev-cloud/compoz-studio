/**
 * @file packages/core/src/domain/site/entities/index.ts
 * @layer core/domain/site/entities
 * @description Barrel exports for site settings domain entities.
 * @remarks
 * This module must stay type-only and contain no runtime logic, validation, or defaults.
 */

export type { FooterSettings } from "@compoz/core/domain/site/entities/footer";
export type { HeaderSettings } from "@compoz/core/domain/site/entities/header";
export type { IdentitySettings } from "@compoz/core/domain/site/entities/identity";

export type {
  LegalMenuItem,
  LegalMenuSettings,
} from "@compoz/core/domain/site/entities/legal-menu";

export type {
  PrimaryMenuItem,
  PrimaryMenuSettings,
} from "@compoz/core/domain/site/entities/primary-menu";

export type {
  SeoSettings,
  StructuredDataAddress,
  StructuredDataEntityType,
  StructuredDataSettings,
} from "@compoz/core/domain/site/entities/seo";

export type { SiteIndex } from "@compoz/core/domain/site/entities/site-index";

export type {
  SocialItem,
  SocialSettings,
} from "@compoz/core/domain/site/entities/social";

export type { SiteStatus } from "@compoz/core/domain/site/entities/site-status";

export type {
  PublicThemeTokens,
  RevealPreset,
  ThemeMode,
  ThemeSettings,
} from "@compoz/core/domain/site/entities/theme";
