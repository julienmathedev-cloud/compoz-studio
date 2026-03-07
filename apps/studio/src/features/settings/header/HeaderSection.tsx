"use client";

/**
 * @file apps/studio/src/features/settings/header/HeaderSection.tsx
 * @layer ui/studio/sections
 *
 * @description
 * Section Studio dédiée au header : chargement (shell), édition (form), warnings UI et preview.
 *
 * @remarks
 * - Le chargement initial est géré par `SettingsSection` (shell).
 * - Monte `useHeaderSettings` (baseline + save) et câble `HeaderForm`.
 * - Affiche les warnings non bloquants (via `HeaderForm` + `computeHeaderWarnings` au submit).
 * - La preview `/preview/header` consomme plusieurs scopes : `header` (draft possible) + `identity` / `primaryMenu` / `social` (baseline-only).
 * - Strictement UI-only : aucune logique métier.
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

  // Hook settings : modèle UI (RHF).
  const { baseline, isLoading, isSaving, save } = useHeaderSettings();

  const { data: settingsBundle, isLoading: isLoadingSettingsBundle } =
    useSettingsBundle(DEFAULT_CONTENT_STATE);

  const [previewMode, setPreviewMode] = useState<"baseline" | "override">(
    "baseline",
  );

  useEffect(() => {
    lg.debug("header.settings", {
      isLoading,
      isSaving,
      hasBaseline: Boolean(baseline),
    });
  }, [isLoading, isSaving, baseline]);

  // Pont UI → Preview/Public : RHF (UI) → SettingsShape (preview).
  const baselinePreview = useMemo<HeaderSettingsShape>(
    () => toHeaderSettingsShapeFromFormValues(baseline),
    [baseline],
  );

  const identityBaselinePreview = useMemo<IdentitySettingsShape | null>(() => {
    if (!settingsBundle) return null;

    // DTO -> FormValues -> Shape (tu as déjà les 2 mappers)
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

  const { ready, setBaseline, frame, iframeRef, setDraft } =
    useStudioPreview<HeaderSettingsShape>("header", baselinePreview);

  /**
   * ✅ Empty state (dans l’iframe) :
   * - On ne l’active qu’une fois que les chargements “data” sont terminés.
   * - Si une baseline requise est absente => on affiche un empty preview au lieu d’un écran blanc.
   */
  const dataReady = !isLoading && !isLoadingSettingsBundle;

  const hasBrand =
    Boolean(baselinePreview?.showLogo && identityBaselinePreview?.logoUrl) ||
    Boolean(baselinePreview?.showSiteName && identityBaselinePreview?.siteName);

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

  // Libellé studio (traduit) → affiché dans l’iframe via route empty globale
  const emptyLabel = t("studio.emptyPreview.header");

  // Preview loading :
  // - ⚠️ ne pas tester `baselinePreview` (il peut exister même si `baseline` est null/undefined)
  // - on teste les baselines brutes + handshake scopes.
  // - ✅ IMPORTANT : si on est en empty, on ne veut pas rester bloqué en loading.
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

  const handlePreviewSync = useCallback(() => {
    frame.onSync();
    setPreviewMode("override");
  }, [frame]);

  const handlePreviewReset = useCallback(() => {
    frame.onReset();
    setPreviewMode("baseline");
  }, [frame]);

  // Warnings UI (non bloquants).
  const [warningKeys, setWarningKeys] = useState<HeaderWarningKey[]>([]);

  // ✅ Badge “erreur” (bloquant) : harmonisé avec Identity/Social.
  const [blockingErrorsCount, setBlockingErrorsCount] = useState(0);

  // Submit : confirmation si warnings + save.
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
      const nextBaselinePreview = toHeaderSettingsShapeFromFormValues(values);
      setBaseline<HeaderSettingsShape>("header", nextBaselinePreview);
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

  return (
    <SettingsSection
      id="header"
      title={t("studio.headerSection.section.title")}
      description={t("studio.headerSection.section.description")}
      isBusy={isSaving}
      isLoading={isLoading}
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
          // Reset preview sur la baseline (SettingsShape).
          setDraft(baselinePreview);
          handlePreviewReset();
        }}
        onWarningKeysChange={setWarningKeys}
        onValuesChange={(values) => {
          // Live preview : RHF (UI) → SettingsShape.
          setDraft(toHeaderSettingsShapeFromFormValues(values));
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
        onSync={handlePreviewSync}
        onReset={handlePreviewReset}
        syncDisabled={frame.syncDisabled}
        isLoading={isPreviewLoading}
        isEmpty={isEmpty}
        emptyLabel={emptyLabel}
        heightClassName="h-[300px]"
        info={
          isEmpty
            ? t("studio.emptyPreview.header")
            : previewMode === "override"
              ? t("studio.shared.preview.infoOverride")
              : t("studio.shared.preview.infoBaseline")
        }
      />
    </SettingsSection>
  );
}

HeaderSection.displayName = "HeaderSection";
