/**
 * @file packages/core/src/domain/pages/use-cases/delete-page.types.ts
 * @layer core/domain/pages/use-cases
 * @description Contracts for deleting a page.
 */

import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";

export interface DeletePageInput {
  pageId: string;
}

export interface DeletePageResult {
  ok: true;
  pageId: string;
}

export interface DeletePageDeps {
  pages: PagesRepository;
}
