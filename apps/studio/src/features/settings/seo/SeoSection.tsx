"use client";

/**
 * @file apps/studio/src/features/settings/seo/SeoSection.tsx
 * @layer ui/studio/sections
 *
 * @description
 * Section Studio dédiée au SEO : chargement (shell), édition (form), warnings UI et confirmation au submit.
 *
 * @remarks
 * - Le chargement initial est géré par `SettingsSection` (shell).
 * - Monte `useSeoSettings` (baseline + save) et câble `SeoForm`.
 * - Affiche les warnings non bloquants via `StudioWarningsPanel` (dérivés du form).
 * - Au submit : recalcule les warnings, demande confirmation, puis sauvegarde.
 * - Strictement UI-only : aucune logique métier.
 */

import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import { uploadImage } from "@compoz/infra/http/studio/media.client";
import { SettingsSection } from "@compoz/studio/components/layouts/SettingsSection";
import { StudioWarningsPanel } from "@compoz/studio/features/_shared/components/StudioWarningsPanel";
import { useStudioSaveDespiteWarningsConfirm } from "@compoz/studio/features/_shared/hooks/useStudioSaveDespiteWarningsConfirm";
import { useStudioDirtyGuard } from "@compoz/studio/features/dirty-guard/useStudioDirtyGuard";
import { SeoForm } from "@compoz/studio/features/settings/seo/components/organisms/SeoForm";
import { useSeoSettings } from "@compoz/studio/features/settings/seo/useSeoSettings";
import {
  computeSeoWarnings,
  type SeoWarningKey,
} from "@compoz/studio/features/settings/seo/validate";
import { notify } from "@compoz/studio/lib/ui/notify";
import { formatBytes } from "@compoz/ui/lib/format-bytes";
import type { SeoFormValues } from "@compoz/validation/site/settings/seo/seo-form";

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
  mediaAssetId?: string;
}>;

export function SeoSection() {
  const t = useTranslations();
  const { confirmSaveDespiteWarnings } = useStudioSaveDespiteWarningsConfirm();

  const dirtyGuard = useStudioDirtyGuard();

  // Hook settings : modèle UI (RHF).
  const { baseline, isLoading, isSaving, save } = useSeoSettings();

  // Warnings UI (non bloquants).
  const [warningKeys, setWarningKeys] = useState<SeoWarningKey[]>([]);

  // Erreurs bloquantes (near-field) : count remonté par le form.
  const [blockingErrorsCount, setBlockingErrorsCount] = useState(0);

  /**
   * Upload OG image : raster uniquement (jpg/png/webp).
   */
  const onUploadOgImage = useCallback(
    async (file: File): Promise<UploadedRasterImage> => {
      const res = await uploadImage(file, "og");

      if (res.wasResized || res.wasCompressed) {
        notify.info(
          t("studio.shared.upload.optimized", {
            from: formatBytes(res.originalSize),
            to: formatBytes(res.optimizedSize),
          }),
        );
      }

      return {
        url: res.url,
        width: res.width,
        height: res.height,
        mediaAssetId: res.mediaAssetId,
      };
    },
    [t],
  );

  // Submit : confirmation si warnings + save.
  const handleSubmit = useCallback(
    async (values: SeoFormValues) => {
      if (isLoading || isSaving) return;

      // 1) Warnings recalculés au submit (source de vérité).
      const warningKeysNow = computeSeoWarnings(values);

      // 2) Confirmation si warnings.
      const ok = await confirmSaveDespiteWarnings(
        warningKeysNow,
        "studio.seoSection.warnings",
      );

      if (!ok) return;

      // 3) Save.
      await save(values);
      dirtyGuard.setDirty(false);
    },
    [confirmSaveDespiteWarnings, isLoading, isSaving, dirtyGuard, save],
  );

  return (
    <SettingsSection
      id="seo"
      title={t("studio.seoSection.section.title")}
      description={t("studio.seoSection.section.description")}
      isBusy={isSaving}
      isLoading={isLoading}
      isDirty={dirtyGuard.isDirty}
      blockingErrorsCount={blockingErrorsCount}
    >
      <StudioWarningsPanel
        id="seo-warnings"
        warningKeys={warningKeys}
        warningMessageKeyPrefix="studio.seoSection.warnings"
      />

      <SeoForm
        initialValues={baseline}
        isSaving={isSaving}
        onSubmit={handleSubmit}
        onReset={() => {
          setWarningKeys([]);
          setBlockingErrorsCount(0);
          dirtyGuard.setDirty(false);
        }}
        onWarningKeysChange={setWarningKeys}
        onBlockingErrorsCountChange={setBlockingErrorsCount}
        onDirtyChange={dirtyGuard.setDirty}
        onUploadOgImage={onUploadOgImage}
      />
    </SettingsSection>
  );
}

SeoSection.displayName = "SeoSection";
