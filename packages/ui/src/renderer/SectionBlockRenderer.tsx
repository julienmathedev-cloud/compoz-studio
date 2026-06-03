/**
 * @file packages/ui/src/renderer/SectionBlockRenderer.tsx
 * @layer ui/renderer
 *
 * @description
 * Renderer site/preview : block Section (V0.9).
 *
 * @remarks
 * Structure V0.9 :
 *
 * section
 *  └ rows[]
 *      └ columns[]
 *          └ cells[]
 */

import { cn } from "@compoz/ui/lib/utils";
import { cellRegistry } from "@compoz/ui/renderer/cells/cellRegistry";

import type {
  SiteBlockSectionUi,
  SiteCellsUi,
  SiteRevealPresetUi,
} from "@compoz/ui/site/site-ui.types";
import type { SiteRuntimeFeatures } from "@compoz/ui/site/skins/resolveSiteRuntimeFeatures";

import type {
  BlockRowShape,
  SectionBlockShape,
} from "@compoz/validation/pages/blocks/block";
import type { CellShape } from "@compoz/validation/pages/blocks/cells/cell";
import type { ReactNode } from "react";

export type SectionRendererProps = Readonly<{
  block: SectionBlockShape;
  index?: number;
  variant?: "site" | "preview";
  className?: string;
  blockUi: SiteBlockSectionUi;
  cellsUi: SiteCellsUi;
  revealUi: SiteRevealPresetUi;
  runtimeFeatures?: SiteRuntimeFeatures;
}>;

type CellPosition = Readonly<{
  rowIndex: number;
  colIndex: number;
  cellIndex: number;
}>;

