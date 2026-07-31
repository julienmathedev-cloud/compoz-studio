/**
 * @file apps/studio/src/features/pages/mappers/pages-form.ts
 * @layer studio/features/pages/mappers
 * @description Page form mapping, canonical normalization, and targeted OCC intent construction.
 */

import type { PageDTO } from "@compoz/core/domain/pages/dto";
import { toSlugIntentInput } from "@compoz/ui/lib/routing/slug";
import { toPageShapeFromDTO } from "@compoz/ui/pages/mappers/page-shape";
import type { PageFormValues } from "@compoz/validation/pages/page-form";
import type {
  CreatePageIntentDTO,
  UpdatePageIntentDTO,
} from "@compoz/validation/pages/page-intents";

const DEFAULT_SITEMAP: NonNullable<PageFormValues["sitemap"]> = {
  include: true,
  priority: null,
  changefreq: null,
};

export type PageFormDirtyFields = Partial<
  Readonly<Record<keyof PageFormValues, unknown>>
>;

export type PageFormSubmissionResult =
  | Readonly<{ rebaseValues: PageFormValues }>
  | Readonly<{ rebaseParentId: string | null; notice: "currentStructureAdopted" }>
  | void;

export function toPageFormValuesFromDTO(
  page: PageDTO | null | undefined,
  slugFallback?: string,
): PageFormValues {
  return toPageShapeFromDTO(page, slugFallback);
}

export function toPageFormValuesFromDraftSources(
  page: PageDTO | null | undefined,
  structuralParentId: string | null | undefined,
  slugFallback?: string,
): PageFormValues {
  const values = toPageFormValuesFromDTO(page, slugFallback);

  return {
    ...values,
    parentId:
      structuralParentId === undefined
        ? values.parentId
        : structuralParentId,
  };
}

export function normalizePageFormValues(
  values: PageFormValues,
): PageFormValues {
  return {
    name: String(values.name ?? "").trim(),
    seoTitle:
      values.seoTitle !== null
        ? String(values.seoTitle ?? "").trim() || null
        : null,
    seoDescription:
      values.seoDescription !== null
        ? String(values.seoDescription ?? "").trim() || null
        : null,
    parentId: values.parentId ?? null,
    slug: toSlugIntentInput(String(values.slug ?? "").trim()),
    sitemap: values.sitemap
      ? {
          include: values.sitemap.include ?? DEFAULT_SITEMAP.include,
          priority: values.sitemap.priority ?? DEFAULT_SITEMAP.priority,
          changefreq: values.sitemap.changefreq ?? DEFAULT_SITEMAP.changefreq,
        }
      : null,
    paginationEnabled: values.paginationEnabled ?? false,
  };
}

function sitemapEquals(
  left: PageFormValues["sitemap"],
  right: PageFormValues["sitemap"],
): boolean {
  if (left === null || right === null) return left === right;

  return (
    left?.include === right?.include &&
    left?.priority === right?.priority &&
    left?.changefreq === right?.changefreq
  );
}

function toPageSitemapIntentDTOFromFormValues(
  values: PageFormValues["sitemap"],
): CreatePageIntentDTO["sitemap"] {
  if (!values) return null;

  return {
    include: values.include,
    changefreq: values.changefreq,
    priority: values.priority,
  };
}

function toFullPageSitemapIntentDTO(
  values: PageFormValues["sitemap"],
): NonNullable<
  NonNullable<
    UpdatePageIntentDTO["metadataChanges"]
  >["changes"]["sitemap"]
>["baseline"] {
  if (!values) return null;

  return {
    include: values.include ?? DEFAULT_SITEMAP.include,
    changefreq: values.changefreq ?? DEFAULT_SITEMAP.changefreq,
    priority: values.priority ?? DEFAULT_SITEMAP.priority,
  };
}

export function toCreatePageIntentDTOFromFormValues(
  values: PageFormValues,
  expectedDraftStructureRevision: number,
): CreatePageIntentDTO {
  const normalizedValues = normalizePageFormValues(values);
  const slug = toSlugIntentInput(normalizedValues.slug);

  return {
    name: normalizedValues.name,
    seoTitle: normalizedValues.seoTitle,
    seoDescription: normalizedValues.seoDescription,
    parentId: normalizedValues.parentId,
    paginationEnabled: normalizedValues.paginationEnabled,
    sitemap: toPageSitemapIntentDTOFromFormValues(normalizedValues.sitemap),
    expectedDraftStructureRevision,
    ...(slug ? { slug } : {}),
  };
}

export function toUpdatePageIntentDTOFromFormValues(input: Readonly<{
  baseline: PageFormValues;
  local: PageFormValues;
  expectedMetaRevision: number;
  expectedDraftStructureRevision?: number;
  dirtyFields?: PageFormDirtyFields;
}>): UpdatePageIntentDTO {
  const baseline = normalizePageFormValues(input.baseline);
  const local = normalizePageFormValues(input.local);
  const changes: NonNullable<
    UpdatePageIntentDTO["metadataChanges"]
  >["changes"] = {};

  if (baseline.name !== local.name) {
    changes.name = { baseline: baseline.name, local: local.name };
  }
  if (baseline.slug !== local.slug) {
    changes.slug = { baseline: baseline.slug, local: local.slug };
  }
  if (baseline.seoTitle !== local.seoTitle) {
    changes.seoTitle = {
      baseline: baseline.seoTitle,
      local: local.seoTitle,
    };
  }
  if (baseline.seoDescription !== local.seoDescription) {
    changes.seoDescription = {
      baseline: baseline.seoDescription,
      local: local.seoDescription,
    };
  }
  if (!sitemapEquals(baseline.sitemap, local.sitemap)) {
    changes.sitemap = {
      baseline: toFullPageSitemapIntentDTO(baseline.sitemap),
      local: toFullPageSitemapIntentDTO(local.sitemap),
    };
  }
  if (baseline.paginationEnabled !== local.paginationEnabled) {
    changes.paginationEnabled = {
      baseline: baseline.paginationEnabled,
      local: local.paginationEnabled,
    };
  }

  const hasMetadataChanges = Object.keys(changes).length > 0;
  const parentChanged = baseline.parentId !== local.parentId;

  return {
    ...(hasMetadataChanges
      ? {
          metadataChanges: {
            expectedMetaRevision: input.expectedMetaRevision,
            changes,
          },
        }
      : {}),
    ...(parentChanged
      ? {
          parentChange: {
            baseline: baseline.parentId,
            local: local.parentId,
            expectedDraftStructureRevision:
              input.expectedDraftStructureRevision ??
              (() => {
                throw new Error(
                  "A draft structure revision is required for a parent change.",
                );
              })(),
          },
        }
      : {}),
  };
}
