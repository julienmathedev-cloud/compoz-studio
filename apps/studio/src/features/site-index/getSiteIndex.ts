"use client";

/**
 * @file apps/studio/src/features/site-index/getSiteIndex.ts
 * @layer hooks/studio/site-index
 *
 * @description
 * Helper "cache-first" pour obtenir le SiteIndex (READ global).
 *
 * @remarks
 * - Centralise la logique cache -> fetchQuery fallback.
 * - Utilisable depuis d’autres hooks (pages/menus/etc.) sans multiplier les reads.
 * - Aligné sur le pattern `getSettingsBundle`.
 * - Tenant-scoped : la queryKey inclut tenantId (sinon cache cross-tenant).
 * - UI-only : aucune logique métier.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { SiteIndexDTO } from "@compoz/core/domain/site/dto";
import type { HttpOpts } from "@compoz/infra/http/internal";
import { pagesStudioApi } from "@compoz/infra/http/studio/pages.client";
import { siteIndexKey } from "@compoz/studio/features/site-index/keys";
import { requireTenantId } from "@compoz/ui/lib/tenant-id";
import type { QueryClient } from "@tanstack/react-query";

/**
 * Lit le SiteIndex en "cache-first".
 *
 * @remarks
 * - Retourne le cache si présent, sinon déclenche un `fetchQuery` (dedupe par key).
 * - `opts.signal` (si fourni) prend le dessus sur le `signal` React Query.
 */
export async function getSiteIndex(
  qc: QueryClient,
  tenantId: string,
  state: ContentState = DEFAULT_CONTENT_STATE,
  opts?: HttpOpts,
): Promise<SiteIndexDTO> {
  const tid = requireTenantId(tenantId, "getSiteIndex.tenantId");
  const key = siteIndexKey(tid, state);

  // 1) Cache-first
  const cached = qc.getQueryData<SiteIndexDTO>(key);
  if (cached) return cached;

  // 2) Fallback fetchQuery (dedupe + AbortSignal)
  return qc.fetchQuery<SiteIndexDTO>({
    queryKey: key,
    queryFn: async ({ signal }) => {
      const res = await pagesStudioApi.getIndex(state, {
        signal: opts?.signal ?? signal,
      });

      const index = res?.index;
      if (!index) {
        throw new Error("getSiteIndex: missing res.index");
      }

      return index; // ✅ flatten
    },
  });
}
