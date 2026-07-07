/**
 * @file packages/core/src/domain/site/validators/site-index.ts
 * @layer core/domain/site/validators
 * @description Blocking domain invariant for site index slug uniqueness.
 * @remarks
 * Page ordering and missing-page warnings are handled outside this validator.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { PageSummary } from "@compoz/core/domain/pages/entities/page";
import type { SiteIndex } from "@compoz/core/domain/site/entities/site-index";

type DupPositions = Readonly<{ value: string; positions: number[] }>;
function findDuplicateSlugs(arr: ReadonlyArray<PageSummary>): DupPositions[] {
  const map = new Map<string, number[]>();

  for (let i = 0; i < arr.length; i++) {
    const slug = String(arr[i]?.slug ?? "").trim();
    const bucket = map.get(slug);
    if (bucket) {
      bucket.push(i);
    } else {
      map.set(slug, [i]);
    }
  }

  const out: DupPositions[] = [];
  for (const [value, positions] of map) {
    if (positions.length > 1) {
      positions.sort((a, b) => a - b);
      out.push({ value, positions });
    }
  }
  return out;
}

export function assertSiteIndex(index: SiteIndex): void {
  const duplicateSlugs = findDuplicateSlugs(index.pages);

  if (duplicateSlugs.length === 0) return;

  throw new DomainError({
    code: EC.SITE_INDEX_DUPLICATE_SLUGS,
    message: EC.SITE_INDEX_DUPLICATE_SLUGS,
    details: {
      path: ["pages"],
      issues: { duplicateSlugs },
    },
  });
}
