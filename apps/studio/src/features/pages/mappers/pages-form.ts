/**
 * @file apps/studio/src/features/pages/mappers/pages-form.ts
 * @layer studio/features/pages/mappers
 *
 * @description
 * Studio page form mappers for DTO-to-RHF values, UI normalization, and API intents.
 *
 * @remarks
 * - Delegates DTO-to-form shaping to the shared `toPageShapeFromDTO` mapper.
 * - Normalizes nullable SEO and sitemap fields before API intent creation.
 * - Does not own draft/published state; callers provide the content-state context.
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

/** Converts a page DTO to Studio page form values through the shared page-shape mapper. */
export function toPageFormValuesFromDTO(
  page: PageDTO | null | undefined,
  slugFallback?: string,
): PageFormValues {
  return toPageShapeFromDTO(page, slugFallback);
}

// UI form normalization.
export function normalizePageFormValues(
  values: PageFormValues,
): PageFormValues {
  return {
    name: String(values.name ?? "").trim(),
    seoTitle:
      values.seoTitle !== null ? String(values.seoTitle ?? "").trim() : null,
    seoDescription:
      values.seoDescription !== null
        ? String(values.seoDescription ?? "").trim() || null
        : null,
    parentId: values.parentId ?? null,
    slug: String(values.slug ?? "").trim(),
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

// API intent helpers.
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

// UI form values -> API intents.
export function toCreatePageIntentDTOFromFormValues(
  values: PageFormValues,
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
    ...(slug ? { slug } : {}),
  };
}

export function toUpdatePageIntentDTOFromFormValues(
  patch: Partial<PageFormValues>,
): UpdatePageIntentDTO {
  const output: UpdatePageIntentDTO = {};

  if ("name" in patch && patch.name !== undefined) {
    output.name = String(patch.name ?? "").trim();
  }

  if ("seoTitle" in patch) {
    output.seoTitle =
      patch.seoTitle !== null && patch.seoTitle !== undefined
        ? String(patch.seoTitle).trim()
        : null;
  }

  if ("seoDescription" in patch) {
    output.seoDescription =
      patch.seoDescription !== null && patch.seoDescription !== undefined
        ? String(patch.seoDescription).trim() || null
        : null;
  }

  if ("slug" in patch && patch.slug !== undefined) {
    output.slug = toSlugIntentInput(patch.slug);
  }

  if ("parentId" in patch) {
    output.parentId = patch.parentId ?? null;
  }

  if ("paginationEnabled" in patch) {
    output.paginationEnabled = Boolean(patch.paginationEnabled);
  }

  if ("sitemap" in patch) {
    output.sitemap = toPageSitemapIntentDTOFromFormValues(
      patch.sitemap ?? null,
    );
  }

  return output;
}
