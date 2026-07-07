/**
 * @file packages/core/src/domain/pages/factories/create-section-block.ts
 * @layer core/domain/pages
 * @description Factory for creating a default section block entity.
 */

import { randomUUID } from "crypto";

import type { SectionBlock } from "@compoz/core/domain/pages/entities/block";
import { createBlockRowEntity } from "@compoz/core/domain/pages/factories/create-block-row";

export function createSectionBlockEntity(): SectionBlock {
  return {
    id: randomUUID(),
    type: "section",
    name: "",
    containerMode: "contained",
    lcpPriority: false,
    rows: [createBlockRowEntity(1)],
  };
}
