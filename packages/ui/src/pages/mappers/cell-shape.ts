/**
 * @file packages/ui/src/pages/mappers/cell-shape.ts
 * @layer ui/pages/mappers
 *
 * @description
 * Mapper "shared runtime" pour les cells.
 */

import type { CellDTO } from "@compoz/core/domain/pages/dto";
import type { CellFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

import { toButtonsCellShapeFromDTO } from "@compoz/ui/pages/mappers/cells/buttons";
import { toCardsCellShapeFromDTO } from "@compoz/ui/pages/mappers/cells/cards";
import { toCardsExtendedCellShapeFromDTO } from "@compoz/ui/pages/mappers/cells/cards-extended";
import { toCarouselCellShapeFromDTO } from "@compoz/ui/pages/mappers/cells/carousel";
import { toCaseStudyCardCellShapeFromDTO } from "@compoz/ui/pages/mappers/cells/case-study-card";
import { toFormCellShapeFromDTO } from "@compoz/ui/pages/mappers/cells/form";
import { toGalleryCellShapeFromDTO } from "@compoz/ui/pages/mappers/cells/gallery";
import { toHeadingCellShapeFromDTO } from "@compoz/ui/pages/mappers/cells/heading";
import { toImageCellShapeFromDTO } from "@compoz/ui/pages/mappers/cells/image";
import { toRichTextCellShapeFromDTO } from "@compoz/ui/pages/mappers/cells/rich-text";
import { toSeparatorCellShapeFromDTO } from "@compoz/ui/pages/mappers/cells/separator";
import { toSpacerCellShapeFromDTO } from "@compoz/ui/pages/mappers/cells/spacer";
import { toStepsCellShapeFromDTO } from "@compoz/ui/pages/mappers/cells/steps";
import { toTimelineCellShapeFromDTO } from "@compoz/ui/pages/mappers/cells/timeline";

export function toCellShapeFromDTO(cell: CellDTO): CellFormValues {
  if (cell.kind === "heading") return toHeadingCellShapeFromDTO(cell);
  if (cell.kind === "richText") return toRichTextCellShapeFromDTO(cell);
  if (cell.kind === "separator") return toSeparatorCellShapeFromDTO(cell);
  if (cell.kind === "buttons") return toButtonsCellShapeFromDTO(cell);
  if (cell.kind === "cards") return toCardsCellShapeFromDTO(cell);
  if (cell.kind === "cardsExtended")
    return toCardsExtendedCellShapeFromDTO(cell);
  if (cell.kind === "steps") return toStepsCellShapeFromDTO(cell);
  if (cell.kind === "timeline") return toTimelineCellShapeFromDTO(cell);
  if (cell.kind === "caseStudyCard")
    return toCaseStudyCardCellShapeFromDTO(cell);
  if (cell.kind === "form") return toFormCellShapeFromDTO(cell);
  if (cell.kind === "image") return toImageCellShapeFromDTO(cell);
  if (cell.kind === "gallery") return toGalleryCellShapeFromDTO(cell);
  if (cell.kind === "carousel") return toCarouselCellShapeFromDTO(cell);
  return toSpacerCellShapeFromDTO(cell);
}
