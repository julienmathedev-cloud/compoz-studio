/**
 * @file packages/infra/src/http/studio/pages.types.ts
 * @layer infra/http
 * @description
 * DTO SoT des réponses pages (admin).
 *
 * @remarks
 * - Aligné sur les routes Next :
 *   - /api/pages
 *   - /api/pages/[pageId]
 *   - /api/pages/[pageId]/blocks
 * - Aucun import depuis `app/api/...`
 */
import type { BlockDTO, PageDTO } from "@compoz/core/domain/pages/dto";
import type { SiteIndexDTO } from "@compoz/core/domain/site/dto";

/* -------------------------------------------------------------------------- */
/* Pages index                                                                */
/* -------------------------------------------------------------------------- */

export type GetPagesIndexResponse = { index: SiteIndexDTO };

export type CreatePageResponse = { page: PageDTO; index: SiteIndexDTO };

export type GetPageByIdResponse = { page: PageDTO };

export type UpdatePageResponse = {
  page: PageDTO;
  index: SiteIndexDTO;
};

export type DeletePageResponse = { index: SiteIndexDTO };

/* -------------------------------------------------------------------------- */
/* Blocks                                                                     */
/* -------------------------------------------------------------------------- */

export type ListPageBlocksResponse = Readonly<{
  blocks: ReadonlyArray<BlockDTO>;
}>;

export type AddLayoutSectionBlockResponse = Readonly<{ page: PageDTO }>;

export type UpdateLayoutSectionBlockResponse = Readonly<{ page: PageDTO }>;

export type DeleteBlockResponse = Readonly<{ page: PageDTO }>;

export type ReorderBlocksResponse = Readonly<{ page: PageDTO }>;

export type ReorderChildrenResponse = Readonly<{ index: SiteIndexDTO }>;
