"use client";

/**
 * @file apps/studio/src/features/settings/social/validate.ts
 * @layer hooks/admin/site/social
 *
 * @description
 * Helpers et hooks de validation UI non bloquante pour les réseaux sociaux.
 *
 * @remarks
 * - Validation métier assurée par le domaine (Zod + use-cases serveur).
 * - Ici : UX uniquement (warnings légers, cohérence, doublons, préfixes incomplets).
 */

import { useMemo } from "react";

import type { SocialFormValues } from "@compoz/validation/site/settings/social/social-form";

/**
 * Clés stables des warnings UI Social.
 */
export type SocialWarningKey = "socialEmpty" | "dupLinks";

/**
 * Paramètres nécessaires au calcul des warnings UI Social.
 */
type WarningProps = Pick<SocialFormValues, "items">;

/** Normalisation simple (trim + lowercase) pour la détection de doublons. */
const normHref = (h: string) => h.trim().toLowerCase();

/**
 * Calcule les warnings UI associés à un brouillon Social.
 */
export function computeSocialWarnings(props: WarningProps): SocialWarningKey[] {
  const out = new Set<SocialWarningKey>();
  const items = Array.isArray(props.items) ? props.items : [];

  // Aucun lien → UX : inciter à ajouter au moins un réseau
  if (items.length === 0) {
    out.add("socialEmpty");
    return Array.from(out);
  }

  // Doublons de href (URL/mailto)
  const seenHrefs = new Set<string>();
  for (const it of items) {
    const h = normHref(it.href ?? "");
    if (!h) continue;
    if (seenHrefs.has(h)) {
      out.add("dupLinks");
      break; // un warning suffit
    }
    seenHrefs.add(h);
  }

  return Array.from(out);
}

/**
 * Hook retournant les warnings UI Social à partir des valeurs courantes.
 */
export function useSocialUiWarnings(
  items: SocialFormValues["items"],
): SocialWarningKey[] {
  return useMemo(() => computeSocialWarnings({ items }), [items]);
}
