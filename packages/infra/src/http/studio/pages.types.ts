/**
 * @file packages/infra/src/http/studio/pages.types.ts
 * @layer infra/http/studio
 * @description
 * DTO SoT des réponses pages (Studio).
 *
 * @remarks
 * - Aligné sur les routes Next (préfixées via ENDPOINTS) :
 *   - /api/.../pages
 *   - /api/.../pages/[pageId]
 *   - /api/.../pages/[pageId]/blocks
 * - Aucun import depuis `app/api/...`
 */

import type { BlockDTO, PageDTO } from "@compoz/core/domain/pages/dto";
import type { SiteIndexDTO } from "@compoz/core/domain/site/dto";

/* -------------------------------------------------------------------------- */
/* Pages index                                                                */
/* -------------------------------------------------------------------------- */

export type GetPagesIndexResponse = Readonly<{ index: SiteIndexDTO }>;

export type CreatePageResponse = Readonly<{
  page: PageDTO;
  index: SiteIndexDTO;
}>;

export type GetPageByIdResponse = Readonly<{ page: PageDTO }>;

export type UpdatePageResponse = Readonly<{
  page: PageDTO;
  index: SiteIndexDTO;
}>;

export type DeletePageResponse = Readonly<{ index: SiteIndexDTO }>;

/* -------------------------------------------------------------------------- */
/* Blocks                                                                     */
/* -------------------------------------------------------------------------- */

export type ListPageBlocksResponse = Readonly<{
  blocks: ReadonlyArray<BlockDTO>;
}>;

export type AddSectionBlockResponse = Readonly<{ page: PageDTO }>;

export type UpdateSectionBlockResponse = Readonly<{ page: PageDTO }>;

export type DeleteBlockResponse = Readonly<{ page: PageDTO }>;

export type ReorderBlocksResponse = Readonly<{ page: PageDTO }>;

export type ReorderChildrenResponse = Readonly<{ index: SiteIndexDTO }>;
