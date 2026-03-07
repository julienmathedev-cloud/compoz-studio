"use client";

/**
 * @file apps/studio/src/features/settings/legal-menu/LegalMenuSection.tsx
 * @layer ui/studio/sections
 *
 * @description
 * Section Studio dédiée au menu légal : chargement (shell), édition (form), warnings UI et preview.
 *
 * @remarks
 * - Le chargement initial est géré par `SettingsSection` (shell).
 * - Monte `useLegalMenuSettings` (baseline + save) et câble `LegalMenuForm`.
 * - Affiche les warnings non bloquants (via `LegalMenuForm` + `computeLegalMenuWarnings` au submit).
 * - La preview `/preview/legal-menu` consomme le scope `legalMenu` (draft possible).
 * - Strictement UI-only : aucune logique métier.
 */

import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

import { SettingsSection } from "@compoz/studio/components/layouts/SettingsSection";
import { StudioWarningsPanel } from "@compoz/studio/features/_shared/components/StudioWarningsPanel";
import { useStudioSaveDespiteWarningsConfirm } from "@compoz/studio/features/_shared/hooks/useStudioSaveDespiteWarningsConfirm";
import { useInternalPageOptions } from "@compoz/studio/features/pages/hooks/useInternalPageOptions";
import { PreviewFrame } from "@compoz/studio/features/preview/PreviewFrame";
import { useStudioPreview } from "@compoz/studio/features/preview/hooks/useStudioPreview";
import { toLegalMenuSettingsShapeFromFormValues } from "@compoz/studio/features/settings/mappers/legal-menu-form";
import { LegalMenuForm } from "@compoz/studio/features/settings/menus/legal-menu/components/organisms/LegalMenuForm";
import { useLegalMenuSettings } from "@compoz/studio/features/settings/menus/legal-menu/useLegalMenuSettings";
import {
  computeLegalMenuWarnings,
  type LegalMenuWarningKey,
} from "@compoz/studio/features/settings/menus/legal-menu/validate";
import type { LegalMenuSettingsShape } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu";
import type { LegalMenuFormValues } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu-form";

type LegalMenuSectionProps = Readonly<{
  /** Remonte l’état dirty (guard / navigation) au parent (Tab/Dashboard). */
  onDirtyChange?: (dirty: boolean) => void;
}>;

