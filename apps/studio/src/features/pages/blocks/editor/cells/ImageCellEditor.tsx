"use client";

/**
 * @file apps/studio/src/features/pages/blocks/editor/cells/ImageCellEditor.tsx
 * @layer ui/organisms
 */

import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { Text } from "@compoz/studio/components/atoms/typography/Text";
import { ImageFields } from "@compoz/studio/features/_shared/ui/molecules/fields/ImageFields";
import { Button } from "@compoz/ui/components/ui/button";
import { cn } from "@compoz/ui/lib/utils";
import type { ImageCellFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";
import { ROW_SM, STACK_MD, STACK_SM } from "@compoz/ui/styles/studio/layout";

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
}>;

export type ImageCellEditorProps = Readonly<{
  idPrefix: string;
  value: ImageCellFormValues;
  onChange: (next: ImageCellFormValues) => void;
  disabled?: boolean;
  onUploadImage?: (file: File) => Promise<UploadedRasterImage>;
  srcInvalid?: boolean;
  srcErrorMessage?: string;
}>;

const VARIANTS = ["default", "wide", "portrait", "square"] as const;
type Variant = (typeof VARIANTS)[number];

export function ImageCellEditor({
  idPrefix,
  value,
  onChange,
  disabled,
  onUploadImage,
  srcInvalid,
  srcErrorMessage,
}: ImageCellEditorProps) {
  const t = useTranslations();

  const variant: Variant =
    value.variant && VARIANTS.includes(value.variant as Variant)
      ? (value.variant as Variant)
      : "default";

  const srcField = useMemo(
    () => ({
      value: value.image?.src ?? "",
      onChange: (v: string) => {
        const nextSrc = String(v ?? "");

        // ✅ écriture atomique : si src est vide, on vide aussi alt
        if (!nextSrc.trim()) {
          onChange({
            ...value,
            image: {
              ...value.image,
              src: "",
              alt: "",
              width: undefined,
              height: undefined,
            },
          });
          return;
        }

        onChange({
          ...value,
          image: {
            ...value.image,
            src: nextSrc,
          },
        });
      },
      onBlur: () => {},
    }),
    [onChange, value],
  );

  const altField = useMemo(
    () => ({
      value: value.image?.alt ?? "",
      onChange: (v: string) =>
        onChange({
          ...value,
          image: {
            ...value.image,
            alt: String(v ?? ""),
          },
        }),
      onBlur: () => {},
    }),
    [onChange, value],
  );

  const variantSlot = (
    <div className={cn(STACK_SM)}>
      <Text as="p" className="font-medium">
        {t("admin.cellEditorTabs.imageCellEditor.variantLabel")}
      </Text>

      <div className={cn(ROW_SM)}>
        {VARIANTS.map((v) => (
          <Button
            key={v}
            type="button"
            size="sm"
            variant={variant === v ? "default" : "ghost"}
            disabled={disabled}
            onClick={() => {
              if (v === "default") {
                // ✅ on retire la variant pour revenir au défaut
                // (tout en conservant l'objet image)
                const { variant: _variant, ...rest } = value;
                onChange(rest);
                return;
              }

              onChange({ ...value, variant: v });
            }}
          >
            {t(`admin.cellEditorTabs.imageCellEditor.variants.${v}`)}
          </Button>
        ))}
      </div>
    </div>
  );

  return (
    <div className={cn(STACK_MD)}>
      <ImageFields
        idPrefix={idPrefix}
        srcField={srcField}
        altField={altField}
        disabled={disabled}
        onUploadImage={onUploadImage}
        onUploaded={(meta) => {
          onChange({
            ...value,
            image: {
              ...value.image,
              src: meta.url,
              width: meta.width,
              height: meta.height,
            },
          });
        }}
        accept="image/jpeg,image/png,image/webp,image/avif"
        preferredTypes={["image/webp", "image/avif"]}
        preferredTypeHint={t("admin.imageSelector.hints.notRecommendedType", {
          types: "WEBP, AVIF",
        })}
        labels={{
          image: t("admin.cellEditorTabs.image.srcLabel"),
          alt: t("admin.cellEditorTabs.image.altLabel"),
        }}
        help={{
          image: t("admin.cellEditorTabs.image.srcHelp"),
          alt: t("admin.cellEditorTabs.image.altHelp"),
        }}
        layout="split"
        sideSlot={variantSlot}
        srcInvalid={srcInvalid}
        srcErrorMessage={srcErrorMessage}
      />
    </div>
  );
}

ImageCellEditor.displayName = "ImageCellEditor";
