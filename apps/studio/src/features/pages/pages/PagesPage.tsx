"use client";

/**
 * @file apps/studio/src/features/pages/pages/PagesPage.tsx
 * @layer ui/pages
 *
 * @description
 * Page “Pages” (admin) — coordination liste + édition (métadonnées + contenu).
 *
 * @remarks
 * - Coordonne `PagesListSection` (listing) et `PageEditSection` (création/édition meta).
 * - L’édition du contenu se fait via navigation (`/dashboard/pages/[pageId]/blocks`).
 * - Dirty guard : bloque la navigation route-based si la page courante est dirty.
 * - UX : un clic “éditer les métadonnées” déclenche un scroll vers le formulaire.
 */

import type { SiteDiffKindDTO } from "@compoz/core/domain/site/dto";
import { Separator } from "@compoz/ui/components/ui/separator";
import { getScrollBehavior } from "@compoz/ui/lib/getScrollBehavior";
import { cn } from "@compoz/ui/lib/utils";
import { ADMIN_SECTION } from "@compoz/ui/styles/studio/layout";
import { Heading } from "@compoz/studio/components/atoms/typography/Heading";
import { useAdminDirtyGuard } from "@compoz/studio/features/dirty-guard/useAdminDirtyGuard";
import { PageEditSection } from "@compoz/studio/features/pages/sections/PageEditSection";
import { PagesListSection } from "@compoz/studio/features/pages/sections/PagesListSection";
import { useReadSiteIndex } from "@compoz/studio/features/site-index/useReadSiteIndex";
import { useSiteStatusDetails } from "@compoz/studio/features/site/status/useSiteStatusDetails";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Page Pages : coordination listing + édition (admin).
 */
export function PagesPage() {
  const t = useTranslations();
  const locale = useLocale();

  const dirtyGuard = useAdminDirtyGuard();
  const { index, isLoading } = useReadSiteIndex();

  const [editPageId, setEditPageId] = useState<string | null>(null);

  /**
   * ✅ V0.5 perf : on évite `scope=all` automatique (full scan).
   * On ne récupère que les pages "dirty", et on met un fallback UI pour le reste.
   */
  const pageStatuses = useSiteStatusDetails({
    enabled: true,
    scope: "dirty",
    includeBlocks: false,
  });

  const statusByPageId = useMemo<
    Readonly<Record<string, SiteDiffKindDTO>>
  >(() => {
    const out: Record<string, SiteDiffKindDTO> = {};

    // ✅ Fallback : toutes les pages de l'index sont considérées "published"
    const pagesFromIndex = index?.pages ?? [];
    for (const p of pagesFromIndex) {
      if (!p?.id) continue;
      out[p.id] = "published";
    }

    // ✅ Override : les pages retournées par statusDetails (dirty) portent leur diff réel
    const pages = pageStatuses.data?.pages ?? [];
    for (const p of pages) {
      if (!p?.id) continue;
      out[p.id] = p.diff;
    }

    return out;
  }, [index?.pages, pageStatuses.data]);

  // Dirty state remonté par PageEditSection (si elle le supporte encore).
  const [metaDirty, setMetaDirty] = useState(false);

  // ✅ Sync vers le provider (ne jamais appeler setDirty dans le render)
  useEffect(() => {
    dirtyGuard.setDirty(metaDirty);
  }, [dirtyGuard, metaDirty]);

  const handleEditContent = useCallback(
    async (pageId: string) => {
      const href = `/${locale}/dashboard/pages/${pageId}/blocks`;
      await dirtyGuard.navigate(href);
    },
    [dirtyGuard, locale],
  );

  const handleEditMeta = useCallback((pageId: string) => {
    setEditPageId(pageId);

    // UX : scroll vers le formulaire d’édition des métadonnées
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
    <div className={cn(ADMIN_SECTION)}>
      <Heading as="h1" className="sr-only">
        {t("admin.shared.entities.pages")}
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
        title={t("admin.pagesListSection.section.title")}
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
