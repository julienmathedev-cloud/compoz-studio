/**
 * @file packages/core/src/domain/pages/entities/cell.ts
 * @layer core/domain/pages
 * @description Canonical union and public type re-exports for page cells.
 */

import type { ButtonsCell } from "@compoz/core/domain/pages/entities/cells/buttons";
import type { CardCollectionCell } from "@compoz/core/domain/pages/entities/cells/card-collection";
import type { CarouselCell } from "@compoz/core/domain/pages/entities/cells/carousel";
import type { FormCell } from "@compoz/core/domain/pages/entities/cells/form";
import type { GalleryCell } from "@compoz/core/domain/pages/entities/cells/gallery";
import type { HeadingCell } from "@compoz/core/domain/pages/entities/cells/heading";
import type { ImageCell } from "@compoz/core/domain/pages/entities/cells/image-editor";
import type { RichTextCell } from "@compoz/core/domain/pages/entities/cells/rich-text";
import type { SeparatorCell } from "@compoz/core/domain/pages/entities/cells/separator";
import type { SpacerCell } from "@compoz/core/domain/pages/entities/cells/spacer";
import type { StepsCell } from "@compoz/core/domain/pages/entities/cells/steps";
import type { TestimonialsCell } from "@compoz/core/domain/pages/entities/cells/testimonials";
import type { TimelineCell } from "@compoz/core/domain/pages/entities/cells/timeline";

export type CellKind =
  | "heading"
  | "richText"
  | "spacer"
  | "separator"
  | "buttons"
  | "image"
  | "gallery"
  | "carousel"
  | "cardCollection"
  | "steps"
  | "testimonials"
  | "form"
  | "timeline";

export type Cell =
  | HeadingCell
  | RichTextCell
  | SpacerCell
  | SeparatorCell
  | ButtonsCell
  | ImageCell
  | GalleryCell
  | CarouselCell
  | CardCollectionCell
  | StepsCell
  | TestimonialsCell
  | FormCell
  | TimelineCell;

export type {
  ButtonIconPosition,
  ButtonItem,
  ButtonItemVariant,
  ButtonPresentation,
  ButtonsCell,
} from "@compoz/core/domain/pages/entities/cells/buttons";

export type {
  CardCollectionAlign,
  CardCollectionCardColumns,
  CardCollectionCardKind,
  CardCollectionCell,
  CardCollectionColumns,
  CardCollectionItem,
  CardCollectionStackedColumns,
} from "@compoz/core/domain/pages/entities/cells/card-collection";

export type { CardItem } from "@compoz/core/domain/pages/entities/items/card-item";

export type { ExtendedCardItem } from "@compoz/core/domain/pages/entities/items/extended-card-item";

export type {
  CarouselCell,
  CarouselItem,
  CarouselItemKind,
  CarouselVariant,
} from "@compoz/core/domain/pages/entities/cells/carousel";

export type {
  FormButtonVariant,
  FormCell,
  FormField,
  FormFieldType,
  FormSubmitButton,
} from "@compoz/core/domain/pages/entities/cells/form";

export type {
  GalleryCell,
  GalleryMaxColumns,
} from "@compoz/core/domain/pages/entities/cells/gallery";

export type {
  HeadingAlign,
  HeadingCell,
  HeadingLevel,
  HeadingVariant,
} from "@compoz/core/domain/pages/entities/cells/heading";

export type {
  ImageCell,
  ImageEditor,
  ImageRatio,
} from "@compoz/core/domain/pages/entities/cells/image-editor";

export type { RichTextCell } from "@compoz/core/domain/pages/entities/cells/rich-text";

export type {
  SeparatorAlign,
  SeparatorCell,
  SeparatorSize,
} from "@compoz/core/domain/pages/entities/cells/separator";

export type {
  SpacerCell,
  SpacerSize,
} from "@compoz/core/domain/pages/entities/cells/spacer";

export type {
  StepItem,
  StepsCell,
  StepsVariant,
} from "@compoz/core/domain/pages/entities/cells/steps";

export type {
  StructuredCardItem,
  StructuredCardSection,
} from "@compoz/core/domain/pages/entities/items/structured-card-item";

export type {
  TestimonialItem,
  TestimonialRating,
  TestimonialsCell,
  TestimonialsDisplayMode,
} from "@compoz/core/domain/pages/entities/cells/testimonials";

export type {
  TimelineCell,
  TimelineItem,
} from "@compoz/core/domain/pages/entities/cells/timeline";
