"use client";
/**
 * @file apps/studio/src/features/pages/pages/PageEditSection.tsx
 * @layer ui/sections
 *
 * @description
 * Section d’admin pour créer / éditer les métadonnées d’une page (title + slug + sitemap).
 *
 * @remarks
 * - Le chargement initial global (index, shell) est géré par le parent.
 * - En mode edit, la section lit la page complète via `useReadPage(pageId)` (nécessaire pour `sitemap`).
 * - Strictement UI-only : aucune logique métier.
 */

import type { SiteIndexDTO } from "@compoz/core/domain/site/dto";
import type { PageFormValues } from "@compoz/validation/pages/page-form";
import { ExpandableLayout } from "@compoz/studio/components/layouts/ExpandableLayout";
import { SettingsSection } from "@compoz/studio/components/layouts/SettingsSection";
import { HintList } from "@compoz/studio/components/molecules/feedback/HintList";
import { useConfirmList } from "@compoz/studio/features/confirm/useConfirmList";
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
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Props du composant `PageEditSection`.
 */
type PageEditSectionProps = Readonly<{
  /** Index du site (ordre + refs pages). Sert au parent/listing. */
  index: SiteIndexDTO | null;

  /** Indique un chargement côté parent (shell). */
  isLoading?: boolean;

  /** id en cours d’édition (null = création). */
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
  const confirmList = useConfirmList();
  const t = useTranslations();

  const [formKey, setFormKey] = useState(0);

  const mode: "create" | "edit" = editId ? "edit" : "create";

  /**
   * ✅ En mode edit, on lit la page complète (nécessaire pour `sitemap`).
   */
  const { page, isLoading: isLoadingPage } = useReadPage(editId ?? "");

  // ✅ Ref = uniquement pour le patch/diff (pas de lecture pendant render).
  const baselineRef = useRef<PageFormValues | null>(null);

  /**
   * Badges section (harmonisés).
   */
  const [isMetaDirty, setIsMetaDirty] = useState(false);
  const [blockingErrorsCount, setBlockingErrorsCount] = useState(0);

  /**
   * Titre de section : on peut encore s’aider de l’index pour afficher un titre
   * "Edit: {title}" même avant que la page complète soit chargée.
   */
  const refTitle = useMemo(() => {
    if (!editId || !index) return null;
    return index.pages.find((p) => p.id === editId)?.title ?? null;
  }, [editId, index]);

  const initialValues = useMemo<PageFormValues>(() => {
    // Mode create : valeurs par défaut UI (mapper = SoT).
    if (mode === "create") {
      return toPageFormValuesFromDTO(null, "");
    }

    // Mode edit :
    // - si `page` est dispo => hydrate depuis le DTO
    // - sinon => fallback minimal (slug + éventuellement le titre depuis l’index)
    const base = toPageFormValuesFromDTO(page, editId ?? "");
    if (page) return base;

    return {
      ...base,
      title: (refTitle ?? base.title ?? "").trim(),
    };
  }, [mode, page, editId, refTitle]);

  useEffect(() => {
    baselineRef.current = initialValues;
  }, [initialValues]);

  const sectionTitle =
    mode === "edit"
      ? t("admin.pageEditSection.section.titleEdit", {
          title: page?.title ?? refTitle ?? editId ?? "",
        })
      : t("admin.pageEditSection.section.titleCreate");

  const { options: parentOptionsDto } = useInternalPageOptions({
    excludePageId: editId,
    rootsOnly: true,
    valueMode: "id", // ✅ ici c’est bien un parentId
  });

  const parentOptions = useMemo(
    () => parentOptionsDto.map(({ value, label }) => ({ value, label })),
    [parentOptionsDto],
  );

  const { create, isCreating } = useCreatePage();

  const { update, isUpdating } = useUpdatePage(async () => {
    // ✅ même comportement que create : reset RHF (submitCount/touched/errors)
    setFormKey((k) => k + 1);
    // ✅ 4) sortir du mode edit
    onCancelEdit();
  });

  const isSaving = isCreating || isUpdating;

  // Warnings UI (non bloquants).
  const [warningKeys, setWarningKeys] = useState<PageWarningKey[]>([]);

  const warningHints = useMemo(
    () => warningKeys.map((k) => t(`admin.pageEditSection.warnings.${k}`)),
    [warningKeys, t],
  );

  const handleSubmit = useCallback(
    async (values: PageFormValues) => {
      // 1) Warnings recalculés au submit (source de vérité).
      const warningKeysNow = computePageWarnings({
        title: values.title ?? "",
        slug: values.slug ?? "",
        parentId: values.parentId ?? null,
        paginationEnabled: values.paginationEnabled ?? false,
      });

      const warningHintsNow = warningKeysNow.map((k) =>
        t(`admin.pageEditSection.warnings.${k}`),
      );

      // 2) Confirmation si warnings.
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

      // 3) Valeurs normalisées (trim + sitemap stable)
      const normalized = normalizePageFormValues(values);

      if (mode === "create") {
        await create(normalized);

        setWarningKeys([]);
        setBlockingErrorsCount(0);
        setIsMetaDirty(false);
        onDirtyChange?.(false);

        setFormKey((k) => k + 1);
        return;
      }

      const originalId = (page?.id ?? editId ?? "").trim();
      if (!originalId) return;

      const baselineForPatch = baselineRef.current ?? initialValues;

      // ✅ baseline + next -> diff + no-changes gérés dans le hook
      await update(originalId, baselineForPatch, normalized);
    },
    [
      confirmList,
      create,
      update,
      mode,
      t,
      page,
      editId,
      initialValues,
      onDirtyChange,
    ],
  );

  const description =
    mode === "edit"
      ? t("admin.pageEditSection.section.descriptionEdit")
      : t("admin.pageEditSection.section.descriptionCreate");

  const isBusy = Boolean(isSaving);

  // ✅ Important : l’état loading de la section = shell + (page loading en mode edit)
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
      <ExpandableLayout
        id="page-edit-warnings"
        label={
          warningHints.length > 0
            ? t("admin.shared.warningsPanel.labelWithCount", {
                count: warningHints.length,
              })
            : t("admin.shared.warningsPanel.label")
        }
        defaultOpen={false}
        disabled={warningHints.length === 0}
      >
        {warningHints.length > 0 ? (
          <HintList
            variant="warning"
            title={t("admin.shared.warningsPanel.title")}
            hints={warningHints}
          />
        ) : null}
      </ExpandableLayout>

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
          setFormKey((k) => k + 1);
          if (mode === "edit") onCancelEdit();
        }}
        onWarningKeysChange={setWarningKeys}
        onDirtyChange={(dirty) => {
          setIsMetaDirty(Boolean(dirty));
          onDirtyChange?.(Boolean(dirty));
        }}
        onBlockingErrorsCountChange={setBlockingErrorsCount}
      />
    </SettingsSection>
  );
}

PageEditSection.displayName = "PageEditSection";
