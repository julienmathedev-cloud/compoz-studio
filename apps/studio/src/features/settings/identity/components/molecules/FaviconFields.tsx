"use client";

/**
 * @file apps/studio/src/features/settings/identity/components/molecules/FaviconFields.tsx
 * @layer studio/features/settings/identity/components/molecules
 *
 * @description
 * RHF-aware favicon selector with upload and preview support.
 *
 * @remarks
 * - Keeps the canonical favicon URL in RHF while showing a larger generated preview variant when possible.
 */

import { useTranslations } from "next-intl";
import type { ControllerRenderProps } from "react-hook-form";

import { ImageSelector } from "@compoz/studio/components/molecules/fields/ImageSelector";
import { MAX_IMAGE_UPLOAD_BYTES } from "@compoz/studio/lib/config/uploads";
import type { FieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import type { IdentityFormValues } from "@compoz/validation/site/settings/identity/identity-form";

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
  mediaAssetId?: string;
}>;

type FaviconFieldsProps = Readonly<{
  siteName: string;
  logoAlt: string;
  faviconUrlField: ControllerRenderProps<IdentityFormValues, "faviconUrl">;
  faviconMediaAssetIdField: ControllerRenderProps<
    IdentityFormValues,
    "faviconMediaAssetId"
  >;
  faviconIds: FieldIds;
  disabled?: boolean;
  onUploadFavicon?: (file: File) => Promise<UploadedRasterImage>;
}>;

/** Favicon uploads are intentionally limited to ICO and PNG. */
const FAVICON_ACCEPT = "image/x-icon,image/vnd.microsoft.icon,image/png";

const FAVICON_PREFERRED_TYPES = [
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "image/png",
] as const;

function resolveFaviconPreviewUrl(input: string): string {
  const url = String(input ?? "").trim();
  if (!url) return "";

  // Uploaded favicon variants use size suffixes; preview with the largest generated one.
  return url.replace(
    /-(16|32|48|180|192|512)(\.[a-z0-9]+)(\?.*)?$/i,
    "-512$2$3",
  );
}

export function FaviconFields({
  siteName,
  logoAlt,
  faviconUrlField,
  faviconMediaAssetIdField,
  faviconIds,
  disabled,
  onUploadFavicon,
}: FaviconFieldsProps) {
  const t = useTranslations();
  const alt = logoAlt || siteName || t("studio.favicon.altFallback");

  const canonicalUrl = String(faviconUrlField.value ?? "");
  const previewUrl = resolveFaviconPreviewUrl(canonicalUrl);

  return (
    <ImageSelector
      ids={faviconIds}
      label={t("studio.favicon.label")}
      url={previewUrl}
      onUrlChange={(value) => {
        faviconUrlField.onChange(String(value ?? ""));
        faviconMediaAssetIdField.onChange(undefined);
      }}
      disabled={disabled}
      previewAlt={alt}
      help={t("studio.favicon.help")}
      accept={FAVICON_ACCEPT}
      onFileSelect={onUploadFavicon}
      onUploaded={(uploaded) => {
        faviconUrlField.onChange(uploaded.url);
        faviconMediaAssetIdField.onChange(uploaded.mediaAssetId ?? undefined);
      }}
      preferredTypes={FAVICON_PREFERRED_TYPES}
      preferredTypeHint={t("studio.favicon.preferredTypeHint")}
      maxBytes={MAX_IMAGE_UPLOAD_BYTES}
      previewMode="icon"
      previewSize={64}
    />
  );
}
