"use client";

/**
 * @file apps/studio/src/features/pages/hooks/useInternalPageOptions.ts
 * @layer hooks/studio/pages
 *
 * @description
 * Construit des options de pages internes (picker) à partir du SiteIndex.
 *
 * @remarks
 * - Source de vérité : `useReadSiteIndex(state)`.
 * - Centralise les règles de filtrage/label pour éviter la duplication.
 */

import { useMemo } from "react";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import type { InternalPageOptionDTO } from "@compoz/core/domain/pages/dto";
import { useReadSiteIndex } from "@compoz/studio/features/site-index/useReadSiteIndex";
import { formatPagePath } from "@compoz/studio/lib/ui/pages";

type UseInternalPageOptionsArgs = Readonly<{
  /** Content state à lire (draft/published). */
  state?: ContentState;

  /** Page à exclure (évite l'auto-link). */
  excludePageId?: string | null;

  /** V0.5 : n'autoriser que les pages racines. */
  rootsOnly?: boolean;

  /** Valeur stockée dans l’option : href (défaut) ou id. */
  valueMode?: "href" | "id";
}>;

export function useInternalPageOptions(args?: UseInternalPageOptionsArgs) {
  const {
    state,
    excludePageId = null,
    rootsOnly = false,
    valueMode = "href",
  } = args ?? {};

  const { index, isLoading } = useReadSiteIndex(state);

  const options = useMemo<ReadonlyArray<InternalPageOptionDTO>>(() => {
    const pages = index?.pages ?? [];
    const excludedId = String(excludePageId ?? "").trim();

    return pages
      .filter((page) => {
        if (!page?.id) return false;
        if (excludedId && page.id === excludedId) return false;
        if (rootsOnly && page.parentId !== null) return false;
        return true;
      })
      .map((page) => {
        const slug = page.slug ?? "";
        const href = formatPagePath(slug);

        return {
          slug,
          value: valueMode === "id" ? page.id : href,
          label: `${page.title}${slug ? ` — ${href}` : ""}`,
        };
      });
  }, [index, excludePageId, rootsOnly, valueMode]);

  return { options, isLoading, index } as const;
}

useInternalPageOptions.displayName = "useInternalPageOptions";
