/**
 * @file apps/studio/src/app/api/_adapters/pages/blocks/cells.ts
 */

import type { Cell } from "@compoz/core/domain/pages/entities/cell";
import type { CellIntentDTO } from "@compoz/validation/pages/blocks/cells/cell-intents";

import { adaptButtonsCell } from "@compoz/studio/app/api/_adapters/pages/blocks/cells/buttons";
import { adaptCardsCell } from "@compoz/studio/app/api/_adapters/pages/blocks/cells/cards";
import { adaptCardsExtendedCell } from "@compoz/studio/app/api/_adapters/pages/blocks/cells/cards-extended";
import { adaptCarouselCell } from "@compoz/studio/app/api/_adapters/pages/blocks/cells/carousel";
import { adaptFormCell } from "@compoz/studio/app/api/_adapters/pages/blocks/cells/form";
import { adaptGalleryCell } from "@compoz/studio/app/api/_adapters/pages/blocks/cells/gallery";
import { adaptHeadingCell } from "@compoz/studio/app/api/_adapters/pages/blocks/cells/heading";
import { adaptImageCell } from "@compoz/studio/app/api/_adapters/pages/blocks/cells/image";
import { adaptRichTextCell } from "@compoz/studio/app/api/_adapters/pages/blocks/cells/rich-text";
import { adaptSeparatorCell } from "@compoz/studio/app/api/_adapters/pages/blocks/cells/separator";
import { adaptSpacerCell } from "@compoz/studio/app/api/_adapters/pages/blocks/cells/spacer";
import { adaptStepsCell } from "@compoz/studio/app/api/_adapters/pages/blocks/cells/steps";
import { adaptStructuredCardCell } from "@compoz/studio/app/api/_adapters/pages/blocks/cells/structured-card";
import { adaptTimelineCell } from "@compoz/studio/app/api/_adapters/pages/blocks/cells/timeline";

export function adaptCells(
  dtoCells: ReadonlyArray<CellIntentDTO> | undefined,
): readonly Cell[] {
  if (!Array.isArray(dtoCells)) return [];

  return dtoCells.map((cell): Cell => {
    switch (cell.kind) {
      case "heading":
        return adaptHeadingCell(cell);

      case "richText":
        return adaptRichTextCell(cell);

      case "spacer":
        return adaptSpacerCell(cell);

      case "separator":
        return adaptSeparatorCell(cell);

      case "buttons":
        return adaptButtonsCell(cell);

      case "image":
        return adaptImageCell(cell);

      case "gallery":
        return adaptGalleryCell(cell);

      case "carousel":
        return adaptCarouselCell(cell);

      case "cards":
        return adaptCardsCell(cell);

      case "cardsExtended":
        return adaptCardsExtendedCell(cell);

      case "steps":
        return adaptStepsCell(cell);

      case "timeline":
        return adaptTimelineCell(cell);

      case "structuredCard":
        return adaptStructuredCardCell(cell);

      case "form":
        return adaptFormCell(cell);

      default:
        return cell;
    }
  });
}
