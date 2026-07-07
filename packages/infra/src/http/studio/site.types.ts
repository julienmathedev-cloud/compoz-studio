/**
 * @file packages/infra/src/http/studio/site.types.ts
 * @layer infra/http/studio
 * @description DTO contracts for Studio publication and site status endpoints.
 * @remarks
 * These DTOs stay aligned with Studio HTTP routes without importing from `app/api`.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import type {
  PublishSiteResultDTO,
  SiteStatusDTO,
  SiteStatusDetailsDTO,
} from "@compoz/core/domain/site/dto";

export type PublishParams = Readonly<{
  from?: ContentState;
  to?: ContentState;
  cleanOrphans?: boolean;
}>;

export type PublishSiteResponse = Readonly<{
  publishResult: PublishSiteResultDTO;
}>;

export type GetSiteStatusResponse = Readonly<{ status: SiteStatusDTO }>;

export type GetSiteStatusDetailsResponse = Readonly<{
  details: SiteStatusDetailsDTO;
}>;
