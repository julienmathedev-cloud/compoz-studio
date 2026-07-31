"use client";

/**
 * @file apps/studio/src/features/settings/theme/ThemeSection.tsx
 * @layer studio/features/settings/theme
 *
 * @description
 * Studio settings section for loading, editing, saving, and previewing public theme settings.
 *
 * @remarks
 * - Keeps the persisted baseline and live preview draft separate so reset/save can restore the preview deterministically.
 * - Form warnings are kept live for editor feedback, then recomputed on submit for the active token mode before confirmation.
 */

import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

import { SettingsSection } from "@compoz/studio/components/layouts/SettingsSection";
import { StudioWarningsPanel } from "@compoz/studio/features/_shared/components/StudioWarningsPanel";
import { useStudioSaveDespiteWarningsConfirm } from "@compoz/studio/features/_shared/hooks/useStudioSaveDespiteWarningsConfirm";
import { useStudioDirtyGuard } from "@compoz/studio/features/dirty-guard/useStudioDirtyGuard";
import { toThemeSettingsShapeFromFormValues } from "@compoz/studio/features/settings/mappers/theme-form";
import { ThemeForm } from "@compoz/studio/features/settings/theme/ThemeForm";
import { ThemePreviewCard } from "@compoz/studio/features/settings/theme/ThemePreviewCard";
import { useThemeSettings } from "@compoz/studio/features/settings/theme/useThemeSettings";
import { SettingsConflictPanel } from "@compoz/studio/features/settings/conflicts/SettingsConflictPanel";
import {
  computeThemeWarnings,
  type ThemeWarningKey,
} from "@compoz/studio/features/settings/theme/validate";
import type { ThemeSettingsShape } from "@compoz/validation/site/settings/theme/theme";
import type { ThemeFormValues } from "@compoz/validation/site/settings/theme/theme-form";

export function ThemeSection() {
  const t = useTranslations();
  const { confirmSaveDespiteWarnings } = useStudioSaveDespiteWarningsConfirm();

  const dirtyGuard = useStudioDirtyGuard();

  const { baseline, conflict, isLoading, isSaving, save } = useThemeSettings();

  const [previewDraft, setPreviewDraft] = useState<ThemeSettingsShape | null>(
    null,
  );
  const [warningKeys, setWarningKeys] = useState<ThemeWarningKey[]>([]);
  const [blockingErrorsCount, setBlockingErrorsCount] = useState(0);
  const [activeWarningMode, setActiveWarningMode] = useState<"light" | "dark">(
    "light",
  );

  /** Runtime preview shape derived from the persisted RHF baseline. */
  const baselinePreview = useMemo<ThemeSettingsShape>(
    () => toThemeSettingsShapeFromFormValues(baseline),
    [baseline],
  );

  const previewValue = previewDraft ?? baselinePreview;

  const handleSubmit = useCallback(
    async (values: ThemeFormValues) => {
      if (isLoading || isSaving) return;

      // Recompute warnings at submit time so confirmation uses the latest validated values and active token mode.
      const warningKeysNow = computeThemeWarnings(
        {
          lightTokens: values.lightTokens,
          darkTokens: values.darkTokens,
        },
        activeWarningMode,
      );

      const ok = await confirmSaveDespiteWarnings(
        warningKeysNow,
        "studio.themeSection.warnings",
      );

      if (!ok) return;

      const result = await save(values);
      if (result.status === "conflict") return;
      dirtyGuard.setDirty(false);
      // Clear the live draft so preview falls back to the saved baseline returned by the hook.
      setPreviewDraft(null);
    },
    [
      activeWarningMode,
      confirmSaveDespiteWarnings,
      dirtyGuard,
      isLoading,
      isSaving,
      save,
    ],
  );

  return (
    <SettingsSection
      id="theme"
      title={t("studio.themeSection.section.title")}
      description={t("studio.themeSection.section.description")}
      isBusy={isSaving}
      isLoading={isLoading}
      isDirty={dirtyGuard.isDirty}
      blockingErrorsCount={blockingErrorsCount}
    >
      <StudioWarningsPanel
        id="theme-warnings"
        warningKeys={warningKeys}
        warningMessageKeyPrefix="studio.themeSection.warnings"
      />
      {conflict ? <SettingsConflictPanel conflict={conflict} focusTargetId="theme" /> : null}

      <ThemeForm
        initialValues={baseline}
        isConflictResolving={conflict !== null}
        isSaving={isSaving}
        onSubmit={handleSubmit}
        onReset={() => {
          setPreviewDraft(null);
          setWarningKeys([]);
          dirtyGuard.setDirty(false);
          setBlockingErrorsCount(0);
        }}
        onValuesChange={(values) => {
          setPreviewDraft(toThemeSettingsShapeFromFormValues(values));
        }}
        onWarningKeysChange={setWarningKeys}
        onActiveWarningModeChange={setActiveWarningMode}
        onBlockingErrorsCountChange={setBlockingErrorsCount}
        onDirtyChange={dirtyGuard.setDirty}
      />

      <ThemePreviewCard themeValue={previewValue} isLoadingTheme={isLoading} />
    </SettingsSection>
  );
}

ThemeSection.displayName = "ThemeSection";
