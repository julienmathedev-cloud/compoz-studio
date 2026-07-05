"use client";

/**
 * @file apps/studio/src/features/_shared/components/ImageFields.tsx
 * @layer studio/features/_shared/ui
 *
 * @description
 * Champs image génériques (src + alt + caption + link optionnel) avec preview et upload optionnel.
 */

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import type { InternalPageOptionDTO } from "@compoz/core/domain/pages/dto";
import { ImageSelector } from "@compoz/studio/components/molecules/fields/ImageSelector";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { LinkFieldsItem } from "@compoz/studio/components/molecules/fields/LinkFieldsItem";
import { MAX_IMAGE_UPLOAD_BYTES } from "@compoz/studio/lib/config/uploads";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
  mediaAssetId?: string;
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
  idPrefix: string;
  srcField: FieldLike<string>;
  altField: FieldLike<string>;
  captionField?: FieldLike<string>;
  hrefField?: FieldLike<string | null>;
  newTabField?: FieldLike<boolean>;
  internalPageOptions?: ReadonlyArray<InternalPageOptionDTO>;
  disabled?: boolean;
  invalidAlt?: boolean;
  altErrorMessage?: string;
  onUploadImage?: (file: File) => Promise<UploadedRasterImage>;
  onUploaded?: (meta: UploadedRasterImage) => void;
  accept?: string;
  preferredTypes?: ReadonlyArray<string>;
  preferredTypeHint?: string;
  layout?: "stack" | "split";
  sideSlot?: ReactNode;
  labels: Readonly<{
    image: string;
    alt: string;
    caption?: string;
    href?: string;
  }>;
  help: Readonly<{
    image: string;
    alt: string;
    caption?: string;
    href?: string;
  }>;
  srcInvalid?: boolean;
  srcErrorMessage?: string;
  hrefInvalid?: boolean;
  hrefErrorMessage?: string;
}>;

export function ImageFields({
  idPrefix,
  srcField,
  altField,
  captionField,
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
  hrefInvalid,
  hrefErrorMessage,
}: ImageFieldsProps) {
  const t = useTranslations();

  const idsImage = createFieldIds(idPrefix, "src", { hint: true });
  const idsAlt = createFieldIds(idPrefix, "alt");
  const idsCaption = createFieldIds(idPrefix, "caption");

  const src = srcField.value ?? "";
  const altRaw = altField.value ?? "";
  const captionRaw = captionField?.value ?? "";

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
      data-invalid={invalidAlt || srcInvalid || hrefInvalid || undefined}
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
        onUploaded={(meta) => {
          onUploaded?.(meta);
        }}
        preferredTypes={preferredTypes}
        preferredTypeHint={preferredTypeHint}
        maxBytes={maxBytes}
        invalid={srcInvalid}
        errorMessage={srcErrorMessage}
      />

      <div className={cn(STACK_MD)}>
        <InputField
          ids={idsAlt}
          label={labels.alt}
          value={altRaw}
          onChange={(v) => altField.onChange(String(v ?? ""))}
          onBlur={() => altField.onBlur?.()}
          placeholder={t("studio.cellEditorTabs.image.altPlaceholder")}
          help={help.alt}
          disabled={isBusy}
          invalid={invalidAlt}
          error={altErrorMessage}
          autoCapitalize="sentences"
          autoCorrect="on"
        />

        {captionField ? (
          <InputField
            ids={idsCaption}
            label={
              labels.caption ?? t("studio.cellEditorTabs.image.captionLabel")
            }
            value={captionRaw}
            onChange={(v) => captionField.onChange(String(v ?? ""))}
            onBlur={() => captionField.onBlur?.()}
            placeholder={t("studio.cellEditorTabs.image.captionPlaceholder")}
            help={help.caption ?? t("studio.cellEditorTabs.image.captionHelp")}
            disabled={isBusy}
            autoCapitalize="sentences"
            autoCorrect="on"
          />
        ) : null}

        {sideSlot ? <div className={cn(STACK_MD)}>{sideSlot}</div> : null}

        {canShowLink ? (
          <LinkFieldsItem
            idPrefix={`${idPrefix}-href`}
            href={String(hrefField!.value ?? "")}
            onHrefChange={(next) => {
              const trimmed = String(next ?? "").trim();
              hrefField!.onChange(trimmed.length ? trimmed : null);
            }}
            disabled={isBusy}
            internalPageOptions={internalPageOptions}
            newTab={newTabField?.value}
            onNewTabChange={
              newTabField ? (v) => newTabField.onChange(Boolean(v)) : undefined
            }
            invalid={hrefInvalid}
            error={hrefErrorMessage}
            onValidateNow={(markTouched) => {
              if (markTouched) {
                hrefField?.onBlur?.();
                newTabField?.onBlur?.();
              }
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

ImageFields.displayName = "ImageFields";
