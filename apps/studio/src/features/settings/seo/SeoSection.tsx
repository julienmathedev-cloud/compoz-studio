"use client";

/**
 * @file apps/studio/src/features/settings/seo/SeoSection.tsx
 * @layer studio/features/settings/seo
 *
 * @description
 * Studio settings section for loading, editing, saving, and warning-checking global SEO settings.
 *
 * @remarks
 * - Form warnings are kept live for editor feedback, then recomputed on submit before the confirmation flow.
 * - OpenGraph image uploads are routed through the studio media API so MediaAsset metadata can be preserved by the form.
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
import { SettingsConflictPanel } from "@compoz/studio/features/settings/conflicts/SettingsConflictPanel";
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

  const { baseline, conflict, isLoading, isSaving, save } = useSeoSettings();

  const [warningKeys, setWarningKeys] = useState<SeoWarningKey[]>([]);

  const [blockingErrorsCount, setBlockingErrorsCount] = useState(0);

  /** Uploads only raster images accepted by the studio media pipeline. */
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

  const handleSubmit = useCallback(
    async (values: SeoFormValues) => {
      if (isLoading || isSaving) return;

      // Recompute warnings at submit time so confirmation uses the latest validated values.
      const warningKeysNow = computeSeoWarnings(values);

      const ok = await confirmSaveDespiteWarnings(
        warningKeysNow,
        "studio.seoSection.warnings",
      );

      if (!ok) return;

      const result = await save(values);
      if (result.status === "conflict") return;
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
      {conflict ? <SettingsConflictPanel conflict={conflict} focusTargetId="seo" /> : null}

      <SeoForm
        initialValues={baseline}
        isConflictResolving={conflict !== null}
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
