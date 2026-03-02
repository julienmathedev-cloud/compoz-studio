"use client";

/**
 * @file apps/studio/src/features/settings/identity/IdentitySection.tsx
 * @layer ui/sections
 *
 * @description
 * Section d’administration dédiée à l’identité du site : chargement (shell), édition (form), warnings UI et preview.
 *
 * @remarks
 * - Le chargement initial est géré par `SettingsSection` (shell).
 * - Monte `useIdentitySettings` (baseline + save) et câble `IdentityForm`.
 * - Affiche les warnings non bloquants (via `IdentityForm` + `computeIdentityWarnings` au submit).
 * - La preview `/preview/header` consomme la baseline `identity` (baseline-only).
 * - Strictement UI-only : aucune logique métier.
 */

import { SettingsSection } from "@compoz/studio/components/layouts/SettingsSection";
import { HintList } from "@compoz/studio/components/molecules/feedback/HintList";
import { useConfirmList } from "@compoz/studio/features/confirm/useConfirmList";
import { useAdminDirtyGuard } from "@compoz/studio/features/dirty-guard/useAdminDirtyGuard";
import { IdentityForm } from "@compoz/studio/features/settings/identity/components/organisms/IdentityForm";
import { useIdentitySettings } from "@compoz/studio/features/settings/identity/useIdentitySettings";

import { uploadImage, uploadSvg } from "@compoz/infra/http/studio/media.client";
import { formatBytes } from "@compoz/ui/lib/format-bytes";
import type { IdentityFormValues } from "@compoz/validation/site/settings/identity/identity-form";
import { ExpandableLayout } from "@compoz/studio/components/layouts/ExpandableLayout";
import {
  computeIdentityWarnings,
  type IdentityWarningKey,
} from "@compoz/studio/features/settings/identity/validate";
import { notify } from "@compoz/studio/lib/ui/notify";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
}>;
export function IdentitySection() {
  const confirmList = useConfirmList();
  const t = useTranslations();

  const dirtyGuard = useAdminDirtyGuard();

  const { baseline, isLoading, isSaving, save } = useIdentitySettings();

  /**
   * Upload logo : SVG only (endpoint dédié).
   */
  const onUploadLogo = useCallback(
    async (file: File): Promise<UploadedRasterImage> => {
      if (file.type === "image/svg+xml") {
        const { url } = await uploadSvg(file);
        return { url, width: 0, height: 0 };
      }

      const res = await uploadImage(file, "logo");

      if (res.wasResized || res.wasCompressed) {
        notify.info(
          t("admin.shared.upload.optimized", {
            from: formatBytes(res.originalSize),
            to: formatBytes(res.optimizedSize),
          }),
        );
      }

      return {
        url: res.url,
        width: res.width,
        height: res.height,
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
          t("admin.shared.upload.optimized", {
            from: formatBytes(res.originalSize),
            to: formatBytes(res.optimizedSize),
          }),
        );
      }

      return {
        url: res.url,
        width: res.width,
        height: res.height,
      };
    },
    [t],
  );

  // Warnings UI (non bloquants).
  const [warningKeys, setWarningKeys] = useState<IdentityWarningKey[]>([]);

  const warningHints = useMemo(
    () => warningKeys.map((k) => t(`admin.identitySection.warnings.${k}`)),
    [warningKeys, t],
  );

  const [blockingErrorsCount, setBlockingErrorsCount] = useState(0);

  // Submit : confirmation si warnings + save.
  const handleSubmit = useCallback(
    async (values: IdentityFormValues) => {
      if (isLoading || isSaving) return;

      const warningKeysNow = computeIdentityWarnings({
        logoUrl: values.logoUrl,
        faviconUrl: values.faviconUrl,
      });

      const warningHintsNow = warningKeysNow.map((k) =>
        t(`admin.identitySection.warnings.${k}`),
      );

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

      await save(values);
      dirtyGuard.setDirty(false);
    },
    [confirmList, isLoading, isSaving, dirtyGuard, save, t],
  );

  const description = t("admin.identitySection.section.description");

  return (
    <SettingsSection
      id="identity"
      title={t("admin.identitySection.section.title")}
      description={description}
      isBusy={isSaving}
      isLoading={isLoading}
      isDirty={dirtyGuard.isDirty}
      blockingErrorsCount={blockingErrorsCount}
    >
      <ExpandableLayout
        id="identity-warnings"
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

      <IdentityForm
        initialValues={baseline}
        isSaving={isSaving}
        onSubmit={handleSubmit}
        onReset={() => {
          setWarningKeys([]);
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
