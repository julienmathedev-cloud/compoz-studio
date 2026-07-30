/**
 * @file packages/core/src/domain/pages/use-cases/blocks/reorder-blocks.types.ts
 * @layer core/domain/pages/use-cases/blocks
 * @description OCC intent contracts for reordering draft blocks.
 */

import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";
import type { PageBlocksMutationResult } from "@compoz/core/domain/pages/revisions/page-blocks.types";

export interface ReorderBlocksDeps {
  pages: PagesRepository;
  nowIso?: () => string;
}

export type ReorderBlocksInput = Readonly<{
  pageId: string;
  expectedBlocksRevision: number;
  baselineOrder: ReadonlyArray<string>;
  localOrder: ReadonlyArray<string>;
}>;

export type ReorderBlocksResult = PageBlocksMutationResult;
