"use client";

/**
 * @file apps/studio/src/features/settings/seo/components/molecules/OpenGraphImageFields.tsx
 * @layer ui/studio/molecules
 *
 * @description
 * Champs OpenGraph image (URL via upload + alt) avec preview, compatible RHF (studio).
 *
 * @remarks
 * - Molecule UI : compose `ImageSelector` et `InputField`.
 * - RHF-aware : reçoit directement les `field` RHF (`defaultImageUrl`, `imageAlt`).
 * - IDs ARIA via `createFieldIds` à partir d’un `idPrefix`.
 * - Strictement UI-only.
 */

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { ControllerRenderProps } from "react-hook-form";

import { SEO } from "@compoz/core/constants/limits/seo";
import { ImageSelector } from "@compoz/studio/components/molecules/fields/ImageSelector";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { MAX_IMAGE_UPLOAD_BYTES } from "@compoz/studio/lib/config/uploads";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import type { SeoFormValues } from "@compoz/validation/site/settings/seo/seo-form";

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
  mediaAssetId?: string;
}>;

type OpenGraphImageFieldsProps = Readonly<{
  idPrefix: string;
  imageUrlField: ControllerRenderProps<
    SeoFormValues,
    "openGraph.defaultImageUrl"
  >;
  imageAltField: ControllerRenderProps<SeoFormValues, "openGraph.imageAlt">;
  disabled?: boolean;
  invalidUrl?: boolean;
  urlErrorMessage?: string;
  invalidAlt?: boolean;
  altErrorMessage?: string;
  onUploadOgImage?: (file: File) => Promise<UploadedRasterImage>;
}>;

export function OpenGraphImageFields({
  idPrefix,
  imageUrlField,
  imageAltField,
  disabled,
  invalidUrl,
  urlErrorMessage,
  invalidAlt,
  altErrorMessage,
  onUploadOgImage,
}: OpenGraphImageFieldsProps) {
  const t = useTranslations();
  const isBusy = !!disabled;

  const imageUrlIds = createFieldIds(idPrefix, "openGraph.defaultImageUrl", {
    hint: true,
  });
  const imageAltIds = createFieldIds(idPrefix, "openGraph.imageAlt");

  const currentAlt = String(imageAltField.value ?? "");
  const currentUrl = String(imageUrlField.value ?? "");

  const alt = useMemo(
    () =>
      currentAlt || t("studio.seoForm.openGraph.defaultImageUrl.altFallback"),
    [currentAlt, t],
  );

  const OG_ACCEPT = "image/jpeg,image/png,image/webp";
  const PREFERRED_OG = ["image/jpeg", "image/png", "image/webp"] as const;

  return (
    <div
      role="group"
      data-invalid={invalidUrl || invalidAlt || undefined}
      className={cn(STACK_MD)}
    >
      <ImageSelector
        ids={imageUrlIds}
        name={imageUrlField.name}
        label={t("studio.seoForm.openGraph.defaultImageUrl.label")}
        url={currentUrl}
        onUrlChange={(v) => {
          const nextUrl = String(v ?? "");
          imageUrlField.onChange(nextUrl);

          if (!nextUrl.trim()) {
            imageAltField.onChange("");
          }
        }}
        disabled={isBusy}
        previewAlt={alt}
        help={t("studio.seoForm.openGraph.defaultImageUrl.help")}
        accept={OG_ACCEPT}
        onFileSelect={onUploadOgImage}
        preferredTypes={PREFERRED_OG}
        preferredTypeHint={t(
          "studio.seoForm.openGraph.defaultImageUrl.preferredTypeHint",
        )}
        maxBytes={MAX_IMAGE_UPLOAD_BYTES}
        invalid={invalidUrl}
        errorMessage={urlErrorMessage}
      />

      <InputField
        ids={imageAltIds}
        name={imageAltField.name}
        label={t("studio.seoForm.openGraph.imageAlt.label")}
        value={currentAlt}
        onChange={(v) => imageAltField.onChange(String(v ?? ""))}
        onBlur={imageAltField.onBlur}
        placeholder={t("studio.seoForm.openGraph.imageAlt.placeholder")}
        help={t("studio.seoForm.openGraph.imageAlt.help")}
        disabled={isBusy}
        showCount
        maxLength={SEO.IMAGE_ALT.MAX}
        autoCapitalize="sentences"
        autoCorrect="on"
        invalid={invalidAlt}
        error={altErrorMessage}
      />
    </div>
  );
}

OpenGraphImageFields.displayName = "OpenGraphImageFields";
