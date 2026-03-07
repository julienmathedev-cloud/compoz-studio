"use client";

/**
 * @file apps/studio/src/features/pages/blocks/components/molecules/BlockCellsDescription.tsx
 * @layer ui/studio/pages/blocks/molecules
 *
 * @description
 * Résumé UI des cells d’un block :
 * - titre seul
 * - badges seuls
 * - titre + badges
 *
 * @remarks
 * - Strictement UI-only.
 * - Supporte principalement `layoutSection`.
 * - Fournit un fallback lisible pour les autres types de blocks.
 */

import type { BlockDTO, CellDTO } from "@compoz/core/domain/pages/dto";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { Badge } from "@compoz/ui/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@compoz/ui/components/ui/tooltip";
import { cn } from "@compoz/ui/lib/utils";
import {
  GalleryHorizontal,
  Image as ImageIcon,
  Images,
  Type,
} from "lucide-react";
import { useTranslations } from "next-intl";

type BlockCellsDescriptionMode = "full" | "title" | "badges";

type BlockCellsDescriptionProps = Readonly<{
  block: BlockDTO;
  index?: number;
  className?: string;
  mode?: BlockCellsDescriptionMode;
}>;

function getCellKind(value: BlockDTO["cells"][number]): CellDTO["kind"] | null {
  if (!value || typeof value !== "object") return null;

  const kind = (value as { kind?: unknown }).kind;

  if (
    kind === "richText" ||
    kind === "image" ||
    kind === "gallery" ||
    kind === "carousel"
  ) {
    return kind;
  }

  return null;
}

function getKindIcon(kind: CellDTO["kind"]) {
  if (kind === "richText") return Type;
  if (kind === "image") return ImageIcon;
  if (kind === "carousel") return GalleryHorizontal;
  return Images;
}

export function BlockCellsDescription({
  block,
  index,
  className,
  mode = "full",
}: BlockCellsDescriptionProps) {
  const t = useTranslations();

  const title =
    block.title?.text ??
    `${t("studio.shared.entities.blocks")}${index != null ? ` ${index + 1}` : ""}`;

  if (mode === "title") {
    return (
      <div className={cn("min-w-0", className)}>
        <Text as="p" truncate>
          {title}
        </Text>
      </div>
    );
  }

  if (block.type !== "layoutSection") {
    return (
      <div className={cn("min-w-0", className)}>
        <Text as="p" truncate>
          {title}
        </Text>

        <Text as="p" variant="meta" truncate>
          {t("studio.pageBlocksListSection.bloc.fallbackSummary", {
            type: block.type,
          })}
        </Text>
      </div>
    );
  }

  const cells = Array.isArray(block.cells) ? block.cells : [];

  const columnBadges = cells
    .map((cell, cellIndex) => {
      const kind = getCellKind(cell);
      if (!kind) return null;

      const Icon = getKindIcon(kind);
      const kindLabel = t(`studio.cellEditorTabs.kinds.${kind}`, {
        default: kind,
      });

      return {
        key: `${cellIndex}:${kind}`,
        column: cellIndex + 1,
        kind,
        kindLabel,
        Icon,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const badges = (
    <TooltipProvider>
      <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
        {columnBadges.length > 0 ? (
          columnBadges.map(({ key, column, kind, kindLabel, Icon }) => (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className="h-8 w-8"
                  aria-label={`${kindLabel} (colonne ${column})`}
                  tabIndex={0}
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                  <span className="sr-only">{kind}</span>
                </Badge>
              </TooltipTrigger>

              <TooltipContent>
                {`${t("studio.cellEditorTabs.tabs", {
                  number: column,
                })} : ${kindLabel}`}
              </TooltipContent>
            </Tooltip>
          ))
        ) : (
          <Badge variant="info">
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
        "grid-cols-[minmax(4rem,10rem)_1fr]",
        className,
      )}
    >
      <Text as="p" truncate>
        {title}
      </Text>

      {badges}
    </div>
  );
}

BlockCellsDescription.displayName = "BlockCellsDescription";
