/**
 * @file packages/core/src/domain/pages/use-cases/reorder-page-children.ts
 * @layer core/domain/pages/use-cases
 * @description Use case that reorders a parent's children in the draft index.
 * @remarks
 * Index-only operation: read the index source of truth, reorder, validate, then persist it.
 */

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { SiteIndexDTO } from "@compoz/core/domain/site/dto";
import { reorderChildrenByParentId } from "@compoz/core/domain/site/index/utils";
import { assertSiteIndex } from "@compoz/core/domain/site/validators/site-index";

import type {
  ReorderPageChildrenDeps,
  ReorderPageChildrenInput,
  ReorderPageChildrenResult,
} from "@compoz/core/domain/pages/use-cases/reorder-page-children.types";

export function reorderPageChildren({
  site,
  nowIso = () => new Date().toISOString(),
}: ReorderPageChildrenDeps) {
  return async function run(
    input: ReorderPageChildrenInput,
  ): Promise<ReorderPageChildrenResult> {
    const parentId = String(input?.parentId ?? "").trim();
    if (!parentId) {
      throw new DomainError({
        code: EC.INVALID_ARGUMENT,
        message: EC.INVALID_ARGUMENT,
        details: { path: ["parentId"] },
      });
    }

    const childIds = Array.isArray(input?.childIds)
      ? input.childIds.map((id) => String(id ?? "").trim()).filter(Boolean)
      : [];

    await site.ensureBase();

    const current = await site.readIndex(DEFAULT_CONTENT_STATE);

    if (!current) {
      throw new DomainError({
        code: EC.SITE_INDEX_NOT_FOUND,
        message: EC.SITE_INDEX_NOT_FOUND,
      });
    }

    const next = reorderChildrenByParentId(current, parentId, childIds);

    // Validate index invariants such as unique slugs and tree structure.
    assertSiteIndex(next);

    const index: SiteIndexDTO = {
      pages: next.pages.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        parentId: p.parentId,
      })),
      updatedAt: nowIso(),
    };

    await site.putIndex(DEFAULT_CONTENT_STATE, index);

    return { index };
  };
}
