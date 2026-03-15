"use client";

/**
 * @file apps/studio/src/features/pages/pages/PageEditSection.tsx
 * @layer ui/studio/pages/sections
 *
 * @description
 * Section studio pour créer / éditer les métadonnées d’une page
 * (title + slug + sitemap).
 *
 * @remarks
 * - Le chargement initial global (index, shell) est géré par le parent.
 * - En mode edit, la section lit la page complète via `useReadPage(pageId)`
 *   (nécessaire pour `sitemap`).
 * - Strictement UI-only : aucune logique métier.
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

/**
 * Props du composant `PageEditSection`.
 */
type PageEditSectionProps = Readonly<{
  /** Index du site (ordre + refs pages). Sert au parent / listing. */
  index: SiteIndexDTO | null;

  /** Indique un chargement côté parent (shell). */
  isLoading?: boolean;

  /** Id en cours d’édition (`null` = création). */
  editId: string | null;

  /** Annule l’édition (revient au mode création). */
  onCancelEdit: () => void;

  /** Remonte l’état dirty (guard / navigation) au parent. */
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

  /**
   * En mode edit, on lit la page complète (nécessaire pour `sitemap`).
   */
  const { page, isLoading: isLoadingPage } = useReadPage(editId ?? "");

  /**
   * Ref utilisée uniquement pour le patch / diff.
   */
  const baselineRef = useRef<PageFormValues | null>(null);

  /**
   * Nom de référence depuis l’index, utile avant le chargement complet de la page.
   */
  const refName = useMemo(() => {
    if (!editId || !index) return null;
    return (
      index.pages.find((pageItem) => pageItem.id === editId)?.name ?? null
    );
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
        slug: values.slug ?? "",
        parentId: values.parentId ?? null,
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
