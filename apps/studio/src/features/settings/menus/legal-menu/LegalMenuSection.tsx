"use client";

/**
 * @file apps/studio/src/features/settings/legal-menu/LegalMenuSection.tsx
 * @layer ui/studio/sections
 *
 * @description
 * Section Studio dédiée au menu légal : chargement (shell), édition (form), warnings UI et preview.
 *
 * @remarks
 * - Le chargement initial est géré par `SettingsSection` (shell).
 * - Monte `useLegalMenuSettings` (baseline + save) et câble `LegalMenuForm`.
 * - Affiche les warnings non bloquants (via `LegalMenuForm` + `computeLegalMenuWarnings` au submit).
 * - La preview `/preview/legal-menu` consomme le scope `legalMenu` en mise à jour live.
 * - Strictement UI-only : aucune logique métier.
 */

import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

import { SettingsSection } from "@compoz/studio/components/layouts/SettingsSection";
import { StudioWarningsPanel } from "@compoz/studio/features/_shared/components/StudioWarningsPanel";
import { useStudioSaveDespiteWarningsConfirm } from "@compoz/studio/features/_shared/hooks/useStudioSaveDespiteWarningsConfirm";
import { useInternalPageOptions } from "@compoz/studio/features/pages/hooks/useInternalPageOptions";
import { PreviewFrame } from "@compoz/studio/features/preview/PreviewFrame";
import { useStudioPreview } from "@compoz/studio/features/preview/hooks/useStudioPreview";
import { toLegalMenuSettingsShapeFromFormValues } from "@compoz/studio/features/settings/mappers/legal-menu-form";
import { LegalMenuForm } from "@compoz/studio/features/settings/menus/legal-menu/components/organisms/LegalMenuForm";
import { useLegalMenuSettings } from "@compoz/studio/features/settings/menus/legal-menu/useLegalMenuSettings";
import {
  computeLegalMenuWarnings,
  type LegalMenuWarningKey,
} from "@compoz/studio/features/settings/menus/legal-menu/validate";
import type { LegalMenuSettingsShape } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu";
import type { LegalMenuFormValues } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu-form";

type LegalMenuSectionProps = Readonly<{
  /** Remonte l’état dirty (guard / navigation) au parent (Tab/Dashboard). */
  onDirtyChange?: (dirty: boolean) => void;
}>;

export function LegalMenuSection({ onDirtyChange }: LegalMenuSectionProps) {
  const t = useTranslations();
  const { confirmSaveDespiteWarnings } = useStudioSaveDespiteWarningsConfirm();

  const [isDirty, setIsDirty] = useState(false);
  const [warningKeys, setWarningKeys] = useState<LegalMenuWarningKey[]>([]);
  const [blockingErrorsCount, setBlockingErrorsCount] = useState(0);
  const [previewDraft, setPreviewDraft] =
    useState<LegalMenuSettingsShape | null>(null);

  const { baseline, isLoading, isSaving, save } = useLegalMenuSettings();

  const { options: internalPageOptions, isLoading: isIndexLoading } =
    useInternalPageOptions();

  /**
   * Baseline preview :
   * - conversion directe de la baseline RHF en shape runtime
   */
  const baselinePreview = useMemo<LegalMenuSettingsShape>(() => {
    return toLegalMenuSettingsShapeFromFormValues(baseline);
  }, [baseline]);

  /**
   * Valeur affichée dans la preview :
   * - draft live si le form change
   * - sinon baseline persistée
   */
  const previewValue = previewDraft ?? baselinePreview;

  const { ready, frame, iframeRef } = useStudioPreview<LegalMenuSettingsShape>(
    "legalMenu",
    {
      baseline: previewValue,
      liveEnabled: true,
    },
  );

  const dataReady = !isLoading && !isIndexLoading;

  const isEmpty = dataReady && (baseline?.items?.length ?? 0) === 0;

  const emptyLabel = t("studio.emptyPreview.legalMenu");

  const isPreviewLoading =
    !isEmpty && (isLoading || isIndexLoading || !ready.isReady("legalMenu"));

  const hrefSet = useMemo(() => {
    const set = new Set<string>();
    set.add("/");

    for (const opt of internalPageOptions ?? []) {
      if (opt?.value) {
        set.add(String(opt.value));
      }
    }

    return set;
  }, [internalPageOptions]);

  const handleSubmit = useCallback(
    async (values: LegalMenuFormValues) => {
      if (isLoading || isSaving) return;

      const warningKeysNow = computeLegalMenuWarnings({
        items: values.items ?? [],
        hrefSet,
      });

      const ok = await confirmSaveDespiteWarnings(
        warningKeysNow,
        "studio.legalMenuSection.warnings",
      );

      if (!ok) return;

      await save(values);

      setPreviewDraft(null);
      setIsDirty(false);
      onDirtyChange?.(false);
    },
    [
      confirmSaveDespiteWarnings,
      hrefSet,
      isLoading,
      isSaving,
      save,
      onDirtyChange,
    ],
  );

  const description = t("studio.legalMenuSection.section.description");

  return (
    <SettingsSection
      id="legal-menu"
      title={t("studio.legalMenuSection.section.title")}
      headingLevel="h2"
      description={description}
      isBusy={isSaving}
      isLoading={isLoading}
      isDirty={isDirty}
      blockingErrorsCount={blockingErrorsCount}
    >
      <StudioWarningsPanel
        id="legal-menu-warnings"
        warningKeys={warningKeys}
        warningMessageKeyPrefix="studio.legalMenuSection.warnings"
      />

      <LegalMenuForm
        initialValues={baseline}
        isSaving={isSaving}
        internalPageOptions={internalPageOptions}
        hrefSet={hrefSet}
        onSubmit={handleSubmit}
        onReset={() => {
          setWarningKeys([]);
          setBlockingErrorsCount(0);
          setIsDirty(false);
          setPreviewDraft(null);
          onDirtyChange?.(false);
        }}
        onWarningKeysChange={setWarningKeys}
        onValuesChange={(values) => {
          setPreviewDraft(toLegalMenuSettingsShapeFromFormValues(values));
        }}
        onBlockingErrorsCountChange={setBlockingErrorsCount}
        onDirtyChange={(dirty) => {
          setIsDirty(dirty);
          onDirtyChange?.(dirty);
        }}
      />

      <PreviewFrame
        title={t("studio.shared.preview.title", {
          entity: t("studio.shared.entities.legalMenu"),
        })}
        src="/preview/legal-menu"
        iframeRef={iframeRef}
        onLoad={frame.onLoad}
        isLoading={isPreviewLoading}
        isEmpty={isEmpty}
        emptyLabel={emptyLabel}
        heightClassName="h-[80px]"
        info={
          isEmpty
            ? t("studio.emptyPreview.legalMenu")
            : t("studio.shared.preview.infoLive")
        }
      />
    </SettingsSection>
  );
}

LegalMenuSection.displayName = "LegalMenuSection";
