/**
 * @file apps/studio/src/features/builder/builder-block-recreation.ts
 * @layer studio/features/builder
 * @description Builder recreation workflow that commits side effects only after create success.
 */

import type { AddSectionBlockResponse } from "@compoz/infra/http/studio/pages.types";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";

export async function runBuilderBlockRecreation(input: Readonly<{
  values: SectionBlockFormValues;
  create: (args: Readonly<{
    values: SectionBlockFormValues;
  }>) => Promise<AddSectionBlockResponse>;
  onSuccess: (createdBlockId: string) => void;
}>): Promise<void> {
  const response = await input.create({ values: input.values });
  input.onSuccess(response.createdBlockId);
}
