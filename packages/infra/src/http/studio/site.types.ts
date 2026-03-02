/**
 * @file packages/infra/src/http/studio/site.types.ts
 * @layer infra/http
 * @description
 * DTO SoT du module "site" (admin) : publish + status + statusDetails.
 *
 * @remarks
 * - Source of truth alignée sur les routes Next :
 *   - /api/site/publish
 *   - /api/site/status
 *   - /api/site/status/details
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

/** Payload optionnel accepté par POST /api/site/publish. */
export type PublishParams = Readonly<{
  from?: ContentState;
  to?: ContentState;
  cleanOrphans?: boolean;
}>;

/** Réponse SoT publish (remplace `PublishSiteResponse`). */
export type PublishSiteResponse = Readonly<{
  publishResult: PublishSiteResultDTO;
}>;

/* -------------------------------------------------------------------------- */
/* Status                                                                     */
/* -------------------------------------------------------------------------- */

/** Réponse SoT status (remplace `GetSiteStatusResponse`). */
export type GetSiteStatusResponse = Readonly<{ status: SiteStatusDTO }>;

/* -------------------------------------------------------------------------- */
/* Status details                                                             */
/* -------------------------------------------------------------------------- */

/** Réponse SoT status/details (remplace `GetSiteStatusDetailsResponse`). */
export type GetSiteStatusDetailsResponse = Readonly<{
  details: SiteStatusDetailsDTO;
}>;
