/**
 * @file packages/core/src/domain/pages/use-cases/blocks/reorder-blocks.ts
 * @layer core/domain/pages/use-cases/blocks
 * @description Relation-based deterministic draft-block reorder through OCC.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import { resolveThreeWayOrder } from "@compoz/core/domain/pages/revisions/page-blocks-order";
import { executePageBlocksMutation } from "@compoz/core/domain/pages/use-cases/blocks/execute-page-blocks-mutation";
import type {
  ReorderBlocksDeps,
  ReorderBlocksInput,
  ReorderBlocksResult,
} from "@compoz/core/domain/pages/use-cases/blocks/reorder-blocks.types";

export function reorderBlocks({
  pages,
  nowIso = () => new Date().toISOString(),
}: ReorderBlocksDeps) {
  return async function run(
    input: ReorderBlocksInput,
  ): Promise<ReorderBlocksResult> {
    const pageId = String(input.pageId ?? "").trim();
    if (!pageId) {
      throw new DomainError({ code: ERROR_CODES.INVALID_ARGUMENT });
    }

    return executePageBlocksMutation({
      pages,
      pageId,
      expectedBlocksRevision: input.expectedBlocksRevision,
      operation: "reorder",
      nowIso,
      resolve: (current) => {
        const resolution = resolveThreeWayOrder({
          baselineOrder: input.baselineOrder,
          localOrder: input.localOrder,
          currentOrder: current.map((block) => block.id),
          path: "blocks",
        });
        if (resolution.status === "conflict") {
          return {
            status: "conflict",
            conflicts: [resolution.conflict],
          };
        }
        const byId = new Map(current.map((block) => [block.id, block]));
        return {
          status: "resolved",
          blocks: resolution.order.map((id) => byId.get(id)!),
        };
      },
    });
  };
}
