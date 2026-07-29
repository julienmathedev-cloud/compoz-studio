"use client";

/**
 * @file apps/studio/src/features/pages/hooks/useInternalPageOptions.ts
 * @layer studio/features/pages/hooks
 *
 * @description
 * Builds internal page picker options from the SiteIndex.
 *
 * @remarks
 * - Reads the SiteIndex projection through `useReadSiteIndex(state)`.
 * - Centralizes filtering and label rules so internal page pickers stay consistent.
 * - Supports href or page id option values depending on the caller use case.
 */

import { useMemo } from "react";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import type { InternalPageOptionDTO } from "@compoz/core/domain/pages/dto";
import { useReadSiteIndex } from "@compoz/studio/features/site-index/useReadSiteIndex";
import { formatPagePath } from "@compoz/studio/lib/ui/pages";

type UseInternalPageOptionsArgs = Readonly<{
  state?: ContentState;

  excludePageId?: string | null;

  /** Restricts options to root pages when enabled. */
  rootsOnly?: boolean;

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
          label: `${page.name}${slug ? ` — ${href}` : ""}`,
        };
      });
  }, [index, excludePageId, rootsOnly, valueMode]);

  return { options, isLoading, index } as const;
}

useInternalPageOptions.displayName = "useInternalPageOptions";
