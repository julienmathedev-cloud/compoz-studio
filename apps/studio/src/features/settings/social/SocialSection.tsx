"use client";

/**
 * @file apps/studio/src/features/settings/social/SocialSection.tsx
 * @layer ui/studio/sections
 *
 * @description
 * Section Studio dédiée aux liens sociaux : chargement (shell), édition (form), warnings UI et preview.
 *
 * @remarks
 * - Le chargement initial est géré par `SettingsSection` (shell).
 * - Monte `useSocialSettings` (baseline + save) et câble `SocialForm`.
 * - Affiche les warnings non bloquants (via `SocialForm` + `computeSocialWarnings` au submit).
 * - La preview `/preview/social` consomme le scope `social` (draft possible).
 * - Strictement UI-only : aucune logique métier.
 */

import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

import { SettingsSection } from "@compoz/studio/components/layouts/SettingsSection";
import { StudioWarningsPanel } from "@compoz/studio/features/_shared/components/StudioWarningsPanel";
import { useStudioSaveDespiteWarningsConfirm } from "@compoz/studio/features/_shared/hooks/useStudioSaveDespiteWarningsConfirm";
import { useStudioDirtyGuard } from "@compoz/studio/features/dirty-guard/useStudioDirtyGuard";
import { PreviewFrame } from "@compoz/studio/features/preview/PreviewFrame";
import { useStudioPreview } from "@compoz/studio/features/preview/hooks/useStudioPreview";
import { toSocialSettingsShapeFromFormValues } from "@compoz/studio/features/settings/mappers/social-form";
import { SocialForm } from "@compoz/studio/features/settings/social/components/organisms/SocialForm";
import { useSocialSettings } from "@compoz/studio/features/settings/social/useSocialSettings";
import {
  computeSocialWarnings,
  type SocialWarningKey,
} from "@compoz/studio/features/settings/social/validate";
import type { SocialSettingsShape } from "@compoz/validation/site/settings/social/social";
import type { SocialFormValues } from "@compoz/validation/site/settings/social/social-form";

export function SocialSection() {
  const t = useTranslations();
  const { confirmSaveDespiteWarnings } = useStudioSaveDespiteWarningsConfirm();

  const dirtyGuard = useStudioDirtyGuard();

  const [blockingErrorsCount, setBlockingErrorsCount] = useState(0);

  // Hook settings : modèle UI (RHF).
  const { baseline, isLoading, isSaving, save } = useSocialSettings();

  // Preview (iframe).

  // Pont UI → Preview/Public : RHF (UI) → SettingsShape (preview).
  const baselinePreview = useMemo<SocialSettingsShape>(
    () => toSocialSettingsShapeFromFormValues(baseline),
    [baseline],
  );

  const { ready, frame, setBaseline, setDraft, iframeRef } =
    useStudioPreview<SocialSettingsShape>("social", baselinePreview);

  // Empty state : on considère "empty" une fois la data prête et sans items.
  // (on se base sur la baseline brute RHF, pas sur baselinePreview, pour éviter les defaults du mapper)
  const dataReady = !isLoading && baseline != null;
  const isEmpty = dataReady && (baseline?.items?.length ?? 0) === 0;

  const emptyLabel = t("studio.emptyPreview.social");

  // Preview loading : on attend la baseline social + le handshake du scope principal.
  // si empty => pas de loader (sinon impression de bug)
  const isPreviewLoading =
    !isEmpty && (isLoading || baseline == null || !ready.isReady("social"));

  // État UI local du panel preview : baseline vs override (après Sync).
  const [previewMode, setPreviewMode] = useState<"baseline" | "override">(
    "baseline",
  );

  const handlePreviewSync = useCallback(() => {
    frame.onSync();
    setPreviewMode("override");
  }, [frame]);

  const handlePreviewReset = useCallback(() => {
    frame.onReset();
    setPreviewMode("baseline");
  }, [frame]);

  // Warnings UI (non bloquants).
  const [warningKeys, setWarningKeys] = useState<SocialWarningKey[]>([]);

  // Submit : confirmation si warnings + save.
  const handleSubmit = useCallback(
    async (values: SocialFormValues) => {
      if (isLoading || isSaving) return;

      // 1) Warnings recalculés au submit (source de vérité).
      const warningKeysNow = computeSocialWarnings({
        items: values.items ?? [],
      });

      // 2) Confirmation si warnings.
      const ok = await confirmSaveDespiteWarnings(
        warningKeysNow,
        "studio.socialSection.warnings",
      );
      if (!ok) return;

      // 3) Save.
      await save(values);
      dirtyGuard.setDirty(false);
      const nextBaselinePreview = toSocialSettingsShapeFromFormValues(values);
      setBaseline<SocialSettingsShape>("social", nextBaselinePreview);
      frame.onReset();
      setPreviewMode("baseline");
    },
    [
      confirmSaveDespiteWarnings,
      isLoading,
      isSaving,
      dirtyGuard,
      save,
      setBaseline,
      frame,
    ],
  );

  const description = t("studio.socialSection.section.description");

  return (
    <SettingsSection
      id="social"
      title={t("studio.socialSection.section.title")}
      description={description}
      isBusy={isSaving}
      isLoading={isLoading}
      blockingErrorsCount={blockingErrorsCount}
      isDirty={dirtyGuard.isDirty}
    >
      <StudioWarningsPanel
        id="social-warnings"
        warningKeys={warningKeys}
        warningMessageKeyPrefix="studio.socialSection.warnings"
      />

      <SocialForm
        initialValues={baseline}
        isSaving={isSaving}
        onSubmit={handleSubmit}
        onReset={() => {
          setWarningKeys([]);
          dirtyGuard.setDirty(false);
          // Reset preview sur la baseline (SettingsShape).
          setDraft(baselinePreview);
          handlePreviewReset();
        }}
        onWarningKeysChange={setWarningKeys}
        onValuesChange={(values) => {
          // Live preview : RHF (UI) → SettingsShape.
          setDraft(toSocialSettingsShapeFromFormValues(values));
        }}
        onBlockingErrorsCountChange={setBlockingErrorsCount}
        onDirtyChange={dirtyGuard.setDirty}
      />

      <PreviewFrame
        title={t("studio.shared.preview.title", {
          entity: t("studio.shared.entities.social"),
        })}
        src="/preview/social"
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
            ? t("studio.emptyPreview.social")
            : previewMode === "override"
              ? t("studio.shared.preview.infoOverride")
              : t("studio.shared.preview.infoBaseline")
        }
      />
    </SettingsSection>
  );
}

SocialSection.displayName = "SocialSection";
