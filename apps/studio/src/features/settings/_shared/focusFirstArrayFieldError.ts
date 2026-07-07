"use client";

/**
 * @file apps/studio/src/features/settings/_shared/focusFirstArrayFieldError.ts
 * @layer studio/features/settings/shared
 *
 * @description
 * Focus helper for the first invalid field inside an RHF array.
 *
 * @remarks
 * - Callers own field priority and DOM id resolution to keep array-specific focus rules explicit.
 * - Does not depend on React Hook Form internal error types.
 */

import { focusByFieldId } from "@compoz/ui/lib/focus";

/** Minimal RHF array item error shape without depending on RHF internals. */
type ArrayItemErrorLike<TFieldKey extends string> = Partial<
  Record<TFieldKey, unknown>
>;

type FocusFirstArrayFieldErrorParams<TFieldKey extends string> = Readonly<{
  itemErrors:
    | ReadonlyArray<ArrayItemErrorLike<TFieldKey> | undefined>
    | unknown;
  fieldPriority: readonly TFieldKey[];
  getFieldId: (index: number, field: TFieldKey) => string | undefined;
}>;

/** Focuses the first invalid RHF array field found by caller-defined field priority. */
export function focusFirstArrayFieldError<TFieldKey extends string>({
  itemErrors,
  fieldPriority,
  getFieldId,
}: FocusFirstArrayFieldErrorParams<TFieldKey>): boolean {
  if (!Array.isArray(itemErrors) || itemErrors.length === 0) {
    return false;
  }

  const firstIndex = itemErrors.findIndex((itemError) => {
    if (!itemError) return false;

    return fieldPriority.some((field) => Boolean(itemError[field]));
  });

  if (firstIndex < 0) {
    return false;
  }

  const firstField = fieldPriority.find((field) =>
    Boolean(itemErrors[firstIndex]?.[field]),
  );

  if (!firstField) {
    return false;
  }

  const targetId = getFieldId(firstIndex, firstField);
  if (!targetId) {
    return false;
  }

  focusByFieldId(targetId);
  return true;
}
