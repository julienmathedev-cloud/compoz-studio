"use client";

/**
 * @file apps/studio/src/features/settings/header/validate.ts
 * @layer studio/features/settings/header
 *
 * @description
 * Non-blocking Studio header form warnings.
 *
 * @remarks
 * - Blocking validation stays in Zod schemas and server use cases.
 */

import { useMemo } from "react";

import type { HeaderFormValues } from "@compoz/validation/site/settings/header/header-form";

export type HeaderWarningKey = "noBranding";

/** Computes non-blocking warnings from header form values. */
export function computeHeaderWarnings(
  s: Pick<HeaderFormValues, "showLogo" | "showSiteName">,
): HeaderWarningKey[] {
  const out = new Set<HeaderWarningKey>();

  const showsLogo = Boolean(s.showLogo);
  const showsSiteName = Boolean(s.showSiteName);

  // A header with neither logo nor site name can render without visible branding.
  if (!showsLogo && !showsSiteName) {
    out.add("noBranding");
  }

  return Array.from(out);
}

/** Memoizes header warnings for form consumers. */
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
