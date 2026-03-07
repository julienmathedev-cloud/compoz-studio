"use client";

/**
 * @file apps/studio/src/features/pages/blocks/validate.ts
 * @layer hooks/studio/pages/blocks
 *
 * @description
 * Helpers et hooks de validation UI pour les blocks (warnings légers).
 *
 * @remarks
 * - Validation métier assurée par le domaine (Zod + use-cases serveur).
 * - Ici : UX uniquement (warnings, incohérences mineures).
 * - V0.5 : uniquement LayoutSectionBlock.
 */

import { useMemo } from "react";

import type { LayoutSectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";

/* ─────────────────────────── Types ─────────────────────────── */

export type BlockWarningKey = "titleMissing" | "titleLooksThin" | "titleSrOnly";

/* ─────────────────────────── Warnings (PURE + hook) ─────────────────────────── */

/**
 * Calcule les warnings UI pour un LayoutSectionBlock.
 */
export function computeLayoutSectionBlockWarnings(
  values: LayoutSectionBlockFormValues,
): BlockWarningKey[] {
  const warnings = new Set<BlockWarningKey>();

  const title = values.title;

  if (title) {
    const text = String(title.text ?? "").trim();

    if (!text) warnings.add("titleMissing");
    if (text.length > 0 && text.length <= 4) warnings.add("titleLooksThin");
    if (title.display === "sr-only") warnings.add("titleSrOnly");
  }

  return Array.from(warnings);
}

/**
 * Hook retournant les warnings UI d’un LayoutSectionBlock (form).
 */
export function useLayoutSectionBlockUiWarnings(
  values: LayoutSectionBlockFormValues,
): BlockWarningKey[] {
  return useMemo(() => computeLayoutSectionBlockWarnings(values), [values]);
}
