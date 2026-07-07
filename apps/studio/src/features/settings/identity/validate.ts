"use client";

/**
 * @file apps/studio/src/features/settings/identity/validate.ts
 * @layer studio/features/settings/identity
 *
 * @description
 * Non-blocking Studio identity form warnings.
 *
 * @remarks
 * - Blocking validation stays in Zod schemas and server use cases.
 */

import { useMemo } from "react";

import type { IdentityFormValues } from "@compoz/validation/site/settings/identity/identity-form";

export type IdentityWarningKey =
  | "logoMissing"
  | "faviconMissing"
  | "logoAndFaviconMissing";

/** Computes non-blocking warnings from identity form values. */
export function computeIdentityWarnings(
  s: Pick<IdentityFormValues, "logo" | "faviconUrl">,
): IdentityWarningKey[] {
  const out = new Set<IdentityWarningKey>();

  const hasLogo = s.logo !== null;
  const hasFavicon = Boolean((s.faviconUrl ?? "").trim());

  if (!hasLogo && !hasFavicon) {
    out.add("logoAndFaviconMissing");
  } else {
    if (!hasLogo) out.add("logoMissing");
    if (!hasFavicon) out.add("faviconMissing");
  }

  return Array.from(out);
}

/** Memoizes identity warnings for form consumers. */
export function useIdentityUiWarnings(
  logo: IdentityFormValues["logo"],
  faviconUrl: IdentityFormValues["faviconUrl"],
): IdentityWarningKey[] {
  return useMemo(
    () => computeIdentityWarnings({ logo, faviconUrl }),
    [logo, faviconUrl],
  );
}
