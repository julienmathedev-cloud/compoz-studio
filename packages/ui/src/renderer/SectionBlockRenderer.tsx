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

import { toStableUiKey } from "@compoz/ui/lib/keys/toStableUiKey";
import { cn } from "@compoz/ui/lib/utils";
import { cellRegistry } from "@compoz/ui/renderer/cells/cellRegistry";

import type {
  SiteBlockSectionUi,
  SiteCellsUi,
} from "@compoz/ui/site/site-ui.types";

import type { SectionBlockShape } from "@compoz/validation/pages/blocks/block";
import type { CellShape } from "@compoz/validation/pages/blocks/cells/cell";
import type { ReactNode } from "react";

export type SectionRendererProps = Readonly<{
  block: SectionBlockShape;
  variant?: "site" | "preview";
  className?: string;
  blockUi: SiteBlockSectionUi;
  cellsUi: SiteCellsUi;
}>;

type CellPosition = Readonly<{
  rowIndex: number;
  colIndex: number;
  cellIndex: number;
}>;

export function SectionBlockRenderer({
  block,
  variant = "site",
  className,
  blockUi,
  cellsUi,
}: SectionRendererProps) {
  const containerMode = block.containerMode ?? "contained";

  const containerClass =
    containerMode === "fullBleed"
      ? blockUi.containerFullBleed
      : blockUi.containerContained;

  const lcpTarget = block.lcpPriority
    ? findFirstMediaCellPosition(block)
    : null;

  return (
    <section
      className={cn(containerClass, className)}
      data-block="section"
      data-variant={variant}
      data-container={containerMode}
    >
      {block.rows.map((row, rowIndex) => {
        const colsKey = row.columnsCount as 1 | 2 | 3;
        const colsClass = blockUi.gridCols[colsKey];

        return (
          <div
            key={toStableUiKey({ id: row.id }, rowIndex)}
            className={cn(blockUi.grid, colsClass)}
            data-row
          >
            {row.columns.map((column, colIndex) => {
              return (
                <div
                  key={toStableUiKey({ id: column.id }, colIndex)}
                  className={blockUi.cell}
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
                        key={__cellKey(cell, cellIndex)}
                        data-cell-id={cell.id}
                        data-cell-kind={cell.kind}
                        className="relative min-w-0"
                      >
                        {renderCellFromRegistry(
                          cell,
                          containerMode === "fullBleed",
                          cellsUi,
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
    </section>
  );
}

SectionBlockRenderer.displayName = "SectionBlockRenderer";

/* -------------------------------------------------------------------------- */
/* Internals                                                                  */
/* -------------------------------------------------------------------------- */

function __cellKey(cell: CellShape, index: number) {
  return toStableUiKey({ id: cell.id }, index);
}

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

function renderCellFromRegistry(
  cell: CellShape,
  isFull: boolean,
  cellsUi: SiteCellsUi,
  isLcpMedia: boolean,
): ReactNode {
  const renderer = cellRegistry[cell.kind];

  if (!renderer) return null;

  return renderer({
    cell,
    ui: cellsUi,
    isFullBleed: isFull,
    isLcpMedia,
  });
}
