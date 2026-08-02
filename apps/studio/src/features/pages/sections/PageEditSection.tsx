"use client";

/**
 * @file apps/studio/src/features/pages/sections/PageEditSection.tsx
 * @layer studio/features/pages/sections
 *
 * @description
 * Studio section for creating or editing page metadata.
 *
 * @remarks
 * - In edit mode, reads the full page because the SiteIndex does not carry every editable field.
 * - Keeps a baseline ref for minimal update patches after warning confirmation.
 */

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { SiteIndexDTO } from "@compoz/core/domain/site/dto";
import { SettingsSection } from "@compoz/studio/components/layouts/SettingsSection";
import { StudioWarningsPanel } from "@compoz/studio/features/_shared/components/StudioWarningsPanel";
import { useStudioSaveDespiteWarningsConfirm } from "@compoz/studio/features/_shared/hooks/useStudioSaveDespiteWarningsConfirm";
import { PageForm } from "@compoz/studio/features/pages/components/organisms/PageForm";
import { resolvePageStructureParent } from "@compoz/studio/features/pages/cache/page-snapshot";
import { useCreatePage } from "@compoz/studio/features/pages/hooks/useCreatePage";
import { useInternalPageOptions } from "@compoz/studio/features/pages/hooks/useInternalPageOptions";
import { useReadPage } from "@compoz/studio/features/pages/hooks/useReadPage";
import { useUpdatePage } from "@compoz/studio/features/pages/hooks/useUpdatePage";
import type { PageEditBaseline } from "@compoz/studio/features/pages/hooks/useUpdatePage";
import { shouldApplyPageUpdateSuccessCleanup } from "@compoz/studio/features/pages/hooks/page-update-submission";
import {
  createPageMetadataConflictState,
  type PageMetadataConflictState,
} from "@compoz/studio/features/pages/conflicts/page-metadata-conflict";
import type { PageMetadataConflictResolutionOutcome } from "@compoz/studio/features/pages/conflicts/page-metadata-conflict-controller";
import { applyPageEditMetadataResolutionPresentationCleanup } from "@compoz/studio/features/pages/conflicts/page-metadata-conflict-presentation-cleanup";
import {
  usePageMetadataConflictPersistence,
} from "@compoz/studio/features/pages/conflicts/usePageMetadataConflictPersistence";
import {
  rebasePageStructureConflictParent,
  type PageStructureConflictRebase,
} from "@compoz/studio/features/pages/conflicts/page-structure-conflict";
import {
  normalizePageFormValues,
  toPageFormValuesFromDraftSources,
  type PageFormDirtyFields,
  type PageFormSubmissionResult,
} from "@compoz/studio/features/pages/mappers/pages-form";
import type { PageWarningKey } from "@compoz/studio/features/pages/validation/validate";
import { computePageWarnings } from "@compoz/studio/features/pages/validation/validate";
import type { PageFormValues } from "@compoz/validation/pages/page-form";

type PageEditSectionProps = Readonly<{
  index: SiteIndexDTO | null;

  isLoading?: boolean;

  editId: string | null;

  onCancelEdit: () => void;

  onDirtyChange?: (dirty: boolean) => void;
}>;

