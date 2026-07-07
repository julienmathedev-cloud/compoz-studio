"use client";

/**
 * @file apps/studio/src/features/pages/pages/PagesPage.tsx
 * @layer studio/features/pages/pages
 *
 * @description
 * Studio page shell coordinating the page list and metadata create/edit form.
 *
 * @remarks
 * - Renders `PageEditSection` for create/edit metadata and `PagesListSection` for the index list.
 * - Opens content editing through route navigation to `/pages/[pageId]/blocks`.
 * - Registers metadata form dirtiness with the Studio dirty guard before route-based navigation.
 * - Scrolls to the metadata form when a page enters metadata edit mode.
 */

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { SiteDiffKindDTO } from "@compoz/core/domain/site/dto";
import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { useStudioDirtyGuard } from "@compoz/studio/features/dirty-guard/useStudioDirtyGuard";
import { PageEditSection } from "@compoz/studio/features/pages/sections/PageEditSection";
import { PagesListSection } from "@compoz/studio/features/pages/sections/PagesListSection";
import { useReadSiteIndex } from "@compoz/studio/features/site-index/useReadSiteIndex";
import { useSiteStatusDetails } from "@compoz/studio/features/site/status/useSiteStatusDetails";
import { Separator } from "@compoz/ui/components/ui/separator";
import { getScrollBehavior } from "@compoz/ui/lib/getScrollBehavior";
import { cn } from "@compoz/ui/lib/utils";
import { STUDIO_SECTION } from "@compoz/ui/styles/studio/layout";

/** Coordinates page metadata editing, page listing, and guarded content navigation. */
export function PagesPage() {
  const t = useTranslations();
  const locale = useLocale();

  const dirtyGuard = useStudioDirtyGuard();
  const { index, isLoading } = useReadSiteIndex();

  const [editPageId, setEditPageId] = useState<string | null>(null);
  const [metaDirty, setMetaDirty] = useState(false);

  /** Avoids the expensive `scope=all` scan; clean pages fall back to the SiteIndex status. */
  const pageStatuses = useSiteStatusDetails({
    enabled: true,
    scope: "dirty",
    includeBlocks: false,
  });

  const statusByPageId = useMemo<
    Readonly<Record<string, SiteDiffKindDTO>>
  >(() => {
    const output: Record<string, SiteDiffKindDTO> = {};

    const pagesFromIndex = index?.pages ?? [];
    for (const page of pagesFromIndex) {
      if (!page?.id) continue;
      output[page.id] = "published";
    }

    const dirtyPages = pageStatuses.data?.pages ?? [];
    for (const page of dirtyPages) {
      if (!page?.id) continue;
      output[page.id] = page.diff;
    }

    return output;
  }, [index?.pages, pageStatuses.data]);

  useEffect(() => {
    dirtyGuard.setDirty(metaDirty);
  }, [dirtyGuard, metaDirty]);

  const handleEditContent = useCallback(
    async (pageId: string) => {
      const href = `/${locale}/pages/${pageId}/blocks`;
      await dirtyGuard.navigate(href);
    },
    [dirtyGuard, locale],
  );

  const handleEditMeta = useCallback((pageId: string) => {
    setEditPageId(pageId);

    requestAnimationFrame(() => {
      document.getElementById("page-edit")?.scrollIntoView({
        behavior: getScrollBehavior(),
        block: "start",
      });
    });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditPageId(null);
    setMetaDirty(false);
  }, []);

  return (
    <div className={cn(STUDIO_SECTION)}>
      <Heading as="h1" className="sr-only">
        {t("studio.shared.entities.pages")}
      </Heading>

      <PageEditSection
        index={index}
        isLoading={isLoading}
        editId={editPageId}
        onCancelEdit={handleCancelEdit}
        onDirtyChange={setMetaDirty}
      />

      <Separator />

      <PagesListSection
        title={t("studio.pagesListSection.section.title")}
        index={index}
        statusByPageId={statusByPageId}
        isLoadingIndex={isLoading}
        onEditMeta={handleEditMeta}
        onEditContent={handleEditContent}
      />
    </div>
  );
}

PagesPage.displayName = "PagesPage";
