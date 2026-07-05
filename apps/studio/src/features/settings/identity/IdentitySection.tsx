"use client";

/**
 * @file apps/studio/src/features/settings/identity/IdentitySection.tsx
 * @layer ui/studio/sections
 *
 * @description
 * Section Studio dédiée à l’identité du site : chargement (shell), édition (form), warnings UI et preview.
 *
 * @remarks
 * - Le chargement initial est géré par `SettingsSection` (shell).
 * - Monte `useIdentitySettings` (baseline + save) et câble `IdentityForm`.
 * - Affiche les warnings non bloquants (via `IdentityForm` + `computeIdentityWarnings` au submit).
 * - La preview `/preview/header` consomme la baseline `identity` (baseline-only).
 * - Strictement UI-only : aucune logique métier.
 */

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { uploadImage, uploadSvg } from "@compoz/infra/http/studio/media.client";
import { log } from "@compoz/infra/lib/log";
import { SettingsSection } from "@compoz/studio/components/layouts/SettingsSection";
import { StudioWarningsPanel } from "@compoz/studio/features/_shared/components/StudioWarningsPanel";
import { useStudioSaveDespiteWarningsConfirm } from "@compoz/studio/features/_shared/hooks/useStudioSaveDespiteWarningsConfirm";
import { useStudioDirtyGuard } from "@compoz/studio/features/dirty-guard/useStudioDirtyGuard";
import { IdentityForm } from "@compoz/studio/features/settings/identity/components/organisms/IdentityForm";
import { useIdentitySettings } from "@compoz/studio/features/settings/identity/useIdentitySettings";
import {
  computeIdentityWarnings,
  type IdentityWarningKey,
} from "@compoz/studio/features/settings/identity/validate";
import { notify } from "@compoz/studio/lib/ui/notify";
import { formatBytes } from "@compoz/ui/lib/format-bytes";
import type { IdentityFormValues } from "@compoz/validation/site/settings/identity/identity-form";

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
  mediaAssetId?: string;
}>;

const lg = log.child({ ns: "ui", area: "studio", name: "IdentitySection" });

export function IdentitySection() {
  const t = useTranslations();
  const { confirmSaveDespiteWarnings } = useStudioSaveDespiteWarningsConfirm();

  const dirtyGuard = useStudioDirtyGuard();

  const { baseline, isLoading, isSaving, save } = useIdentitySettings();

  useEffect(() => {
    lg.debug("identity.settings", {
      isLoading,
      isSaving,
      hasBaseline: Boolean(baseline),
      baseline,
    });
  }, [isLoading, isSaving, baseline]);

  /**
   * Upload logo : raster ou SVG.
   * Le serveur renvoie désormais toujours des dimensions exploitables.
   */
  const onUploadLogo = useCallback(
    async (file: File): Promise<UploadedRasterImage> => {
      if (file.type === "image/svg+xml") {
        const res = await uploadSvg(file);

        return {
          url: res.url,
          width: res.width,
          height: res.height,
          mediaAssetId: res.mediaAssetId,
        };
      }

      const res = await uploadImage(file, "logo");

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

  /**
   * Upload favicon : raster/ico uniquement (endpoint image).
   */
  const onUploadFavicon = useCallback(
    async (file: File): Promise<UploadedRasterImage> => {
      const res = await uploadImage(file, "favicon");

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

  const [warningKeys, setWarningKeys] = useState<IdentityWarningKey[]>([]);
  const [blockingErrorsCount, setBlockingErrorsCount] = useState(0);

  const handleSubmit = useCallback(
    async (values: IdentityFormValues) => {
      if (isLoading || isSaving) return;

      const warningKeysNow = computeIdentityWarnings({
        logo: values.logo,
        faviconUrl: values.faviconUrl,
      });

      const ok = await confirmSaveDespiteWarnings(
        warningKeysNow,
        "studio.identitySection.warnings",
      );

      if (!ok) return;

      await save(values);
      dirtyGuard.setDirty(false);
    },
    [confirmSaveDespiteWarnings, isLoading, isSaving, dirtyGuard, save],
  );

  const description = t("studio.identitySection.section.description");

  return (
    <SettingsSection
      id="identity"
      title={t("studio.identitySection.section.title")}
      description={description}
      isBusy={isSaving}
      isLoading={isLoading}
      isDirty={dirtyGuard.isDirty}
      blockingErrorsCount={blockingErrorsCount}
    >
      <StudioWarningsPanel
        id="identity-warnings"
        warningKeys={warningKeys}
        warningMessageKeyPrefix="studio.identitySection.warnings"
      />

      <IdentityForm
        initialValues={baseline}
        isSaving={isSaving}
        onSubmit={handleSubmit}
        onReset={() => {
          setWarningKeys([]);
          setBlockingErrorsCount(0);
          dirtyGuard.setDirty(false);
        }}
        onUploadLogo={onUploadLogo}
        onUploadFavicon={onUploadFavicon}
        onWarningKeysChange={setWarningKeys}
        onBlockingErrorsCountChange={setBlockingErrorsCount}
        onDirtyChange={dirtyGuard.setDirty}
      />
    </SettingsSection>
  );
}

IdentitySection.displayName = "IdentitySection";
