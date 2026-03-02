"use client";

/**
 * @file apps/studio/src/features/settings/identity/components/molecules/FaviconFields.tsx
 * @layer ui/molecules
 *
 * @description
 * Champs favicon (unique) : sélection d’image + preview, compatible RHF.
 *
 * @remarks
 * - Molecule UI : compose `ImageSelector`.
 * - La valeur canonique est pilotée via `faviconUrlField` (RHF).
 * - Formats acceptés : ico, png.
 * - Strictement UI-only : aucune logique métier.
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
}>;

/**
 * Props du composant `FaviconFields`.
 */
type FaviconFieldsProps = Readonly<{
  /** Titre du site (fallback pour le texte alternatif). */
  siteName: string;
  /** Texte alternatif du logo (prioritaire sur `siteName`). */
  logoAlt: string;
  /** Champ RHF contrôlé pour l’URL de la favicon. */
  faviconUrlField: ControllerRenderProps<IdentityFormValues, "faviconUrl">;
  /** IDs ARIA du champ favicon (générés via `createFieldIds` + `useIdPrefix`). */
  faviconIds: FieldIds;
  /** Désactive toute interaction (save / submit / upload). */
  disabled?: boolean;
  /** Upload optionnel de la favicon : reçoit un fichier et retourne une URL publique. */
  onUploadFavicon?: (file: File) => Promise<UploadedRasterImage>;
}>;

/**
 * Champs favicon standardisés (admin).
 */
export function FaviconFields({
  siteName,
  logoAlt,
  faviconUrlField,
  faviconIds,
  disabled,
  onUploadFavicon,
}: FaviconFieldsProps) {
  const t = useTranslations();
  const alt = logoAlt || siteName || t("admin.favicon.altFallback");

  // Types MIME acceptés pour les favicons.
  const FAVICON_ACCEPT = "image/x-icon,image/vnd.microsoft.icon,image/png";
  const maxBytes = MAX_IMAGE_UPLOAD_BYTES;

  return (
    <ImageSelector
      ids={faviconIds}
      label={t("admin.favicon.label")}
      url={String(faviconUrlField.value ?? "")}
      onUrlChange={(v) => faviconUrlField.onChange(String(v ?? ""))}
      disabled={disabled}
      previewAlt={alt}
      help={t("admin.favicon.help")}
      accept={FAVICON_ACCEPT}
      onFileSelect={onUploadFavicon}
      preferredTypes={["image/x-icon", "image/vnd.microsoft.icon", "image/png"]}
      preferredTypeHint={t("admin.favicon.preferredTypeHint")}
      maxBytes={maxBytes}
      // ✅ favicon : preview en "icône" (évite l’agrandissement pixelisé)
      previewMode="icon"
      previewSize={128}
    />
  );
}

FaviconFields.displayName = "FaviconFields";
