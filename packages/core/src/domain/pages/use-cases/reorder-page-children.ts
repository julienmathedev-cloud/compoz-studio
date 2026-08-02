/**
 * @file packages/core/src/domain/pages/use-cases/reorder-page-children.ts
 * @layer core/domain/pages/use-cases
 * @description Use case that reorders a parent's draft children transactionally.
 * @remarks
 * Validation and persistence share the Website-level structure OCC boundary.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import { assertDraftStructureRevision } from "@compoz/core/domain/pages/use-cases/helpers/assert-draft-structure-revision";

import type {
  ReorderPageChildrenDeps,
  ReorderPageChildrenInput,
  ReorderPageChildrenResult,
} from "@compoz/core/domain/pages/use-cases/reorder-page-children.types";

export function reorderPageChildren({
  structure,
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

    const normalizeOrder = (order: unknown): string[] =>
      Array.isArray(order)
        ? order.map((id) => String(id ?? "").trim())
        : [];
    const baselineOrder = normalizeOrder(input?.baselineOrder);
    const localOrder = normalizeOrder(input?.localOrder);
    const baselineIds = new Set(baselineOrder);
    if (
      !Array.isArray(input?.baselineOrder) ||
      !Array.isArray(input?.localOrder) ||
      baselineOrder.some((id) => !id) ||
      localOrder.some((id) => !id) ||
      baselineIds.size !== baselineOrder.length ||
      new Set(localOrder).size !== localOrder.length ||
      baselineOrder.length !== localOrder.length ||
      localOrder.some((id) => !baselineIds.has(id))
    ) {
      throw new DomainError({
        code: EC.INVALID_ARGUMENT,
        message: EC.INVALID_ARGUMENT,
        details: { path: ["baselineOrder", "localOrder"] },
      });
    }

    return structure.reorder({
      parentPageId: parentId,
      baselineOrder,
      localOrder,
      expectedDraftStructureRevision: assertDraftStructureRevision(
        input.expectedDraftStructureRevision,
      ),
    });
  };
}
