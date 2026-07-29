/**
 * @file packages/core/src/domain/pages/ports/draft-page-structure-initializer.ts
 * @layer core/domain/pages
 * @description Technical initializer for draft pages of a newly-created Website.
 */

import type { CreateDraftPageInput } from "@compoz/core/domain/pages/ports/pages-repository";

export interface DraftPageStructureInitializer {
  createDraftPages(
    inputs: ReadonlyArray<CreateDraftPageInput>,
  ): Promise<void>;
}
