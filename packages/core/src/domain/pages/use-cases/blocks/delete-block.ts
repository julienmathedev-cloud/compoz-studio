/**
 * @file packages/core/src/domain/pages/use-cases/blocks/delete-block.ts
 * @layer core/domain/pages/use-cases/blocks
 * @description Semantic draft-block delete through the shared OCC executor.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import { pageBlockValueEquals } from "@compoz/core/domain/pages/revisions/page-blocks-equality";
import { executePageBlocksMutation } from "@compoz/core/domain/pages/use-cases/blocks/execute-page-blocks-mutation";
import type {
  DeleteBlockDeps,
  DeleteBlockInput,
  DeleteBlockResult,
} from "@compoz/core/domain/pages/use-cases/blocks/delete-block.types";

export function deleteBlock({
  pages,
  nowIso = () => new Date().toISOString(),
}: DeleteBlockDeps) {
  return async function run(input: DeleteBlockInput): Promise<DeleteBlockResult> {
    const pageId = String(input.pageId ?? "").trim();
    const blockId = String(input.blockId ?? "").trim();
    if (!pageId || !blockId) {
      throw new DomainError({ code: ERROR_CODES.INVALID_ARGUMENT });
    }

    return executePageBlocksMutation({
      pages,
      pageId,
      expectedBlocksRevision: input.expectedBlocksRevision,
      operation: "delete",
      nowIso,
      resolve: (current) => {
        const block = current.find((item) => item.id === blockId);
        if (!block) {
          return {
            status: "resolved",
            blocks: current,
            affectedBlockId: blockId,
          };
        }
        if (!pageBlockValueEquals(block, input.baselineBlock)) {
          return {
            status: "conflict",
            conflicts: [{
              kind: "blockChangedBeforeDelete",
              path: `blocks[${blockId}]`,
              blockId,
              baseline: input.baselineBlock,
              current: block,
            }],
          };
        }
        return {
          status: "resolved",
          blocks: current.filter((item) => item.id !== blockId),
          affectedBlockId: blockId,
        };
      },
    });
  };
}
