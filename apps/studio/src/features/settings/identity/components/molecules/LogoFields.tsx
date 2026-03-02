"use client";

/**
 * @file  apps/studio/src/features/settings/identity/components/molecules/LogoFields.tsx
 * @layer ui/molecules
 *
 * @description
 * Champs logo (URL + alt) avec preview, compatible RHF (admin).
 *
 * @remarks
 * - Molecule UI : compose `ImageSelector` et `InputField`.
 * - RHF-aware : reçoit directement les `field` RHF (`logoAlt`, `logoUrl`).
 * - Génère les IDs ARIA via `createFieldIds` à partir d’un `idPrefix`.
 * - Centralise les contraintes UI (formats recommandés, aide de longueur).
 * - Strictement UI-only : aucune logique métier.
 */

import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import type { ControllerRenderProps } from "react-hook-form";

import { LOGO } from "@compoz/core/constants/limits/logo";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import type { IdentityFormValues } from "@compoz/validation/site/settings/identity/identity-form";
import { MAX_IMAGE_UPLOAD_BYTES } from "@compoz/studio/lib/config/uploads";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import { cn } from "@compoz/ui/lib/utils";
import { ImageSelector } from "@compoz/studio/components/molecules/fields/ImageSelector";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
}>;

/**
 * Props du composant `LogoFields`.
 */
type LogoFieldsProps = Readonly<{
  idPrefix: string;
  siteName: string;
  logoAltField: ControllerRenderProps<IdentityFormValues, "logoAlt">;
  logoUrlField: ControllerRenderProps<IdentityFormValues, "logoUrl">;
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
  logoAltField,
  logoUrlField,
  disabled,
  invalidAlt,
  altErrorMessage,
  onUploadLogo,
}: LogoFieldsProps) {
  const isBusy = !!disabled;
  const t = useTranslations();

  // IDs ARIA dérivés du préfixe de champ.
  const logoAltIds = createFieldIds(idPrefix, "logoAlt");
  const logoImageIds = createFieldIds(idPrefix, "logoUrl", { hint: true });

  // Valeur actuelle de l'alt (depuis RHF) — string stable
  const currentAlt = String(logoAltField.value ?? "");

  // Alt effectif : valeur saisie → titre → fallback i18n.
  const alt = useMemo(
    () => currentAlt || siteName || t("admin.logoFields.altFallback"),
    [currentAlt, siteName, t],
  );

  // Recommandation : SVG prioritaire, fallback PNG/WEBP
  const LOGO_ACCEPT = "image/svg+xml,image/png,image/webp";
  const PREFERRED_LOGO = ["image/svg+xml"] as const;
  const preferredLogoHint = t("admin.logoFields.preferredTypeHint");

  // Aide dynamique pour l’alt en fonction de la longueur
  const NEAR_THRESHOLD = 10;
  const altLen = currentAlt.length;
  const altRemaining = Math.max(0, LOGO.ALT_MAX - altLen);

  const altHelpDynamic =
    altLen > 0 && altRemaining <= NEAR_THRESHOLD
      ? t("admin.logoFields.alt.helpNearLimit", { remaining: altRemaining })
      : t("admin.logoFields.alt.help");

  const maxBytes = MAX_IMAGE_UPLOAD_BYTES;

  /**
   * Adapter `onUploadLogo` → shape attendue par `ImageSelector`.
   *
   * @remarks
   * - SVG: pas de dimensions fiables (et pas utiles ici) → 0/0.
   * - Raster: si ton endpoint ne renvoie pas width/height, idem 0/0.
   *   (Tu peux raffiner plus tard si tu veux.)
   */
  const handleUploadLogo = useCallback(
    async (file: File): Promise<UploadedRasterImage> => {
      if (!onUploadLogo) {
        throw new Error("LogoFields: onUploadLogo is not provided.");
      }

      const { url, width, height } = await onUploadLogo(file);

      // ⚠️ Logo : width/height non critiques (SVG ou raster). On garde une shape stable.
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
        label={t("admin.logoFields.image.label")}
        url={String(logoUrlField.value ?? "")}
        onUrlChange={(v) => {
          const nextUrl = String(v ?? "");

          // ✅ FormValues stables : on stocke toujours une string
          logoUrlField.onChange(nextUrl);

          // ✅ Si on vient de supprimer le logo, on vide l'alt (string stable, pas undefined)
          if (!nextUrl.trim()) {
            logoAltField.onChange("");
          }
        }}
        disabled={isBusy}
        previewAlt={alt}
        help={t("admin.logoFields.image.help")}
        accept={LOGO_ACCEPT}
        onFileSelect={onUploadLogo ? handleUploadLogo : undefined}
        preferredTypes={PREFERRED_LOGO}
        preferredTypeHint={preferredLogoHint}
        maxBytes={maxBytes}
      />

      <InputField
        ids={logoAltIds}
        label={t("admin.logoFields.alt.label")}
        value={currentAlt}
        onChange={(v) => logoAltField.onChange(String(v ?? ""))}
        onBlur={logoAltField.onBlur}
        placeholder={t("admin.logoFields.alt.placeholder")}
        help={altHelpDynamic}
        required
        disabled={isBusy}
        showCount
        maxLength={LOGO.ALT_MAX}
        autoCapitalize="sentences"
        autoCorrect="on"
        invalid={invalidAlt}
        error={altErrorMessage}
      />
    </div>
  );
}

LogoFields.displayName = "LogoFields";
