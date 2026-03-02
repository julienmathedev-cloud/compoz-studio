/**
 * @file packages/infra/src/http/studio/site.client.ts
 * @layer infra/http
 * @description
 * Client HTTP Admin pour la publication du site (draft → published) + status.
 *
 * @remarks
 * - Client HTTP pur (infra-only)
 * - Typage via DTO SoT infra (site.types.ts)
 * - Aucune dépendance vers app/api/... ni vers UI
 */

import { ENDPOINTS } from "@compoz/infra/http/endpoints";
import { apiFetch } from "@compoz/infra/lib/api-fetch";
import { logSpan } from "@compoz/infra/lib/log";

import type {
  GetSiteStatusDetailsResponse,
  GetSiteStatusResponse,
  PublishParams,
  PublishSiteResponse,
} from "@compoz/infra/http/studio/site.types";

import type { SiteStatusDetailsQueryDTO } from "@compoz/core/domain/site/dto";

function assertJsonResponse<T>(res: T | null, ctx: string): T {
  if (!res) {
    throw new Error(`${ctx}: expected JSON response, received null.`);
  }
  return res;
}

function buildQueryString(query?: SiteStatusDetailsQueryDTO): string {
  const scope = query?.scope ?? "dirty";
  const includeBlocks = query?.includeBlocks ? "1" : "0";
  const pageId = (query?.pageId ?? "").trim();

  const sp = new URLSearchParams();
  sp.set("scope", scope);
  sp.set("includeBlocks", includeBlocks);

  if (pageId) {
    sp.set("pageId", pageId);
  }

  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

/* -------------------------------------------------------------------------- */
/*                                   API                                      */
/* -------------------------------------------------------------------------- */

export const siteAdminApi = {
  async publish(params?: PublishParams): Promise<PublishSiteResponse> {
    const hasBody = !!(params && Object.keys(params).length > 0);

    return logSpan(
      "infra.http.admin.site.publish",
      {
        endpoint: ENDPOINTS.STUDIO.SITE.publish,
        method: "POST",
        hasBody,
      },
      async () => {
        const res = await apiFetch<PublishSiteResponse>(
          ENDPOINTS.STUDIO.SITE.publish,
          {
            method: "POST",
            ...(hasBody ? { body: JSON.stringify(params) } : null),
          },
        );

        return assertJsonResponse(res, "siteAdminApi.publish");
      },
    );
  },

  async status(): Promise<GetSiteStatusResponse> {
    return logSpan(
      "infra.http.admin.site.status.get",
      { endpoint: ENDPOINTS.STUDIO.SITE.status, method: "GET" },
      async () => {
        const res = await apiFetch<GetSiteStatusResponse>(
          ENDPOINTS.STUDIO.SITE.status,
          { method: "GET" },
        );

        return assertJsonResponse(res, "siteAdminApi.status");
      },
    );
  },

  async statusDetails(
    query?: SiteStatusDetailsQueryDTO,
  ): Promise<GetSiteStatusDetailsResponse> {
    const qs = buildQueryString(query);
    const endpoint = `${ENDPOINTS.STUDIO.SITE.statusDetails}${qs}`;

    return logSpan(
      "infra.http.admin.site.statusDetails.get",
      { endpoint, method: "GET" },
      async () => {
        const res = await apiFetch<GetSiteStatusDetailsResponse>(endpoint, {
          method: "GET",
        });

        return assertJsonResponse(res, "siteAdminApi.statusDetails");
      },
    );
  },
} as const;
