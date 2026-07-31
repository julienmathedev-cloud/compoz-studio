"use client";

/**
 * @file apps/studio/src/features/settings/menus/primary-menu/PrimaryMenuSection.tsx
 * @layer studio/features/settings/menus/primary-menu
 *
 * @description
 * Studio settings section for loading, editing, saving, and previewing the primary menu.
 *
 * @remarks
 * - Keeps the persisted baseline and live preview draft separate so reset/save can restore the preview deterministically.
 * - Non-blocking warnings are computed from both form values and the current internal page href set.
 */

import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

import { SettingsSection } from "@compoz/studio/components/layouts/SettingsSection";
import { StudioWarningsPanel } from "@compoz/studio/features/_shared/components/StudioWarningsPanel";
import { useStudioSaveDespiteWarningsConfirm } from "@compoz/studio/features/_shared/hooks/useStudioSaveDespiteWarningsConfirm";
import { useInternalPageOptions } from "@compoz/studio/features/pages/hooks/useInternalPageOptions";
import { PreviewFrame } from "@compoz/studio/features/preview/PreviewFrame";
import { useStudioPreview } from "@compoz/studio/features/preview/hooks/useStudioPreview";
import { toPrimaryMenuSettingsShapeFromFormValues } from "@compoz/studio/features/settings/mappers/primary-menu-form";
import { PrimaryMenuForm } from "@compoz/studio/features/settings/menus/primary-menu/components/organisms/PrimaryMenuForm";
import { usePrimaryMenuSettings } from "@compoz/studio/features/settings/menus/primary-menu/usePrimaryMenuSettings";
import { SettingsConflictPanel } from "@compoz/studio/features/settings/conflicts/SettingsConflictPanel";
import type { PrimaryMenuWarningKey } from "@compoz/studio/features/settings/menus/primary-menu/validate";
import { computePrimaryMenuWarnings } from "@compoz/studio/features/settings/menus/primary-menu/validate";
import type { PrimaryMenuSettingsShape } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu";
import type { PrimaryMenuFormValues } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu-form";

type PrimaryMenuSectionProps = Readonly<{
  onDirtyChange?: (dirty: boolean) => void;
}>;

export function PrimaryMenuSection({ onDirtyChange }: PrimaryMenuSectionProps) {
  const t = useTranslations();
  const { confirmSaveDespiteWarnings } = useStudioSaveDespiteWarningsConfirm();

  const [isDirty, setIsDirty] = useState(false);
  const [warningKeys, setWarningKeys] = useState<PrimaryMenuWarningKey[]>([]);
  const [blockingErrorsCount, setBlockingErrorsCount] = useState(0);
  const [previewDraft, setPreviewDraft] =
    useState<PrimaryMenuSettingsShape | null>(null);

  const { baseline, conflict, isLoading, isSaving, save } = usePrimaryMenuSettings();

  /** Runtime preview shape derived from the persisted RHF baseline. */
  const baselinePreview = useMemo<PrimaryMenuSettingsShape>(() => {
    return toPrimaryMenuSettingsShapeFromFormValues(baseline);
  }, [baseline]);

  const previewValue = previewDraft ?? baselinePreview;

  const { ready, frame, iframeRef } =
    useStudioPreview<PrimaryMenuSettingsShape>("primaryMenu", {
      baseline: previewValue,
      liveEnabled: true,
    });

  /** Internal page options are the source of truth for editable internal menu targets. */
  const { options: internalPageOptions } = useInternalPageOptions();

  /** Known internal hrefs used by warning checks for draft and published pages. */
  const hrefSet = useMemo(() => {
    const set = new Set<string>();
    set.add("/");

    for (const opt of internalPageOptions ?? []) {
      const value = String(opt?.value ?? "").trim();
      if (value) set.add(value);
    }

    return set;
  }, [internalPageOptions]);

  const dataReady = !isLoading;
  const isEmpty = dataReady && (baseline?.items?.length ?? 0) === 0;

  const emptyLabel = t("studio.emptyPreview.primaryMenu");

  const isPreviewLoading =
    !isEmpty && (isLoading || !ready.isReady("primaryMenu"));

  const handleSubmit = useCallback(
    async (values: PrimaryMenuFormValues) => {
      if (isLoading || isSaving) return;

      const warningKeysNow = computePrimaryMenuWarnings({
        items: values.items ?? [],
        hrefSet,
      });

      const ok = await confirmSaveDespiteWarnings(
        warningKeysNow,
        "studio.primaryMenuSection.warnings",
      );

      if (!ok) return;

      const result = await save(values);
      if (result.status === "conflict") return;

      setPreviewDraft(null);
      setIsDirty(false);
      onDirtyChange?.(false);
    },
    [
      confirmSaveDespiteWarnings,
      isLoading,
      isSaving,
      hrefSet,
      save,
      onDirtyChange,
    ],
  );

  const description = t("studio.primaryMenuSection.section.description");

  return (
    <SettingsSection
      id="primary-menu"
      title={t("studio.primaryMenuSection.section.title")}
      headingLevel="h2"
      description={description}
      isBusy={isSaving}
      isLoading={isLoading}
      isDirty={isDirty}
      blockingErrorsCount={blockingErrorsCount}
    >
      <StudioWarningsPanel
        id="primary-menu-warnings"
        warningKeys={warningKeys}
        warningMessageKeyPrefix="studio.primaryMenuSection.warnings"
      />
      {conflict ? <SettingsConflictPanel conflict={conflict} focusTargetId="primary-menu" /> : null}

      <PrimaryMenuForm
        initialValues={baseline}
        isConflictResolving={conflict !== null}
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
          setPreviewDraft(toPrimaryMenuSettingsShapeFromFormValues(values));
        }}
        onBlockingErrorsCountChange={setBlockingErrorsCount}
        onDirtyChange={(dirty) => {
          setIsDirty(dirty);
          onDirtyChange?.(dirty);
        }}
      />

      <PreviewFrame
        title={t("studio.shared.preview.title", {
          entity: t("studio.shared.entities.primaryMenu"),
        })}
        src="/preview/primary-menu"
        iframeRef={iframeRef}
        onLoad={frame.onLoad}
        isLoading={isPreviewLoading}
        isEmpty={isEmpty}
        emptyLabel={emptyLabel}
        heightClassName="h-[250px]"
        info={
          isEmpty
            ? t("studio.emptyPreview.primaryMenu")
            : t("studio.shared.preview.infoLive")
        }
      />
    </SettingsSection>
  );
}

PrimaryMenuSection.displayName = "PrimaryMenuSection";
