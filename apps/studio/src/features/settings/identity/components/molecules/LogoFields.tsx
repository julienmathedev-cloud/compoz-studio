"use client";

/**
 * @file apps/studio/src/features/settings/identity/components/molecules/LogoFields.tsx
 * @layer studio/features/settings/identity/components/molecules
 *
 * @description
 * RHF-aware logo selector with alt text editing and preview support.
 *
 * @remarks
 * - Keeps the whole logo object in one RHF field so URL, dimensions, alt text, and media asset id stay in sync.
 */

import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import type { ControllerRenderProps } from "react-hook-form";

import { LOGO_ALT } from "@compoz/core/constants/limits/logo";
import { ImageSelector } from "@compoz/studio/components/molecules/fields/ImageSelector";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { MAX_IMAGE_UPLOAD_BYTES } from "@compoz/studio/lib/config/uploads";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import type { IdentityFormValues } from "@compoz/validation/site/settings/identity/identity-form";

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
  mediaAssetId?: string;
}>;

/** Logo uploads are intentionally limited to SVG, PNG, and WEBP. */

const LOGO_ACCEPT = "image/svg+xml,image/png,image/webp";

const PREFERRED_LOGO = ["image/svg+xml"] as const;

const ALT_NEAR_LIMIT_THRESHOLD = 10;

type LogoFieldsProps = Readonly<{
  idPrefix: string;
  siteName: string;
  logoField: ControllerRenderProps<IdentityFormValues, "logo">;
  disabled?: boolean;
  invalidAlt?: boolean;
  altErrorMessage?: string;

  /** Uploads a logo and returns the shape expected by `ImageSelector`. */
  onUploadLogo?: (file: File) => Promise<UploadedRasterImage>;
}>;

export function LogoFields({
  idPrefix,
  siteName,
  logoField,
  disabled,
  invalidAlt,
  altErrorMessage,
  onUploadLogo,
}: LogoFieldsProps) {
  const t = useTranslations();
  const isBusy = !!disabled;

  const logoAltIds = createFieldIds(idPrefix, "logo.alt");
  const logoImageIds = createFieldIds(idPrefix, "logo.src", { hint: true });

  const currentLogo = logoField.value;
  const currentUrl = currentLogo?.src ?? "";
  const currentAlt = currentLogo?.alt ?? "";

  const previewAlt = useMemo(
    () => currentAlt || siteName || t("studio.logoFields.altFallback"),
    [currentAlt, siteName, t],
  );

  const preferredLogoHint = t("studio.logoFields.preferredTypeHint");

  const altLength = currentAlt.length;
  const altRemaining = Math.max(0, LOGO_ALT.MAX - altLength);

  const altHelpDynamic =
    altLength > 0 && altRemaining <= ALT_NEAR_LIMIT_THRESHOLD
      ? t("studio.logoFields.alt.helpNearLimit", { remaining: altRemaining })
      : t("studio.logoFields.alt.help");

  /** Keeps upload adaptation local because logos may be SVG or raster assets. */
  const handleUploadLogo = useCallback(
    async (file: File): Promise<UploadedRasterImage> => {
      if (!onUploadLogo) {
        throw new Error("LogoFields: onUploadLogo is not provided.");
      }

      const { url, width, height, mediaAssetId } = await onUploadLogo(file);
      return {
        url,
        width,
        height,
        ...(mediaAssetId ? { mediaAssetId } : {}),
      };
    },
    [onUploadLogo],
  );

  return (
    <div
      role="group"
      data-invalid={invalidAlt || undefined}
      className={cn(STACK_MD, "min-w-0")}
    >
      <ImageSelector
        ids={logoImageIds}
        label={t("studio.logoFields.image.label")}
        url={currentUrl}
        onUrlChange={(value) => {
          const nextUrl = String(value ?? "").trim();

          // Clearing the URL removes the whole logo object from RHF.
          if (!nextUrl) {
            logoField.onChange(null);
            return;
          }

          if (!currentLogo?.width || !currentLogo?.height) {
            return;
          }

          logoField.onChange({
            src: nextUrl,
            alt: currentAlt,
            width: currentLogo.width,
            height: currentLogo.height,
            ...(currentLogo.mediaAssetId
              ? { mediaAssetId: currentLogo.mediaAssetId }
              : {}),
          });
        }}
        disabled={isBusy}
        previewAlt={previewAlt}
        help={t("studio.logoFields.image.help")}
        accept={LOGO_ACCEPT}
        onFileSelect={onUploadLogo ? handleUploadLogo : undefined}
        onUploaded={(uploaded) => {
          logoField.onChange({
            src: uploaded.url,
            alt: currentAlt,
            width: uploaded.width,
            height: uploaded.height,
            ...(uploaded.mediaAssetId
              ? { mediaAssetId: uploaded.mediaAssetId }
              : {}),
          });
        }}
        preferredTypes={PREFERRED_LOGO}
        preferredTypeHint={preferredLogoHint}
        maxBytes={MAX_IMAGE_UPLOAD_BYTES}
      />

      <InputField
        ids={logoAltIds}
        label={t("studio.logoFields.alt.label")}
        value={currentAlt}
        onChange={(value) => {
          const nextAlt = String(value ?? "");

          if (currentLogo === null) {
            return;
          }

          logoField.onChange({
            ...currentLogo,
            alt: nextAlt,
          });
        }}
        onBlur={logoField.onBlur}
        placeholder={t("studio.logoFields.alt.placeholder")}
        help={altHelpDynamic}
        required
        disabled={isBusy || currentLogo === null}
        showCount
        maxLength={LOGO_ALT.MAX}
        autoCapitalize="sentences"
        autoCorrect="on"
        invalid={invalidAlt}
        error={altErrorMessage}
      />
    </div>
  );
}

LogoFields.displayName = "LogoFields";
