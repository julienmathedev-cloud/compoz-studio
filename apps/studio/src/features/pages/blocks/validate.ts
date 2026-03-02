"use client";

/**
 * @file apps/studio/src/features/pages/blocks/validate.ts
 * @layer hooks/admin/pages/blocks
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

export function computeLayoutSectionBlockWarnings(
  values: LayoutSectionBlockFormValues,
): BlockWarningKey[] {
  const out = new Set<BlockWarningKey>();

  const title = values.title;

  if (title) {
    const text = (title.text ?? "").trim();

    if (!text) out.add("titleMissing");
    if (text.length > 0 && text.length <= 4) out.add("titleLooksThin");
    if (title.display === "sr-only") out.add("titleSrOnly");
  }

  return Array.from(out);
}

/**
 * Hook retournant les warnings UI d’un LayoutSectionBlock (form).
 */
export function useLayoutSectionBlockUiWarnings(
  values: LayoutSectionBlockFormValues,
): BlockWarningKey[] {
  return useMemo(() => computeLayoutSectionBlockWarnings(values), [values]);
}
