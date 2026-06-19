/**
 * @file packages/ui/src/pages/mappers/cell-shape.ts
 * @layer ui/pages/mappers
 *
 * @description
 * Shared runtime mapper for cells.
 */

import type { CellDTO } from "@compoz/core/domain/pages/dto";
import type { CellFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

import { toButtonsCellShapeFromDTO } from "@compoz/ui/pages/mappers/cells/buttons";
import { toCardCollectionCellShapeFromDTO } from "@compoz/ui/pages/mappers/cells/card-collection";
import { toCarouselCellShapeFromDTO } from "@compoz/ui/pages/mappers/cells/carousel";
import { toFormCellShapeFromDTO } from "@compoz/ui/pages/mappers/cells/form";
import { toGalleryCellShapeFromDTO } from "@compoz/ui/pages/mappers/cells/gallery";
import { toHeadingCellShapeFromDTO } from "@compoz/ui/pages/mappers/cells/heading";
import { toImageCellShapeFromDTO } from "@compoz/ui/pages/mappers/cells/image";
import { toRichTextCellShapeFromDTO } from "@compoz/ui/pages/mappers/cells/rich-text";
import { toSeparatorCellShapeFromDTO } from "@compoz/ui/pages/mappers/cells/separator";
import { toSpacerCellShapeFromDTO } from "@compoz/ui/pages/mappers/cells/spacer";
import { toStepsCellShapeFromDTO } from "@compoz/ui/pages/mappers/cells/steps";
import { toTestimonialsCellShapeFromDTO } from "@compoz/ui/pages/mappers/cells/testimonials";
import { toTimelineCellShapeFromDTO } from "@compoz/ui/pages/mappers/cells/timeline";

export function toCellShapeFromDTO(cell: CellDTO): CellFormValues {
  if (cell.kind === "heading") return toHeadingCellShapeFromDTO(cell);
  if (cell.kind === "richText") return toRichTextCellShapeFromDTO(cell);
  if (cell.kind === "separator") return toSeparatorCellShapeFromDTO(cell);
  if (cell.kind === "buttons") return toButtonsCellShapeFromDTO(cell);
  if (cell.kind === "cardCollection") {
    return toCardCollectionCellShapeFromDTO(cell);
  }
  if (cell.kind === "steps") return toStepsCellShapeFromDTO(cell);
  if (cell.kind === "testimonials") {
    return toTestimonialsCellShapeFromDTO(cell);
  }
  if (cell.kind === "timeline") return toTimelineCellShapeFromDTO(cell);
  if (cell.kind === "form") return toFormCellShapeFromDTO(cell);
  if (cell.kind === "image") return toImageCellShapeFromDTO(cell);
  if (cell.kind === "gallery") return toGalleryCellShapeFromDTO(cell);
  if (cell.kind === "carousel") return toCarouselCellShapeFromDTO(cell);

  return toSpacerCellShapeFromDTO(cell);
}
