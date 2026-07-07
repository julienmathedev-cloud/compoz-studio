"use client";

/**
 * @file apps/studio/src/features/pages/blocks/components/molecules/BlockCellsDescription.tsx
 * @layer studio/features/pages/blocks/components/molecules
 *
 * @description
 * Block summary renderer for title, cell badges, or title-and-badges modes.
 *
 * @remarks
 * - Extracts cell badges only for `section` blocks, where rows, columns, and cells exist.
 * - Provides a readable fallback summary for non-section block types.
 * - Keeps badge tooltips accessible with focusable triggers and screen-reader labels.
 */

import type { BlockDTO, CellDTO } from "@compoz/core/domain/pages/dto";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import {
  getCellKind,
  getCellKindMeta,
} from "@compoz/studio/lib/pages/blocks/cell-kind-meta";
import { Badge } from "@compoz/ui/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@compoz/ui/components/ui/tooltip";
import { cn } from "@compoz/ui/lib/utils";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

type BlockCellsDescriptionMode = "full" | "title" | "badges";

type BlockCellsDescriptionProps = Readonly<{
  block: BlockDTO;
  index?: number;
  className?: string;
  mode?: BlockCellsDescriptionMode;
}>;

type BlockCellBadgeItem = Readonly<{
  key: string;
  row: number;
  column: number;
  kind: CellDTO["kind"];
  kindLabel: string;
  Icon: LucideIcon;
}>;

type SectionBlockDTO = Extract<BlockDTO, { type: "section" }>;
type SectionRowDTO = SectionBlockDTO["rows"][number];
type SectionColumnDTO = SectionRowDTO["columns"][number];

function getFallbackBlockName(
  block: BlockDTO,
  index: number | undefined,
  blockEntityLabel: string,
): string {
  const explicitName = String(block.name ?? "").trim();

  if (explicitName.length > 0) {
    return explicitName;
  }

  return index != null ? `${blockEntityLabel} ${index + 1}` : blockEntityLabel;
}

function getSectionCellBadges(
  block: SectionBlockDTO,
  t: ReturnType<typeof useTranslations>,
): ReadonlyArray<BlockCellBadgeItem> {
  const rows: ReadonlyArray<SectionRowDTO> = Array.isArray(block.rows)
    ? block.rows
    : [];

  return rows.flatMap((row: SectionRowDTO, rowIndex: number) => {
    const columns: ReadonlyArray<SectionColumnDTO> = Array.isArray(row.columns)
      ? row.columns
      : [];

    return columns.flatMap((column: SectionColumnDTO, colIndex: number) => {
      const cells: ReadonlyArray<CellDTO> = Array.isArray(column.cells)
        ? column.cells
        : [];

      return cells
        .map((cell: CellDTO, cellIndex: number) => {
          const kind = getCellKind(cell);
          if (!kind) return null;

          const meta = getCellKindMeta(kind, t);

          return {
            key: `${rowIndex}:${colIndex}:${cellIndex}:${kind}`,
            row: rowIndex + 1,
            column: colIndex + 1,
            kind,
            kindLabel: meta.label,
            Icon: meta.Icon,
          } satisfies BlockCellBadgeItem;
        })
        .filter((item): item is BlockCellBadgeItem => Boolean(item));
    });
  });
}

export function BlockCellsDescription({
  block,
  index,
  className,
  mode = "full",
}: BlockCellsDescriptionProps) {
  const t = useTranslations();
  const blockEntityLabel = t("studio.shared.entities.blocks");

  const name = getFallbackBlockName(block, index, blockEntityLabel);

  if (mode === "title") {
    return (
      <div className={cn("min-w-0", className)}>
        <Text as="p" truncate>
          {name}
        </Text>
      </div>
    );
  }

  if (block.type !== "section") {
    return (
      <div className={cn("min-w-0", className)}>
        <Text as="p" truncate>
          {name}
        </Text>

        <Text as="p" variant="meta" truncate>
          {t("studio.pageBlocksListSection.bloc.fallbackSummary", {
            type: block.type,
          })}
        </Text>
      </div>
    );
  }

  const cellBadges = getSectionCellBadges(block, t);

  const badges = (
    <TooltipProvider>
      <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
        {cellBadges.length > 0 ? (
          cellBadges.map(({ key, row, column, kind, kindLabel, Icon }) => (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  visualMode="studio"
                  className="h-8 w-8"
                  aria-label={`${kindLabel} (ligne ${row}, colonne ${column})`}
                  tabIndex={0}
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                  <span className="sr-only">{kind}</span>
                </Badge>
              </TooltipTrigger>

              <TooltipContent>
                {`${t("studio.pageBlocksListSection.bloc.row")} ${row} · ${t(
                  "studio.pageBlocksListSection.bloc.column",
                )} ${column} : ${kindLabel}`}
              </TooltipContent>
            </Tooltip>
          ))
        ) : (
          <Badge variant="info" visualMode="studio">
            {t("studio.pageBlocksListSection.bloc.empty")}
          </Badge>
        )}
      </div>
    </TooltipProvider>
  );

  if (mode === "badges") {
    return badges;
  }

  return (
    <div
      className={cn(
        "grid items-center gap-3",
        "grid-cols-[minmax(8rem,12rem)_1fr]",
        className,
      )}
    >
      <Text as="p" truncate>
        {name}
      </Text>

      {badges}
    </div>
  );
}

BlockCellsDescription.displayName = "BlockCellsDescription";
