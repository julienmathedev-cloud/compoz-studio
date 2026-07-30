/**
 * @file apps/studio/src/app/api/_adapters/pages/blocks/block-baselines.ts
 * @layer studio/app/api/adapters
 * @description Identity boundary for already-validated persisted OCC baselines.
 */

import type { Block } from "@compoz/core/domain/pages/entities/block";
import type { UpdateSectionBlockPatchInput } from "@compoz/core/domain/pages/use-cases/blocks/update-section-block.types";
import type {
  DeleteBlockIntentDTO,
  UpdateSectionBlockIntentDTO,
} from "@compoz/validation/pages/blocks/block-intents";

type IntentRowsBaseline = NonNullable<
  UpdateSectionBlockIntentDTO["changes"]["rows"]
>["baseline"];
type PatchRowsBaseline = NonNullable<
  UpdateSectionBlockPatchInput["changes"]["rows"]
>["baseline"];

export function preserveBaselineValue<T>(value: T): T {
  return value;
}

export function preserveValidatedRowsBaseline(
  rows: IntentRowsBaseline,
): PatchRowsBaseline {
  return rows as unknown as PatchRowsBaseline;
}

export function preserveValidatedBlockBaseline(
  block: DeleteBlockIntentDTO["baselineBlock"],
): Block {
  return block as Block;
}
