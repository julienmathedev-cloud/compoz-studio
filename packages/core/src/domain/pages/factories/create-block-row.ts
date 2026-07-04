/**
 * @file packages/core/src/domain/pages/factories/create-block-row.ts
 * @layer core/domain/pages
 */

import { randomUUID } from "crypto";

import type { BlockRow } from "@compoz/core/domain/pages/entities/block";
import { createBlockColumnEntity } from "@compoz/core/domain/pages/factories/create-block-column";

export function createBlockRowEntity(columnsCount: 1 | 2 | 3): BlockRow {
  const columns = Array.from({ length: columnsCount }, () =>
    createBlockColumnEntity(),
  );

  return {
    id: randomUUID(),
    columnsCount,
    reverseOn: {
      mobile: false,
      tablet: false,
      desktop: false,
    },
    columns,
  };
}
