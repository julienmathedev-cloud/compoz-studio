"use client";

/**
 * @file apps/studio/src/features/settings/legal-menu/validate.ts
 * @layer hooks/admin/site/legal-menu
 *
 * @description
 * Helpers et hooks de validation UI non bloquante pour le menu légal.
 *
 * @remarks
 * - Validation métier assurée par le domaine (Zod + use-cases serveur).
 * - Ici : UX uniquement (warnings légers, cohérence et doublons).
 */

import { isHttpPrefixOnly } from "@compoz/core/domain/urls/ui-heuristics";
import { hasDuplicates } from "@compoz/ui/hooks/validate/helpers";
import { resolveLinkFlags } from "@compoz/ui/lib/links/helpers";
import { hrefCompareKey, labelCompareKey } from "@compoz/ui/lib/urls/compare";
import type { LegalMenuItemFormValues } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu-form";
import { useMemo } from "react";

/* ────────────────────────────── 2) Warnings UI (non-bloquants) ───────────────────────────── */

/**
 * Clés stables des warnings UI du menu légal.
 */
export type LegalMenuWarningKey =
  | "legalMenuEmpty"
  | "dupLabelsTop"
  | "dupLinksTop"
  | "externalNoNewTab"
  | "externalPrefixOnly"
  | "internalHrefNotFound";

/**
 * Paramètres nécessaires au calcul des warnings UI du menu légal.
 */
type WarningProps = {
  items: ReadonlyArray<LegalMenuItemFormValues>;
  hrefSet?: ReadonlySet<string>;
};

/**
 * Calcule les warnings UI associés à un brouillon de menu légal.
 */
export function computeLegalMenuWarnings(
  props: WarningProps,
): LegalMenuWarningKey[] {
  const { items, hrefSet } = props;
  const out = new Set<LegalMenuWarningKey>();

  // Aucun élément → footer légal vide
  if (!items || items.length === 0) {
    out.add("legalMenuEmpty");
    return Array.from(out);
  }

  const labelKeys: string[] = [];
  const hrefKeys: string[] = [];

  let hasExternalNoNewTab = false;
  let hasExternalPrefixOnly = false;

  for (const it of items) {
    const labelKey = labelCompareKey(it.label);
    const hrefKey = hrefCompareKey(it.href);

    labelKeys.push(labelKey);
    hrefKeys.push(hrefKey);

    // Option 1 : externe dérivé depuis href
    const href = (it.href ?? "").trim();
    const flags = resolveLinkFlags(href);
    const isExternal = flags.rawExternal;

    // Lien externe sans ouverture dans un nouvel onglet
    if (isExternal && !it.newTab) {
      hasExternalNoNewTab = true;
    }

    // Forme douteuse du href : "http" / "https" sans URL complète
    // ("/" est accepté comme homepage)
    if (href !== "/" && isHttpPrefixOnly(href)) {
      hasExternalPrefixOnly = true;
    }

    // Contrôle de cohérence pour les liens internes : doivent exister dans hrefSet
    if (!isExternal) {
      if (
        href &&
        href !== "/" &&
        href.startsWith("/") &&
        hrefSet &&
        !hrefSet.has(href)
      ) {
        out.add("internalHrefNotFound");
      }
    }
  }

  // Doublons sur les libellés et les href top-level
  if (hasDuplicates(labelKeys)) {
    out.add("dupLabelsTop");
  }
  if (hasDuplicates(hrefKeys)) {
    out.add("dupLinksTop");
  }

  if (hasExternalNoNewTab) {
    out.add("externalNoNewTab");
  }
  if (hasExternalPrefixOnly) {
    out.add("externalPrefixOnly");
  }

  return Array.from(out);
}

/**
 * Hook retournant les warnings UI du menu légal à partir des valeurs courantes.
 */
export function useLegalMenuUiWarnings(
  items: ReadonlyArray<LegalMenuItemFormValues>,
  hrefSet?: ReadonlySet<string>,
): LegalMenuWarningKey[] {
  return useMemo(
    () => computeLegalMenuWarnings({ items, hrefSet }),
    [items, hrefSet],
  );
}
