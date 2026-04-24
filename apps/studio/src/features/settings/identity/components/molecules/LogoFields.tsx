"use client";

/**
 * @file apps/studio/src/features/settings/identity/components/molecules/LogoFields.tsx
 * @layer ui/studio/settings/identity/molecules
 *
 * @description
 * Champs logo (image + alt) avec preview, compatibles RHF (studio).
 *
 * @remarks
 * - Molecule UI : compose `ImageSelector` et `InputField`.
 * - RHF-aware : reçoit directement le `field` RHF du logo complet (`logo`).
 * - Génère les IDs ARIA via `createFieldIds` à partir d’un `idPrefix`.
 * - Centralise les contraintes UI (formats recommandés, aide de longueur).
 * - Strictement UI-only : aucune logique métier.
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
}>;

/**
 * Types MIME acceptés pour les logos.
 */
const LOGO_ACCEPT = "image/svg+xml,image/png,image/webp";

/**
 * Types MIME préférés pour les logos.
 */
const PREFERRED_LOGO = ["image/svg+xml"] as const;

/**
 * Seuil à partir duquel on affiche l’aide “proche de la limite”.
 */
const ALT_NEAR_LIMIT_THRESHOLD = 10;

/**
 * Props du composant `LogoFields`.
 */
type LogoFieldsProps = Readonly<{
  idPrefix: string;
  siteName: string;
  logoField: ControllerRenderProps<IdentityFormValues, "logo">;
  disabled?: boolean;
  invalidAlt?: boolean;
  altErrorMessage?: string;

  /**
   * Upload optionnel du logo.
   *
   * @remarks
   * - Peut renvoyer un SVG (logo) ou un raster (png/webp).
   * - Le composant `ImageSelector` attend une shape `{ url, width, height }`.
   */
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

  /**
   * IDs ARIA dérivés du préfixe de champ.
   */
  const logoAltIds = createFieldIds(idPrefix, "logo.alt");
  const logoImageIds = createFieldIds(idPrefix, "logo.src", { hint: true });

  /**
   * Valeur actuelle du logo (depuis RHF).
   */
  const currentLogo = logoField.value;
  const currentUrl = currentLogo?.src ?? "";
  const currentAlt = currentLogo?.alt ?? "";

  /**
   * Alt effectif : valeur saisie → titre → fallback i18n.
   */
  const previewAlt = useMemo(
    () => currentAlt || siteName || t("studio.logoFields.altFallback"),
    [currentAlt, siteName, t],
  );

  /**
   * Recommandation : SVG prioritaire, fallback PNG/WEBP.
   */
  const preferredLogoHint = t("studio.logoFields.preferredTypeHint");

  /**
   * Aide dynamique pour l’alt en fonction de la longueur.
   */
  const altLength = currentAlt.length;
  const altRemaining = Math.max(0, LOGO_ALT.MAX - altLength);

  const altHelpDynamic =
    altLength > 0 && altRemaining <= ALT_NEAR_LIMIT_THRESHOLD
      ? t("studio.logoFields.alt.helpNearLimit", { remaining: altRemaining })
      : t("studio.logoFields.alt.help");

  /**
   * Adapter `onUploadLogo` → shape attendue par `ImageSelector`.
   */
  const handleUploadLogo = useCallback(
    async (file: File): Promise<UploadedRasterImage> => {
      if (!onUploadLogo) {
        throw new Error("LogoFields: onUploadLogo is not provided.");
      }

      const { url, width, height } = await onUploadLogo(file);
      return { url, width, height };
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

          // Suppression du logo
          if (!nextUrl) {
            logoField.onChange(null);
            return;
          }

          // Mise à jour manuelle URL (cas saisie/édition textuelle)
          // On conserve les dimensions si elles existent déjà, sinon fallback neutre.
          if (!currentLogo?.width || !currentLogo?.height) {
            return;
          }

          logoField.onChange({
            src: nextUrl,
            alt: currentAlt,
            width: currentLogo.width,
            height: currentLogo.height,
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
