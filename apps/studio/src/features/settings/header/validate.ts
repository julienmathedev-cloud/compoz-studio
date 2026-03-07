"use client";

/**
 * @file apps/studio/src/features/settings/header/validate.ts
 * @layer hooks/studio/site/header
 *
 * @description
 * Helpers et hooks de validation UI non bloquante pour le header.
 *
 * @remarks
 * - Validation métier assurée par le domaine (Zod + use-cases serveur).
 * - Ici : UX uniquement (warnings légers, cohérence visuelle).
 */

import { useMemo } from "react";

import type { HeaderFormValues } from "@compoz/validation/site/settings/header/header-form";

/* ─────────────────────────────── Types ─────────────────────────────── */

/**
 * Clés stables des warnings UI du header.
 */
export type HeaderWarningKey = "noBranding";

/* ─────────────────────────────── PURE FN ───────────────────────────── */

/**
 * Calcule les warnings UI associés à un brouillon de header.
 */
export function computeHeaderWarnings(
  s: Pick<HeaderFormValues, "showLogo" | "showSiteName">,
): HeaderWarningKey[] {
  const out = new Set<HeaderWarningKey>();

  const showsLogo = Boolean(s.showLogo);
  const showsSiteName = Boolean(s.showSiteName);

  // Aucun branding visible → header potentiellement vide / peu lisible
  if (!showsLogo && !showsSiteName) {
    out.add("noBranding");
  }

  return Array.from(out);
}

/* ─────────────────────────────── HOOK ─────────────────────────────── */

/**
 * Hook retournant les warnings UI du header à partir des valeurs courantes.
 */
export function useHeaderUiWarnings(
  showLogo: HeaderFormValues["showLogo"],
  showSiteName: HeaderFormValues["showSiteName"],
): HeaderWarningKey[] {
  return useMemo(
    () => computeHeaderWarnings({ showLogo, showSiteName }),
    [showLogo, showSiteName],
  );
}

useHeaderUiWarnings.displayName = "useHeaderUiWarnings";
