"use client";

/**
 * @file apps/studio/src/features/settings/theme/ThemeSection.tsx
 * @layer ui/studio/sections
 *
 * @description
 * Section Studio dédiée au thème public :
 * chargement (shell), édition (form), warnings UI et preview.
 *
 * @remarks
 * - Le chargement initial est géré par `SettingsSection` (shell).
 * - Monte `useThemeSettings` (baseline + save) et câble `ThemeForm`.
 * - Affiche les warnings non bloquants (via `ThemeForm` + `computeThemeWarnings` au submit).
 * - La preview est déléguée à `ThemePreviewCard`.
 * - Strictement UI-only : aucune logique métier.
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

  const { baseline, isLoading, isSaving, save } = useThemeSettings();

  const [previewDraft, setPreviewDraft] = useState<ThemeSettingsShape | null>(
    null,
  );
  const [warningKeys, setWarningKeys] = useState<ThemeWarningKey[]>([]);
  const [blockingErrorsCount, setBlockingErrorsCount] = useState(0);
  const [activeWarningMode, setActiveWarningMode] = useState<"light" | "dark">(
    "light",
  );

  const baselinePreview = useMemo<ThemeSettingsShape | null>(() => {
    if (!baseline) return null;
    return toThemeSettingsShapeFromFormValues(baseline);
  }, [baseline]);

  const previewValue = previewDraft ?? baselinePreview;

  const handleSubmit = useCallback(
    async (values: ThemeFormValues) => {
      if (isLoading || isSaving) return;

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

      await save(values);
      dirtyGuard.setDirty(false);
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

      <ThemeForm
        initialValues={baseline}
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
