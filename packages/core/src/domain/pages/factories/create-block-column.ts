/**
 * @file packages/core/src/domain/pages/factories/create-block-column.ts
 * @layer core/domain/pages
 */

import { randomUUID } from "crypto";

import type { BlockColumn } from "@compoz/core/domain/pages/entities/block";

export function createBlockColumnEntity(): BlockColumn {
  return {
    id: randomUUID(),
    cells: [],
  };
}
