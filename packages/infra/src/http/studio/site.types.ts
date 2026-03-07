/**
 * @file packages/infra/src/http/studio/site.types.ts
 * @layer infra/http/studio
 * @description
 * DTO SoT du module "site" (Studio) : publish + status + statusDetails.
 *
 * @remarks
 * - Source of truth alignée sur les routes Next côté Studio (préfixées via ENDPOINTS) :
 *   - /api/.../site/publish
 *   - /api/.../site/status
 *   - /api/.../site/status/details
 * - Évite d'importer des types depuis `app/api/.../route.ts`
 *   (dépendance framework) dans un package partagé.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import type {
  PublishSiteResultDTO,
  SiteStatusDTO,
  SiteStatusDetailsDTO,
} from "@compoz/core/domain/site/dto";

/* -------------------------------------------------------------------------- */
/* Publish                                                                    */
/* -------------------------------------------------------------------------- */

/** Payload optionnel accepté par POST publish. */
export type PublishParams = Readonly<{
  from?: ContentState;
  to?: ContentState;
  cleanOrphans?: boolean;
}>;

export type PublishSiteResponse = Readonly<{
  publishResult: PublishSiteResultDTO;
}>;

/* -------------------------------------------------------------------------- */
/* Status                                                                     */
/* -------------------------------------------------------------------------- */

export type GetSiteStatusResponse = Readonly<{ status: SiteStatusDTO }>;

/* -------------------------------------------------------------------------- */
/* Status details                                                             */
/* -------------------------------------------------------------------------- */

export type GetSiteStatusDetailsResponse = Readonly<{
  details: SiteStatusDetailsDTO;
}>;
