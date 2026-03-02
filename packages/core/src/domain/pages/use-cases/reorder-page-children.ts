/**
 * @file packages/core/src/domain/pages/use-cases/reorder-page-children.ts
 * @layer core/domain
 *
 * @description
 * Use-case : reorder des enfants d’un parent (index-only, draft).
 *
 * @remarks
 * - Lit l’index (SoT), applique le reorder, valide, écrit l’index.
 */

import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
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
  // statusCache, // ❌ domain pur : invalidation en route
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

    const current = await site.readIndex(WRITE_CONTENT_STATE);

    if (!current) {
      throw new DomainError({
        code: EC.SITE_INDEX_NOT_FOUND,
        message: EC.SITE_INDEX_NOT_FOUND,
      });
    }

    const next = reorderChildrenByParentId(current, parentId, childIds);

    // Invariants: slug unique, etc.
    assertSiteIndex(next);

    const index: SiteIndexDTO = {
      pages: next.pages.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        parentId: p.parentId,
      })),
      updatedAt: nowIso(),
    };

    await site.writeIndex(WRITE_CONTENT_STATE, index);

    // ✅ domain pur : plus d’invalidation KV ici
    return { index };
  };
}
