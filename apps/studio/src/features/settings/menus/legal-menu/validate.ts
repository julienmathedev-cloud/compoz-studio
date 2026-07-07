"use client";

/**
 * @file apps/studio/src/features/settings/menus/legal-menu/validate.ts
 * @layer studio/features/settings/menus/legal-menu
 *
 * @description
 * Non-blocking studio warning helpers for the legal menu.
 *
 * @remarks
 * - Domain validation remains handled by Zod and server use cases.
 * - These warnings only support editor UX: consistency checks, duplicates, and draft-friendly href hints.
 */

import { useMemo } from "react";

import { isHttpPrefixOnly } from "@compoz/core/domain/urls/ui-heuristics";
import { hasDuplicates } from "@compoz/ui/hooks/validate/helpers";
import { resolveLinkFlags } from "@compoz/ui/lib/links/helpers";
import { hrefCompareKey, labelCompareKey } from "@compoz/ui/lib/urls/compare";
import type { LegalMenuItemFormValues } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu-form";

export type LegalMenuWarningKey =
  | "legalMenuEmpty"
  | "dupLabelsTop"
  | "dupLinksTop"
  | "externalNoNewTab"
  | "externalPrefixOnly"
  | "internalHrefNotFound";

type WarningProps = {
  items: ReadonlyArray<LegalMenuItemFormValues>;
  hrefSet?: ReadonlySet<string>;
};

export function computeLegalMenuWarnings(
  props: WarningProps,
): LegalMenuWarningKey[] {
  const { items, hrefSet } = props;
  const out = new Set<LegalMenuWarningKey>();

  // An empty legal footer is allowed but should stay visible to the editor.
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

    const href = (it.href ?? "").trim();
    const flags = resolveLinkFlags(href);
    const isExternal = flags.rawExternal;

    // External links are safer when they do not replace the edited site preview.
    if (isExternal && !it.newTab) {
      hasExternalNoNewTab = true;
    }

    // Keep prefix-only URLs editable, but surface them as likely unfinished external links.
    if (href !== "/" && isHttpPrefixOnly(href)) {
      hasExternalPrefixOnly = true;
    }

    // Internal links should match the current published/draft page href set when available.
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

export function useLegalMenuUiWarnings(
  items: ReadonlyArray<LegalMenuItemFormValues>,
  hrefSet?: ReadonlySet<string>,
): LegalMenuWarningKey[] {
  return useMemo(
    () => computeLegalMenuWarnings({ items, hrefSet }),
    [items, hrefSet],
  );
}
