/**
 * @file apps/studio/src/features/pages/lib/page-form-parent-rebase.ts
 * @layer studio/features/pages/lib
 * @description Applies a parent-only RHF rebase while retaining metadata form state.
 */

import type { UseFormResetField } from "react-hook-form";

import type { PageFormValues } from "@compoz/validation/pages/page-form";

export function applyPageFormParentRebase(
  currentResetBaseline: PageFormValues,
  resetField: UseFormResetField<PageFormValues>,
  parentId: string | null,
): PageFormValues {
  const nextResetBaseline = {
    ...currentResetBaseline,
    parentId,
  };

  resetField("parentId", {
    defaultValue: parentId,
    keepError: true,
    keepTouched: true,
  });

  return nextResetBaseline;
}
