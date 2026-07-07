"use client";

/**
 * @file apps/studio/src/features/settings/menus/primary-menu/validate.ts
 * @layer studio/features/settings/menus/primary-menu
 *
 * @description
 * Non-blocking studio warning helpers for the primary menu.
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

import type {
  PrimaryMenuChildShape,
  PrimaryMenuItemShape,
} from "@compoz/validation/site/settings/menus/primary-menu/primary-menu";

export type PrimaryMenuWarningKey =
  | "primaryMenuEmpty"
  | "dupLabelsTop"
  | "dupLinksTop"
  | "dupLabelsChildren"
  | "dupLinksChildren"
  | "externalNoNewTab"
  | "externalPrefixOnly"
  | "internalHrefNotFound";

type WarningProps = {
  items: ReadonlyArray<PrimaryMenuItemShape>;
  hrefSet?: ReadonlySet<string>;
};

/** Checks editable internal hrefs against the current draft/published page href set. */
function isMissingInternalHref(href: string, hrefSet?: ReadonlySet<string>) {
  if (!hrefSet) return false;
  if (!href || href === "/") return false;
  if (!href.startsWith("/")) return false;

  const pathname = new URL(href, "http://dummy").pathname;
  return !hrefSet.has(pathname);
}

export function computePrimaryMenuWarnings(
  props: WarningProps,
): PrimaryMenuWarningKey[] {
  const { items, hrefSet } = props;
  const out = new Set<PrimaryMenuWarningKey>();

  // An empty primary menu is allowed but should stay visible to the editor.
  if (!items || items.length === 0) {
    out.add("primaryMenuEmpty");
    return Array.from(out);
  }

  const topLabelKeys: string[] = [];
  const topHrefKeys: string[] = [];

  let hasExternalNoNewTab = false;
  let hasExternalPrefixOnly = false;

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

    // External links are safer when they do not replace the edited site preview.
    if (isExternal && !it.newTab) hasExternalNoNewTab = true;

    // Keep prefix-only URLs editable, but surface them as likely unfinished external links.
    if (href !== "/" && isHttpPrefixOnly(href)) {
      hasExternalPrefixOnly = true;
    }

    // Leaf parent links should match the current internal page href set when available.
    if (!hasChildren && !isExternal && isMissingInternalHref(href, hrefSet)) {
      out.add("internalHrefNotFound");
    }

    if (hasChildren) {
      const childLabelKeys: string[] = [];
      const childHrefKeys: string[] = [];

      for (const c of children) {
        const cHref = String(c.href ?? "").trim();
        const cFlags = resolveLinkFlags(cHref);
        const cIsExternal = cFlags.rawExternal;

        childLabelKeys.push(labelCompareKey(c.label));
        childHrefKeys.push(hrefCompareKey(cHref));

        // External child links follow the same preview-safety hint as parent links.
        if (cIsExternal && !c.newTab) hasExternalNoNewTab = true;

        // Keep prefix-only child URLs editable while flagging likely unfinished values.
        if (cHref !== "/" && isHttpPrefixOnly(cHref)) {
          hasExternalPrefixOnly = true;
        }

        // Child internal links should also match the editable page href set.
        if (!cIsExternal && isMissingInternalHref(cHref, hrefSet)) {
          out.add("internalHrefNotFound");
        }
      }

      if (hasDuplicates(childLabelKeys)) hasDupLabelsChildren = true;
      if (hasDuplicates(childHrefKeys)) hasDupLinksChildren = true;
    }
  }

  if (hasDuplicates(topLabelKeys)) out.add("dupLabelsTop");
  if (hasDuplicates(topHrefKeys)) out.add("dupLinksTop");

  if (hasDupLabelsChildren) out.add("dupLabelsChildren");
  if (hasDupLinksChildren) out.add("dupLinksChildren");

  if (hasExternalNoNewTab) out.add("externalNoNewTab");
  if (hasExternalPrefixOnly) out.add("externalPrefixOnly");

  return Array.from(out);
}

export function usePrimaryMenuUiWarnings(
  items: ReadonlyArray<PrimaryMenuItemShape>,
  hrefSet?: ReadonlySet<string>,
): PrimaryMenuWarningKey[] {
  return useMemo(
    () => computePrimaryMenuWarnings({ items, hrefSet }),
    [items, hrefSet],
  );
}
