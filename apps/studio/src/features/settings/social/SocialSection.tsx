"use client";

/**
 * @file apps/studio/src/features/settings/social/SocialSection.tsx
 * @layer ui/sections
 *
 * @description
 * Section d’administration dédiée aux liens sociaux : chargement (shell), édition (form), warnings UI et preview.
 *
 * @remarks
 * - Le chargement initial est géré par `SettingsSection` (shell).
 * - Monte `useSocialSettings` (baseline + save) et câble `SocialForm`.
 * - Affiche les warnings non bloquants (via `SocialForm` + `computeSocialWarnings` au submit).
 * - La preview `/preview/social` consomme le scope `social` (draft possible).
 * - Strictement UI-only : aucune logique métier.
 */

import type { SocialSettingsShape } from "@compoz/validation/site/settings/social/social";
import type { SocialFormValues } from "@compoz/validation/site/settings/social/social-form";
import { ExpandableLayout } from "@compoz/studio/components/layouts/ExpandableLayout";
import { SettingsSection } from "@compoz/studio/components/layouts/SettingsSection";
import { HintList } from "@compoz/studio/components/molecules/feedback/HintList";
import { useConfirmList } from "@compoz/studio/features/confirm/useConfirmList";
import { useAdminDirtyGuard } from "@compoz/studio/features/dirty-guard/useAdminDirtyGuard";
import { useAdminPreview } from "@compoz/studio/features/preview/hooks/useAdminPreview";
import { PreviewFrame } from "@compoz/studio/features/preview/PreviewFrame";
import { toSocialSettingsShapeFromFormValues } from "@compoz/studio/features/settings/mappers/social-form";
import { SocialForm } from "@compoz/studio/features/settings/social/components/organisms/SocialForm";
import { useSocialSettings } from "@compoz/studio/features/settings/social/useSocialSettings";
import {
  computeSocialWarnings,
  type SocialWarningKey,
} from "@compoz/studio/features/settings/social/validate";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

export function SocialSection() {
  const confirmList = useConfirmList();
  const t = useTranslations();

  const dirtyGuard = useAdminDirtyGuard();

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
    useAdminPreview<SocialSettingsShape>("social", baselinePreview);

  // ✅ Empty state : on considère "empty" une fois la data prête et sans items.
  // (on se base sur la baseline brute RHF, pas sur baselinePreview, pour éviter les defaults du mapper)
  const dataReady = !isLoading && baseline != null;
  const isEmpty = dataReady && (baseline?.items?.length ?? 0) === 0;

  const emptyLabel = t("admin.emptyPreview.social");

  // Preview loading : on attend la baseline social + le handshake du scope principal.
  // ⚠️ si empty => pas de loader (sinon impression de bug)
  const isPreviewLoading =
    !isEmpty && (isLoading || baseline == null || !ready.isReady("social"));

  // État UI local du panel preview : baseline vs override (après Sync).
  const [previewMode, setPreviewMode] = useState<"baseline" | "override">(
    "baseline",
  );

  const handlePreviewSync = useCallback(() => {
    frame.onSync();
    setPreviewMode("override");
  }, [frame, setPreviewMode]);

  const handlePreviewReset = useCallback(() => {
    frame.onReset();
    setPreviewMode("baseline");
  }, [frame, setPreviewMode]);

  // Warnings UI (non bloquants).

  // Warnings live dérivés des valeurs RHF (affichage uniquement).
  const [warningKeys, setWarningKeys] = useState<SocialWarningKey[]>([]);

  const warningHints = useMemo(
    () => warningKeys.map((k) => t(`admin.socialSection.warnings.${k}`)),
    [warningKeys, t],
  );

  // Submit : confirmation si warnings + save.
  const handleSubmit = useCallback(
    async (values: SocialFormValues) => {
      if (isLoading || isSaving) return;

      // 1) Warnings recalculés au submit (source de vérité).
      const warningKeysNow = computeSocialWarnings({
        items: values.items ?? [],
      });
      const warningHintsNow = warningKeysNow.map((k) =>
        t(`admin.socialSection.warnings.${k}`),
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

      // 3) Save.
      await save(values);
      dirtyGuard.setDirty(false);
      const nextBaselinePreview = toSocialSettingsShapeFromFormValues(values);
      setBaseline<SocialSettingsShape>("social", nextBaselinePreview);
      frame.onReset();
      setPreviewMode("baseline");
    },
    [confirmList, isLoading, isSaving, dirtyGuard, save, setBaseline, frame, t],
  );

  // Render.

  const description = t("admin.socialSection.section.description");

  return (
    <SettingsSection
      id="social"
      title={t("admin.socialSection.section.title")}
      description={description}
      isBusy={isSaving}
      isLoading={isLoading}
      blockingErrorsCount={blockingErrorsCount}
      isDirty={dirtyGuard.isDirty}
    >
      <ExpandableLayout
        id="social-warnings"
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
        title={t("admin.shared.preview.title", {
          entity: t("admin.shared.entities.social"),
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
            ? t("admin.emptyPreview.social")
            : previewMode === "override"
              ? t("admin.shared.preview.infoOverride")
              : t("admin.shared.preview.infoBaseline")
        }
      />
    </SettingsSection>
  );
}

SocialSection.displayName = "SocialSection";
