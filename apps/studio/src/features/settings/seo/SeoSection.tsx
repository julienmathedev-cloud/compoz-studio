"use client";

/**
 * @file apps/studio/src/features/settings/seo/SeoSection.tsx
 * @layer ui/sections
 *
 * @description
 * Section d’administration dédiée au SEO : chargement (shell), édition (form), warnings UI et confirmation au submit.
 *
 * @remarks
 * - Le chargement initial est géré par `SettingsSection` (shell).
 * - Monte `useSeoSettings` (baseline + save) et câble `SeoForm`.
 * - Affiche les warnings non bloquants en `HintList` (dérivés du form).
 * - Au submit : recalcule les warnings, demande confirmation, puis sauvegarde.
 * - Strictement UI-only : aucune logique métier.
 */

import { uploadImage } from "@compoz/infra/http/studio/media.client";
import { formatBytes } from "@compoz/ui/lib/format-bytes";
import type { SeoFormValues } from "@compoz/validation/site/settings/seo/seo-form";
import { ExpandableLayout } from "@compoz/studio/components/layouts/ExpandableLayout";
import { SettingsSection } from "@compoz/studio/components/layouts/SettingsSection";
import { HintList } from "@compoz/studio/components/molecules/feedback/HintList";
import { useConfirmList } from "@compoz/studio/features/confirm/useConfirmList";
import { useAdminDirtyGuard } from "@compoz/studio/features/dirty-guard/useAdminDirtyGuard";
import { SeoForm } from "@compoz/studio/features/settings/seo/components/organisms/SeoForm";
import { useSeoSettings } from "@compoz/studio/features/settings/seo/useSeoSettings";
import {
  computeSeoWarnings,
  type SeoWarningKey,
} from "@compoz/studio/features/settings/seo/validate";
import { notify } from "@compoz/studio/lib/ui/notify";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
}>;

export function SeoSection() {
  const confirmList = useConfirmList();
  const t = useTranslations();

  const dirtyGuard = useAdminDirtyGuard();

  // Hook settings : modèle UI (RHF).
  const { baseline, isLoading, isSaving, save } = useSeoSettings();

  // Warnings UI (non bloquants).
  const [warningKeys, setWarningKeys] = useState<SeoWarningKey[]>([]);

  const warningHints = useMemo(
    () => warningKeys.map((k) => t(`admin.seoSection.warnings.${k}`)),
    [warningKeys, t],
  );

  // ✅ Erreurs bloquantes (near-field) : count remonté par le form.
  const [blockingErrorsCount, setBlockingErrorsCount] = useState(0);

  /**
   * Upload OG image : raster uniquement (jpg/png/webp).
   */
  const onUploadOgImage = useCallback(
    async (file: File): Promise<UploadedRasterImage> => {
      const res = await uploadImage(file, "og");

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

  // Submit : confirmation si warnings + save.
  const handleSubmit = useCallback(
    async (values: SeoFormValues) => {
      if (isLoading || isSaving) return;

      // 1) Warnings recalculés au submit (source de vérité).
      const warningKeysNow = computeSeoWarnings(values);
      const warningHintsNow = warningKeysNow.map((k) =>
        t(`admin.seoSection.warnings.${k}`),
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
    },
    [confirmList, isLoading, isSaving, dirtyGuard, save, t],
  );

  return (
    <SettingsSection
      id="seo"
      title={t("admin.seoSection.section.title")}
      description={t("admin.seoSection.section.description")}
      isBusy={isSaving}
      isLoading={isLoading}
      isDirty={dirtyGuard.isDirty}
      blockingErrorsCount={blockingErrorsCount}
    >
      <ExpandableLayout
        id="seo-warnings"
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
        {!isLoading && warningHints.length > 0 ? (
          <HintList
            variant="warning"
            title={t("admin.shared.warningsPanel.title")}
            hints={warningHints}
          />
        ) : null}
      </ExpandableLayout>

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
