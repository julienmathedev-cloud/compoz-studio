/**
 * @file packages/ui/src/pages/mappers/cells/rich-text.ts
 * @layer ui/pages/mappers
 *
 * @description
 * Mapper "shared runtime" pour les cellules de type `richText`.
 */
import type { CellDTO } from "@compoz/core/domain/pages/dto";
import type { RichTextCellFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

export function toRichTextCellShapeFromDTO(
  cell: Extract<CellDTO, { kind: "richText" }>,
): RichTextCellFormValues {
  return {
    id: cell.id,
    kind: "richText",
    cssClassName: cell.cssClassName,
    content: cell.content,
    reveal: cell.reveal,
  };
}
