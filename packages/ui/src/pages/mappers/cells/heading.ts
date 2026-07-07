/**
 * @file packages/ui/src/pages/mappers/cells/heading.ts
 * @layer ui/pages/mappers
 * @description Maps heading cell DTOs to form values.
 */

import type { CellDTO } from "@compoz/core/domain/pages/dto";
import type { HeadingCellFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

export function toHeadingCellShapeFromDTO(
  cell: Extract<CellDTO, { kind: "heading" }>,
): HeadingCellFormValues {
  return {
    id: cell.id,
    kind: "heading",
    cssClassName: cell.cssClassName,
    level: cell.level,
    title: cell.title,
    subtitle: cell.subtitle,
    align: cell.align,
    variant: cell.variant,
    separator: cell.separator,
    idAnchor: cell.idAnchor,
    reveal: cell.reveal,
    highlights: [...cell.highlights],
  };
}
