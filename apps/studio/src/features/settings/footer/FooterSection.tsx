"use client";

/**
 * @file apps/studio/src/features/settings/footer/FooterSection.tsx
 * @layer studio/features/settings/footer
 *
 * @description
 * Studio section for editing footer settings with warnings and live preview.
 *
 * @remarks
 * - Preview uses `footer` in live mode and injects `legalMenu` as a baseline-only scope.
 */

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { log } from "@compoz/infra/lib/log";
import { SettingsSection } from "@compoz/studio/components/layouts/SettingsSection";
import { StudioWarningsPanel } from "@compoz/studio/features/_shared/components/StudioWarningsPanel";
import { useStudioPreviewBaselineScope } from "@compoz/studio/features/_shared/hooks/useStudioPreviewBaselineScope";
import { useStudioSaveDespiteWarningsConfirm } from "@compoz/studio/features/_shared/hooks/useStudioSaveDespiteWarningsConfirm";
import { useStudioDirtyGuard } from "@compoz/studio/features/dirty-guard/useStudioDirtyGuard";
import { PreviewFrame } from "@compoz/studio/features/preview/PreviewFrame";
import { useStudioPreview } from "@compoz/studio/features/preview/hooks/useStudioPreview";
import { useSettingsBundle } from "@compoz/studio/features/settings/bundle/useSettingsBundle";
import { FooterForm } from "@compoz/studio/features/settings/footer/FooterForm";
import { useFooterSettings } from "@compoz/studio/features/settings/footer/useFooterSettings";
import type { FooterWarningKey } from "@compoz/studio/features/settings/footer/validate";
import { computeFooterWarnings } from "@compoz/studio/features/settings/footer/validate";
import { toFooterSettingsShapeFromFormValues } from "@compoz/studio/features/settings/mappers/footer-form";
import { toLegalMenuSettingsShapeFromDTO } from "@compoz/ui/settings/mappers/legal-menu-shape";

import type { FooterSettingsShape } from "@compoz/validation/site/settings/footer/footer";
import type { FooterFormValues } from "@compoz/validation/site/settings/footer/footer-form";
import type { LegalMenuSettingsShape } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu";

const lg = log.child({ ns: "ui", area: "studio", name: "FooterSection" });

export function FooterSection() {
  const t = useTranslations();
  const { confirmSaveDespiteWarnings } = useStudioSaveDespiteWarningsConfirm();
  const dirtyGuard = useStudioDirtyGuard();

  const { baseline, isLoading, isSaving, save } = useFooterSettings();

  const { data: settingsBundle, isLoading: isLoadingSettingsBundle } =
    useSettingsBundle(DEFAULT_CONTENT_STATE);

  const [warningKeys, setWarningKeys] = useState<FooterWarningKey[]>([]);
  const [blockingErrorsCount, setBlockingErrorsCount] = useState(0);
  const [previewDraft, setPreviewDraft] = useState<FooterSettingsShape | null>(
    null,
  );

  useEffect(() => {
    lg.debug("footer.settings", {
      isLoading,
      isSaving,
      hasBaseline: Boolean(baseline),
      baseline,
      hasSettingsBundle: Boolean(settingsBundle),
      isLoadingSettingsBundle,
    });
  }, [isLoading, isSaving, baseline, settingsBundle, isLoadingSettingsBundle]);

  /** Preview baseline uses the runtime shape derived from the RHF baseline. */
  const baselinePreview = useMemo<FooterSettingsShape>(() => {
    return toFooterSettingsShapeFromFormValues(baseline);
  }, [baseline]);

  const previewValue = previewDraft ?? baselinePreview;

  /** Footer preview needs the legal menu chrome, but does not edit it live. */
  const legalMenuBaselinePreview =
    useMemo<LegalMenuSettingsShape | null>(() => {
      if (!settingsBundle) return null;
      return toLegalMenuSettingsShapeFromDTO(settingsBundle.legalMenu);
    }, [settingsBundle]);

  const { ready, setBaseline, frame, iframeRef } =
    useStudioPreview<FooterSettingsShape>("footer", {
      baseline: previewValue,
      liveEnabled: true,
    });

  useStudioPreviewBaselineScope<LegalMenuSettingsShape>({
    scope: "legalMenu",
    baseline: legalMenuBaselinePreview,
    ready,
    setBaseline,
    onInject: () => {
      lg.debug("footer.preview.inject.legalMenu.baseline", {
        scope: "legalMenu",
      });
    },
  });

  /** Avoids showing the empty preview before dependent settings have finished loading. */
  const dataReady = !isLoading && !isLoadingSettingsBundle;

  const isEmpty = dataReady && legalMenuBaselinePreview == null;

  const emptyLabel = t("studio.emptyPreview.footer");

  const isPreviewLoading =
    !isEmpty &&
    (isLoading ||
      isLoadingSettingsBundle ||
      legalMenuBaselinePreview == null ||
      !ready.isReady("footer") ||
      !ready.isReady("legalMenu"));

  const handleSubmit = useCallback(
    async (values: FooterFormValues) => {
      if (isLoading || isSaving) return;

      const warningKeysNow = computeFooterWarnings(values);

      const ok = await confirmSaveDespiteWarnings(
        warningKeysNow,
        "studio.footerSection.warnings",
      );

      if (!ok) return;

      await save(values);
      dirtyGuard.setDirty(false);
      setPreviewDraft(null);
    },
    [confirmSaveDespiteWarnings, isLoading, isSaving, dirtyGuard, save],
  );

  return (
    <SettingsSection
      id="footer"
      title={t("studio.footerSection.section.title")}
      description={t("studio.footerSection.section.description")}
      isBusy={isSaving}
      isLoading={isLoading || isLoadingSettingsBundle}
      isDirty={dirtyGuard.isDirty}
      blockingErrorsCount={blockingErrorsCount}
    >
      <StudioWarningsPanel
        id="footer-warnings"
        warningKeys={warningKeys}
        warningMessageKeyPrefix="studio.footerSection.warnings"
      />

      <FooterForm
        initialValues={baseline}
        isSaving={isSaving}
        onSubmit={handleSubmit}
        onReset={() => {
          lg.debug("footer.form.reset", { baseline });
          setWarningKeys([]);
          setBlockingErrorsCount(0);
          dirtyGuard.setDirty(false);
          setPreviewDraft(null);
        }}
        onWarningKeysChange={setWarningKeys}
        onValuesChange={(values) => {
          setPreviewDraft(toFooterSettingsShapeFromFormValues(values));
        }}
        onBlockingErrorsCountChange={setBlockingErrorsCount}
        onDirtyChange={dirtyGuard.setDirty}
      />

      <PreviewFrame
        title={t("studio.shared.preview.title", {
          entity: t("studio.shared.entities.footer"),
        })}
        src="/preview/footer"
        iframeRef={iframeRef}
        onLoad={frame.onLoad}
        isLoading={isPreviewLoading}
        isEmpty={isEmpty}
        emptyLabel={emptyLabel}
        heightClassName="h-[80px]"
        info={
          isEmpty
            ? t("studio.emptyPreview.footer")
            : t("studio.shared.preview.infoLive")
        }
      />
    </SettingsSection>
  );
}

FooterSection.displayName = "FooterSection";
