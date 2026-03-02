"use client";

/**
 * @file apps/studio/src/features/settings/footer/validate.ts
 * @layer hooks/admin/site/footer
 *
 * @description
 * Helpers et hooks de validation UI non bloquante pour le footer.
 *
 * @remarks
 * - Validation métier assurée par le domaine (Zod + use-cases serveur).
 * - Ici : UX uniquement (warnings légers, cohérence visuelle).
 */

import { useMemo } from "react";

import type { FooterFormValues } from "@compoz/validation/site/settings/footer/footer-form";

/**
 * Clés stables des warnings UI du footer.
 */
export type FooterWarningKey = "footerLooksEmpty" | "copyrightEmpty";

/**
 * Calcule les warnings UI associés à un brouillon de footer.
 */
export function computeFooterWarnings(
  s: Pick<FooterFormValues, "copyright" | "showYear">,
): FooterWarningKey[] {
  const out = new Set<FooterWarningKey>();

  const copyrightText = (s.copyright ?? "").trim();
  const hasCopyright = copyrightText.length > 0;
  const showsYear = Boolean(s.showYear);

  // 1) Avertissement si aucun texte n’est fourni
  if (!hasCopyright) out.add("copyrightEmpty");

  // 2) Footer considéré “vide” si ni texte ni année affichée
  if (!hasCopyright && !showsYear) out.add("footerLooksEmpty");

  return Array.from(out);
}

/**
 * Hook retournant les warnings UI du footer à partir des valeurs courantes.
 */
export function useFooterUiWarnings(
  copyright: FooterFormValues["copyright"],
  showYear: FooterFormValues["showYear"],
): FooterWarningKey[] {
  return useMemo(
    () => computeFooterWarnings({ copyright, showYear }),
    [copyright, showYear],
  );
}
