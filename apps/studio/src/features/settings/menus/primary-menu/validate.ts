"use client";

/**
 * @file apps/studio/src/features/settings/menus/primary-menu/validate.ts
 * @layer hooks/studio/site/primary-menu
 *
 * @description
 * Helpers et hooks de validation UI non bloquante pour le menu principal.
 *
 * @remarks
 * - Validation métier assurée par le domaine (Zod + use-cases serveur).
 * - Ici : UX uniquement (warnings légers, cohérence, doublons, liens externes).
 * - Le mode externe est dérivé depuis `href` (URL absolue).
 */

import { useMemo } from "react";

import { isHttpPrefixOnly } from "@compoz/core/domain/urls/ui-heuristics";
import { hasDuplicates } from "@compoz/ui/hooks/validate/helpers";
import { resolveLinkFlags } from "@compoz/ui/lib/links/helpers";
import { hrefCompareKey, labelCompareKey } from "@compoz/ui/lib/urls/compare";

import type {
  PrimaryMenuChildShape,
  PrimaryMenuItemShape,
} from "@compoz/validation/site/settings/menus/primary-menu/primary-menu";

/* ───────────────────────── 2) Warnings UI (non-bloquants) ───────────────────────── */

/**
 * Clés stables des warnings UI du menu principal.
 */
export type PrimaryMenuWarningKey =
  | "primaryMenuEmpty"
  | "dupLabelsTop"
  | "dupLinksTop"
  | "dupLabelsChildren"
  | "dupLinksChildren"
  | "externalNoNewTab"
  | "externalPrefixOnly"
  | "internalHrefNotFound";

/**
 * Paramètres nécessaires au calcul des warnings UI du menu principal.
 */
type WarningProps = {
  items: ReadonlyArray<PrimaryMenuItemShape>;
  hrefSet?: ReadonlySet<string>;
};

function isMissingInternalHref(href: string, hrefSet?: ReadonlySet<string>) {
  if (!hrefSet) return false;
  if (!href || href === "/") return false;
  if (!href.startsWith("/")) return false;
  return !hrefSet.has(href);
}

/**
 * Calcule les warnings UI associés à un brouillon de menu principal.
 */
export function computePrimaryMenuWarnings(
  props: WarningProps,
): PrimaryMenuWarningKey[] {
  const { items, hrefSet } = props;
  const out = new Set<PrimaryMenuWarningKey>();

  // Aucun item → menu vide
  if (!items || items.length === 0) {
    out.add("primaryMenuEmpty");
    return Array.from(out);
  }

  const topLabelKeys: string[] = [];
  const topHrefKeys: string[] = [];

  // Flags globaux (un seul warning si au moins un cas)
  let hasExternalNoNewTab = false;
  let hasExternalPrefixOnly = false;

  // Flags globaux enfants
  let hasDupLabelsChildren = false;
  let hasDupLinksChildren = false;

  for (const it of items) {
    topLabelKeys.push(labelCompareKey(it.label));

    const href = String(it.href ?? "").trim();
    if (href) topHrefKeys.push(hrefCompareKey(href));

    const flags = resolveLinkFlags(href);
    const isExternal = flags.rawExternal;

    const children: ReadonlyArray<PrimaryMenuChildShape> = it.children ?? [];
    const hasChildren = children.length > 0;

    // Externe sans newTab
    if (isExternal && !it.newTab) hasExternalNoNewTab = true;

    // Préfixe http mal saisi ("http", "https", "http://")
    if (href !== "/" && isHttpPrefixOnly(href)) {
      hasExternalPrefixOnly = true;
    }

    // Vérif href interne vs hrefSet
    if (!hasChildren && !isExternal && isMissingInternalHref(href, hrefSet)) {
      out.add("internalHrefNotFound");
    }

    // Enfants (doublons + validations individuelles)
    if (hasChildren) {
      const childLabelKeys: string[] = [];
      const childHrefKeys: string[] = [];

      for (const c of children) {
        const cHref = String(c.href ?? "").trim();
        const cFlags = resolveLinkFlags(cHref);
        const cIsExternal = cFlags.rawExternal;

        childLabelKeys.push(labelCompareKey(c.label));
        childHrefKeys.push(hrefCompareKey(cHref));

        if (cIsExternal && !c.newTab) hasExternalNoNewTab = true;

        if (cHref !== "/" && isHttpPrefixOnly(cHref)) {
          hasExternalPrefixOnly = true;
        }

        if (!cIsExternal && isMissingInternalHref(cHref, hrefSet)) {
          out.add("internalHrefNotFound");
        }
      }

      if (hasDuplicates(childLabelKeys)) hasDupLabelsChildren = true;
      if (hasDuplicates(childHrefKeys)) hasDupLinksChildren = true;
    }
  }

  // Doublons top-level
  if (hasDuplicates(topLabelKeys)) out.add("dupLabelsTop");
  if (hasDuplicates(topHrefKeys)) out.add("dupLinksTop");

  // Doublons enfants (au moins un parent concerné)
  if (hasDupLabelsChildren) out.add("dupLabelsChildren");
  if (hasDupLinksChildren) out.add("dupLinksChildren");

  // Flags globaux externes
  if (hasExternalNoNewTab) out.add("externalNoNewTab");
  if (hasExternalPrefixOnly) out.add("externalPrefixOnly");

  return Array.from(out);
}

/**
 * Hook retournant les warnings UI du menu principal à partir des valeurs courantes.
 */
export function usePrimaryMenuUiWarnings(
  items: ReadonlyArray<PrimaryMenuItemShape>,
  hrefSet?: ReadonlySet<string>,
): PrimaryMenuWarningKey[] {
  return useMemo(
    () => computePrimaryMenuWarnings({ items, hrefSet }),
    [items, hrefSet],
  );
}
