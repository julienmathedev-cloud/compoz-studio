"use client";

/**
 * @file apps/studio/src/features/pages/blocks/validate.ts
 * @layer studio/features/pages/blocks
 *
 * @description
 * UI warning helpers for draft section block forms.
 *
 * @remarks
 * - Domain validation stays in Zod schemas and server use-cases.
 * - These helpers only surface lightweight UX warnings while editing.
 * - Currently targets section block form values only.
 */

import { useMemo } from "react";

import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";

export type BlockWarningKey = "titleMissing" | "titleLooksThin" | "titleSrOnly";

/** Computes lightweight UI warnings for a section block form. */
export function computeLayoutSectionBlockWarnings(
  values: SectionBlockFormValues,
): BlockWarningKey[] {
  const warnings = new Set<BlockWarningKey>();

  const name = values.name;

  if (name) {
    const text = String(name ?? "").trim();

    if (!text) warnings.add("titleMissing");
    if (text.length > 0 && text.length <= 4) warnings.add("titleLooksThin");
  }

  return Array.from(warnings);
}

/** Memoizes section block UI warnings for form consumers. */
export function useLayoutSectionBlockUiWarnings(
  values: SectionBlockFormValues,
): BlockWarningKey[] {
  return useMemo(() => computeLayoutSectionBlockWarnings(values), [values]);
}
