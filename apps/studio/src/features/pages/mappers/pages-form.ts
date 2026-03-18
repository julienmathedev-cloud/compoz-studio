/**
 * @file apps/studio/src/features/pages/mappers/pages-form.ts
 * @layer ui/studio/pages/mappers
 *
 * @description
 * Mappers de formulaires studio pour les pages :
 * - normalisations UI (trim / coercitions simples)
 * - construction des Intent DTO pour l’API studio
 *
 * @remarks
 * - Pour DTO -> valeurs UI, on s’appuie sur le mapper shared `toPageShapeFromDTO`.
 */

import type { PageDTO } from "@compoz/core/domain/pages/dto";
import { toSlugIntentInput } from "@compoz/ui/lib/routing/slug";
import { toPageShapeFromDTO } from "@compoz/ui/pages/mappers/page-shape";
import type { PageFormValues } from "@compoz/validation/pages/page-form";
import type {
  CreatePageIntentDTO,
  UpdatePageIntentDTO,
} from "@compoz/validation/pages/page-intents";

/* -------------------------------------------------------------------------- */
/* Defaults UI                                                                */
/* -------------------------------------------------------------------------- */

const DEFAULT_SITEMAP: NonNullable<PageFormValues["sitemap"]> = {
  include: true,
  priority: null,
  changefreq: null,
};

/* -------------------------------------------------------------------------- */
/* Domain (DTO) -> UI (form values)                                           */
/* -------------------------------------------------------------------------- */

/**
 * Convertit un DTO page en `PageFormValues` studio.
 *
 * @remarks
 * Délègue au mapper shared ; le caller peut ensuite re-normaliser si besoin.
 */
export function toPageFormValuesFromDTO(
  page: PageDTO | null | undefined,
  slugFallback?: string,
): PageFormValues {
  return toPageShapeFromDTO(page, slugFallback);
}

/* -------------------------------------------------------------------------- */
/* Normalisations UI (forms)                                                  */
/* -------------------------------------------------------------------------- */

export function normalizePageFormValues(
  values: PageFormValues,
): PageFormValues {
  return {
    name: String(values.name ?? "").trim(),
    seoTitle:
      values.seoTitle !== null ? String(values.seoTitle ?? "").trim() : null,
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

/* -------------------------------------------------------------------------- */
/* Helpers internes (intents)                                                 */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* UI -> INTENTS (API studio)                                                 */
/* -------------------------------------------------------------------------- */

export function toCreatePageIntentDTOFromFormValues(
  values: PageFormValues,
): CreatePageIntentDTO {
  const normalizedValues = normalizePageFormValues(values);
  const slug = toSlugIntentInput(normalizedValues.slug);

  return {
    name: normalizedValues.name,
    seoTitle: normalizedValues.seoTitle,
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
