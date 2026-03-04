"use client";

/**
 * @file apps/studio/src/features/site-index/getSiteIndex.ts
 * @layer hooks/admin/site/site-index
 *
 * @description
 * Helper "cache-first" pour obtenir le SiteIndex (READ global).
 *
 * @remarks
 * - Centralise la logique cache -> fetchQuery fallback.
 * - Utilisable depuis d’autres hooks (pages/menus/etc.) sans multiplier les reads.
 * - Aligné sur le pattern `getSettingsBundle`.
 * - Tenant-scoped : la queryKey inclut tenantId (sinon cache cross-tenant).
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { SiteIndexDTO } from "@compoz/core/domain/site/dto";
import type { HttpOpts } from "@compoz/infra/http/internal";
import { pagesAdminApi } from "@compoz/infra/http/studio/pages.client";
import { siteIndexKey } from "@compoz/studio/features/site-index/keys";
import type { QueryClient } from "@tanstack/react-query";

function normalizeTenantId(tenantId: unknown): string {
  return String(tenantId ?? "")
    .trim()
    .toLowerCase();
}

export async function getSiteIndex(
  qc: QueryClient,
  tenantId: string,
  state: ContentState = WRITE_CONTENT_STATE,
  opts?: HttpOpts,
): Promise<SiteIndexDTO> {
  const tid = normalizeTenantId(tenantId);
  if (!tid) {
    throw new Error("getSiteIndex: missing tenantId");
  }

  const key = siteIndexKey(tid, state);

  // 1) Cache-first
  const cached = qc.getQueryData<SiteIndexDTO>(key);
  if (cached) return cached;

  // 2) Fallback fetchQuery (dedupe + AbortSignal)
  const index = await qc.fetchQuery<SiteIndexDTO>({
    queryKey: key,
    queryFn: async ({ signal }) => {
      const res = await pagesAdminApi.getIndex(state, {
        signal: opts?.signal ?? signal,
      });

      if (!res?.index) {
        throw new Error("site-index: missing res.index");
      }

      return res.index; // ✅ flatten
    },
  });

  return index;
}
