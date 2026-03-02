"use client";

/**
 * @file apps/studio/src/features/pages/pages/PagesListSection.tsx
 * @layer ui/sections
 *
 * @description
 * Section “Pages” (listing) : affiche les pages depuis `SiteIndexDTO` et expose les actions UI
 * (éditer métadonnées, éditer contenu, supprimer).
 *
 * @remarks
 * - La suppression est orchestrée via `useDeletePage`.
 * - Les confirmations et l’état busy par item sont gérés localement.
 * - `PageListItem` reste strictement présentational.
 * - Le chargement initial est géré par `SettingsSection` (shell) via `isLoadingIndex`.
 * - Strictement UI-only : aucune logique métier.
 */

import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";

import type { PageSummaryDTO } from "@compoz/core/domain/pages/dto";
import type {
  SiteDiffKindDTO,
  SiteIndexDTO,
} from "@compoz/core/domain/site/dto";
import { Card, CardContent } from "@compoz/ui/components/ui/card";
import { Separator } from "@compoz/ui/components/ui/separator";
import { toStableUiKey } from "@compoz/ui/lib/keys/toStableUiKey";
import { cn } from "@compoz/ui/lib/utils";
import { EMPTY_CARD, STACK_SM } from "@compoz/ui/styles/studio/layout";
import { ExpandableLayout } from "@compoz/studio/components/layouts/ExpandableLayout";
import { SettingsSection } from "@compoz/studio/components/layouts/SettingsSection";
import { EmptyState } from "@compoz/studio/components/molecules/feedback/EmptyState";
import { PageListItem } from "@compoz/studio/features/pages/components/molecules/PageListItem";
import { useDeletePage } from "@compoz/studio/features/pages/hooks/useDeletePage";

type PagesListSectionProps = Readonly<{
  /** Titre de la section (défaut i18n). */
  title?: string;

  /** Index du site (références pages) ou null si indisponible. */
  index: SiteIndexDTO | null;

  statusByPageId?: Readonly<Record<string, SiteDiffKindDTO>>;

  /** Indique un chargement de l’index côté parent (shell). */
  isLoadingIndex?: boolean;

  /** Ouvre l’édition des métadonnées (title/slug) d’une page. */
  onEditMeta?: (pageId: string) => void;

  /** Ouvre l’édition du contenu d’une page. */
  onEditContent?: (pageId: string) => void;
}>;

type PageGroups = Readonly<{
  parents: ReadonlyArray<PageSummaryDTO>;
  childrenByParentId: Readonly<Record<string, ReadonlyArray<PageSummaryDTO>>>;
}>;

export function PagesListSection({
  title,
  index,
  statusByPageId,
  isLoadingIndex,
  onEditMeta,
  onEditContent,
}: PagesListSectionProps) {
  const t = useTranslations();

  const pages: ReadonlyArray<PageSummaryDTO> = useMemo(
    () => (index?.pages ?? []) as ReadonlyArray<PageSummaryDTO>,
    [index],
  );

  const { remove, isDeleting, deletingPageId } = useDeletePage();
  const handleDelete = useCallback(
    async (page: PageSummaryDTO) => {
      await remove({ pageId: page.id, label: page.title });
    },
    [remove],
  );

  const description = t("admin.pagesListSection.section.description");
  const headingTitle = title ?? t("admin.pagesListSection.section.title");

  // Busy local : suppression en cours (le shell est géré par `SettingsSection`).
  const isBusy = Boolean(isDeleting);

  /**
   * Grouping UI-only :
   * - on préserve l’ordre du SoT `index.pages`
   * - 1 niveau (parents + enfants)
   */
  const groups = useMemo<PageGroups>(() => {
    const parents: PageSummaryDTO[] = [];
    const childrenByParentId: Record<string, PageSummaryDTO[]> = {};
    const byId = new Map<string, PageSummaryDTO>();

    for (const p of pages) byId.set(p.id, p);

    for (const p of pages) {
      const pid = p.parentId;
      if (!pid) {
        parents.push(p);
        continue;
      }
      if (!childrenByParentId[pid]) childrenByParentId[pid] = [];
      childrenByParentId[pid].push(p);
    }

    return { parents, childrenByParentId } as const;
  }, [pages]);

  const renderRow = useCallback(
    (p: PageSummaryDTO) => {
      const isDeletingRow = deletingPageId === p.id;

      return (
        <PageListItem
          page={p}
          statusKind={statusByPageId?.[p.id]}
          onEditMeta={onEditMeta}
          onEditContent={onEditContent}
          onDelete={() => handleDelete(p)}
          isDeleting={isDeletingRow}
        />
      );
    },
    [deletingPageId, handleDelete, onEditContent, onEditMeta, statusByPageId],
  );

  return (
    <SettingsSection
      id="pages-list"
      title={headingTitle}
      headingLevel="h2"
      description={description}
      isBusy={isBusy}
      isLoading={Boolean(isLoadingIndex)}
    >
      {pages.length === 0 ? (
        <EmptyState
          text={t("admin.pagesListSection.empty")}
          className={cn(EMPTY_CARD)}
        />
      ) : (
        <Card variant="panel">
          <CardContent>
            <ul className={cn(STACK_SM)}>
              {groups.parents.map((parent, i) => {
                const children = groups.childrenByParentId[parent.id] ?? [];
                const hasChildren = children.length > 0;

                return (
                  <li
                    key={toStableUiKey(
                      { id: parent.id, label: parent.slug },
                      i,
                    )}
                    className={cn(STACK_SM)}
                  >
                    {renderRow(parent)}

                    {hasChildren ? (
                      <div className="pl-4">
                        <ExpandableLayout
                          id={`pages-children-${parent.id}`}
                          label={t(
                            "admin.pagesListSection.childrenExpandableLabel",
                            { count: children.length },
                          )}
                          defaultOpen={false}
                          triggerClassName="text-muted-foreground"
                        >
                          <Card
                            variant="panel"
                            className="bg-accent/10 shadow-xs shadow-accent"
                          >
                            <CardContent className="flex flex-col">
                              <ul className={cn(STACK_SM)}>
                                {children.map((child, j) => (
                                  <li
                                    key={toStableUiKey(
                                      { id: child.id, label: child.slug },
                                      j,
                                    )}
                                    className={cn(STACK_SM)}
                                  >
                                    {renderRow(child)}
                                    {j < children.length - 1 ? (
                                      <Separator />
                                    ) : null}
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        </ExpandableLayout>
                      </div>
                    ) : null}
                    {i < groups.parents.length - 1 ? <Separator /> : null}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </SettingsSection>
  );
}

PagesListSection.displayName = "PagesListSection";
