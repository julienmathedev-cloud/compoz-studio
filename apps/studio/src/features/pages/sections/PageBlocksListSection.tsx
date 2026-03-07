"use client";

/**
 * @file apps/studio/src/features/pages/sections/PageBlocksListSection.tsx
 * @layer ui/studio/pages/sections
 *
 * @description
 * Section “Blocks” (listing) : affiche les blocks draft d’une page et expose
 * les actions UI (ajouter, réordonner, supprimer, éditer) + preview de la page complète.
 */

import { ArrowLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { SiteDiffKindDTO } from "@compoz/core/domain/site/dto";
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { ExpandableLayout } from "@compoz/studio/components/layouts/ExpandableLayout";
import { SettingsSection } from "@compoz/studio/components/layouts/SettingsSection";
import { AddEmptyCardButton } from "@compoz/studio/components/molecules/controls/AddEmptyCardButton";
import { StudioWarningsPanel } from "@compoz/studio/features/_shared/components/StudioWarningsPanel";
import { useConfirmList } from "@compoz/studio/features/confirm/useConfirmList";
import { useStudioDirtyGuard } from "@compoz/studio/features/dirty-guard/useStudioDirtyGuard";
import { PageBlockListItem } from "@compoz/studio/features/pages/blocks/components/molecules/PageBlockListItem";
import { useCreateBlock } from "@compoz/studio/features/pages/blocks/hooks/useCreateBlock";
import { useDeleteBlock } from "@compoz/studio/features/pages/blocks/hooks/useDeleteBlock";
import { useListPageBlocks } from "@compoz/studio/features/pages/blocks/hooks/useListPageBlocks";
import { useReorderBlocks } from "@compoz/studio/features/pages/blocks/hooks/useReorderBlocks";
import { ChildPageListItem } from "@compoz/studio/features/pages/components/molecules/ChildPageListItem";
import { PageForm } from "@compoz/studio/features/pages/components/organisms/PageForm";
import { useReadPage } from "@compoz/studio/features/pages/hooks/useReadPage";
import { useReorderPageChildren } from "@compoz/studio/features/pages/hooks/useReorderPageChildren";
import { useUpdatePage } from "@compoz/studio/features/pages/hooks/useUpdatePage";
import { createEmptyLayoutSectionBlock } from "@compoz/studio/features/pages/mappers/blocks-form";
import {
  normalizePageFormValues,
  toPageFormValuesFromDTO,
} from "@compoz/studio/features/pages/mappers/pages-form";
import type { PageWarningKey } from "@compoz/studio/features/pages/validation/validate";
import { computePageWarnings } from "@compoz/studio/features/pages/validation/validate";
import { useStudioPreview } from "@compoz/studio/features/preview/hooks/useStudioPreview";
import { PreviewFrame } from "@compoz/studio/features/preview/PreviewFrame";
import { useSettingsBundle } from "@compoz/studio/features/settings/bundle/useSettingsBundle";
import { useReadSiteIndex } from "@compoz/studio/features/site-index/useReadSiteIndex";
import { useSiteStatusDetails } from "@compoz/studio/features/site/status/useSiteStatusDetails";
import { formatPagePath } from "@compoz/studio/lib/ui/pages";
import { Button } from "@compoz/ui/components/ui/button";
import { Card, CardContent } from "@compoz/ui/components/ui/card";
import { Separator } from "@compoz/ui/components/ui/separator";
import { moveItem } from "@compoz/ui/lib/array";
import { toStableUiKey } from "@compoz/ui/lib/keys/toStableUiKey";
import { cn } from "@compoz/ui/lib/utils";
import { toBlockShapeFromDTO } from "@compoz/ui/pages/mappers/block-shape";
import { toLegalMenuSettingsShapeFromDTO } from "@compoz/ui/settings/mappers/legal-menu-shape";
import { toPrimaryMenuSettingsShapeFromDTO } from "@compoz/ui/settings/mappers/primary-menu-shape";
import { toSocialSettingsShapeFromDTO } from "@compoz/ui/settings/mappers/social-shape";
import { STACK_SM } from "@compoz/ui/styles/studio/layout";
import type { BlockShape } from "@compoz/validation/pages/blocks/block";
import type { PageRenderShape } from "@compoz/validation/pages/page";
import type { PageFormValues } from "@compoz/validation/pages/page-form";
import type { FooterSettingsShape } from "@compoz/validation/site/settings/footer/footer";
import type { HeaderSettingsShape } from "@compoz/validation/site/settings/header/header";
import type { IdentitySettingsShape } from "@compoz/validation/site/settings/identity/identity";
import type { LegalMenuSettingsShape } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu";
import type { PrimaryMenuSettingsShape } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu";
import type { SocialSettingsShape } from "@compoz/validation/site/settings/social/social";

type PageBlocksListSectionProps = Readonly<{
  pageId: string;
  slug: string;
}>;

type ParentOption = Readonly<{
  value: string;
  label: string;
}>;

export function PageBlocksListSection({
  pageId,
  slug,
}: PageBlocksListSectionProps) {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();

  const dirtyGuard = useStudioDirtyGuard();
  const confirmList = useConfirmList();
  const backHref = `/${locale}/pages`;

  const { blocks, isLoading } = useListPageBlocks(pageId);
  const { index: siteIndex, isLoading: isLoadingIndex } = useReadSiteIndex();
  const { reorderChildren, isReordering: isReorderingChildren } =
    useReorderPageChildren();

  /* ---------------------------------------------------------------------- */
  /* Page props (edit)                                                      */
  /* ---------------------------------------------------------------------- */

  const { page, isLoading: isLoadingPage } = useReadPage(pageId);
  const { update, isUpdating } = useUpdatePage();

  const baselineRef = useRef<PageFormValues | null>(null);

  const initialValues = useMemo<PageFormValues>(() => {
    return toPageFormValuesFromDTO(page, pageId);
  }, [page, pageId]);

  useEffect(() => {
    baselineRef.current = initialValues;
  }, [initialValues]);

  const parentOptions = useMemo<ReadonlyArray<ParentOption>>(() => {
    if (!siteIndex) return [];

    const currentId = pageId.trim();

    return (siteIndex.pages ?? [])
      .filter((pageItem) => {
        if (!pageItem.id) return false;
        if (pageItem.id === currentId) return false;
        if (pageItem.parentId !== null) return false;
        return true;
      })
      .map((pageItem) => ({
        value: pageItem.id,
        label: `${pageItem.title}${
          pageItem.slug ? ` — ${formatPagePath(pageItem.slug)}` : ""
        }`,
      }));
  }, [siteIndex, pageId]);

  /* ---------------------------------------------------------------------- */
  /* Status pages (badges diff)                                             */
  /* ---------------------------------------------------------------------- */

  const pageStatuses = useSiteStatusDetails({
    enabled: true,
    scope: "dirty",
    includeBlocks: false,
  });

  const statusByPageId = useMemo<
    Readonly<Record<string, SiteDiffKindDTO>>
  >(() => {
    const output: Record<string, SiteDiffKindDTO> = {};

    const pagesFromIndex = siteIndex?.pages ?? [];
    for (const pageItem of pagesFromIndex) {
      if (!pageItem?.id) continue;
      output[pageItem.id] = "published";
    }

    const dirtyPages = pageStatuses.data?.pages ?? [];
    for (const pageItem of dirtyPages) {
      if (!pageItem?.id) continue;
      output[pageItem.id] = pageItem.diff;
    }

    return output;
  }, [siteIndex?.pages, pageStatuses.data]);

  const [isMetaDirty, setIsMetaDirty] = useState(false);
  const [blockingErrorsCount, setBlockingErrorsCount] = useState(0);
  const [warningKeys, setWarningKeys] = useState<PageWarningKey[]>([]);

  const handleSubmitPageMeta = useCallback(
    async (values: PageFormValues) => {
      const warningKeysNow = computePageWarnings({
        title: values.title ?? "",
        slug: values.slug ?? "",
        parentId: values.parentId ?? null,
        paginationEnabled: values.paginationEnabled ?? false,
      });

      const warningHintsNow = warningKeysNow.map((key) =>
        t(`studio.pageEditSection.warnings.${key}`),
      );

      if (warningHintsNow.length > 0) {
        const ok = await confirmList({
          title: t("studio.shared.confirm.saveDespiteWarnings.title"),
          intro: t("studio.shared.confirm.saveDespiteWarnings.intro"),
          items: warningHintsNow,
          confirmLabel: t(
            "studio.shared.confirm.saveDespiteWarnings.confirmLabel",
          ),
          cancelLabel: t("common.cancel"),
          requireAckLabel: t(
            "studio.shared.confirm.saveDespiteWarnings.requireAckLabel",
          ),
          tone: "default",
        });

        if (!ok) return;
      }

      const normalized = normalizePageFormValues(values);
      const originalId = pageId.trim();
      if (!originalId) return;

      const baselineForPatch = baselineRef.current ?? initialValues;
      await update(originalId, baselineForPatch, normalized);

      setWarningKeys([]);
      setBlockingErrorsCount(0);
      setIsMetaDirty(false);
    },
    [confirmList, initialValues, pageId, t, update],
  );

  /* ---------------------------------------------------------------------- */
  /* Blocks                                                                  */
  /* ---------------------------------------------------------------------- */

  const children = useMemo(() => {
    const pages = siteIndex?.pages ?? [];
    return pages.filter((pageItem) => pageItem.parentId === pageId);
  }, [siteIndex, pageId]);

  const list = useMemo(() => blocks ?? [], [blocks]);

  const blockStatuses = useSiteStatusDetails({
    enabled: true,
    scope: "dirty",
    includeBlocks: true,
    pageId,
  });

  const statusByBlockId = useMemo<
    Readonly<Record<string, SiteDiffKindDTO>>
  >(() => {
    const output: Record<string, SiteDiffKindDTO> = {};

    for (const block of list) {
      output[block.id] = "published";
    }

    const pages = blockStatuses.data?.pages ?? [];
    const pageForBlocks = pages.find((pageItem) => pageItem.id === pageId);

    const items = pageForBlocks?.blockItems ?? [];
    for (const item of items) {
      output[item.id] = item.diff;
    }

    return output;
  }, [blockStatuses.data, list, pageId]);

  const { create, isCreating } = useCreateBlock();
  const { remove, isDeleting, deletingBlockId } = useDeleteBlock();
  const { reorder, isReordering } = useReorderBlocks();

  const [busyId, setBusyId] = useState<string | null>(null);

  const isBusy = Boolean(
    isCreating ||
    isDeleting ||
    isReordering ||
    isReorderingChildren ||
    isUpdating,
  );

  const moveChild = useCallback(
    async (fromIndex: number, toIndex: number) => {
      if (!pageId.trim()) return;
      if (isBusy || busyId) return;
      if (toIndex < 0 || toIndex >= children.length) return;
      if (fromIndex === toIndex) return;

      const ordered = children.map((child) => child.id);
      const nextOrdered = moveItem(ordered, fromIndex, toIndex);
      const picked = ordered[fromIndex];

      try {
        setBusyId(picked ?? "__reorder_children__");
        await reorderChildren(pageId, nextOrdered);
      } finally {
        setBusyId(null);
      }
    },
    [busyId, children, isBusy, pageId, reorderChildren],
  );

  const headingTitle = t("studio.pageBlocksListSection.section.title", {
    title: slug,
  });
  const description = t("studio.pageBlocksListSection.section.description");

  /* ---------------------------------------------------------------------- */
  /* Preview page (read-only)                                               */
  /* ---------------------------------------------------------------------- */

  const { data: settingsBundle, isLoading: isLoadingSettingsBundle } =
    useSettingsBundle(DEFAULT_CONTENT_STATE);

  const headerBaselinePreview = useMemo<HeaderSettingsShape | null>(() => {
    if (!settingsBundle) return null;
    return settingsBundle.header as HeaderSettingsShape;
  }, [settingsBundle]);

  const identityBaselinePreview = useMemo<IdentitySettingsShape | null>(() => {
    if (!settingsBundle) return null;
    return settingsBundle.identity as IdentitySettingsShape;
  }, [settingsBundle]);

  const primaryMenuBaselinePreview =
    useMemo<PrimaryMenuSettingsShape | null>(() => {
      if (!settingsBundle) return null;
      return toPrimaryMenuSettingsShapeFromDTO(settingsBundle.primaryMenu);
    }, [settingsBundle]);

  const socialBaselinePreview = useMemo<SocialSettingsShape | null>(() => {
    if (!settingsBundle) return null;
    return toSocialSettingsShapeFromDTO(settingsBundle.social);
  }, [settingsBundle]);

  const footerBaselinePreview = useMemo<FooterSettingsShape | null>(() => {
    if (!settingsBundle) return null;
    return settingsBundle.footer as FooterSettingsShape;
  }, [settingsBundle]);

  const legalMenuBaselinePreview =
    useMemo<LegalMenuSettingsShape | null>(() => {
      if (!settingsBundle) return null;
      return toLegalMenuSettingsShapeFromDTO(settingsBundle.legalMenu);
    }, [settingsBundle]);

  const previewScope = useMemo(() => `page:${slug}`, [slug]);

  const pageBaselinePreview = useMemo<PageRenderShape | null>(() => {
    if (!page) return null;

    const pageBlocks = list
      .map(toBlockShapeFromDTO)
      .filter((shape): shape is BlockShape => Boolean(shape));

    return {
      title: page.title,
      blocks: pageBlocks,
      paginationEnabled: Boolean(page.paginationEnabled),
    } as const;
  }, [list, page]);

  const { ready, setBaseline, frame, iframeRef } =
    useStudioPreview<PageRenderShape>(previewScope, pageBaselinePreview);

  const hasAllBaselines =
    settingsBundle != null &&
    headerBaselinePreview != null &&
    identityBaselinePreview != null &&
    primaryMenuBaselinePreview != null &&
    socialBaselinePreview != null &&
    footerBaselinePreview != null &&
    legalMenuBaselinePreview != null;

  const hasHandshake =
    ready.isReady("header") &&
    ready.isReady("identity") &&
    ready.isReady("primaryMenu") &&
    ready.isReady("social") &&
    ready.isReady("footer") &&
    ready.isReady("legalMenu") &&
    ready.isReady("siteIndex") &&
    ready.isReady(previewScope);

  const sectionLoading =
    (isLoading && list.length === 0) || (isLoadingIndex && !siteIndex);

  useEffect(() => {
    if (!siteIndex || !pageBaselinePreview) return;

    if (headerBaselinePreview != null && ready.isReady("header")) {
      setBaseline("header", headerBaselinePreview);
    }

    if (identityBaselinePreview != null && ready.isReady("identity")) {
      setBaseline("identity", identityBaselinePreview);
    }

    if (primaryMenuBaselinePreview != null && ready.isReady("primaryMenu")) {
      setBaseline("primaryMenu", primaryMenuBaselinePreview);
    }

    if (socialBaselinePreview != null && ready.isReady("social")) {
      setBaseline("social", socialBaselinePreview);
    }

    if (footerBaselinePreview != null && ready.isReady("footer")) {
      setBaseline("footer", footerBaselinePreview);
    }

    if (legalMenuBaselinePreview != null && ready.isReady("legalMenu")) {
      setBaseline("legalMenu", legalMenuBaselinePreview);
    }

    if (ready.isReady("siteIndex")) {
      setBaseline("siteIndex", siteIndex);
    }

    if (ready.isReady(previewScope)) {
      setBaseline(previewScope, pageBaselinePreview);
    }
  }, [
    headerBaselinePreview,
    identityBaselinePreview,
    primaryMenuBaselinePreview,
    socialBaselinePreview,
    footerBaselinePreview,
    legalMenuBaselinePreview,
    siteIndex,
    previewScope,
    pageBaselinePreview,
    ready,
    setBaseline,
  ]);

  /* ---------------------------------------------------------------------- */
  /* Actions                                                                */
  /* ---------------------------------------------------------------------- */

  const handleAdd = useCallback(async () => {
    if (!pageId.trim()) return;
    if (isBusy || busyId) return;

    try {
      setBusyId("__add__");

      const nextIndex = list.length + 1;
      const nextTitle = t("studio.pageBlocksListSection.bloc.title", {
        title: nextIndex,
      });

      const values = createEmptyLayoutSectionBlock({
        columns: 1,
        containerMode: "contained",
        title: { text: nextTitle, display: "visible" },
      });

      await create({ pageId, values, label: String(nextIndex) });
    } finally {
      setBusyId(null);
    }
  }, [busyId, create, isBusy, pageId, list.length, t]);

  const handleDelete = useCallback(
    async (blockIdToDelete: string) => {
      if (!pageId.trim()) return;
      if (isBusy || busyId) return;

      try {
        setBusyId(blockIdToDelete);
        await remove(pageId, blockIdToDelete);
      } finally {
        setBusyId(null);
      }
    },
    [busyId, isBusy, remove, pageId],
  );

  const move = useCallback(
    async (fromIndex: number, toIndex: number) => {
      if (!pageId.trim()) return;
      if (isBusy || busyId) return;
      if (toIndex < 0 || toIndex >= list.length) return;
      if (fromIndex === toIndex) return;

      const ordered = list.map((block) => block.id);
      const nextOrdered = moveItem(ordered, fromIndex, toIndex);
      const picked = ordered[fromIndex];

      try {
        setBusyId(picked ?? "__reorder__");
        await reorder(pageId, { orderedBlockIds: nextOrdered });
      } finally {
        setBusyId(null);
      }
    },
    [busyId, isBusy, list, reorder, pageId],
  );

  /* ---------------------------------------------------------------------- */
  /* Render                                                                 */
  /* ---------------------------------------------------------------------- */

  const sectionIsLoading = Boolean(sectionLoading || isLoadingPage);
  const dataReady =
    !isLoading && !isLoadingIndex && !isLoadingSettingsBundle && !isLoadingPage;

  const isEmpty =
    dataReady &&
    pageBaselinePreview != null &&
    pageBaselinePreview.blocks.length === 0;

  const emptyLabel = t("studio.emptyPreview.pageEmpty");

  const isPreviewLoading =
    !isEmpty &&
    (isLoading ||
      isLoadingIndex ||
      isLoadingSettingsBundle ||
      !siteIndex ||
      !hasAllBaselines ||
      !hasHandshake ||
      !pageBaselinePreview);

  return (
    <SettingsSection
      id="page-blocks"
      title={headingTitle}
      description={description}
      isBusy={isBusy}
      isLoading={sectionIsLoading}
      isDirty={isMetaDirty}
      blockingErrorsCount={blockingErrorsCount}
    >
      <Button
        asChild
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        aria-label={t("studio.pageBlocksListSection.bloc.back")}
      >
        <Link
          href={backHref}
          onClick={(event) => {
            if (event.defaultPrevented) return;
            if (event.button !== 0) return;
            if (
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.altKey
            )
              return;

            event.preventDefault();
            void dirtyGuard.navigate(backHref);
          }}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("studio.pageBlocksListSection.bloc.back")}
        </Link>
      </Button>

      <Card variant="panel">
        <CardContent className="flex flex-col gap-2">
          {list.length > 0 ? (
            <ul className={cn(STACK_SM)}>
              {list.map((block, index) => {
                const isRowBusy =
                  deletingBlockId === block.id || busyId === block.id;

                return (
                  <li
                    key={toStableUiKey(
                      { id: block.id, label: block.type },
                      index,
                    )}
                    className={cn(STACK_SM)}
                  >
                    <PageBlockListItem
                      block={block}
                      statusKind={statusByBlockId[block.id]}
                      onMoveUp={() => move(index, index - 1)}
                      onMoveDown={() => move(index, index + 1)}
                      onEdit={() => {
                        router.push(
                          `/${locale}/pages/${pageId}/blocks/${block.id}`,
                        );
                      }}
                      onDelete={() => handleDelete(block.id)}
                      isDeleting={isRowBusy}
                      disabled={isBusy || Boolean(busyId)}
                      isFirst={index === 0}
                      isLast={index === list.length - 1}
                      index={index}
                    />
                    {index < list.length - 1 ? <Separator /> : null}
                  </li>
                );
              })}
            </ul>
          ) : null}

          {list.length > 0 ? <Separator /> : null}

          <AddEmptyCardButton
            onClick={handleAdd}
            disabled={isBusy || Boolean(busyId)}
            ariaLabel={t("studio.pageBlocksListSection.bloc.add")}
            tooltip={t("studio.pageBlocksListSection.bloc.add")}
            compact
            className="w-full"
          />
        </CardContent>
      </Card>

      <ExpandableLayout
        id="page-blocks-children"
        label={t("studio.pageForm.childrens.label", { count: children.length })}
        defaultOpen={false}
        disabled={children.length === 0}
      >
        {children.length > 0 ? (
          <Card variant="panel">
            <CardContent>
              <Text as="p" variant="muted">
                {t("studio.pageForm.childrens.help")}
              </Text>

              <ul className={cn(STACK_SM, "mt-4")}>
                {children.map((pageItem, index) => (
                  <li key={pageItem.id}>
                    <ChildPageListItem
                      page={pageItem}
                      statusKind={statusByPageId[pageItem.id]}
                      index={index}
                      total={children.length}
                      isReordering={isBusy || Boolean(busyId)}
                      onMoveUp={() => moveChild(index, index - 1)}
                      onMoveDown={() => moveChild(index, index + 1)}
                    />
                    {index < children.length - 1 ? <Separator /> : null}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}
      </ExpandableLayout>

      <ExpandableLayout
        id="page-blocks-settings"
        label={t("studio.pageBlocksListSection.section.pageSettings")}
        defaultOpen={false}
        disabled={false}
      >
        <StudioWarningsPanel
          id="page-blocks-settings-warnings"
          warningKeys={warningKeys}
          warningMessageKeyPrefix="studio.pageEditSection.warnings"
        />

        <PageForm
          initialValues={initialValues}
          parentOptions={parentOptions}
          isSaving={isUpdating}
          mode="edit"
          bFocusFields={false}
          bCancelAlwaysEnabledInEdit
          onSubmit={handleSubmitPageMeta}
          onReset={() => {
            setWarningKeys([]);
            setBlockingErrorsCount(0);
            setIsMetaDirty(false);
          }}
          onWarningKeysChange={setWarningKeys}
          onDirtyChange={(dirty) => setIsMetaDirty(Boolean(dirty))}
          onBlockingErrorsCountChange={setBlockingErrorsCount}
        />
      </ExpandableLayout>

      <PreviewFrame
        title={t("studio.shared.preview.title", {
          entity: t("studio.shared.entities.page"),
        })}
        src={`/preview/pages/${slug}`}
        iframeRef={iframeRef}
        onLoad={frame.onLoad}
        syncDisabled
        isLoading={isPreviewLoading}
        isEmpty={isEmpty}
        emptyLabel={emptyLabel}
        heightClassName="h-[800px]"
        info={
          isEmpty
            ? t("studio.emptyPreview.pageEmpty")
            : !isPreviewLoading
              ? t("studio.shared.preview.infoBaseline")
              : t("studio.overviewSection.preview.loading")
        }
      />
    </SettingsSection>
  );
}

PageBlocksListSection.displayName = "PageBlocksListSection";
