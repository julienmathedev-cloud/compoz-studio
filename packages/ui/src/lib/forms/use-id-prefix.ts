/**
 * @file packages/ui/src/lib/forms/use-id-prefix.ts
 * @layer ui/lib/forms
 * @description Stable SSR-safe id helpers for accessible form fields.
 * @remarks
 * IDs link fields with labels, errors, help text, and optional hints.
 */

import { useId, useMemo } from "react";

/**
 * Normalizes a value into a safe kebab-case id segment.
 */
function normalizeIdSegment(value: string | undefined): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Builds a stable prefix from a normalized seed and React `useId()`. */
export function useIdPrefix(seed: string): string {
  const reactId = useId();

  return useMemo(() => {
    const normalizedSeed = normalizeIdSegment(seed);

    // React ids may contain framework-specific separators such as `:`.
    const normalizedReactId = reactId.toLowerCase().replace(/[^a-z0-9]+/g, "");

    return normalizedSeed
      ? `${normalizedSeed}-${normalizedReactId}`
      : normalizedReactId;
  }, [seed, reactId]);
}

export type FieldIds = {
  fieldId: string;
  labelId: string;
  errorId: string;
  helpId: string;
  hintId?: string;
};

export function createFieldIds(
  idPrefix: string,
  name: string,
  opts?: {
    hint?: boolean;
  },
): FieldIds {
  // Field names may contain dots or special characters from form paths.
  const normalizedName = normalizeIdSegment(name) || "field";

  const base = `${idPrefix}-${normalizedName}`;

  return {
    fieldId: base,
    labelId: `${base}-label`,
    errorId: `${base}-error`,
    helpId: `${base}-help`,
    hintId: opts?.hint ? `${base}-hint` : undefined,
  };
}