export function SectionBlockRenderer({
  block,
  index = 0,
  variant = "site",
  className,
  blockUi,
  cellsUi,
  revealUi,
  runtimeFeatures,
}: SectionRendererProps) {
  const containerMode = block.containerMode ?? "contained";

  const containerClass =
    containerMode === "fullBleed"
      ? blockUi.containerFullBleed
      : blockUi.containerContained;

  const spacingClass =
    containerMode === "fullBleed" ? undefined : blockUi.sectionSpacingContained;

  const lcpTarget = block.lcpPriority
    ? findFirstMediaCellPosition(block)
    : null;

  return (
    <section
      className={cn(
        blockUi.surface,
        block.cssClassName,
        shouldAutoHideSingleH1Block(block, runtimeFeatures)
          ? "seo-only"
          : undefined,
      )}
      data-block="section"
      data-variant={variant}
      data-container={containerMode}
      data-block-index={index}
    >
      <div className={cn(containerClass, spacingClass, className)}>
        <div className={cn(blockUi.rows)}>
          {block.rows.map((row, rowIndex) => {
            const colsKey = row.columnsCount as 1 | 2 | 3;
            const colsClass = blockUi.gridCols[colsKey];

            return (
              <div
                key={row.id}
                className={cn(blockUi.grid, colsClass)}
                data-row
              >
                {row.columns.map((column, colIndex) => {
                  const columnOrderClass = getColumnOrderClass(row, colIndex);

                  return (
                    <div
                      key={column.id}
                      className={cn(blockUi.column, columnOrderClass)}
                      data-column
                    >
                      {column.cells.map((cell, cellIndex) => {
                        const isLcpMedia =
                          lcpTarget !== null &&
                          lcpTarget.rowIndex === rowIndex &&
                          lcpTarget.colIndex === colIndex &&
                          lcpTarget.cellIndex === cellIndex;

                        return (
                          <div
                            key={cell.id}
                            data-cell-id={cell.id}
                            data-cell-kind={cell.kind}
                            className={cn(
                              blockUi.cell,
                              cell.cssClassName,
                              "relative",
                              getSpacerWrapperVisibilityClass(cell),
                            )}
                          >
                            {renderCellFromRegistry(
                              cell,
                              containerMode === "fullBleed",
                              cellsUi,
                              revealUi,
                              isLcpMedia,
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

SectionBlockRenderer.displayName = "SectionBlockRenderer";

/* -------------------------------------------------------------------------- */
/* Internals                                                                  */
/* -------------------------------------------------------------------------- */

function isMediaCell(cell: CellShape): boolean {
  return (
    cell.kind === "image" || cell.kind === "gallery" || cell.kind === "carousel"
  );
}

function findFirstMediaCellPosition(
  block: SectionBlockShape,
): CellPosition | null {
  for (let rowIndex = 0; rowIndex < block.rows.length; rowIndex += 1) {
    const row = block.rows[rowIndex];

    for (let colIndex = 0; colIndex < row.columns.length; colIndex += 1) {
      const column = row.columns[colIndex];

      for (let cellIndex = 0; cellIndex < column.cells.length; cellIndex += 1) {
        const cell = column.cells[cellIndex];

        if (isMediaCell(cell)) {
          return {
            rowIndex,
            colIndex,
            cellIndex,
          };
        }
      }
    }
  }

  return null;
}

function getColumnOrderClass(
  row: BlockRowShape,
  colIndex: number,
): string | undefined {
  const columnsLength = row.columns.length;

  if (columnsLength <= 1) {
    return undefined;
  }

  const mobileOrderMap = {
    2: ["order-2", "order-1"],
    3: ["order-3", "order-2", "order-1"],
  } as const;

  const tabletOrderMap = {
    2: ["md:order-2", "md:order-1"],
    3: ["md:order-3", "md:order-2", "md:order-1"],
  } as const;

  const desktopOrderMap = {
    2: ["lg:order-2", "lg:order-1"],
    3: ["lg:order-3", "lg:order-2", "lg:order-1"],
  } as const;

  const classes: string[] = [];

  // MOBILE
  if (row.reverseOn.mobile) {
    classes.push(mobileOrderMap[columnsLength as 2 | 3][colIndex]);
  }

  // TABLET
  if (row.reverseOn.tablet) {
    classes.push(tabletOrderMap[columnsLength as 2 | 3][colIndex]);
  } else if (row.reverseOn.mobile) {
    // reset si mobile actif mais pas tablet
    classes.push("md:order-none");
  }

  // DESKTOP
  if (row.reverseOn.desktop) {
    classes.push(desktopOrderMap[columnsLength as 2 | 3][colIndex]);
  } else if (row.reverseOn.tablet) {
    // reset si tablet actif mais pas desktop
    classes.push("lg:order-none");
  }

  return classes.length > 0 ? classes.join(" ") : undefined;
}

function renderCellFromRegistry(
  cell: CellShape,
  isFull: boolean,
  cellsUi: SiteCellsUi,
  revealUi: SiteRevealPresetUi,
  isLcpMedia: boolean,
): ReactNode {
  const renderer = cellRegistry[cell.kind];

  if (!renderer) return null;

  return renderer({
    cell,
    ui: cellsUi,
    revealUi,
    isFullBleed: isFull,
    isLcpMedia,
  });
}

function shouldAutoHideSingleH1Block(
  block: SectionBlockShape,
  runtimeFeatures?: SiteRuntimeFeatures,
): boolean {
  if (!runtimeFeatures?.autoHideSingleH1Block) {
    return false;
  }

  const row = block.rows[0];
  if (!row || block.rows.length !== 1 || row.columns.length !== 1) {
    return false;
  }

  const column = row.columns[0];
  if (!column || column.cells.length !== 1) {
    return false;
  }

  const cell = column.cells[0];
  if (!cell || cell.kind !== "heading" || cell.level !== "h1") {
    return false;
  }

  return String(cell.title ?? "").trim().length > 0;
}

function getSpacerWrapperVisibilityClass(cell: CellShape): string | undefined {
  if (cell.kind !== "spacer") {
    return undefined;
  }

  const visibility = cell.visibility;
  const v = {
    mobile: visibility?.mobile ?? true,
    tablet: visibility?.tablet ?? true,
    desktop: visibility?.desktop ?? true,
  };

  return cn(
    v.mobile ? "block" : "hidden",
    v.tablet ? "md:block" : "md:hidden",
    v.desktop ? "lg:block" : "lg:hidden",
  );
}
