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
 * - La preview `/preview/social` consomme le scope `social` en mise à jour live.
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
  const [warningKeys, setWarningKeys] = useState<SocialWarningKey[]>([]);
  const [previewDraft, setPreviewDraft] = useState<SocialSettingsShape | null>(
    null,
  );

  // Hook settings : modèle UI (RHF).
  const { baseline, isLoading, isSaving, save } = useSocialSettings();

  /**
   * Baseline preview :
   * - toujours dérivée de la baseline courante du hook
   * - plus de gating sur `hasLoadedOnce`
   */
  const baselinePreview = useMemo<SocialSettingsShape>(
    () => toSocialSettingsShapeFromFormValues(baseline),
    [baseline],
  );

  /**
   * Valeur effectivement affichée dans la preview :
   * - draft live si l’utilisateur modifie le form
   * - sinon baseline persistée
   */
  const previewValue = previewDraft ?? baselinePreview;

  const { ready, iframeRef, frame } = useStudioPreview<SocialSettingsShape>(
    "social",
    {
      baseline: previewValue,
      liveEnabled: true,
    },
  );

  // Empty state : on considère "empty" une fois la data prête et sans items.
  const dataReady = !isLoading;
  const isEmpty = dataReady && (baseline?.items?.length ?? 0) === 0;

  const emptyLabel = t("studio.emptyPreview.social");

  // Preview loading : on attend la baseline social + le handshake du scope principal.
  const isPreviewLoading = !isEmpty && (isLoading || !ready.isReady("social"));

  // Submit : confirmation si warnings + save.
  const handleSubmit = useCallback(
    async (values: SocialFormValues) => {
      if (isLoading || isSaving) return;

      const warningKeysNow = computeSocialWarnings({
        items: values.items ?? [],
      });

      const ok = await confirmSaveDespiteWarnings(
        warningKeysNow,
        "studio.socialSection.warnings",
      );
      if (!ok) return;

      await save(values);
      dirtyGuard.setDirty(false);

      /**
       * Après save :
       * - on efface le draft live
       * - la preview retombe naturellement sur la nouvelle baseline persistée
       */
      setPreviewDraft(null);
    },
    [confirmSaveDespiteWarnings, isLoading, isSaving, dirtyGuard, save],
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
          setBlockingErrorsCount(0);
          dirtyGuard.setDirty(false);
          setPreviewDraft(null);
        }}
        onWarningKeysChange={setWarningKeys}
        onValuesChange={(values) => {
          setPreviewDraft(toSocialSettingsShapeFromFormValues(values));
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
        isLoading={isPreviewLoading}
        isEmpty={isEmpty}
        emptyLabel={emptyLabel}
        heightClassName="h-[80px]"
        info={
          isEmpty
            ? t("studio.emptyPreview.social")
            : t("studio.shared.preview.infoLive")
        }
      />
    </SettingsSection>
  );
}

SocialSection.displayName = "SocialSection";
