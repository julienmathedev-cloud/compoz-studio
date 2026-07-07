"use client";

/**
 * @file apps/studio/src/features/site-index/getSiteIndex.ts
 * @layer studio/features/site-index
 *
 * @description
 * Cache-first helper for reading the Studio SiteIndex.
 *
 * @remarks
 * - Returns the cached SiteIndex when present, otherwise falls back to `fetchQuery`.
 * - Shared by page, menu, and settings hooks to avoid duplicated SiteIndex reads.
 * - Query keys are scoped by Prisma Website.id to avoid cache collisions when switching the active website.
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
 * Reads the SiteIndex from React Query cache or fetches it through the shared query key.
 *
 * @remarks
 * - `fetchQuery` deduplicates concurrent reads for the same key.
 * - `opts.signal`, when provided, takes precedence over the React Query signal.
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
