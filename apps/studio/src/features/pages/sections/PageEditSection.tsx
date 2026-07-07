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
import { useCreatePage } from "@compoz/studio/features/pages/hooks/useCreatePage";
import { useInternalPageOptions } from "@compoz/studio/features/pages/hooks/useInternalPageOptions";
import { useReadPage } from "@compoz/studio/features/pages/hooks/useReadPage";
import { useUpdatePage } from "@compoz/studio/features/pages/hooks/useUpdatePage";
import {
  normalizePageFormValues,
  toPageFormValuesFromDTO,
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
  const { page, isLoading: isLoadingPage } = useReadPage(editId ?? "");

  /** Baseline used to build minimal update patches. */
  const baselineRef = useRef<PageFormValues | null>(null);

  const refName = useMemo(() => {
    if (!editId || !index) return null;
    return index.pages.find((pageItem) => pageItem.id === editId)?.name ?? null;
  }, [editId, index]);

  const initialValues = useMemo<PageFormValues>(() => {
    if (mode === "create") {
      return toPageFormValuesFromDTO(null, "");
    }

    const base = toPageFormValuesFromDTO(page, editId ?? "");
    if (page) return base;

    return {
      ...base,
      name: (refName ?? base.name ?? "").trim(),
    };
  }, [mode, page, editId, refName]);

  useEffect(() => {
    baselineRef.current = initialValues;
  }, [initialValues]);

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

  const { update, isUpdating } = useUpdatePage(async () => {
    setFormKey((key) => key + 1);
    onCancelEdit();
  });

  const isSaving = isCreating || isUpdating;
  const isBusy = Boolean(isSaving);

  const handleSubmit = useCallback(
    async (values: PageFormValues) => {
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

      const baselineForPatch = baselineRef.current ?? initialValues;
      await update(originalId, baselineForPatch, normalized);
    },
    [
      confirmSaveDespiteWarnings,
      create,
      editId,
      initialValues,
      mode,
      onDirtyChange,
      page,
      update,
    ],
  );

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
        key={formKey}
        initialValues={initialValues}
        parentOptions={parentOptions}
        isSaving={isSaving}
        mode={mode}
        onSubmit={handleSubmit}
        onReset={() => {
          setWarningKeys([]);
          setBlockingErrorsCount(0);
          setIsMetaDirty(false);
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
