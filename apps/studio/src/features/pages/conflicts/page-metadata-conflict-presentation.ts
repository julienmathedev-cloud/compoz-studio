/**
 * @file apps/studio/src/features/pages/conflicts/page-metadata-conflict-presentation.ts
 * @layer studio/features/pages/conflicts
 * @description User-facing adapters for Page metadata OCC conflicts.
 */

import type {
  ConflictDisplayValue,
  ConflictPresentationGroup,
} from "@compoz/studio/features/conflicts/conflict-presentation";
import type { PageMetadataConflictState } from "@compoz/studio/features/pages/conflicts/page-metadata-conflict";

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
  field: PageMetadataConflictState["unresolvedFields"][number],
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
  return [{
    id: "page-metadata",
    items: state.details.conflicts
      .filter((conflict) => state.unresolvedFields.includes(conflict.field))
      .map((conflict) => ({
        id: conflict.field,
        label: t(`fields.${conflict.field}`),
        status: "conflict" as const,
        resolutionMode: "choice" as const,
        comparison: {
          baseline: displayMetadataValue(conflict.field, conflict.baseline, t, tChangeFrequency),
          server: displayMetadataValue(conflict.field, conflict.current, t, tChangeFrequency),
          local: displayMetadataValue(conflict.field, conflict.local, t, tChangeFrequency),
        },
      })),
  }];
}
