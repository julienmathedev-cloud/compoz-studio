/**
 * @file packages/core/src/domain/pages/dto.ts
 * @layer core/domain/pages
 * @description Read DTOs for the Pages module.
 * @remarks
 * DTOs expose stable immutable shapes to adapters.
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
  PageRevisions,
  PageSitemap,
  PageSummary,
  SitemapChangeFreq,
} from "@compoz/core/domain/pages/entities/page";

export type PageDTO = Readonly<Page>;

export type PageRevisionsDTO = Readonly<PageRevisions>;

export type PageWithRevisionsDTO = Readonly<{
  page: PageDTO;
  revisions: PageRevisionsDTO;
}>;

export type PageSummaryDTO = Readonly<PageSummary>;

export type InternalPageOptionDTO = Readonly<InternalPageOption>;

export type PageSitemapDTO = Readonly<PageSitemap>;

export type SitemapChangeFreqDTO = SitemapChangeFreq;

export type ImageDTO = Readonly<Image>;

export type BlockDTO = Readonly<Block>;

export type PageBlocksSnapshotDTO = Readonly<{
  blocks: ReadonlyArray<BlockDTO>;
  blocksRevision: number;
}>;

export type CellDTO = Readonly<Cell>;

export type ImageEditorDTO = Readonly<ImageEditor>;
export type ButtonItemDTO = Readonly<ButtonItem>;

export type CardItemDTO = Readonly<CardItem>;
export type ExtendedCardItemDTO = Readonly<ExtendedCardItem>;
export type StructuredCardItemDTO = Readonly<StructuredCardItem>;
export type StructuredCardSectionDTO = Readonly<StructuredCardSection>;

export type TimelineItemDTO = Readonly<TimelineItem>;
export type TestimonialItemDTO = Readonly<TestimonialItem>;
export type TestimonialsCellDTO = Readonly<TestimonialsCell>;

export type CardCollectionItemDTO = Readonly<CardCollectionItem>;
export type CardCollectionCardKindDTO = CardCollectionCardKind;
export type CardCollectionColumnsDTO = CardCollectionColumns;
export type CardCollectionAlignDTO = CardCollectionAlign;
export type CardCollectionCellDTO = Readonly<CardCollectionCell>;

export type CarouselVariantDTO = CarouselVariant;
export type CarouselItemKindDTO = CarouselItemKind;
export type CarouselItemDTO = Readonly<CarouselItem>;
export type CarouselCellDTO = Readonly<CarouselCell>;
