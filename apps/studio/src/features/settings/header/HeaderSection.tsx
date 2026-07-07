"use client";

/**
 * @file apps/studio/src/features/settings/header/HeaderSection.tsx
 * @layer studio/features/settings/header
 *
 * @description
 * Studio section for editing header settings with warnings and live preview.
 *
 * @remarks
 * - Preview uses `header` in live mode and injects `identity`, `primaryMenu`, and `social` as baseline-only scopes.
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
import { HeaderForm } from "@compoz/studio/features/settings/header/HeaderForm";
import { useHeaderSettings } from "@compoz/studio/features/settings/header/useHeaderSettings";
import type { HeaderWarningKey } from "@compoz/studio/features/settings/header/validate";
import { computeHeaderWarnings } from "@compoz/studio/features/settings/header/validate";
import { toHeaderSettingsShapeFromFormValues } from "@compoz/studio/features/settings/mappers/header-form";
import {
  toIdentityFormValuesFromDTO,
  toIdentitySettingsShapeFromFormValues,
} from "@compoz/studio/features/settings/mappers/identity-form";
import { toPrimaryMenuSettingsShapeFromDTO } from "@compoz/ui/settings/mappers/primary-menu-shape";
import { toSocialSettingsShapeFromDTO } from "@compoz/ui/settings/mappers/social-shape";
import type { HeaderSettingsShape } from "@compoz/validation/site/settings/header/header";
import type { HeaderFormValues } from "@compoz/validation/site/settings/header/header-form";
import type { IdentitySettingsShape } from "@compoz/validation/site/settings/identity/identity";
import type { PrimaryMenuSettingsShape } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu";
import type { SocialSettingsShape } from "@compoz/validation/site/settings/social/social";

const lg = log.child({ ns: "ui", area: "studio", name: "HeaderSection" });

export function HeaderSection() {
  const t = useTranslations();
  const { confirmSaveDespiteWarnings } = useStudioSaveDespiteWarningsConfirm();

  const dirtyGuard = useStudioDirtyGuard();

  const { baseline, isLoading, isSaving, save } = useHeaderSettings();

  const { data: settingsBundle, isLoading: isLoadingSettingsBundle } =
    useSettingsBundle(DEFAULT_CONTENT_STATE);

  const [warningKeys, setWarningKeys] = useState<HeaderWarningKey[]>([]);
  const [blockingErrorsCount, setBlockingErrorsCount] = useState(0);
  const [previewDraft, setPreviewDraft] = useState<HeaderSettingsShape | null>(
    null,
  );

  useEffect(() => {
    lg.debug("header.settings", {
      isLoading,
      isSaving,
      hasBaseline: Boolean(baseline),
      hasSettingsBundle: Boolean(settingsBundle),
      isLoadingSettingsBundle,
    });
  }, [isLoading, isSaving, baseline, settingsBundle, isLoadingSettingsBundle]);

  /** Preview baseline uses the runtime shape derived from the RHF baseline. */
  const baselinePreview = useMemo<HeaderSettingsShape>(() => {
    return toHeaderSettingsShapeFromFormValues(baseline);
  }, [baseline]);

  const previewValue = previewDraft ?? baselinePreview;

  const identityBaselinePreview = useMemo<IdentitySettingsShape | null>(() => {
    if (!settingsBundle) return null;

    return toIdentitySettingsShapeFromFormValues(
      toIdentityFormValuesFromDTO(settingsBundle.identity),
    );
  }, [settingsBundle]);

  const primaryMenuBaselinePreview =
    useMemo<PrimaryMenuSettingsShape | null>(() => {
      if (!settingsBundle) return null;
      return toPrimaryMenuSettingsShapeFromDTO(settingsBundle.primaryMenu);
    }, [settingsBundle]);

  const socialBaselinePreview = useMemo<SocialSettingsShape | null>(() => {
    if (!settingsBundle) return null;
    return toSocialSettingsShapeFromDTO(settingsBundle.social);
  }, [settingsBundle]);

  const { ready, setBaseline, frame, iframeRef } =
    useStudioPreview<HeaderSettingsShape>("header", {
      baseline: previewValue,
      liveEnabled: true,
    });

  /** Header preview needs these chrome scopes, but does not edit them live. */
  useStudioPreviewBaselineScope<IdentitySettingsShape>({
    scope: "identity",
    baseline: identityBaselinePreview,
    ready,
    setBaseline,
    onInject: () => {
      lg.debug("header.preview.inject.identity.baseline", {
        scope: "identity",
      });
    },
  });

  useStudioPreviewBaselineScope<PrimaryMenuSettingsShape>({
    scope: "primaryMenu",
    baseline: primaryMenuBaselinePreview,
    ready,
    setBaseline,
    onInject: () => {
      lg.debug("header.preview.inject.primaryMenu.baseline", {
        scope: "primaryMenu",
      });
    },
  });

  useStudioPreviewBaselineScope<SocialSettingsShape>({
    scope: "social",
    baseline: socialBaselinePreview,
    ready,
    setBaseline,
    onInject: () => {
      lg.debug("header.preview.inject.social.baseline", {
        scope: "social",
      });
    },
  });

  /** Avoids showing the empty preview before dependent settings have finished loading. */
  const dataReady = !isLoading && !isLoadingSettingsBundle;

  const hasBrand =
    Boolean(
      baselinePreview.showLogo &&
      identityBaselinePreview?.logo &&
      identityBaselinePreview.logo.src.trim().length > 0,
    ) ||
    Boolean(baselinePreview.showSiteName && identityBaselinePreview?.siteName);

  const hasMenu = Boolean(primaryMenuBaselinePreview?.items?.length);
  const hasSocial = Boolean(socialBaselinePreview?.items?.length);

  const hasSomethingToRender = hasBrand || hasMenu || hasSocial;

  const isEmpty =
    dataReady &&
    settingsBundle != null &&
    identityBaselinePreview != null &&
    primaryMenuBaselinePreview != null &&
    socialBaselinePreview != null &&
    !hasSomethingToRender;

  const emptyLabel = t("studio.emptyPreview.header");

  const isPreviewLoading =
    !isEmpty &&
    (isLoading ||
      isLoadingSettingsBundle ||
      identityBaselinePreview == null ||
      primaryMenuBaselinePreview == null ||
      socialBaselinePreview == null ||
      !ready.isReady("header") ||
      !ready.isReady("identity") ||
      !ready.isReady("primaryMenu") ||
      !ready.isReady("social"));

  const handleSubmit = useCallback(
    async (values: HeaderFormValues) => {
      if (isLoading || isSaving) return;

      const warningKeysNow = computeHeaderWarnings({
        showLogo: values.showLogo,
        showSiteName: values.showSiteName,
      });

      const ok = await confirmSaveDespiteWarnings(
        warningKeysNow,
        "studio.headerSection.warnings",
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
      id="header"
      title={t("studio.headerSection.section.title")}
      description={t("studio.headerSection.section.description")}
      isBusy={isSaving}
      isLoading={isLoading || isLoadingSettingsBundle}
      isDirty={dirtyGuard.isDirty}
      blockingErrorsCount={blockingErrorsCount}
    >
      <StudioWarningsPanel
        id="header-warnings"
        warningKeys={warningKeys}
        warningMessageKeyPrefix="studio.headerSection.warnings"
      />

      <HeaderForm
        initialValues={baseline}
        isSaving={isSaving}
        onSubmit={handleSubmit}
        onReset={() => {
          lg.debug("header.form.reset", { hasBaseline: Boolean(baseline) });
          setWarningKeys([]);
          dirtyGuard.setDirty(false);
          setBlockingErrorsCount(0);
          setPreviewDraft(null);
        }}
        onWarningKeysChange={setWarningKeys}
        onValuesChange={(values) => {
          setPreviewDraft(toHeaderSettingsShapeFromFormValues(values));
        }}
        onBlockingErrorsCountChange={setBlockingErrorsCount}
        onDirtyChange={dirtyGuard.setDirty}
      />

      <PreviewFrame
        title={t("studio.shared.preview.title", {
          entity: t("studio.shared.entities.header"),
        })}
        src="/preview/header"
        iframeRef={iframeRef}
        onLoad={frame.onLoad}
        isLoading={isPreviewLoading}
        isEmpty={isEmpty}
        emptyLabel={emptyLabel}
        heightClassName="h-[300px]"
        info={
          isEmpty
            ? t("studio.emptyPreview.header")
            : t("studio.shared.preview.infoLive")
        }
      />
    </SettingsSection>
  );
}

HeaderSection.displayName = "HeaderSection";
