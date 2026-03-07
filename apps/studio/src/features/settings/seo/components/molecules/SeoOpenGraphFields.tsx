"use client";

/**
 * @file apps/studio/src/features/settings/seo/components/molecules/SeoOpenGraphFields.tsx
 * @layer ui/studio/molecules
 * @description Champs Open Graph SEO (title / description + image via OpenGraphImageFields).
 */

import type { Control } from "react-hook-form";
import { Controller, useController, useFormState } from "react-hook-form";

import { SEO } from "@compoz/core/constants/limits/seo";
import { InputField } from "@compoz/studio/components/molecules/fields/InputField";
import { TextareaField } from "@compoz/studio/components/molecules/fields/TextareaField";
import { OpenGraphImageFields } from "@compoz/studio/features/settings/seo/components/molecules/OpenGraphImageFields";
import { createFieldIds } from "@compoz/ui/lib/forms/use-id-prefix";
import { cn } from "@compoz/ui/lib/utils";
import { STACK_MD } from "@compoz/ui/styles/studio/layout";
import type { SeoFormValues } from "@compoz/validation/site/settings/seo/seo-form";

type UploadedRasterImage = Readonly<{
  url: string;
  width: number;
  height: number;
}>;

type SeoOpenGraphFieldsProps = Readonly<{
  control: Control<SeoFormValues>;
  isBusy: boolean;
  t: (key: string) => string;
  idPrefix: string;
  onUploadOgImage?: (file: File) => Promise<UploadedRasterImage>;
}>;

export function SeoOpenGraphFields({
  control,
  isBusy,
  t,
  idPrefix,
  onUploadOgImage,
}: SeoOpenGraphFieldsProps) {
  const ogImageUrl = useController({
    name: "openGraph.defaultImageUrl",
    control,
  });

  const ogImageAlt = useController({
    name: "openGraph.imageAlt",
    control,
  });

  const { errors, touchedFields, submitCount } = useFormState({ control });
  const showError = submitCount > 0;

  const touchedOgUrl = Boolean(touchedFields.openGraph?.defaultImageUrl);
  const touchedOgAlt = Boolean(touchedFields.openGraph?.imageAlt);

  const invalidOgUrl =
    (showError || touchedOgUrl) &&
    Boolean(
      errors.openGraph?.defaultImageUrl?.message ??
      errors.openGraph?.defaultImageUrl,
    );

  const invalidOgAlt =
    (showError || touchedOgAlt) &&
    Boolean(errors.openGraph?.imageAlt?.message ?? errors.openGraph?.imageAlt);

  const ogUrlErrorMessage =
    (showError || touchedOgUrl) && errors.openGraph?.defaultImageUrl?.message
      ? String(errors.openGraph.defaultImageUrl.message)
      : undefined;

  const ogAltErrorMessage =
    (showError || touchedOgAlt) && errors.openGraph?.imageAlt?.message
      ? String(errors.openGraph.imageAlt.message)
      : undefined;

  const ogTitleIds = createFieldIds(idPrefix, "openGraph.title");
  const ogDescriptionIds = createFieldIds(idPrefix, "openGraph.description");

  return (
    <>
      <OpenGraphImageFields
        idPrefix={idPrefix}
        imageUrlField={ogImageUrl.field}
        imageAltField={ogImageAlt.field}
        disabled={isBusy}
        invalidUrl={invalidOgUrl}
        urlErrorMessage={ogUrlErrorMessage}
        invalidAlt={invalidOgAlt}
        altErrorMessage={ogAltErrorMessage}
        onUploadOgImage={onUploadOgImage}
      />

      <div className={cn(STACK_MD)}>
        <Controller
          name="openGraph.title"
          control={control}
          render={({ field }) => (
            <InputField
              ids={ogTitleIds}
              label={t("studio.seoForm.openGraph.title.label")}
              value={field.value ?? ""}
              onChange={(v) => field.onChange(String(v ?? ""))}
              onBlur={field.onBlur}
              placeholder={t("studio.seoForm.openGraph.title.placeholder")}
              help={t("studio.seoForm.openGraph.title.help")}
              disabled={isBusy}
              showCount
              maxLength={SEO.TITLE.MAX}
            />
          )}
        />

        <Controller
          name="openGraph.description"
          control={control}
          render={({ field }) => (
            <TextareaField
              ids={ogDescriptionIds}
              label={t("studio.seoForm.openGraph.description.label")}
              value={field.value ?? ""}
              onChange={(v) => field.onChange(String(v ?? ""))}
              onBlur={field.onBlur}
              placeholder={t(
                "studio.seoForm.openGraph.description.placeholder",
              )}
              help={t("studio.seoForm.openGraph.description.help")}
              rows={6}
              disabled={isBusy}
              showCount
              maxLength={SEO.DESCRIPTION.MAX}
            />
          )}
        />
      </div>
    </>
  );
}

SeoOpenGraphFields.displayName = "SeoOpenGraphFields";
