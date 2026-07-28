/**
 * @file packages/infra/src/http/studio/pages.types.ts
 * @layer infra/http/studio
 * @description DTO contracts for Studio page endpoints.
 * @remarks
 * These DTOs stay aligned with the HTTP routes without importing from `app/api`.
 */

import type {
  BlockDTO,
  PageDTO,
  PageWithRevisionsDTO,
} from "@compoz/core/domain/pages/dto";
import type {
  DraftSiteIndexWithRevisionDTO,
  SiteIndexDTO,
} from "@compoz/core/domain/site/dto";

export type GetPagesIndexResponse = DraftSiteIndexWithRevisionDTO;

export type CreatePageResponse = Readonly<{
  page: PageDTO;
  index: SiteIndexDTO;
}>;

export type GetPageByIdResponse = PageWithRevisionsDTO;

export type UpdatePageResponse = Readonly<{
  page: PageDTO;
  index: SiteIndexDTO;
}>;

export type DeletePageResponse = Readonly<{ index: SiteIndexDTO }>;

export type ListPageBlocksResponse = Readonly<{
  blocks: ReadonlyArray<BlockDTO>;
}>;

export type AddSectionBlockResponse = Readonly<{ page: PageDTO }>;

export type UpdateSectionBlockResponse = Readonly<{ page: PageDTO }>;

export type DeleteBlockResponse = Readonly<{ page: PageDTO }>;

export type ReorderBlocksResponse = Readonly<{ page: PageDTO }>;

export type ReorderChildrenResponse = Readonly<{ index: SiteIndexDTO }>;
