/**
 * @file src/core/domain/pages/dto.ts
 * @layer core/domain
 * @description
 * DTOs de lecture pour le module Pages, alignés sur les entités du domaine.
 * Ces types représentent la forme stable exposée aux adapters (API/infra)
 * et restent immuables (`Readonly<>`).
 */

import type { Block } from "@compoz/core/domain/pages/entities/block";
import type { Cell } from "@compoz/core/domain/pages/entities/cell";
import type {
  Page,
  PageSitemap,
  PageSummary,
  SitemapChangeFreq,
  InternalPageOption,
} from "@compoz/core/domain/pages/entities/page";

/**
 * DTO complet représentant une Page.
 * Aligné strictement sur l’entité métier `Page`.
 */
export type PageDTO = Readonly<Page>;

/**
 * DTO résumé pour les listes/admin (slug + title uniquement).
 * Correspond au type métier `PageSummary`.
 */
export type PageSummaryDTO = Readonly<PageSummary>;

/** DTO de type `InternalPageOption`. */
export type InternalPageOptionDTO = Readonly<InternalPageOption>;

/**
 * DTO du sous-objet `sitemap` (optionnel dans une Page).
 * Structure exposée telle quelle, immuable.
 */
export type PageSitemapDTO = Readonly<PageSitemap>;

/**
 * Enum (type union) représentant les valeurs possibles de `changefreq`.
 * Exposé afin que les couches UI / schémas puissent s’y référer sans
 * importer directement l’entité.
 */
export type SitemapChangeFreqDTO = SitemapChangeFreq;

/** DTO représentant un Block (aligné sur l’entité métier `Block`). */
export type BlockDTO = Readonly<Block>;

export type CellDTO = Readonly<Cell>;
