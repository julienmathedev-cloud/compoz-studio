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

import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";

/* ─────────────────────────── Types ─────────────────────────── */

export type BlockWarningKey = "titleMissing" | "titleLooksThin" | "titleSrOnly";

/* ─────────────────────────── Warnings (PURE + hook) ─────────────────────────── */

/**
 * Calcule les warnings UI pour un LayoutSectionBlock.
 */
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

/**
 * Hook retournant les warnings UI d’un LayoutSectionBlock (form).
 */
export function useLayoutSectionBlockUiWarnings(
  values: SectionBlockFormValues,
): BlockWarningKey[] {
  return useMemo(() => computeLayoutSectionBlockWarnings(values), [values]);
}
