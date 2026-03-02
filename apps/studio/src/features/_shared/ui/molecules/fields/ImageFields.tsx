"use client";

/**
 * @file apps/studio/src/features/_shared/ui/molecules/fields/ImageFields.tsx
 * @layer ui/molecules
 *
 * @description
 * Champs image génériques (src + alt + link optionnel) avec preview et upload optionnel.
 */

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { ImageSelector } from "@compoz/studio/components/molecules/fields/ImageSelector";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { LinkFieldsItem } from "@compoz/studio/features/settings/menus/_shared/LinkFieldsItem";
import type { InternalPageOptionDTO } from "@compoz/core/domain/pages/dto";
import { MAX_IMAGE_UPLOAD_BYTES } from "@compoz/studio/lib/config/uploads";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
}>;

/**
 * Champ minimal compatible avec RHF et avec un modèle contrôlé.
 */
type FieldLike<T> = Readonly<{
  value: T;
  onChange: (next: T) => void;
  onBlur?: () => void;
}>;

type ImageFieldsProps = Readonly<{
  /** Préfixe stable pour générer les IDs ARIA. */
  idPrefix: string;

  /** Champs (RHF ou contrôlés). */
  srcField: FieldLike<string>;
  altField: FieldLike<string>;

  /** Optionnel : href (gallery menu). */
  hrefField?: FieldLike<string | null>;

  /**
   * Optionnel : newTab (tu as dit que ça ne dérange pas).
   * Si présent => LinkFieldsItem affichera le switch.
   */
  newTabField?: FieldLike<boolean>;

  /** Options internes (picker) */
  internalPageOptions?: ReadonlyArray<InternalPageOptionDTO>;

  /** Désactive toute interaction. */
  disabled?: boolean;

  /** Indicateur invalidité + message d’erreur alt (optionnel). */
  invalidAlt?: boolean;
  altErrorMessage?: string;

  /** Upload optionnel. */
  onUploadImage?: (file: File) => Promise<UploadedRasterImage>;
  onUploaded?: (meta: UploadedRasterImage) => void;
  /** Config input file. */
  accept?: string;
  preferredTypes?: ReadonlyArray<string>;
  preferredTypeHint?: string;

  /** Layout */
  layout?: "stack" | "split";

  /** Slot optionnel */
  sideSlot?: ReactNode;

  /** Libellés */
  labels: Readonly<{
    image: string;
    alt: string;
    href?: string;
  }>;

  /** Aide (optionnelle) */
  help: Readonly<{
    image: string;
    alt: string;
    href?: string;
  }>;

  srcInvalid?: boolean;
  srcErrorMessage?: string;
}>;

export function ImageFields({
  idPrefix,
  srcField,
  altField,
  hrefField,
  newTabField,
  internalPageOptions,
  disabled,
  invalidAlt,
  altErrorMessage,
  onUploadImage,
  onUploaded,
  accept = "image/*",
  preferredTypes,
  preferredTypeHint,
  layout = "stack",
  sideSlot,
  labels,
  help,
  srcInvalid,
  srcErrorMessage,
}: ImageFieldsProps) {
  const t = useTranslations();

  const idsImage = createFieldIds(idPrefix, "src", { hint: true });
  const idsAlt = createFieldIds(idPrefix, "alt");

  const src = srcField.value ?? "";
  const altRaw = altField.value ?? "";

  const isBusy = Boolean(disabled);
  const maxBytes = MAX_IMAGE_UPLOAD_BYTES;

  const containerClass =
    layout === "split"
      ? "grid gap-4 md:grid-cols-2 md:items-start"
      : cn(STACK_MD);

  const canShowLink = Boolean(hrefField);

  return (
    <div
      role="group"
      data-invalid={invalidAlt || srcInvalid || undefined}
      className={cn(containerClass)}
    >
      <ImageSelector
        ids={idsImage}
        label={labels.image}
        url={src}
        onUrlChange={(v) => srcField.onChange(v ?? "")}
        disabled={isBusy}
        previewAlt={altRaw}
        help={help.image}
        accept={accept}
        onFileSelect={onUploadImage}
        onUploaded={onUploaded}
        preferredTypes={preferredTypes}
        preferredTypeHint={preferredTypeHint}
        maxBytes={maxBytes}
        invalid={srcInvalid}
        errorMessage={srcErrorMessage}
      />

      <div className={cn(STACK_MD)}>
        {sideSlot ? <div className={cn(STACK_MD)}>{sideSlot}</div> : null}

        <InputField
          ids={idsAlt}
          label={labels.alt}
          value={altRaw}
          onChange={(v) => altField.onChange(String(v ?? ""))}
          onBlur={() => altField.onBlur?.()}
          placeholder={t("admin.cellEditorTabs.image.altPlaceholder")}
          help={help.alt}
          disabled={isBusy}
          invalid={invalidAlt}
          error={altErrorMessage}
          autoCapitalize="sentences"
          autoCorrect="on"
        />

        {/* ✅ Link editor (menu-like) */}
        {canShowLink ? (
          <LinkFieldsItem
            idPrefix={`${idPrefix}-href`}
            href={String(hrefField!.value ?? "")}
            onHrefChange={(next) => {
              // "" => null (reset)
              const trimmed = String(next ?? "").trim();
              hrefField!.onChange(trimmed.length ? trimmed : null);
            }}
            disabled={isBusy}
            internalPageOptions={internalPageOptions}
            // newTab optionnel (tu veux le laisser possible)
            newTab={newTabField?.value}
            onNewTabChange={
              newTabField ? (v) => newTabField.onChange(Boolean(v)) : undefined
            }
          />
        ) : null}
      </div>
    </div>
  );
}

ImageFields.displayName = "ImageFields";
