/**
 * @file packages/core/src/domain/pages/dto.ts
 * @layer core/domain
 *
 * @description
 * Read DTOs for the Pages module, aligned with domain entities.
 *
 * @remarks
 * These types represent the stable shape exposed to adapters such as API
 * and infra layers. DTOs remain immutable through `Readonly<>`.
 */

import type { Image } from "@compoz/core/domain/assets/entities/image";
import type { Block } from "@compoz/core/domain/pages/entities/block";
import type {
  ButtonItem,
  CardCollectionAlign,
  CardCollectionCardKind,
  CardCollectionCell,
  CardCollectionColumns,
  CardCollectionItem,
  CardItem,
  CarouselCell,
  CarouselItem,
  CarouselItemKind,
  CarouselVariant,
  Cell,
  ExtendedCardItem,
  ImageEditor,
  StructuredCardItem,
  StructuredCardSection,
  TestimonialItem,
  TestimonialsCell,
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
 * Complete DTO representing a page.
 *
 * @remarks
 * Strictly aligned with the `Page` domain entity.
 */
export type PageDTO = Readonly<Page>;

/**
 * Summary DTO used for admin lists.
 *
 * @remarks
 * Strictly aligned with the `PageSummary` domain entity.
 */
export type PageSummaryDTO = Readonly<PageSummary>;

/**
 * DTO representing an internal page option.
 */
export type InternalPageOptionDTO = Readonly<InternalPageOption>;

/**
 * DTO representing the optional sitemap sub-object of a page.
 *
 * @remarks
 * The structure is exposed as-is and remains immutable.
 */
export type PageSitemapDTO = Readonly<PageSitemap>;

/**
 * Union type representing allowed sitemap `changefreq` values.
 *
 * @remarks
 * Exposed so UI and schema layers can reference it without importing the
 * domain entity directly.
 */
export type SitemapChangeFreqDTO = SitemapChangeFreq;

export type ImageDTO = Readonly<Image>;

/**
 * DTO representing a block.
 *
 * @remarks
 * Strictly aligned with the `Block` domain entity.
 */
export type BlockDTO = Readonly<Block>;

/**
 * DTO representing a cell.
 *
 * @remarks
 * Strictly aligned with the `Cell` domain entity.
 */
export type CellDTO = Readonly<Cell>;

/* -------------------------------------------------------------------------- */
/* Cell items DTO                                                             */
/* -------------------------------------------------------------------------- */

export type ImageEditorDTO = Readonly<ImageEditor>;
export type ButtonItemDTO = Readonly<ButtonItem>;

export type CardItemDTO = Readonly<CardItem>;
export type ExtendedCardItemDTO = Readonly<ExtendedCardItem>;
export type StructuredCardItemDTO = Readonly<StructuredCardItem>;
export type StructuredCardSectionDTO = Readonly<StructuredCardSection>;

export type TimelineItemDTO = Readonly<TimelineItem>;
export type TestimonialItemDTO = Readonly<TestimonialItem>;
export type TestimonialsCellDTO = Readonly<TestimonialsCell>;

/* -------------------------------------------------------------------------- */
/* Card collection DTO                                                        */
/* -------------------------------------------------------------------------- */

export type CardCollectionItemDTO = Readonly<CardCollectionItem>;
export type CardCollectionCardKindDTO = CardCollectionCardKind;
export type CardCollectionColumnsDTO = CardCollectionColumns;
export type CardCollectionAlignDTO = CardCollectionAlign;
export type CardCollectionCellDTO = Readonly<CardCollectionCell>;

/* -------------------------------------------------------------------------- */
/* Carousel DTO                                                               */
/* -------------------------------------------------------------------------- */

export type CarouselVariantDTO = CarouselVariant;
export type CarouselItemKindDTO = CarouselItemKind;
export type CarouselItemDTO = Readonly<CarouselItem>;
export type CarouselCellDTO = Readonly<CarouselCell>;
