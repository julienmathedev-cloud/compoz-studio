"use client";

/**
 * @file apps/studio/src/features/settings/legal-menu/LegalMenuSection.tsx
 * @layer ui/sections
 *
 * @description
 * Section d’administration dédiée au menu légal : chargement (shell), édition (form), warnings UI et preview.
 *
 * @remarks
 * - Le chargement initial est géré par `SettingsSection` (shell).
 * - Monte `useLegalMenuSettings` (baseline + save) et câble `LegalMenuForm`.
 * - Affiche les warnings non bloquants (via `LegalMenuForm` + `computeLegalMenuWarnings` au submit).
 * - La preview `/preview/legal-menu` consomme le scope `legalMenu` (draft possible).
 * - Strictement UI-only : aucune logique métier.
 */

import type { LegalMenuSettingsShape } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu";
import type { LegalMenuFormValues } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu-form";
import { ExpandableLayout } from "@compoz/studio/components/layouts/ExpandableLayout";
import { SettingsSection } from "@compoz/studio/components/layouts/SettingsSection";
import { HintList } from "@compoz/studio/components/molecules/feedback/HintList";
import { useConfirmList } from "@compoz/studio/features/confirm/useConfirmList";
import { useInternalPageOptions } from "@compoz/studio/features/pages/hooks/useInternalPageOptions";
import { useAdminPreview } from "@compoz/studio/features/preview/hooks/useAdminPreview";
import { PreviewFrame } from "@compoz/studio/features/preview/PreviewFrame";
import { toLegalMenuSettingsShapeFromFormValues } from "@compoz/studio/features/settings/mappers/legal-menu-form";
import { LegalMenuForm } from "@compoz/studio/features/settings/menus/legal-menu/components/organisms/LegalMenuForm";
import { useLegalMenuSettings } from "@compoz/studio/features/settings/menus/legal-menu/useLegalMenuSettings";
import {
  computeLegalMenuWarnings,
  type LegalMenuWarningKey,
} from "@compoz/studio/features/settings/menus/legal-menu/validate";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

type LegalMenuSectionProps = Readonly<{
  /** Remonte l’état dirty (guard / navigation) au parent (Tab/Dashboard). */
  onDirtyChange?: (dirty: boolean) => void;
}>;