export function PageEditSection({
  index,
  isLoading,
  editId,
  onCancelEdit,
  onDirtyChange,
}: PageEditSectionProps) {
  const t = useTranslations();
  const { confirmSaveDespiteWarnings } = useStudioSaveDespiteWarningsConfirm();

  const [formKey, setFormKey] = useState(0);
  const [isMetaDirty, setIsMetaDirty] = useState(false);
  const [blockingErrorsCount, setBlockingErrorsCount] = useState(0);
  const [warningKeys, setWarningKeys] = useState<PageWarningKey[]>([]);

  const mode: "create" | "edit" = editId ? "edit" : "create";

  /** SiteIndex is only a summary; edit mode needs the full page payload. */
  const {
    page,
    revisions,
    isLoading: isLoadingPage,
  } = useReadPage(editId ?? "");

  /** Baseline used to build minimal update patches. */
  const baselineRef = useRef<PageEditBaseline | null>(null);
  const submittedBaselineRef = useRef<PageEditBaseline | null>(null);
  const submittedValuesRef = useRef<PageFormValues | null>(null);
  const baselinePageIdRef = useRef<string | null>(null);
  const structureConflictRebaseRef =
    useRef<PageStructureConflictRebase | null>(null);
  const [metadataConflictEntry, setMetadataConflictEntry] = useState<{
    pageId: string;
    state: PageMetadataConflictState;
  } | null>(null);
  const metadataConflict =
    metadataConflictEntry?.pageId === editId
      ? metadataConflictEntry.state
      : null;

  const indexPage = useMemo(() => {
    if (!editId || !index) return null;
    return index.pages.find((pageItem) => pageItem.id === editId) ?? null;
  }, [editId, index]);
  const refName = indexPage?.name ?? null;

  const initialValues = useMemo<PageFormValues>(() => {
    if (mode === "create") {
      return toPageFormValuesFromDraftSources(null, undefined, "");
    }

    const base = toPageFormValuesFromDraftSources(
      page,
      indexPage?.parentId,
      editId ?? "",
    );
    if (page) return base;

    return {
      ...base,
      name: (refName ?? base.name ?? "").trim(),
    };
  }, [mode, page, editId, indexPage, refName]);

  useEffect(() => {
    if (mode === "create") {
      baselinePageIdRef.current = null;
      baselineRef.current = null;
      return;
    }

    if (
      !page ||
      !revisions ||
      !indexPage ||
      baselinePageIdRef.current === editId
    ) {
      return;
    }
    baselinePageIdRef.current = editId;
    baselineRef.current = {
      values: toPageFormValuesFromDraftSources(
        page,
        indexPage.parentId,
        editId ?? "",
      ),
      metaRevision: revisions.metaRevision,
    };
  }, [editId, indexPage, mode, page, revisions]);

  const sectionTitle =
    mode === "edit"
      ? t("studio.pageEditSection.section.titleEdit", {
          title: page?.name ?? refName ?? editId ?? "",
        })
      : t("studio.pageEditSection.section.titleCreate");

  const description =
    mode === "edit"
      ? t("studio.pageEditSection.section.descriptionEdit")
      : t("studio.pageEditSection.section.descriptionCreate");

  const { options: parentOptionsDto } = useInternalPageOptions({
    excludePageId: editId,
    rootsOnly: true,
    valueMode: "id",
  });

  const parentOptions = useMemo(
    () => parentOptionsDto.map(({ value, label }) => ({ value, label })),
    [parentOptionsDto],
  );

  const { create, isCreating } = useCreatePage();

  const {
    update,
    resolveMetadataConflict,
    adoptMetadataConflictCurrent,
    isUpdating,
  } = useUpdatePage({
    onSuccess: ({ response }) => {
      const responseParent = resolvePageStructureParent(
        response.structure?.index.pages,
        response.page.id,
        indexPage?.parentId,
      );
      baselineRef.current = {
        values: toPageFormValuesFromDraftSources(
          response.page,
          responseParent,
          response.page.slug,
        ),
        metaRevision: response.revisions.metaRevision,
      };
      structureConflictRebaseRef.current = null;
      setMetadataConflictEntry(null);
      setFormKey((key) => key + 1);
      onCancelEdit();
    },
    onMetadataConflict: (details) => {
      const baseline = submittedBaselineRef.current ?? baselineRef.current;
      const local = submittedValuesRef.current;
      if (!baseline || !local) return;
      setMetadataConflictEntry({
        pageId: details.current.page.id,
        state: createPageMetadataConflictState(
          details,
          baseline.values,
          local,
        ),
      });
    },
    onStructureConflict: (details) => {
      const baseline = baselineRef.current;
      const currentPageId = (page?.id ?? editId ?? "").trim();
      if (!baseline || !currentPageId) return;

      const rebase = rebasePageStructureConflictParent({
        baseline,
        details,
        pageId: currentPageId,
      });
      if (!rebase) return;

      baselineRef.current = rebase.baseline;
      structureConflictRebaseRef.current = rebase;
    },
  });

  const isSaving = isCreating || isUpdating;
  const isBusy = Boolean(isSaving);

  const handleSubmit = useCallback(
    async (
      values: PageFormValues,
      dirtyFields: PageFormDirtyFields,
    ): Promise<PageFormSubmissionResult> => {
      const warningKeysNow = computePageWarnings({
        name: values.name ?? "",
        seoTitle: values.seoTitle ?? null,
        seoDescription: values.seoDescription ?? null,
        parentId: values.parentId ?? null,
        slug: values.slug ?? "",
        sitemap: values.sitemap ?? null,
        paginationEnabled: values.paginationEnabled ?? false,
      });

      const ok = await confirmSaveDespiteWarnings(
        warningKeysNow,
        "studio.pageEditSection.warnings",
      );

      if (!ok) return;

      const normalized = normalizePageFormValues(values);

      if (mode === "create") {
        await create(normalized);

        setWarningKeys([]);
        setBlockingErrorsCount(0);
        setIsMetaDirty(false);
        onDirtyChange?.(false);

        setFormKey((key) => key + 1);
        return;
      }

      const originalId = (page?.id ?? editId ?? "").trim();
      if (!originalId) return;

      const baselineForPatch = baselineRef.current;
      if (!baselineForPatch) return;
      submittedBaselineRef.current = baselineForPatch;
      submittedValuesRef.current = normalized;
      const outcome = await update(
        originalId,
        baselineForPatch,
        normalized,
        dirtyFields,
      );
      if (outcome === "structureConflict") {
        const rebase = structureConflictRebaseRef.current;
        structureConflictRebaseRef.current = null;
        return rebase
          ? { rebaseParentId: rebase.parentId, notice: rebase.notice }
          : undefined;
      }
      if (!shouldApplyPageUpdateSuccessCleanup(outcome)) {
        return;
      }

    },
    [
      confirmSaveDespiteWarnings,
      create,
      editId,
      mode,
      onDirtyChange,
      page,
      update,
    ],
  );

  const closeMetadataConflict = useCallback(() => {
    setMetadataConflictEntry(null);
  }, []);

  const handleMetadataResolved = useCallback((
    outcome: PageMetadataConflictResolutionOutcome,
  ) => {
    applyPageEditMetadataResolutionPresentationCleanup(outcome, {
      clearWarnings: () => setWarningKeys([]),
      clearBlockingErrors: () => setBlockingErrorsCount(0),
      markSectionClean: () => {
        setIsMetaDirty(false);
        onDirtyChange?.(false);
      },
      clearStructureConflict: () => {
        structureConflictRebaseRef.current = null;
      },
      remountForm: () => setFormKey((key) => key + 1),
      closeEditor: onCancelEdit,
    });
  }, [onCancelEdit, onDirtyChange]);

  const metadataConflictPersistence = usePageMetadataConflictPersistence({
    baselineRef,
    submittedBaselineRef,
    submittedValuesRef,
    resolveMetadataConflict,
    adoptCache: adoptMetadataConflictCurrent,
    close: closeMetadataConflict,
    onResolved: handleMetadataResolved,
  });

  const sectionLoading = Boolean(
    isLoading || (mode === "edit" && isLoadingPage),
  );

  return (
    <SettingsSection
      id="page-edit"
      title={sectionTitle}
      description={description}
      isBusy={isBusy}
      isLoading={sectionLoading}
      isDirty={isMetaDirty}
      blockingErrorsCount={blockingErrorsCount}
    >
      <StudioWarningsPanel
        id="page-edit-warnings"
        warningKeys={warningKeys}
        warningMessageKeyPrefix="studio.pageEditSection.warnings"
      />

      <PageForm
        key={`${editId ?? "create"}:${
          page && indexPage ? "ready" : "loading"
        }:${formKey}`}
        initialValues={initialValues}
        parentOptions={parentOptions}
        isSaving={isSaving}
        mode={mode}
        onSubmit={handleSubmit}
        metadataConflict={metadataConflict}
        onMetadataConflictAbandon={closeMetadataConflict}
        onMetadataConflictCommit={metadataConflictPersistence.commit}
        onMetadataConflictMutate={metadataConflictPersistence.mutate}
        onReset={() => {
          setWarningKeys([]);
          setBlockingErrorsCount(0);
          setIsMetaDirty(false);
          setMetadataConflictEntry(null);
          structureConflictRebaseRef.current = null;
          onDirtyChange?.(false);
          setFormKey((key) => key + 1);

          if (mode === "edit") {
            onCancelEdit();
          }
        }}
        onWarningKeysChange={setWarningKeys}
        onDirtyChange={(dirty) => {
          const nextDirty = Boolean(dirty);
          setIsMetaDirty(nextDirty);
          onDirtyChange?.(nextDirty);
        }}
        onBlockingErrorsCountChange={setBlockingErrorsCount}
      />
    </SettingsSection>
  );
}

PageEditSection.displayName = "PageEditSection";
