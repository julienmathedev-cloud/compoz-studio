/**
 * @file apps/studio/src/features/pages/mappers/pages-form.ts
 * @layer ui-mappers/pages
 *
 * @description
 * Mappers "forms admin" dashboard pour les pages :
 * - normalisations UI (trim/coercitions simples)
 * - construction des Intent DTO pour l’API admin
 *
 * @remarks
 * - Pour DTO -> valeurs UI, on s’appuie sur le mapper shared `toPageShapeFromDTO`.
 */

import type { PageDTO } from "@compoz/core/domain/pages/dto";
import type { PageFormValues } from "@compoz/validation/pages/page-form";
import type {
  CreatePageIntentDTO,
  UpdatePageIntentDTO,
} from "@compoz/validation/pages/page-intents";

import { toPageShapeFromDTO } from "@compoz/ui/pages/mappers/page-shape";

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
 * DTO -> FormValues (studio).
 *
 * @remarks
 * Delegue au mapper shared, puis laisse le caller décider s’il veut re-normaliser.
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
    title: (values.title ?? "").trim(),
    parentId: values.parentId ?? null,
    slug: (values.slug ?? "").trim(),
    sitemap: {
      include: values.sitemap?.include ?? DEFAULT_SITEMAP.include,
      priority: values.sitemap?.priority ?? DEFAULT_SITEMAP.priority,
      changefreq: values.sitemap?.changefreq ?? DEFAULT_SITEMAP.changefreq,
    },
    paginationEnabled: values.paginationEnabled ?? false,
  };
}

/* -------------------------------------------------------------------------- */
/* Helpers internes (intents)                                                 */
/* -------------------------------------------------------------------------- */

function toPageSitemapIntentDTOFromFormValues(
  values: PageFormValues["sitemap"],
): CreatePageIntentDTO["sitemap"] | undefined {
  if (!values) return undefined;

  if (!values.include) return { include: false };

  const out: CreatePageIntentDTO["sitemap"] = { include: true };

  if (values.changefreq) out.changefreq = values.changefreq;
  if (typeof values.priority === "number") out.priority = values.priority;

  return out;
}

function normalizeSlugInputForIntent(raw: string | null | undefined): string {
  const s = String(raw ?? "").trim();
  if (!s) return "";

  // "/" = home (cas spécial)
  if (s === "/") return "/";

  // ignore leading slashes: "/contact" => "contact"
  return s.replace(/^\/+/, "");
}

/* -------------------------------------------------------------------------- */
/* UI -> INTENTS (API admin)                                                  */
/* -------------------------------------------------------------------------- */

export function toCreatePageIntentDTOFromFormValues(
  values: PageFormValues,
): CreatePageIntentDTO {
  const v = normalizePageFormValues(values);

  const slug = normalizeSlugInputForIntent(v.slug);

  const out: CreatePageIntentDTO = {
    title: v.title,
    parentId: v.parentId,
    paginationEnabled: v.paginationEnabled,
    ...(slug ? { slug } : {}),
  };

  const sitemap = toPageSitemapIntentDTOFromFormValues(v.sitemap);
  if (sitemap !== undefined) out.sitemap = sitemap;

  return out;
}

export function toUpdatePageIntentDTOFromFormValues(
  p: Partial<PageFormValues>,
): UpdatePageIntentDTO {
  const out: UpdatePageIntentDTO = {};

  if ("title" in p && p.title !== undefined) out.title = (p.title ?? "").trim();

  if ("slug" in p && p.slug !== undefined) {
    const normalized = normalizeSlugInputForIntent(p.slug);
    out.slug = normalized; // "" = reset (et "/" = home)
  }

  if ("parentId" in p) out.parentId = p.parentId ?? null;

  if ("paginationEnabled" in p) {
    out.paginationEnabled = Boolean(p.paginationEnabled);
  }

  if ("sitemap" in p) {
    const sitemap = toPageSitemapIntentDTOFromFormValues(p.sitemap);
    if (sitemap !== undefined) out.sitemap = sitemap;
  }

  return out;
}