export function LegalMenuSection({ onDirtyChange }: LegalMenuSectionProps) {
  const confirmList = useConfirmList();
  const t = useTranslations();

  const [isDirty, setIsDirty] = useState(false);

  // Hook settings : modèle UI (RHF).
  const { baseline, isLoading, isSaving, save } = useLegalMenuSettings();

  const [previewMode, setPreviewMode] = useState<"baseline" | "override">(
    "baseline",
  );

  // ✅ Options internes (picker) — centralisées via hook (SoT = SiteIndex).
  const { options: internalPageOptions, isLoading: isIndexLoading } =
    useInternalPageOptions();

  // Preview (iframe).

  // Pont UI → Preview/Public : RHF (UI) → SettingsShape (preview).
  const baselinePreview = useMemo<LegalMenuSettingsShape>(
    () => toLegalMenuSettingsShapeFromFormValues(baseline),
    [baseline],
  );

  const { ready, frame, setBaseline, setDraft, iframeRef } =
    useAdminPreview<LegalMenuSettingsShape>("legalMenu", baselinePreview);

  /**
   * ✅ Empty state (dans l’iframe) :
   * - On ne l’active qu’une fois les chargements data terminés.
   * - Si la baseline est absente => empty preview au lieu d’un écran blanc.
   */
  // Preview empty/loader
  const dataReady = !isLoading && !isIndexLoading && baseline != null;

  // ✅ Empty = baseline chargée mais aucun item
  const isEmpty = dataReady && (baseline?.items?.length ?? 0) === 0;

  const emptyLabel = t("admin.emptyPreview.legalMenu");

  // Preview loading : si empty => pas de loader
  const isPreviewLoading =
    !isEmpty &&
    (isLoading ||
      isIndexLoading ||
      baseline == null ||
      !ready.isReady("legalMenu"));

  const handlePreviewSync = useCallback(() => {
    frame.onSync();
    setPreviewMode("override");
  }, [frame]);

  const handlePreviewReset = useCallback(() => {
    frame.onReset();
    setPreviewMode("baseline");
  }, [frame]);

  // ✅ Ensemble des href internes connus (warnings UI).
  // On se base sur les options (déjà normalisées via formatPagePath dans le hook).
  const hrefSet = useMemo(() => {
    const set = new Set<string>();
    set.add("/");

    for (const opt of internalPageOptions ?? []) {
      if (opt?.value) set.add(String(opt.value));
    }

    return set;
  }, [internalPageOptions]);

  // Warnings UI (non bloquants).

  // Warnings live dérivés des valeurs RHF (affichage uniquement).
  const [warningKeys, setWarningKeys] = useState<LegalMenuWarningKey[]>([]);

  const warningHints = useMemo(
    () => warningKeys.map((k) => t(`admin.legalMenuSection.warnings.${k}`)),
    [warningKeys, t],
  );

  const [blockingErrorsCount, setBlockingErrorsCount] = useState(0);

  // Submit : confirmation si warnings + save.
  const handleSubmit = useCallback(
    async (values: LegalMenuFormValues) => {
      if (isLoading || isSaving) return;

      // 1) Warnings recalculés au submit (source de vérité).
      const warningKeysNow = computeLegalMenuWarnings({
        items: values.items ?? [],
        hrefSet,
      });

      const warningHintsNow = warningKeysNow.map((k) =>
        t(`admin.legalMenuSection.warnings.${k}`),
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
      const nextBaseline = toLegalMenuSettingsShapeFromFormValues(values);
      setBaseline<LegalMenuSettingsShape>("legalMenu", nextBaseline);
      frame.onReset();
      setPreviewMode("baseline");
      setIsDirty(false);
      onDirtyChange?.(false);
    },
    [
      confirmList,
      hrefSet,
      isLoading,
      isSaving,
      save,
      onDirtyChange,
      setBaseline,
      frame,
      t,
    ],
  );

  // Render.

  const description = t("admin.legalMenuSection.section.description");

  return (
    <SettingsSection
      id="legal-menu"
      title={t("admin.legalMenuSection.section.title")}
      headingLevel="h2"
      description={description}
      isBusy={isSaving}
      isLoading={isLoading}
      isDirty={isDirty}
      blockingErrorsCount={blockingErrorsCount}
    >
      <ExpandableLayout
        id="legal-menu-warnings"
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
            title={t("admin.shared.warningsPanel.title")}
            hints={warningHints}
            variant="warning"
          />
        ) : null}
      </ExpandableLayout>

      <LegalMenuForm
        initialValues={baseline}
        isSaving={isSaving}
        internalPageOptions={internalPageOptions}
        hrefSet={hrefSet}
        onSubmit={handleSubmit}
        onReset={() => {
          setWarningKeys([]);
          setDraft(baselinePreview);
          handlePreviewReset();
        }}
        onWarningKeysChange={setWarningKeys}
        onValuesChange={(values) => {
          // Live preview : RHF (UI) → SettingsShape.
          setDraft(toLegalMenuSettingsShapeFromFormValues(values));
        }}
        onBlockingErrorsCountChange={setBlockingErrorsCount}
        onDirtyChange={(dirty) => {
          setIsDirty(dirty); // badge local
          onDirtyChange?.(dirty); // remonte à MenuPage
        }}
      />

      <PreviewFrame
        title={t("admin.shared.preview.title", {
          entity: t("admin.shared.entities.legalMenu"),
        })}
        src="/preview/legal-menu"
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
            ? t("admin.emptyPreview.legalMenu")
            : previewMode === "override"
              ? t("admin.shared.preview.infoOverride")
              : t("admin.shared.preview.infoBaseline")
        }
      />
    </SettingsSection>
  );
}

LegalMenuSection.displayName = "LegalMenuSection";
