/**
 * @file packages/ui/src/renderer/cells/cellRegistry.tsx
 * @layer ui/renderer
 *
 * @description
 * Registry des renderers de cellules.
 */

import type { ReactNode } from "react";

import { ButtonsCellRenderer } from "@compoz/ui/renderer/cells/ButtonsCellRenderer";
import { CardsCellRenderer } from "@compoz/ui/renderer/cells/CardsCellRenderer";
import { CardsExtendedCellRenderer } from "@compoz/ui/renderer/cells/CardsExtendedCellRenderer";
import { CarouselCellRenderer } from "@compoz/ui/renderer/cells/CarouselCellRenderer";
import { CaseStudyCardCellRenderer } from "@compoz/ui/renderer/cells/CaseStudyCardCellRenderer";
import { FormCellRenderer } from "@compoz/ui/renderer/cells/FormCellRenderer";
import { GalleryCellRenderer } from "@compoz/ui/renderer/cells/GalleryCellRenderer";
import { HeadingCellRenderer } from "@compoz/ui/renderer/cells/HeadingCellRenderer";
import { ImageCellRenderer } from "@compoz/ui/renderer/cells/ImageCellRenderer";
import { RichTextCellRenderer } from "@compoz/ui/renderer/cells/RichTextCellRenderer";
import { SeparatorCellRenderer } from "@compoz/ui/renderer/cells/SeparatorCellRenderer";
import { SpacerCellRenderer } from "@compoz/ui/renderer/cells/SpacerCellRenderer";
import { StepsCellRenderer } from "@compoz/ui/renderer/cells/StepsCellRenderer";
import { TimelineCellRenderer } from "@compoz/ui/renderer/cells/TimelineCellRenderer";

import type { SiteCellsUi } from "@compoz/ui/site/site-ui.types";

import type {
  ButtonsCellShape,
  CardsCellShape,
  CardsExtendedCellShape,
  CarouselCellShape,
  CaseStudyCardCellShape,
  CellShape,
  FormCellShape,
  GalleryCellShape,
  HeadingCellShape,
  ImageCellShape,
  RichTextCellShape,
  SeparatorCellShape,
  SpacerCellShape,
  StepsCellShape,
  TimelineCellShape,
} from "@compoz/validation/pages/blocks/cells/cell";

export type CellRenderArgs = Readonly<{
  cell: CellShape;
  ui: SiteCellsUi;
  isFullBleed: boolean;
  isLcpMedia: boolean;
}>;

export type CellRenderer = (args: CellRenderArgs) => ReactNode;

export const cellRegistry: Record<string, CellRenderer> = {
  heading: ({ cell, ui }) => (
    <HeadingCellRenderer cell={cell as HeadingCellShape} ui={ui.heading} />
  ),

  richText: ({ cell, ui }) => (
    <RichTextCellRenderer cell={cell as RichTextCellShape} ui={ui.richText} />
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

  cards: ({ cell, ui }) => (
    <CardsCellRenderer cell={cell as CardsCellShape} ui={ui.cards} />
  ),

  cardsExtended: ({ cell, ui }) => (
    <CardsExtendedCellRenderer
      cell={cell as CardsExtendedCellShape}
      ui={ui.cardsExtended}
    />
  ),

  steps: ({ cell, ui }) => (
    <StepsCellRenderer cell={cell as StepsCellShape} ui={ui.steps} />
  ),

  timeline: ({ cell, ui }) => (
    <TimelineCellRenderer cell={cell as TimelineCellShape} ui={ui.timeline} />
  ),

  caseStudyCard: ({ cell, ui }) => (
    <CaseStudyCardCellRenderer
      cell={cell as CaseStudyCardCellShape}
      ui={ui.caseStudyCard}
    />
  ),

  form: ({ cell, ui }) => (
    <FormCellRenderer cell={cell as FormCellShape} ui={ui.form} />
  ),

  image: ({ cell, ui, isLcpMedia }) => (
    <ImageCellRenderer
      cell={cell as ImageCellShape}
      ui={ui.image}
      priority={isLcpMedia}
    />
  ),

  gallery: ({ cell, ui, isLcpMedia }) => (
    <GalleryCellRenderer
      cell={cell as GalleryCellShape}
      navUi={ui.navGallery}
      zoomUi={ui.zoomGallery}
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
