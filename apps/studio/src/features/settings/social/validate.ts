"use client";

/**
 * @file apps/studio/src/features/settings/social/validate.ts
 * @layer hooks/studio/site/social
 *
 * @description
 * Helpers et hooks de validation UI non bloquante pour les réseaux sociaux.
 *
 * @remarks
 * - Validation métier assurée par le domaine (Zod + use-cases serveur).
 * - Ici : UX uniquement (warnings légers, cohérence, doublons).
 */

import { useMemo } from "react";

import type { SocialFormValues } from "@compoz/validation/site/settings/social/social-form";

/**
 * Clés stables des warnings UI Social.
 */
export type SocialWarningKey = "socialEmpty" | "dupLinks";

/** Normalisation simple (trim + lowercase) pour la détection de doublons. */
function normHref(href: string): string {
  return href.trim().toLowerCase();
}

/**
 * Calcule les warnings UI associés à un brouillon Social.
 */
export function computeSocialWarnings({
  items,
}: Pick<SocialFormValues, "items">): SocialWarningKey[] {
  const warnings = new Set<SocialWarningKey>();

  const safeItems = Array.isArray(items) ? items : [];

  // Aucun lien → UX : inciter à ajouter au moins un réseau
  if (safeItems.length === 0) {
    warnings.add("socialEmpty");
    return Array.from(warnings);
  }

  // Doublons de href (URL/mailto)
  const seenHrefs = new Set<string>();

  for (const item of safeItems) {
    const href = normHref(item.href ?? "");

    if (!href) continue;

    if (seenHrefs.has(href)) {
      warnings.add("dupLinks");
      break; // un warning suffit
    }

    seenHrefs.add(href);
  }

  return Array.from(warnings);
}

/**
 * Hook retournant les warnings UI Social à partir des valeurs courantes.
 */
export function useSocialUiWarnings(
  items: SocialFormValues["items"],
): SocialWarningKey[] {
  return useMemo(() => computeSocialWarnings({ items }), [items]);
}
