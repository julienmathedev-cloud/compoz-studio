/**
 * @file packages/ui/src/renderer/LayoutSectionRenderer.tsx
 * @layer ui/renderer
 *
 * @description
 * Renderer site/preview : block LayoutSection (V0.5).
 *
 * @remarks
 * - Consomme `LayoutSectionBlockShape` (frontière Zod).
 * - Rend : section wrapper + title optionnel + grid de cells.
 * - Défensif : si cells < columns → rend ce qui existe ; si > columns → tronque.
 * - La logique métier "cells.length === columns" reste côté domaine/validators.
 */

import type { ReactNode } from "react";

import { toStableUiKey } from "@compoz/ui/lib/keys/toStableUiKey";
import { cn } from "@compoz/ui/lib/utils";
import { CarouselCellRenderer } from "@compoz/ui/renderer/cells/CarouselCellRenderer";
import { GalleryCellRenderer } from "@compoz/ui/renderer/cells/GalleryCellRenderer";
import { ImageCellRenderer } from "@compoz/ui/renderer/cells/ImageCellRenderer";
import { RichTextCellRenderer } from "@compoz/ui/renderer/cells/RichTextCellRenderer";
import { SiteHeading } from "@compoz/ui/site/components/atoms/SiteHeading";
import type {
  SiteBlocksUi,
  SiteLayoutSectionUi,
} from "@compoz/ui/site/site-ui.types";
import type { LayoutSectionBlockShape } from "@compoz/validation/pages/blocks/block";
import type { CellShape } from "@compoz/validation/pages/blocks/cells/cell";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type LayoutSectionRendererProps = Readonly<{
  block: LayoutSectionBlockShape;

  /** Variant rendu (public/preview). */
  variant?: "site" | "preview";

  /** Classes skin/template (wrapper section). */
  className?: string;

  /** UI fine. */
  layoutUi: SiteLayoutSectionUi;
  blocksUi: SiteBlocksUi;
}>;

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function LayoutSectionRenderer({
  block,
  variant = "site",
  className,
  layoutUi,
  blocksUi,
}: LayoutSectionRendererProps) {
  const rawCols = block?.layout?.columns ?? 1;
  const cols = Math.min(3, Math.max(1, rawCols));

  const cells = Array.isArray(block?.cells) ? block.cells : [];

  const titleText = block?.title?.text?.trim() ?? "";
  const shouldRenderTitle =
    block?.titleEnabled === true && titleText.length > 0;

  const titleHidden = block?.title?.display === "sr-only";

  const visibleCells = cells.slice(0, cols);

  const containerMode = block.containerMode ?? "contained";
  const containerClass =
    containerMode === "fullBleed"
      ? layoutUi.containerFullBleed
      : layoutUi.containerContained;

  const colsKey = cols as 1 | 2 | 3;
  const colsClass = layoutUi.gridCols[colsKey];

  const shouldBoostBlock = block.lcpPriority === true;

  const lcpMediaIndex = shouldBoostBlock
    ? visibleCells.findIndex(
        (c) =>
          c.kind === "image" || c.kind === "gallery" || c.kind === "carousel",
      )
    : -1;

  return (
    <section
      className={cn(containerClass, className)}
      data-block="layoutSection"
      data-variant={variant}
      data-cols={cols}
      data-container={containerMode}
    >
      {shouldRenderTitle ? (
        <header>
          <SiteHeading level={2} visuallyHidden={titleHidden}>
            {titleText}
          </SiteHeading>
        </header>
      ) : null}

      <div className={cn(layoutUi.grid, colsClass)}>
        {visibleCells.map((cell, index) => {
          const isLcpMedia = index === lcpMediaIndex;

          return (
            <div key={__cellKey(cell, index)} className={cn(layoutUi.cell)}>
              {renderCell(
                cell,
                containerMode === "fullBleed",
                blocksUi ?? {},
                isLcpMedia,
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

LayoutSectionRenderer.displayName = "LayoutSectionRenderer";

/* -------------------------------------------------------------------------- */
/* Internals                                                                  */
/* -------------------------------------------------------------------------- */

function __cellKey(cell: CellShape, index: number) {
  // V0.5 : les cells n’ont pas d’id → key = kind + index.
  // Quand tu ajouteras `cell.id`, on basculera dessus.
  return toStableUiKey({ id: `${cell.kind}-${index}` }, index);
}

function renderCell(
  cell: CellShape,
  isFull: boolean,
  blocksUi: SiteBlocksUi,
  isLcpMedia: boolean,
): ReactNode {
  switch (cell.kind) {
    case "richText":
      return <RichTextCellRenderer cell={cell} ui={blocksUi.richText} />;

    case "image":
      return (
        <ImageCellRenderer
          cell={cell}
          ui={blocksUi.image}
          priority={isLcpMedia}
        />
      );

    case "gallery":
      return (
        <GalleryCellRenderer
          cell={cell}
          navUi={blocksUi.navGallery}
          zoomUi={blocksUi.zoomGallery}
          priority={isLcpMedia}
        />
      );

    case "carousel":
      return (
        <CarouselCellRenderer
          images={cell.images}
          ui={blocksUi.carousel}
          isFullBleed={isFull}
          priority={isLcpMedia}
        />
      );

    default:
      return null;
  }
}
