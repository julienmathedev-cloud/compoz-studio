/**
 * @file packages/core/src/domain/pages/dto.ts
 * @layer core/domain
 * @description
 * DTOs de lecture pour le module Pages, alignés sur les entités du domaine.
 * Ces types représentent la forme stable exposée aux adapters (API/infra)
 * et restent immuables (`Readonly<>`).
 */

import type { Image } from "@compoz/core/domain/assets/entities/image";
import type { Block } from "@compoz/core/domain/pages/entities/block";
import type {
  ButtonItem,
  CardItem,
  CardsExtendedItem,
  CarouselCell,
  CarouselItem,
  CarouselItemKind,
  CarouselVariant,
  Cell,
  ImageEditor,
  StructuredCardCell,
  StructuredCardColumns,
  StructuredCardItem,
  StructuredCardSection,
  TimelineItem,
} from "@compoz/core/domain/pages/entities/cell";
import type {
  InternalPageOption,
  Page,
  PageSitemap,
  PageSummary,
  SitemapChangeFreq,
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

export type ImageDTO = Readonly<Image>;

/** DTO représentant un Block (aligné sur l’entité métier `Block`). */
export type BlockDTO = Readonly<Block>;

/** DTO représentant une Cell (aligné sur l’entité métier `Cell`). */
export type CellDTO = Readonly<Cell>;

/* -------------------------------------------------------------------------- */
/* Cell items DTO                                                             */
/* -------------------------------------------------------------------------- */

export type ImageEditorDTO = Readonly<ImageEditor>;
export type ButtonItemDTO = Readonly<ButtonItem>;
export type CardItemDTO = Readonly<CardItem>;
export type CardsExtendedItemDTO = Readonly<CardsExtendedItem>;
export type StructuredCardItemDTO = Readonly<StructuredCardItem>;
export type TimelineItemDTO = Readonly<TimelineItem>;
export type StructuredCardColumnsDTO = Readonly<StructuredCardColumns>;
export type StructuredCardCellDTO = Readonly<StructuredCardCell>;
export type StructuredCardSectionDTO = Readonly<StructuredCardSection>;

/* -------------------------------------------------------------------------- */
/* Carousel DTO                                                               */
/* -------------------------------------------------------------------------- */

export type CarouselVariantDTO = CarouselVariant;
export type CarouselItemKindDTO = CarouselItemKind;
export type CarouselItemDTO = Readonly<CarouselItem>;
export type CarouselCellDTO = Readonly<CarouselCell>;
