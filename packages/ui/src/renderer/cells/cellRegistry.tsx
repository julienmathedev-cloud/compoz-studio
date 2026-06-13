/**
 * @file packages/ui/src/renderer/cells/cellRegistry.tsx
 * @layer ui/renderer
 *
 * @description
 * Registry des renderers de cellules.
 */

import type { ReactNode } from "react";

import { ButtonsCellRenderer } from "@compoz/ui/renderer/cells/ButtonsCellRenderer";
import { CardCollectionCellRenderer } from "@compoz/ui/renderer/cells/CardCollectionCellRenderer";
import { CardsCellRenderer } from "@compoz/ui/renderer/cells/CardsCellRenderer";
import { CardsExtendedCellRenderer } from "@compoz/ui/renderer/cells/CardsExtendedCellRenderer";
import { CarouselCellRenderer } from "@compoz/ui/renderer/cells/CarouselCellRenderer";
import { FormCellRenderer } from "@compoz/ui/renderer/cells/FormCellRenderer";
import { GalleryCellRenderer } from "@compoz/ui/renderer/cells/GalleryCellRenderer";
import { HeadingCellRenderer } from "@compoz/ui/renderer/cells/HeadingCellRenderer";
import { ImageCellRenderer } from "@compoz/ui/renderer/cells/ImageCellRenderer";
import { RichTextCellRenderer } from "@compoz/ui/renderer/cells/RichTextCellRenderer";
import { SeparatorCellRenderer } from "@compoz/ui/renderer/cells/SeparatorCellRenderer";
import { SpacerCellRenderer } from "@compoz/ui/renderer/cells/SpacerCellRenderer";
import { StepsCellRenderer } from "@compoz/ui/renderer/cells/StepsCellRenderer";
import { StructuredCardCellRenderer } from "@compoz/ui/renderer/cells/StructuredCardCellRenderer";
import { TimelineCellRenderer } from "@compoz/ui/renderer/cells/TimelineCellRenderer";

import type {
  SiteCellsUi,
  SiteRevealPresetUi,
} from "@compoz/ui/site/site-ui.types";

import type {
  ButtonsCellShape,
  CardCollectionCellShape,
  CardsCellShape,
  CardsExtendedCellShape,
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
  StructuredCardCellShape,
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
      cardsUi={ui.cards}
      cardsExtendedUi={ui.cardsExtended}
      structuredCardUi={ui.structuredCard}
      revealUi={revealUi}
    />
  ),

  cards: ({ cell, ui, revealUi }) => (
    <CardsCellRenderer
      cell={cell as CardsCellShape}
      ui={ui.cards}
      revealUi={revealUi}
    />
  ),

  cardsExtended: ({ cell, ui, revealUi }) => (
    <CardsExtendedCellRenderer
      cell={cell as CardsExtendedCellShape}
      ui={ui.cardsExtended}
      revealUi={revealUi}
    />
  ),

  steps: ({ cell, ui }) => (
    <StepsCellRenderer cell={cell as StepsCellShape} ui={ui.steps} />
  ),

  timeline: ({ cell, ui }) => (
    <TimelineCellRenderer cell={cell as TimelineCellShape} ui={ui.timeline} />
  ),

  structuredCard: ({ cell, ui, revealUi }) => (
    <StructuredCardCellRenderer
      cell={cell as StructuredCardCellShape}
      ui={ui.structuredCard}
      revealUi={revealUi}
    />
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
