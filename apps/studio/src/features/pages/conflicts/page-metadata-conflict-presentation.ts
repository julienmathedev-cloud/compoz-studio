/**
 * @file apps/studio/src/features/pages/conflicts/page-metadata-conflict-presentation.ts
 * @layer studio/features/pages/conflicts
 * @description User-facing adapters for Page metadata OCC conflicts.
 */

import type {
  ConflictDisplayValue,
  ConflictPresentationGroup,
} from "@compoz/studio/features/conflicts/conflict-presentation";
import type { PageMetadataField } from "@compoz/core/domain/pages/revisions/page-metadata";
import { resolutionModeForStatus } from "@compoz/studio/features/conflicts/conflict-presentation";
import {
  PAGE_METADATA_CONFLICT_FIELDS,
  pageMetadataConflictStatus,
  type PageMetadataConflictState,
} from "@compoz/studio/features/pages/conflicts/page-metadata-conflict";
import { toPageFormValuesFromDTO } from "@compoz/studio/features/pages/mappers/pages-form";

type MetadataTranslations = (
  key: string,
  values?: Record<string, string | number>,
) => string;

type ChangeFrequencyTranslations = (key: string) => string;

function isSitemap(value: unknown): value is Readonly<{
  include?: unknown;
  priority?: unknown;
  changefreq?: unknown;
}> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function displayMetadataValue(
  field: PageMetadataField,
  value: unknown,
  t: MetadataTranslations,
  tChangeFrequency: ChangeFrequencyTranslations,
): ConflictDisplayValue {
  if (field === "paginationEnabled") {
    return {
      kind: "boolean",
      text: value === true ? t("boolean.true") : t("boolean.false"),
    };
  }

  if (field === "sitemap") {
    if (!isSitemap(value)) return { kind: "empty", text: t("empty") };
    const include = value.include === true ? t("sitemap.included") : t("sitemap.excluded");
    const frequency = typeof value.changefreq === "string"
      ? tChangeFrequency(value.changefreq)
      : t("sitemap.defaultFrequency");
    const priority = typeof value.priority === "number" ? String(value.priority) : t("sitemap.defaultPriority");
    return { kind: "list", items: [include, t("sitemap.frequency", { value: frequency }), t("sitemap.priority", { value: priority })] };
  }

  if (typeof value !== "string" || !value.trim()) {
    return { kind: "empty", text: t("empty") };
  }

  return { kind: field === "seoDescription" ? "rich-text" : "text", text: value };
}

export function toPageMetadataConflictPresentation(
  state: PageMetadataConflictState,
  t: MetadataTranslations,
  tChangeFrequency: ChangeFrequencyTranslations,
): readonly ConflictPresentationGroup[] {
  const current = toPageFormValuesFromDTO(state.details.current.page);

  return [{
    id: "page-metadata",
    items: PAGE_METADATA_CONFLICT_FIELDS.flatMap((field) => {
      const status = pageMetadataConflictStatus(state, field);
      if (!status) return [];

      return [{
        id: field,
        label: t(`fields.${field}`),
        status,
        resolutionMode: resolutionModeForStatus(status),
        comparison: {
          baseline: displayMetadataValue(field, state.baseline[field], t, tChangeFrequency),
          server: displayMetadataValue(field, current[field], t, tChangeFrequency),
          local: displayMetadataValue(field, state.local[field], t, tChangeFrequency),
        },
      }];
    }),
  }];
}