export function LegalMenuSection({ onDirtyChange }: LegalMenuSectionProps) {
  const t = useTranslations();
  const { confirmSaveDespiteWarnings } = useStudioSaveDespiteWarningsConfirm();

  const [isDirty, setIsDirty] = useState(false);

  // Hook settings : modèle UI (RHF).
  const { baseline, isLoading, isSaving, save } = useLegalMenuSettings();

  const [previewMode, setPreviewMode] = useState<"baseline" | "override">(
    "baseline",
  );

  // Options internes (picker) — centralisées via hook (SoT = SiteIndex).
  const { options: internalPageOptions, isLoading: isIndexLoading } =
    useInternalPageOptions();

  // Preview (iframe).

  // Pont UI → Preview/Public : RHF (UI) → SettingsShape (preview).
  const baselinePreview = useMemo<LegalMenuSettingsShape>(
    () => toLegalMenuSettingsShapeFromFormValues(baseline),
    [baseline],
  );

  const { ready, frame, setBaseline, setDraft, iframeRef } =
    useStudioPreview<LegalMenuSettingsShape>("legalMenu", baselinePreview);

  /**
   * Empty state (dans l’iframe) :
   * - On ne l’active qu’une fois les chargements data terminés.
   * - Si la baseline est absente => empty preview au lieu d’un écran blanc.
   */
  const dataReady = !isLoading && !isIndexLoading && baseline != null;

  // Empty = baseline chargée mais aucun item.
  const isEmpty = dataReady && (baseline?.items?.length ?? 0) === 0;

  const emptyLabel = t("studio.emptyPreview.legalMenu");

  // Preview loading : si empty => pas de loader
  const isPreviewLoading =
    !isEmpty &&
    (isLoading ||
      isIndexLoading ||
      baseline == null ||
      !ready.isReady("legalMenu"));

  const handlePreviewSync = useCallback(() => {
    frame.onSync();
    setPreviewMode("override");
  }, [frame]);

  const handlePreviewReset = useCallback(() => {
    frame.onReset();
    setPreviewMode("baseline");
  }, [frame]);

  // Ensemble des href internes connus (warnings UI).
  // On se base sur les options (déjà normalisées via formatPagePath dans le hook).
  const hrefSet = useMemo(() => {
    const set = new Set<string>();
    set.add("/");

    for (const opt of internalPageOptions ?? []) {
      if (opt?.value) {
        set.add(String(opt.value));
      }
    }

    return set;
  }, [internalPageOptions]);

  // Warnings UI (non bloquants).

  // Warnings live dérivés des valeurs RHF (affichage uniquement).
  const [warningKeys, setWarningKeys] = useState<LegalMenuWarningKey[]>([]);

  const [blockingErrorsCount, setBlockingErrorsCount] = useState(0);

  // Submit : confirmation si warnings + save.
  const handleSubmit = useCallback(
    async (values: LegalMenuFormValues) => {
      if (isLoading || isSaving) return;

      // 1) Warnings recalculés au submit (source de vérité).
      const warningKeysNow = computeLegalMenuWarnings({
        items: values.items ?? [],
        hrefSet,
      });

      // 2) Confirmation si warnings.
      const ok = await confirmSaveDespiteWarnings(
        warningKeysNow,
        "studio.legalMenuSection.warnings",
      );

      if (!ok) return;

      // 3) Save.
      await save(values);
      const nextBaseline = toLegalMenuSettingsShapeFromFormValues(values);
      setBaseline<LegalMenuSettingsShape>("legalMenu", nextBaseline);
      frame.onReset();
      setPreviewMode("baseline");
      setIsDirty(false);
      onDirtyChange?.(false);
    },
    [
      confirmSaveDespiteWarnings,
      hrefSet,
      isLoading,
      isSaving,
      save,
      onDirtyChange,
      setBaseline,
      frame,
    ],
  );

  const description = t("studio.legalMenuSection.section.description");

  return (
    <SettingsSection
      id="legal-menu"
      title={t("studio.legalMenuSection.section.title")}
      headingLevel="h2"
      description={description}
      isBusy={isSaving}
      isLoading={isLoading}
      isDirty={isDirty}
      blockingErrorsCount={blockingErrorsCount}
    >
      <StudioWarningsPanel
        id="legal-menu-warnings"
        warningKeys={warningKeys}
        warningMessageKeyPrefix="studio.legalMenuSection.warnings"
      />

      <LegalMenuForm
        initialValues={baseline}
        isSaving={isSaving}
        internalPageOptions={internalPageOptions}
        hrefSet={hrefSet}
        onSubmit={handleSubmit}
        onReset={() => {
          setWarningKeys([]);
          setDraft(baselinePreview);
          handlePreviewReset();
        }}
        onWarningKeysChange={setWarningKeys}
        onValuesChange={(values) => {
          // Live preview : RHF (UI) → SettingsShape.
          setDraft(toLegalMenuSettingsShapeFromFormValues(values));
        }}
        onBlockingErrorsCountChange={setBlockingErrorsCount}
        onDirtyChange={(dirty) => {
          setIsDirty(dirty); // badge local
          onDirtyChange?.(dirty); // remonte à MenuPage
        }}
      />

      <PreviewFrame
        title={t("studio.shared.preview.title", {
          entity: t("studio.shared.entities.legalMenu"),
        })}
        src="/preview/legal-menu"
        iframeRef={iframeRef}
        onLoad={frame.onLoad}
        onSync={handlePreviewSync}
        onReset={handlePreviewReset}
        syncDisabled={frame.syncDisabled}
        isLoading={isPreviewLoading}
        isEmpty={isEmpty}
        emptyLabel={emptyLabel}
        heightClassName="h-[80px]"
        info={
          isEmpty
            ? t("studio.emptyPreview.legalMenu")
            : previewMode === "override"
              ? t("studio.shared.preview.infoOverride")
              : t("studio.shared.preview.infoBaseline")
        }
      />
    </SettingsSection>
  );
}

LegalMenuSection.displayName = "LegalMenuSection";
