"use client";

/**
 * @file apps/studio/src/features/pages/pages/PagesListSection.tsx
 * @layer ui/studio/pages/sections
 *
 * @description
 * Section “Pages” (listing) : affiche les pages depuis `SiteIndexDTO` et expose
 * les actions UI (éditer métadonnées, éditer contenu, supprimer).
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
import { ExpandableLayout } from "@compoz/studio/components/layouts/ExpandableLayout";
import { SettingsSection } from "@compoz/studio/components/layouts/SettingsSection";
import { EmptyState } from "@compoz/studio/components/molecules/feedback/EmptyState";
import { PageListItem } from "@compoz/studio/features/pages/components/molecules/PageListItem";
import { useDeletePage } from "@compoz/studio/features/pages/hooks/useDeletePage";
import { Card, CardContent } from "@compoz/ui/components/ui/card";
import { Separator } from "@compoz/ui/components/ui/separator";
import { toStableUiKey } from "@compoz/ui/lib/keys/toStableUiKey";
import { cn } from "@compoz/ui/lib/utils";
import { EMPTY_CARD, STACK_SM } from "@compoz/ui/styles/studio/layout";

type PagesListSectionProps = Readonly<{
  /** Titre de la section (défaut i18n). */
  title?: string;

  /** Index du site (références pages) ou null si indisponible. */
  index: SiteIndexDTO | null;

  statusByPageId?: Readonly<Record<string, SiteDiffKindDTO>>;

  /** Indique un chargement de l’index côté parent (shell). */
  isLoadingIndex?: boolean;

  /** Ouvre l’édition des métadonnées (title / slug) d’une page. */
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

  const pages = useMemo<ReadonlyArray<PageSummaryDTO>>(
    () => (index?.pages ?? []) as ReadonlyArray<PageSummaryDTO>,
    [index],
  );

  const { remove, isDeleting, deletingPageId } = useDeletePage();

  const handleDelete = useCallback(
    async (page: PageSummaryDTO) => {
      await remove({ pageId: page.id, label: page.name });
    },
    [remove],
  );

  const headingTitle = title ?? t("studio.pagesListSection.section.title");
  const description = t("studio.pagesListSection.section.description");
  const isBusy = Boolean(isDeleting);

  /**
   * Grouping UI-only :
   * - préserve l’ordre du SoT `index.pages`
   * - profondeur 1 (parents + enfants)
   */
  const groups = useMemo<PageGroups>(() => {
    const parents: PageSummaryDTO[] = [];
    const childrenByParentId: Record<string, PageSummaryDTO[]> = {};

    for (const page of pages) {
      const parentId = page.parentId;

      if (!parentId) {
        parents.push(page);
        continue;
      }

      if (!childrenByParentId[parentId]) {
        childrenByParentId[parentId] = [];
      }

      childrenByParentId[parentId].push(page);
    }

    return { parents, childrenByParentId };
  }, [pages]);

  const renderRow = useCallback(
    (page: PageSummaryDTO) => {
      const isDeletingRow = deletingPageId === page.id;

      return (
        <PageListItem
          page={page}
          statusKind={statusByPageId?.[page.id]}
          onEditMeta={onEditMeta}
          onEditContent={onEditContent}
          onDelete={() => handleDelete(page)}
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
          text={t("studio.pagesListSection.empty")}
          className={cn(EMPTY_CARD)}
        />
      ) : (
        <Card variant="panel">
          <CardContent>
            <ul className={cn(STACK_SM)}>
              {groups.parents.map((parent, parentIndex) => {
                const children = groups.childrenByParentId[parent.id] ?? [];
                const hasChildren = children.length > 0;

                return (
                  <li
                    key={toStableUiKey(
                      { id: parent.id, label: parent.slug },
                      parentIndex,
                    )}
                    className={cn(STACK_SM)}
                  >
                    {renderRow(parent)}

                    {hasChildren ? (
                      <div className="pl-4">
                        <ExpandableLayout
                          id={`pages-children-${parent.id}`}
                          label={t(
                            "studio.pagesListSection.childrenExpandableLabel",
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
                                {children.map((child, childIndex) => (
                                  <li
                                    key={toStableUiKey(
                                      { id: child.id, label: child.slug },
                                      childIndex,
                                    )}
                                    className={cn(STACK_SM)}
                                  >
                                    {renderRow(child)}
                                    {childIndex < children.length - 1 ? (
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

                    {parentIndex < groups.parents.length - 1 ? (
                      <Separator />
                    ) : null}
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
