/**
 * @file packages/infra/src/http/studio/pages.types.ts
 * @layer infra/http/studio
 * @description DTO contracts for Studio page endpoints.
 * @remarks
 * These DTOs stay aligned with the HTTP routes without importing from `app/api`.
 */

import type {
  PageDTO,
  PageBlocksSnapshotDTO,
  PageWithRevisionsDTO,
} from "@compoz/core/domain/pages/dto";
import type {
  DraftSiteIndexWithRevisionDTO,
} from "@compoz/core/domain/site/dto";

export type GetPagesIndexResponse = DraftSiteIndexWithRevisionDTO;

export type CreatePageResponse = Readonly<{
  page: PageDTO;
}> &
  DraftSiteIndexWithRevisionDTO;

export type GetPageByIdResponse = PageWithRevisionsDTO;

export type UpdatePageResponse = Readonly<{
  page: PageDTO;
  revisions: PageWithRevisionsDTO["revisions"];
  structure?: DraftSiteIndexWithRevisionDTO;
}>;

export type DeletePageResponse = DraftSiteIndexWithRevisionDTO;

export type ListPageBlocksResponse = PageBlocksSnapshotDTO;

export type PageBlocksMutationResponse = PageBlocksSnapshotDTO &
  Readonly<{
    outcome: "updated" | "noChanges";
    affectedBlockId?: string;
  }>;

export type AddSectionBlockResponse = PageBlocksMutationResponse &
  Readonly<{ createdBlockId: string }>;

export type UpdateSectionBlockResponse = PageBlocksMutationResponse;

export type DeleteBlockResponse = PageBlocksMutationResponse;

export type ReorderBlocksResponse = PageBlocksMutationResponse;

export type ReorderChildrenResponse = DraftSiteIndexWithRevisionDTO;
