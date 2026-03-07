"use client";

/**
 * @file apps/studio/src/features/settings/menus/primary-menu/PrimaryMenuSection.tsx
 * @layer ui/studio/sections
 *
 * @description
 * Section Studio dédiée au menu principal : chargement (shell), édition (form), warnings UI et preview.
 *
 * @remarks
 * - Le chargement initial est géré par `SettingsSection` (shell).
 * - Monte `usePrimaryMenuSettings` (baseline + save) et câble `PrimaryMenuForm`.
 * - Affiche les warnings non bloquants (via `PrimaryMenuForm` + `computePrimaryMenuWarnings` au submit).
 * - La preview `/preview/primary-menu` consomme le scope `primaryMenu` (draft possible).
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
import { toPrimaryMenuSettingsShapeFromFormValues } from "@compoz/studio/features/settings/mappers/primary-menu-form";
import { PrimaryMenuForm } from "@compoz/studio/features/settings/menus/primary-menu/components/organisms/PrimaryMenuForm";
import { usePrimaryMenuSettings } from "@compoz/studio/features/settings/menus/primary-menu/usePrimaryMenuSettings";
import type { PrimaryMenuWarningKey } from "@compoz/studio/features/settings/menus/primary-menu/validate";
import { computePrimaryMenuWarnings } from "@compoz/studio/features/settings/menus/primary-menu/validate";
import type { PrimaryMenuSettingsShape } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu";
import type { PrimaryMenuFormValues } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu-form";

type PrimaryMenuSectionProps = Readonly<{
  /** Remonte l’état dirty (guard / navigation) au parent (Tab/Dashboard). */
  onDirtyChange?: (dirty: boolean) => void;
}>;

export function PrimaryMenuSection({ onDirtyChange }: PrimaryMenuSectionProps) {
  const t = useTranslations();
  const { confirmSaveDespiteWarnings } = useStudioSaveDespiteWarningsConfirm();

  const [isDirty, setIsDirty] = useState(false);

  // Hook settings : modèle UI (RHF).
  const { baseline, isLoading, isSaving, save } = usePrimaryMenuSettings();

  const [previewMode, setPreviewMode] = useState<"baseline" | "override">(
    "baseline",
  );

  // Pont UI → Preview/Public : RHF (UI) → SettingsShape (preview).
  const baselinePreview = useMemo<PrimaryMenuSettingsShape>(
    () => toPrimaryMenuSettingsShapeFromFormValues(baseline),
    [baseline],
  );

  const { ready, frame, setBaseline, setDraft, iframeRef } =
    useStudioPreview<PrimaryMenuSettingsShape>("primaryMenu", baselinePreview);

  /**
   * internalPageOptions : via hook SoT (plus de mapping local depuis useReadSiteIndex)
   */
  const { options: internalPageOptions } = useInternalPageOptions();

  /**
   * hrefSet : inchangé, mais basé sur les options (déjà normalisées)
   * Important : on garde exactement la même intention fonctionnelle : set de href internes connus.
   */
  const hrefSet = useMemo(() => {
    const set = new Set<string>();
    set.add("/");

    for (const opt of internalPageOptions ?? []) {
      const value = String(opt?.value ?? "").trim();
      if (value) set.add(value);
    }

    return set;
  }, [internalPageOptions]);

  // Warnings UI (non bloquants).
  const [warningKeys, setWarningKeys] = useState<PrimaryMenuWarningKey[]>([]);
  const [blockingErrorsCount, setBlockingErrorsCount] = useState(0);

  // Preview empty/loader
  const dataReady = !isLoading && baseline != null;
  const isEmpty = dataReady && (baseline?.items?.length ?? 0) === 0;

  const emptyLabel = t("studio.emptyPreview.primaryMenu");

  // Preview loading : on attend la baseline primaryMenu + le handshake du scope principal.
  // si empty => pas de loader
  const isPreviewLoading =
    !isEmpty &&
    (isLoading || baseline == null || !ready.isReady("primaryMenu"));

  const handlePreviewSync = useCallback(() => {
    frame.onSync();
    setPreviewMode("override");
  }, [frame]);

  const handlePreviewReset = useCallback(() => {
    frame.onReset();
    setPreviewMode("baseline");
  }, [frame]);

  // Submit : confirmation si warnings + save.
  const handleSubmit = useCallback(
    async (values: PrimaryMenuFormValues) => {
      if (isLoading || isSaving) return;

      // 1) Warnings recalculés au submit (source de vérité).
      const warningKeysNow = computePrimaryMenuWarnings({
        items: values.items ?? [],
        hrefSet,
      });

      // 2) Confirmation si warnings.
      const ok = await confirmSaveDespiteWarnings(
        warningKeysNow,
        "studio.primaryMenuSection.warnings",
      );

      if (!ok) return;

      // 3) Save.
      await save(values);
      const nextBaseline = toPrimaryMenuSettingsShapeFromFormValues(values);
      setBaseline<PrimaryMenuSettingsShape>("primaryMenu", nextBaseline);
      frame.onReset();
      setPreviewMode("baseline");
      setIsDirty(false);
      onDirtyChange?.(false);
    },
    [
      confirmSaveDespiteWarnings,
      isLoading,
      isSaving,
      hrefSet,
      save,
      onDirtyChange,
      frame,
      setBaseline,
    ],
  );

  const description = t("studio.primaryMenuSection.section.description");

  return (
    <SettingsSection
      id="primary-menu"
      title={t("studio.primaryMenuSection.section.title")}
      headingLevel="h2"
      description={description}
      isBusy={isSaving}
      isLoading={isLoading}
      isDirty={isDirty}
      blockingErrorsCount={blockingErrorsCount}
    >
      <StudioWarningsPanel
        id="primary-menu-warnings"
        warningKeys={warningKeys}
        warningMessageKeyPrefix="studio.primaryMenuSection.warnings"
      />

      <PrimaryMenuForm
        initialValues={baseline}
        isSaving={isSaving}
        internalPageOptions={internalPageOptions}
        hrefSet={hrefSet}
        onSubmit={handleSubmit}
        onReset={() => {
          setWarningKeys([]);
          // Reset preview sur la baseline (SettingsShape).
          setDraft(baselinePreview);
          handlePreviewReset();
        }}
        onWarningKeysChange={setWarningKeys}
        onValuesChange={(values) => {
          // Live preview : RHF (UI) → SettingsShape.
          setDraft(toPrimaryMenuSettingsShapeFromFormValues(values));
        }}
        onBlockingErrorsCountChange={setBlockingErrorsCount}
        onDirtyChange={(dirty) => {
          setIsDirty(dirty);
          onDirtyChange?.(dirty);
        }}
      />

      <PreviewFrame
        title={t("studio.shared.preview.title", {
          entity: t("studio.shared.entities.primaryMenu"),
        })}
        src="/preview/primary-menu"
        iframeRef={iframeRef}
        onLoad={frame.onLoad}
        onSync={handlePreviewSync}
        onReset={handlePreviewReset}
        syncDisabled={frame.syncDisabled}
        isLoading={isPreviewLoading}
        isEmpty={isEmpty}
        emptyLabel={emptyLabel}
        heightClassName="h-[250px]"
        info={
          isEmpty
            ? t("studio.emptyPreview.primaryMenu")
            : previewMode === "override"
              ? t("studio.shared.preview.infoOverride")
              : t("studio.shared.preview.infoBaseline")
        }
      />
    </SettingsSection>
  );
}

PrimaryMenuSection.displayName = "PrimaryMenuSection";
