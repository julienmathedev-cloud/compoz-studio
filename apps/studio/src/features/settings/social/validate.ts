"use client";

/**
 * @file apps/studio/src/features/settings/social/validate.ts
 * @layer studio/features/settings/social
 *
 * @description
 * Non-blocking studio warning helpers for social link settings.
 *
 * @remarks
 * - Domain validation remains handled by Zod and server use cases.
 * - These warnings only support editor UX: empty social lists and duplicate canonical hrefs.
 */

import { useMemo } from "react";

import type { SocialFormValues } from "@compoz/validation/site/settings/social/social-form";

export type SocialWarningKey = "socialEmpty" | "dupLinks";

/** Normalizes canonical hrefs for duplicate detection. */
function normHref(href: string): string {
  return href.trim().toLowerCase();
}

export function computeSocialWarnings({
  items,
}: Pick<SocialFormValues, "items">): SocialWarningKey[] {
  const warnings = new Set<SocialWarningKey>();

  const safeItems = Array.isArray(items) ? items : [];

  // An empty social list is allowed but should stay visible to the editor.
  if (safeItems.length === 0) {
    warnings.add("socialEmpty");
    return Array.from(warnings);
  }

  // Duplicate canonical hrefs point to the same social destination.
  const seenHrefs = new Set<string>();

  for (const item of safeItems) {
    const href = normHref(item.href ?? "");

    if (!href) continue;

    if (seenHrefs.has(href)) {
      warnings.add("dupLinks");
      break; // One warning is enough.
    }

    seenHrefs.add(href);
  }

  return Array.from(warnings);
}

export function useSocialUiWarnings(
  items: SocialFormValues["items"],
): SocialWarningKey[] {
  return useMemo(() => computeSocialWarnings({ items }), [items]);
}
