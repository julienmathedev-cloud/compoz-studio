"use client";

/**
 * @file apps/studio/src/features/pages/sections/PageBlocksListSection.tsx
 * @layer ui/sections
 *
 * @description
 * Section “Blocks” (listing) : affiche les blocks (draft) d’une page et expose les actions UI
 * (ajouter, réordonner, supprimer, éditer) + preview de la page complète.
 */

import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { SiteDiffKindDTO } from "@compoz/core/domain/site/dto";
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
import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { ExpandableLayout } from "@compoz/studio/components/layouts/ExpandableLayout";
import { SettingsSection } from "@compoz/studio/components/layouts/SettingsSection";
import { AddEmptyCardButton } from "@compoz/studio/components/molecules/controls/AddEmptyCardButton";
import { HintList } from "@compoz/studio/components/molecules/feedback/HintList";
import { useConfirmList } from "@compoz/studio/features/confirm/useConfirmList";
import { useAdminDirtyGuard } from "@compoz/studio/features/dirty-guard/useAdminDirtyGuard";
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
import { useAdminPreview } from "@compoz/studio/features/preview/hooks/useAdminPreview";
import { PreviewFrame } from "@compoz/studio/features/preview/PreviewFrame";
import { useSettingsBundle } from "@compoz/studio/features/settings/bundle/useSettingsBundle";
import { useReadSiteIndex } from "@compoz/studio/features/site-index/useReadSiteIndex";
import { useSiteStatusDetails } from "@compoz/studio/features/site/status/useSiteStatusDetails";
import { formatPagePath } from "@compoz/studio/lib/ui/pages";
import { ArrowLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type PageBlocksListSectionProps = Readonly<{
  pageId: string;
  slug: string;
}>;

type ParentOption = Readonly<{ value: string; label: string }>;

export function PageBlocksListSection({
  pageId,
  slug,
}: PageBlocksListSectionProps) {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();

  const dirtyGuard = useAdminDirtyGuard();
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

  // ✅ baseline pour patch/diff (pas de lecture pendant render).
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
      .filter((p) => {
        if (!p.id) return false;
        if (p.id === currentId) return false;
        if (p.parentId !== null) return false; // profondeur 1
        return true;
      })
      .map((p) => ({
        value: p.id,
        label: `${p.title}${p.slug ? ` — ${formatPagePath(p.slug)}` : ""}`,
      }));
  }, [siteIndex, pageId]);

  const { update, isUpdating } = useUpdatePage();

  /* ---------------------------------------------------------------------- */
  /* Status pages (badges diff)                                              */
  /* ---------------------------------------------------------------------- */

  /**
   * ✅ V0.5 perf : ne pas appeler `scope=all` automatiquement.
   * On récupère uniquement les pages "dirty" et on fallback "published" en UI.
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

    // ✅ fallback : toutes les pages de l'index sont "published"
    const pagesFromIndex = siteIndex?.pages ?? [];
    for (const p of pagesFromIndex) {
      if (!p?.id) continue;
      out[p.id] = "published";
    }

    // ✅ override : dirty pages
    const pages = pageStatuses.data?.pages ?? [];
    for (const p of pages) {
      if (!p?.id) continue;
      out[p.id] = p.diff;
    }

    return out;
  }, [siteIndex?.pages, pageStatuses.data]);

  const [isMetaDirty, setIsMetaDirty] = useState(false);
  const [blockingErrorsCount, setBlockingErrorsCount] = useState(0);
  const [warningKeys, setWarningKeys] = useState<PageWarningKey[]>([]);

  const warningHints = useMemo(
    () => warningKeys.map((k) => t(`admin.pageEditSection.warnings.${k}`)),
    [warningKeys, t],
  );

  const handleSubmitPageMeta = useCallback(
    async (values: PageFormValues) => {
      const warningKeysNow = computePageWarnings({
        title: values.title ?? "",
        slug: values.slug ?? "",
        parentId: values.parentId ?? null,
        paginationEnabled: values.paginationEnabled ?? false,
      });

      const warningHintsNow = warningKeysNow.map((k) =>
        t(`admin.pageEditSection.warnings.${k}`),
      );

      if (warningHintsNow.length > 0) {
        const ok = await confirmList({
          title: t("admin.shared.confirm.saveDespiteWarnings.title"),
          intro: t("admin.shared.confirm.saveDespiteWarnings.intro"),
          items: warningHintsNow,
          confirmLabel: t(
            "admin.shared.confirm.saveDespiteWarnings.confirmLabel",
          ),
          cancelLabel: t("common.cancel"),
          requireAckLabel: t(
            "admin.shared.confirm.saveDespiteWarnings.requireAckLabel",
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
    return pages.filter((p) => p.parentId === pageId);
  }, [siteIndex, pageId]);

  const list = useMemo(() => blocks ?? [], [blocks]);

  /**
   * ✅ V0.5 perf : pour les blocks, on limite au strict nécessaire :
   * - scope="dirty"
   * - includeBlocks=true
   * - pageId fourni
   *
   * Objectif : éviter les rebuild globaux (scope=all) sans action explicite.
   */
  const blockStatuses = useSiteStatusDetails({
    enabled: true,
    scope: "dirty",
    includeBlocks: true,
    pageId,
  });

  const statusByBlockId = useMemo<
    Readonly<Record<string, SiteDiffKindDTO>>
  >(() => {
    const out: Record<string, SiteDiffKindDTO> = {};

    // ✅ fallback : tout bloc non mentionné est "published"
    for (const b of list) out[b.id] = "published";

    // ✅ override : si endpoint renvoie des blockItems pour la page, on applique les diff
    const pages = blockStatuses.data?.pages ?? [];
    const pageForBlocks = pages.find((p) => p.id === pageId) ?? null;

    const items = pageForBlocks?.blockItems ?? [];
    for (const it of items) out[it.id] = it.diff;

    return out;
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
      if (!pageId?.trim()) return;
      if (isBusy || busyId) return;
      if (toIndex < 0 || toIndex >= children.length) return;
      if (fromIndex === toIndex) return;

      const ordered = children.map((c) => c.id);
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

  const headingTitle = t("admin.pageBlocksListSection.section.title", {
    title: slug,
  });
  const description = t("admin.pageBlocksListSection.section.description");

  /* ---------------------------------------------------------------------- */
  /* Preview page (read-only)                                                */
  /* ---------------------------------------------------------------------- */

  // ✅ Option B : 1 seul READ global pour alimenter la preview
  const { data: settingsBundle, isLoading: isLoadingSettingsBundle } =
    useSettingsBundle(WRITE_CONTENT_STATE);

  // ⚠️ Tant que certains mappers DTO->Shape n'existent pas, on cast.
  // Dès que tu ajoutes `toHeaderSettingsShapeFromDTO`, etc., tu remplaces ces casts.
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

  // ✅ scope attendu par l'iframe preview (page:${slug})
  const previewScope = useMemo(() => `page:${slug}`, [slug]);

  /**
   * Baseline page : on ne la construit QUE si `page` est dispo.
   * (évite d'injecter null / vide et de bloquer le gating côté iframe)
   */
  const pageBaselinePreview = useMemo<PageRenderShape | null>(() => {
    if (!page) return null;

    const pageBlocks = list
      .map(toBlockShapeFromDTO)
      .filter((x): x is BlockShape => Boolean(x));

    return {
      title: page.title,
      blocks: pageBlocks,
      paginationEnabled: Boolean(page.paginationEnabled),
    } as const;
  }, [list, page]);

  // ✅ Hook preview (page baseline + overrides)
  const { ready, setBaseline, frame, iframeRef } =
    useAdminPreview<PageRenderShape>(previewScope, pageBaselinePreview);

  /**
   * Baselines site settings : on attend qu'elles existent avant de déclarer la preview "ready".
   */
  const hasAllBaselines =
    settingsBundle != null &&
    headerBaselinePreview != null &&
    identityBaselinePreview != null &&
    primaryMenuBaselinePreview != null &&
    socialBaselinePreview != null &&
    footerBaselinePreview != null &&
    legalMenuBaselinePreview != null;

  /**
   * Handshake : l'iframe doit annoncer qu'elle est prête à recevoir ces scopes.
   * (inclut siteIndex pour pagination fiable)
   */
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
    // Guard data minimales
    if (!siteIndex) return;
    if (!pageBaselinePreview) return;

    // Settings baselines
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

    // siteIndex (pager)
    if (ready.isReady("siteIndex")) {
      setBaseline("siteIndex", siteIndex);
    }

    // Page baseline
    if (ready.isReady(previewScope)) {
      setBaseline(previewScope, pageBaselinePreview);
    }
  }, [
    // computed payloads
    headerBaselinePreview,
    identityBaselinePreview,
    primaryMenuBaselinePreview,
    socialBaselinePreview,
    footerBaselinePreview,
    legalMenuBaselinePreview,

    // data page
    siteIndex,
    previewScope,
    pageBaselinePreview,

    // api
    ready,
    setBaseline,
  ]);

  /* ---------------------------------------------------------------------- */
  /* Actions                                                                 */
  /* ---------------------------------------------------------------------- */

  const handleAdd = useCallback(async () => {
    if (!pageId?.trim()) return;
    if (isBusy || busyId) return;

    try {
      setBusyId("__add__");
      const nextIndex = list.length + 1;
      const nextTitle = t("admin.pageBlocksListSection.bloc.title", {
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
    async (blockId: string) => {
      if (!pageId?.trim()) return;
      if (isBusy || busyId) return;

      try {
        setBusyId(blockId);
        await remove(pageId, blockId);
      } finally {
        setBusyId(null);
      }
    },
    [busyId, isBusy, remove, pageId],
  );

  const move = useCallback(
    async (fromIndex: number, toIndex: number) => {
      if (!pageId?.trim()) return;
      if (isBusy || busyId) return;
      if (toIndex < 0 || toIndex >= list.length) return;
      if (fromIndex === toIndex) return;

      const ordered = list.map((b) => b.id);
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
  /* Render                                                                  */
  /* ---------------------------------------------------------------------- */

  const sectionIsLoading = Boolean(sectionLoading || isLoadingPage);
  const dataReady =
    !isLoading && !isLoadingIndex && !isLoadingSettingsBundle && !isLoadingPage;

  const isEmpty =
    dataReady &&
    pageBaselinePreview != null &&
    pageBaselinePreview.blocks.length === 0;

  const emptyLabel = t("admin.emptyPreview.pageEmpty");

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
        aria-label={t("admin.pageBlocksListSection.bloc.back")}
      >
        <Link
          href={backHref}
          onClick={(e) => {
            if (e.defaultPrevented) return;
            if (e.button !== 0) return;
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

            e.preventDefault();
            void dirtyGuard.navigate(backHref);
          }}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("admin.pageBlocksListSection.bloc.back")}
        </Link>
      </Button>

      {/* ------------------------------------------------------------------ */}
      {/* Blocks list (toujours visible)                                      */}
      {/* ------------------------------------------------------------------ */}

      <Card variant="panel">
        <CardContent className="flex flex-col gap-2">
          {list.length > 0 ? (
            <ul className={cn(STACK_SM)}>
              {list.map((b, index) => {
                const isRowBusy = deletingBlockId === b.id || busyId === b.id;

                return (
                  <li
                    key={toStableUiKey({ id: b.id, label: b.type }, index)}
                    className={cn(STACK_SM)}
                  >
                    <PageBlockListItem
                      block={b}
                      statusKind={statusByBlockId[b.id]}
                      onMoveUp={() => move(index, index - 1)}
                      onMoveDown={() => move(index, index + 1)}
                      onEdit={() => {
                        router.push(
                          `/${locale}/pages/${pageId}/blocks/${b.id}`,
                        );
                      }}
                      onDelete={() => handleDelete(b.id)}
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
            ariaLabel={t("admin.pageBlocksListSection.bloc.add")}
            tooltip={t("admin.pageBlocksListSection.bloc.add")}
            compact
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Pages filles (repliable)                                            */}
      {/* ------------------------------------------------------------------ */}

      <ExpandableLayout
        id="page-blocks-children"
        label={t("admin.pageForm.childrens.label", { count: children.length })}
        defaultOpen={false}
        disabled={children.length === 0}
      >
        {children.length > 0 ? (
          <Card variant="panel">
            <CardContent>
              <Text as="p" variant="muted">
                {t("admin.pageForm.childrens.help")}
              </Text>

              <ul className={cn(STACK_SM, "mt-4")}>
                {children.map((p, idx) => (
                  <li key={p.id}>
                    <ChildPageListItem
                      page={p}
                      statusKind={statusByPageId[p.id]}
                      index={idx}
                      total={children.length}
                      isReordering={isBusy || Boolean(busyId)}
                      onMoveUp={() => moveChild(idx, idx - 1)}
                      onMoveDown={() => moveChild(idx, idx + 1)}
                    />
                    {idx < children.length - 1 ? <Separator /> : null}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}
      </ExpandableLayout>

      {/* ------------------------------------------------------------------ */}
      {/* Settings page (repliable)                                           */}
      {/* ------------------------------------------------------------------ */}

      <ExpandableLayout
        id="page-blocks-settings"
        label={t("admin.pageBlocksListSection.section.pageSettings")}
        defaultOpen={false}
        disabled={false}
      >
        {warningHints.length > 0 ? (
          <HintList
            variant="warning"
            title={t("admin.shared.warningsPanel.title")}
            hints={warningHints}
          />
        ) : null}

        <PageForm
          initialValues={initialValues}
          parentOptions={parentOptions}
          isSaving={isUpdating}
          mode="edit"
          bFocusFields={false}
          bCancelAlwaysEnabledInEdit={true}
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

      {/* ------------------------------------------------------------------ */}
      {/* Preview                                                             */}
      {/* ------------------------------------------------------------------ */}

      <PreviewFrame
        title={t("admin.shared.preview.title", {
          entity: t("admin.shared.entities.page"),
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
            ? t("admin.emptyPreview.pageEmpty")
            : !isPreviewLoading
              ? t("admin.shared.preview.infoBaseline")
              : t("admin.overviewSection.preview.loading")
        }
      />
    </SettingsSection>
  );
}

PageBlocksListSection.displayName = "PageBlocksListSection";
