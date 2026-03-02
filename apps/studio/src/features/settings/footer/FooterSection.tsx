"use client";

/**
 * @file apps/studio/src/features/settings/footer/FooterSection.tsx
 * @layer ui/sections
 *
 * @description
 * Section d’administration dédiée au footer : chargement (shell), édition (form), warnings UI et preview.
 *
 * @remarks
 * - Le chargement initial est géré par `SettingsSection` (shell).
 * - Monte `useFooterSettings` (baseline + save) et câble `FooterForm`.
 * - Affiche les warnings non bloquants (via `FooterForm` + `computeFooterWarnings` au submit).
 * - La preview `/preview/footer` consomme deux scopes : `footer` (draft possible) et `legalMenu` (baseline-only).
 * - Strictement UI-only : aucune logique métier.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { log } from "@compoz/infra/lib/log";
import { toLegalMenuSettingsShapeFromDTO } from "@compoz/ui/settings/mappers/legal-menu-shape";
import { ExpandableLayout } from "@compoz/studio/components/layouts/ExpandableLayout";
import { SettingsSection } from "@compoz/studio/components/layouts/SettingsSection";
import { HintList } from "@compoz/studio/components/molecules/feedback/HintList";
import { useConfirmList } from "@compoz/studio/features/confirm/useConfirmList";
import { useAdminDirtyGuard } from "@compoz/studio/features/dirty-guard/useAdminDirtyGuard";
import { useAdminPreview } from "@compoz/studio/features/preview/hooks/useAdminPreview";
import { useSettingsBundle } from "@compoz/studio/features/settings/bundle/useSettingsBundle";
import { FooterForm } from "@compoz/studio/features/settings/footer/FooterForm";
import { useFooterSettings } from "@compoz/studio/features/settings/footer/useFooterSettings";
import type { FooterWarningKey } from "@compoz/studio/features/settings/footer/validate";
import { computeFooterWarnings } from "@compoz/studio/features/settings/footer/validate";
import { toFooterSettingsShapeFromFormValues } from "@compoz/studio/features/settings/mappers/footer-form";

import type { FooterSettingsShape } from "@compoz/validation/site/settings/footer/footer";
import type { FooterFormValues } from "@compoz/validation/site/settings/footer/footer-form";
import type { LegalMenuSettingsShape } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu";
import { PreviewFrame } from "@compoz/studio/features/preview/PreviewFrame";
import { useTranslations } from "next-intl";

const lg = log.child({ ns: "ui", area: "admin", name: "FooterSection" });

export function FooterSection() {
  const confirmList = useConfirmList();
  const t = useTranslations();

  const dirtyGuard = useAdminDirtyGuard();

  // Hook settings : modèle UI (RHF).
  const { baseline, isLoading, isSaving, save } = useFooterSettings();

  // Baseline du menu légal : injectée dans la preview `/preview/footer` (baseline-only).
  const { data: settingsBundle, isLoading: isLoadingSettingsBundle } =
    useSettingsBundle(WRITE_CONTENT_STATE);

  const [previewMode, setPreviewMode] = useState<"baseline" | "override">(
    "baseline",
  );

  useEffect(() => {
    lg.debug("footer.settings", {
      isLoading,
      isSaving,
      hasBaseline: Boolean(baseline),
      baseline,
    });
  }, [isLoading, isSaving, baseline]);

  // ✅ Badges section : compteur d’erreurs bloquantes (remonté par le form).
  const [blockingErrorsCount, setBlockingErrorsCount] = useState(0);

  // Pont UI → Preview/Public : RHF (UI) → SettingsShape (preview).
  const baselinePreview = useMemo<FooterSettingsShape>(
    () => toFooterSettingsShapeFromFormValues(baseline),
    [baseline],
  );

  // Pont UI → Preview/Public : legalMenu baseline-only.
  const legalMenuBaselinePreview =
    useMemo<LegalMenuSettingsShape | null>(() => {
      if (!settingsBundle) return null;
      return toLegalMenuSettingsShapeFromDTO(settingsBundle.legalMenu);
    }, [settingsBundle]);

  const { ready, setBaseline, setDraft, frame, iframeRef } =
    useAdminPreview<FooterSettingsShape>("footer", baselinePreview);

  /**
   * ✅ Empty state (dans l’iframe) :
   * - On ne l’active qu’une fois que les chargements “data” sont terminés.
   * - Si une baseline requise est absente => on affiche un empty preview au lieu d’un écran blanc.
   */
  const dataReady = !isLoading && !isLoadingSettingsBundle;
  const isEmpty =
    dataReady &&
    (baseline == null ||
      settingsBundle == null ||
      legalMenuBaselinePreview == null);

  const emptyLabel = t("admin.emptyPreview.footer");

  // Preview loading :
  // - ⚠️ ne pas tester `baselinePreview` (il peut exister même si `baseline` est null/undefined)
  // - on teste les baselines brutes + handshake scopes.
  // - ✅ IMPORTANT : si on est en empty, on ne veut pas rester bloqué en loading.
  const isPreviewLoading =
    !isEmpty &&
    (isLoading ||
      isLoadingSettingsBundle ||
      baseline == null ||
      settingsBundle == null ||
      legalMenuBaselinePreview == null ||
      !ready.isReady("footer") ||
      !ready.isReady("legalMenu"));

  useEffect(() => {
    if (legalMenuBaselinePreview == null) return;
    if (!ready.isReady("legalMenu")) return;

    lg.debug("footer.preview.inject.legalMenu.baseline", {
      scope: "legalMenu",
    });

    setBaseline<LegalMenuSettingsShape>("legalMenu", legalMenuBaselinePreview);
  }, [legalMenuBaselinePreview, ready, setBaseline]);

  const handlePreviewSync = useCallback(() => {
    frame.onSync();
    setPreviewMode("override");
  }, [frame]);

  const handlePreviewReset = useCallback(() => {
    frame.onReset();
    setPreviewMode("baseline");
  }, [frame]);

  // Warnings UI (non bloquants).

  // Warnings live dérivés des valeurs RHF (affichage uniquement).
  const [warningKeys, setWarningKeys] = useState<FooterWarningKey[]>([]);

  const warningHints = useMemo(
    () => warningKeys.map((k) => t(`admin.footerSection.warnings.${k}`)),
    [warningKeys, t],
  );

  // Submit : confirmation si warnings + save.
  const handleSubmit = useCallback(
    async (values: FooterFormValues) => {
      if (isLoading || isSaving) return;

      // 1) Warnings recalculés au submit (source de vérité).
      const warningKeysNow = computeFooterWarnings(values);
      const warningHintsNow = warningKeysNow.map((k) =>
        t(`admin.footerSection.warnings.${k}`),
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
      const nextBaselinePreview = toFooterSettingsShapeFromFormValues(values);
      setBaseline<FooterSettingsShape>("footer", nextBaselinePreview);
      frame.onReset();
      setPreviewMode("baseline");
    },
    [confirmList, isLoading, isSaving, dirtyGuard, save, setBaseline, frame, t],
  );

  // Render.

  return (
    <SettingsSection
      id="footer"
      title={t("admin.footerSection.section.title")}
      description={t("admin.footerSection.section.description")}
      isBusy={isSaving}
      isLoading={isLoading}
      isDirty={dirtyGuard.isDirty}
      blockingErrorsCount={blockingErrorsCount}
    >
      <ExpandableLayout
        id="footer-warnings"
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

      <FooterForm
        initialValues={baseline}
        isSaving={isSaving}
        onSubmit={handleSubmit}
        onReset={() => {
          lg.debug("footer.form.reset", { baseline });
          setWarningKeys([]);
          setBlockingErrorsCount(0);
          dirtyGuard.setDirty(false);
          // Reset preview sur la baseline (SettingsShape).
          setDraft(baselinePreview);
          handlePreviewReset();
        }}
        onWarningKeysChange={setWarningKeys}
        onValuesChange={(values) => {
          // Live preview : RHF (UI) → SettingsShape.
          setDraft(toFooterSettingsShapeFromFormValues(values));
        }}
        onBlockingErrorsCountChange={setBlockingErrorsCount}
        onDirtyChange={dirtyGuard.setDirty}
      />

      <PreviewFrame
        title={t("admin.shared.preview.title", {
          entity: t("admin.shared.entities.footer"),
        })}
        src="/preview/footer"
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
            ? t("admin.emptyPreview.footer")
            : previewMode === "override"
              ? t("admin.shared.preview.infoOverride")
              : t("admin.shared.preview.infoBaseline")
        }
      />
    </SettingsSection>
  );
}

FooterSection.displayName = "FooterSection";
