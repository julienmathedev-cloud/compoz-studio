/**
 * @file packages/ui/src/pages/mappers/cells/timeline.ts
 * @layer ui/pages/mappers
 *
 * @description
 * Mapper "shared runtime" pour les cellules de type `timeline`.
 */

import type { CellDTO } from "@compoz/core/domain/pages/dto";
import { normalizeString } from "@compoz/ui/lib/normalize";
import type { TimelineCellFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

export function toTimelineCellShapeFromDTO(
  cell: Extract<CellDTO, { kind: "timeline" }>,
): TimelineCellFormValues {
  return {
    id: normalizeString(cell.id, ""),
    kind: "timeline",
    items: cell.items.map((item) => ({
      id: normalizeString(item.id, ""),
      period: normalizeString(item.period, ""),
      title: normalizeString(item.title, ""),
      subtitle: normalizeString(item.subtitle ?? "", ""),
      description: normalizeString(item.description ?? "", ""),
      badge: normalizeString(item.badge ?? "", ""),
      keywords: item.keywords
        ? item.keywords
            .map((keyword) => normalizeString(keyword, ""))
            .filter(Boolean)
        : [],
    })),
  };
}
