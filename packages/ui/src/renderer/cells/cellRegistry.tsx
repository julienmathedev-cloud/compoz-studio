/**
 * @file packages/ui/src/renderer/cells/cellRegistry.tsx
 * @layer ui/renderer/cells
 *
 * @description
 * Registry mapping validated cell kinds to their renderer components.
 */

import type { ReactNode } from "react";

import { ButtonsCellRenderer } from "@compoz/ui/renderer/cells/ButtonsCellRenderer";
import { CardCollectionCellRenderer } from "@compoz/ui/renderer/cells/CardCollectionCellRenderer";
import { CarouselCellRenderer } from "@compoz/ui/renderer/cells/CarouselCellRenderer";
import { FormCellRenderer } from "@compoz/ui/renderer/cells/FormCellRenderer";
import { GalleryCellRenderer } from "@compoz/ui/renderer/cells/GalleryCellRenderer";
import { HeadingCellRenderer } from "@compoz/ui/renderer/cells/HeadingCellRenderer";
import { ImageCellRenderer } from "@compoz/ui/renderer/cells/ImageCellRenderer";
import { RichTextCellRenderer } from "@compoz/ui/renderer/cells/RichTextCellRenderer";
import { SeparatorCellRenderer } from "@compoz/ui/renderer/cells/SeparatorCellRenderer";
import { SpacerCellRenderer } from "@compoz/ui/renderer/cells/SpacerCellRenderer";
import { StepsCellRenderer } from "@compoz/ui/renderer/cells/StepsCellRenderer";
import { TestimonialsCellRenderer } from "@compoz/ui/renderer/cells/TestimonialsCellRenderer";
import { TimelineCellRenderer } from "@compoz/ui/renderer/cells/TimelineCellRenderer";

import type {
  SiteCellsUi,
  SiteRevealPresetUi,
} from "@compoz/ui/site/site-ui.types";

import type {
  ButtonsCellShape,
  CardCollectionCellShape,
  CarouselCellShape,
  CellShape,
  FormCellShape,
  GalleryCellShape,
  HeadingCellShape,
  ImageCellShape,
  RichTextCellShape,
  SeparatorCellShape,
  SpacerCellShape,
  StepsCellShape,
  TestimonialsCellShape,
  TimelineCellShape,
} from "@compoz/validation/pages/blocks/cells/cell";

export type CellRenderArgs = Readonly<{
  cell: CellShape;
  ui: SiteCellsUi;
  revealUi: SiteRevealPresetUi;
  isFullBleed: boolean;
  isLcpMedia: boolean;
}>;

export type CellRenderer = (args: CellRenderArgs) => ReactNode;

export const cellRegistry: Record<string, CellRenderer> = {
  heading: ({ cell, ui, revealUi }) => (
    <HeadingCellRenderer
      cell={cell as HeadingCellShape}
      ui={ui.heading}
      revealUi={revealUi}
    />
  ),

  richText: ({ cell, ui, revealUi }) => (
    <RichTextCellRenderer
      cell={cell as RichTextCellShape}
      ui={ui.richText}
      revealUi={revealUi}
    />
  ),

  spacer: ({ cell, ui }) => (
    <SpacerCellRenderer cell={cell as SpacerCellShape} ui={ui.spacer} />
  ),

  separator: ({ cell, ui }) => (
    <SeparatorCellRenderer
      cell={cell as SeparatorCellShape}
      ui={ui.separator}
    />
  ),

  buttons: ({ cell, ui }) => (
    <ButtonsCellRenderer cell={cell as ButtonsCellShape} ui={ui.buttons} />
  ),

  cardCollection: ({ cell, ui, revealUi }) => (
    <CardCollectionCellRenderer
      cell={cell as CardCollectionCellShape}
      ui={ui.cardCollection}
      cardUi={ui.card}
      extendedCardUi={ui.extendedCard}
      structuredCardUi={ui.structuredCard}
      revealUi={revealUi}
    />
  ),

  steps: ({ cell, ui }) => (
    <StepsCellRenderer cell={cell as StepsCellShape} ui={ui.steps} />
  ),

  testimonials: ({ cell, ui }) => (
    <TestimonialsCellRenderer
      cell={cell as TestimonialsCellShape}
      ui={ui.testimonials}
    />
  ),

  timeline: ({ cell, ui }) => (
    <TimelineCellRenderer cell={cell as TimelineCellShape} ui={ui.timeline} />
  ),

  form: ({ cell, ui }) => (
    <FormCellRenderer cell={cell as FormCellShape} ui={ui.form} />
  ),

  image: ({ cell, ui, revealUi, isLcpMedia }) => (
    <ImageCellRenderer
      cell={cell as ImageCellShape}
      ui={ui.image}
      revealUi={revealUi}
      priority={isLcpMedia}
    />
  ),

  gallery: ({ cell, ui, revealUi, isLcpMedia }) => (
    <GalleryCellRenderer
      cell={cell as GalleryCellShape}
      navUi={ui.navGallery}
      zoomUi={ui.zoomGallery}
      revealUi={revealUi}
      priority={isLcpMedia}
    />
  ),

  carousel: ({ cell, ui, isFullBleed, isLcpMedia }) => (
    <CarouselCellRenderer
      cell={cell as CarouselCellShape}
      ui={ui.carousel}
      isFullBleed={isFullBleed}
      priority={isLcpMedia}
    />
  ),
};
