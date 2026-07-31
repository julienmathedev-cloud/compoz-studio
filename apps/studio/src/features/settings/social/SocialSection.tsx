"use client";

/**
 * @file apps/studio/src/features/settings/social/SocialSection.tsx
 * @layer studio/features/settings/social
 *
 * @description
 * Studio settings section for loading, editing, saving, and previewing social links.
 *
 * @remarks
 * - Keeps the persisted baseline and live preview draft separate so reset/save can restore the preview deterministically.
 * - Form warnings are kept live for editor feedback, then recomputed on submit before the confirmation flow.
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
import { SettingsConflictPanel } from "@compoz/studio/features/settings/conflicts/SettingsConflictPanel";
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

  const { baseline, conflict, isLoading, isSaving, save } = useSocialSettings();

  /** Runtime preview shape derived from the persisted RHF baseline. */
  const baselinePreview = useMemo<SocialSettingsShape>(
    () => toSocialSettingsShapeFromFormValues(baseline),
    [baseline],
  );

  const previewValue = previewDraft ?? baselinePreview;

  const { ready, iframeRef, frame } = useStudioPreview<SocialSettingsShape>(
    "social",
    {
      baseline: previewValue,
      liveEnabled: true,
    },
  );

  const dataReady = !isLoading;
  const isEmpty = dataReady && (baseline?.items?.length ?? 0) === 0;

  const emptyLabel = t("studio.emptyPreview.social");

  const isPreviewLoading = !isEmpty && (isLoading || !ready.isReady("social"));

  const handleSubmit = useCallback(
    async (values: SocialFormValues) => {
      if (isLoading || isSaving) return;
      // Recompute warnings at submit time so confirmation uses the latest validated values.
      const warningKeysNow = computeSocialWarnings({
        items: values.items ?? [],
      });

      const ok = await confirmSaveDespiteWarnings(
        warningKeysNow,
        "studio.socialSection.warnings",
      );
      if (!ok) return;

      const result = await save(values);
      if (result.status === "conflict") return;
      dirtyGuard.setDirty(false);

      /** Clear the live draft so preview falls back to the saved baseline returned by the hook. */
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
      {conflict ? <SettingsConflictPanel conflict={conflict} focusTargetId="social" /> : null}

      <SocialForm
        initialValues={baseline}
        isConflictResolving={conflict !== null}
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
