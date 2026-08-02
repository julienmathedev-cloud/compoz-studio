/**
 * @file apps/studio/src/features/pages/lib/page-form-metadata-commit.ts
 * @layer studio/features/pages/lib
 * @description Commits only page metadata into RHF while preserving structural parent state.
 */

import type { UseFormResetField } from "react-hook-form";

import type { PageFormValues } from "@compoz/validation/pages/page-form";

export function rebasePageFormMetadataValues(
  baseline: PageFormValues,
  metadataValues: PageFormValues,
): PageFormValues {
  return {
    ...baseline,
    name: metadataValues.name,
    slug: metadataValues.slug,
    seoTitle: metadataValues.seoTitle,
    seoDescription: metadataValues.seoDescription,
    sitemap: metadataValues.sitemap,
    paginationEnabled: metadataValues.paginationEnabled,
  };
}

export function commitPageFormMetadataResolution(
  baseline: PageFormValues,
  resetField: UseFormResetField<PageFormValues>,
  metadataValues: PageFormValues,
): PageFormValues {
  const options = {
    keepError: false,
    keepTouched: true,
  } as const;

  resetField("name", { ...options, defaultValue: metadataValues.name });
  resetField("slug", { ...options, defaultValue: metadataValues.slug });
  resetField("seoTitle", { ...options, defaultValue: metadataValues.seoTitle });
  resetField("seoDescription", {
    ...options,
    defaultValue: metadataValues.seoDescription,
  });
  resetField("sitemap", { ...options, defaultValue: metadataValues.sitemap });
  resetField("paginationEnabled", {
    ...options,
    defaultValue: metadataValues.paginationEnabled,
  });

  return rebasePageFormMetadataValues(baseline, metadataValues);
}
