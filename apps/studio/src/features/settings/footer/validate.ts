"use client";

/**
 * @file apps/studio/src/features/settings/footer/validate.ts
 * @layer studio/features/settings/footer
 *
 * @description
 * Non-blocking Studio footer form warnings.
 *
 * @remarks
 * - Blocking validation stays in Zod schemas and server use cases.
 */

import { useMemo } from "react";

import type { FooterFormValues } from "@compoz/validation/site/settings/footer/footer-form";

export type FooterWarningKey = "footerLooksEmpty" | "copyrightEmpty";

/** Computes non-blocking warnings from footer form values. */
export function computeFooterWarnings(
  values: Pick<FooterFormValues, "copyright" | "showYear">,
): FooterWarningKey[] {
  const out = new Set<FooterWarningKey>();

  const copyrightText = values.copyright?.trim() ?? "";
  const hasCopyright = copyrightText.length > 0;
  const showsYear = Boolean(values.showYear);

  if (!hasCopyright) {
    out.add("copyrightEmpty");
  }

  // A footer with neither text nor year will render visually empty.
  if (!hasCopyright && !showsYear) {
    out.add("footerLooksEmpty");
  }

  return Array.from(out);
}

/** Memoizes footer warnings for form consumers. */
export function useFooterUiWarnings(
  copyright: FooterFormValues["copyright"],
  showYear: FooterFormValues["showYear"],
): FooterWarningKey[] {
  return useMemo(
    () =>
      computeFooterWarnings({
        copyright,
        showYear,
      }),
    [copyright, showYear],
  );
}

useFooterUiWarnings.displayName = "useFooterUiWarnings";
