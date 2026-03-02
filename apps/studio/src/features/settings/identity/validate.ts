"use client";

/**
 * @file apps/studio/src/features/settings/identity/validate.ts
 * @layer hooks/admin/site/identity
 *
 * @description
 * Helpers et hooks de validation UI non bloquante pour l’identité du site.
 *
 * @remarks
 * - Validation métier assurée par le domaine (Zod + use-cases serveur).
 * - Ici : UX uniquement (warnings légers, complétude visuelle).
 */

import { useMemo } from "react";

import type { IdentityFormValues } from "@compoz/validation/site/settings/identity/identity-form";

/* ─────────────────────────── Warnings (non-bloquants) ───────────────────────── */

/**
 * Clés stables des warnings UI pour l’identité du site.
 */
export type IdentityWarningKey =
  | "logoMissing"
  | "faviconMissing"
  | "logoAndFaviconMissing";

/* ─────────────────────────────── PURE FN ───────────────────────────── */

/**
 * Calcule les warnings UI associés à un brouillon d’identité.
 */
export function computeIdentityWarnings(
  s: Pick<IdentityFormValues, "logoUrl" | "faviconUrl">,
): IdentityWarningKey[] {
  const out = new Set<IdentityWarningKey>();

  const hasLogo = Boolean((s.logoUrl ?? "").trim());
  const hasFavicon = Boolean((s.faviconUrl ?? "").trim());

  if (!hasLogo && !hasFavicon) {
    out.add("logoAndFaviconMissing");
  } else {
    if (!hasLogo) out.add("logoMissing");
    if (!hasFavicon) out.add("faviconMissing");
  }

  return Array.from(out);
}

/* ─────────────────────────────── HOOK ─────────────────────────────── */

/**
 * Hook retournant les warnings UI de l’identité à partir des valeurs courantes.
 */
export function useIdentityUiWarnings(
  logoUrl: IdentityFormValues["logoUrl"],
  faviconUrl: IdentityFormValues["faviconUrl"],
): IdentityWarningKey[] {
  return useMemo(
    () => computeIdentityWarnings({ logoUrl, faviconUrl }),
    [logoUrl, faviconUrl],
  );
}
