/**
 * @file packages/core/src/domain/site/entities/index.ts
 * @layer core/domain
 * @description
 * Point d’entrée regroupant les exports des entités métier liées aux réglages du site
 * (SiteSettings). Fournit un import unique et lisible pour les adapters.
 *
 * Invariant : ce module ne contient que des types (aucune logique, validation ou default).
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

export type { SeoSettings } from "@compoz/core/domain/site/entities/seo";

export type { SiteIndex } from "@compoz/core/domain/site/entities/site-index";

export type {
  SocialItem,
  SocialSettings,
} from "@compoz/core/domain/site/entities/social";

export type { SiteStatus } from "@compoz/core/domain/site/entities/site-status";
