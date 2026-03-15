/**
 * @file packages/ui/src/pages/mappers/cells/case-study-card.ts
 * @layer ui/pages/mappers
 *
 * @description
 * Mapper "shared runtime" pour les cellules de type `caseStudyCard`.
 */

import type { CellDTO } from "@compoz/core/domain/pages/dto";
import type { CaseStudyCardCellFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

export function toCaseStudyCardCellShapeFromDTO(
  cell: Extract<CellDTO, { kind: "caseStudyCard" }>,
): CaseStudyCardCellFormValues {
  return {
    id: cell.id,
    kind: "caseStudyCard",
    columns: cell.columns,
    items: cell.items.map((item) => ({
      id: item.id,
      image: item.image ?? undefined,
      title: item.title,
      context: item.context,
      solution: item.solution,
      result: item.result,
    })),
  };
}
