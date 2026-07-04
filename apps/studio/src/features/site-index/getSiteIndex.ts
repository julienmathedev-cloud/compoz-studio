"use client";

/**
 * @file apps/studio/src/features/site-index/getSiteIndex.ts
 * @layer hooks/studio/site-index
 *
 * @description
 * Helper cache-first pour obtenir le SiteIndex.
 *
 * @remarks
 * - Centralise la logique cache -> fetchQuery fallback.
 * - Utilisable depuis d’autres hooks pages/menus/etc. sans multiplier les reads.
 * - Aligné sur le pattern `getSettingsBundle`.
 * - Website-scoped : la queryKey inclut Prisma Website.id pour éviter les
 *   collisions de cache lors d’un switch de Website actif.
 * - UI-only : aucune logique métier.
 */

import type { QueryClient } from "@tanstack/react-query";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { SiteIndexDTO } from "@compoz/core/domain/site/dto";
import type { HttpOpts } from "@compoz/infra/http/internal";
import { pagesStudioApi } from "@compoz/infra/http/studio/pages.client";
import { siteIndexKey } from "@compoz/studio/features/site-index/keys";

function requireWebsiteId(value: unknown, field = "websiteId"): string {
  const websiteId = String(value ?? "").trim();

  if (!websiteId) {
    throw new Error(`${field} is required`);
  }

  return websiteId;
}

/**
 * Lit le SiteIndex en cache-first.
 *
 * @remarks
 * - Retourne le cache si présent.
 * - Sinon déclenche un `fetchQuery`, dedupe par queryKey.
 * - `opts.signal`, si fourni, prend le dessus sur le `signal` React Query.
 */
export async function getSiteIndex(
  queryClient: QueryClient,
  websiteId: string,
  state: ContentState = DEFAULT_CONTENT_STATE,
  opts?: HttpOpts,
): Promise<SiteIndexDTO> {
  const websiteIdKey = requireWebsiteId(websiteId, "getSiteIndex.websiteId");
  const key = siteIndexKey(websiteIdKey, state);

  const cached = queryClient.getQueryData<SiteIndexDTO>(key);

  if (cached) return cached;

  return queryClient.fetchQuery<SiteIndexDTO>({
    queryKey: key,
    queryFn: async ({ signal }) => {
      const response = await pagesStudioApi.getIndex(state, {
        signal: opts?.signal ?? signal,
      });

      const index = response?.index;

      if (!index) {
        throw new Error("getSiteIndex: missing response.index");
      }

      return index;
    },
  });
}
