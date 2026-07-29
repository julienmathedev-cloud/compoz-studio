/**
 * @file apps/studio/src/app/api/_adapters/pages/pages.ts
 * @layer studio/app/api/adapters
 *
 * @description
 * Studio API adapters for page create and update intents.
 *
 * @remarks
 * - Preserves PATCH semantics by only propagating fields whose keys are present.
 * - Keeps sitemap normalization aligned with the domain contract, including `null` values.
 * - Normalizes slugs through the UI source of truth, `toSlugIntentInput`.
 * - Leaves `state` handling to the route.
 */

import { log } from "@compoz/infra/lib/log";
import { trimOrKeep } from "@compoz/studio/lib/strings";
import { toSlugIntentInput } from "@compoz/ui/lib/routing/slug";

import type {
  CreatePageIntentDTO,
  UpdatePageIntentDTO,
} from "@compoz/validation/pages/page-intents";

import type { CreatePageInput } from "@compoz/core/domain/pages/use-cases/create-page.types";
import type { UpdatePageInput } from "@compoz/core/domain/pages/use-cases/update-page.types";

/**
 * Domain update patch without `pageId`, which is provided by route params.
 */
type UpdatePagePatchInput = Omit<UpdatePageInput, "pageId">;

/**
 * Normalizes the sitemap block coming from API intents.
 *
 * Current domain contract:
 * - `sitemap` may be `null`
 * - `changefreq` may be `null`
 * - `priority` may be `null`
 * - in patches, a missing key must remain `undefined`
 */
function normalizeSitemap(
  sitemap:
    | CreatePageIntentDTO["sitemap"]
    | UpdatePageIntentDTO["sitemap"]
    | undefined,
): UpdatePagePatchInput["sitemap"] | CreatePageInput["sitemap"] | undefined {
  if (typeof sitemap === "undefined") return undefined;
  if (sitemap === null) return null;

  return {
    include: sitemap.include,
    changefreq: sitemap.changefreq,
    priority: sitemap.priority,
  };
}

/**
 * Converts a page creation DTO into domain input.
 *
 * Contract:
 * - `name` is always trimmed and required.
 * - `seoTitle` is trimmed when provided, otherwise `null`.
 * - `seoDescription` is trimmed when provided and non-empty, otherwise `null`.
 * - `slug` is optional: normalized when provided, otherwise the domain fallback applies.
 * - `sitemap` is always propagated (`null` or normalized object).
 */
export function adaptCreatePagePayload(
  dto: CreatePageIntentDTO,
): CreatePageInput {
  const started = Date.now();

  log.debug("studio.adapter.pages.create.start", {
    hasSlug: typeof dto.slug === "string",
    hasSeoTitle: dto.seoTitle !== null,
    hasSeoDescription: dto.seoDescription !== null,
    hasSitemap: true,
    hasParentId: true,
  });

  const out: CreatePageInput = {
    name: trimOrKeep(dto.name),
    seoTitle: dto.seoTitle !== null ? trimOrKeep(dto.seoTitle) : null,
    seoDescription:
      dto.seoDescription !== null
        ? trimOrKeep(dto.seoDescription) || null
        : null,
    parentId: dto.parentId,
    sitemap: normalizeSitemap(dto.sitemap) ?? null,
    paginationEnabled: dto.parentId === null ? false : dto.paginationEnabled,
    expectedDraftStructureRevision: dto.expectedDraftStructureRevision,
  };

  if ("slug" in dto && typeof dto.slug === "string") {
    const s = toSlugIntentInput(dto.slug);

    // Create: when empty, let the domain apply its fallback.
    if (s.length > 0) out.slug = s;
  }

  log.debug("studio.adapter.pages.create.end", {
    ms: Date.now() - started,
    outKeys: Object.keys(out),
  });

  return out;
}

/**
 * Converts a page update DTO into a partial domain patch without `pageId`.
 *
 * Contract:
 * - A field is set only when its key is present in the DTO.
 * - `state` is handled by the route.
 * - `sitemap` is propagated when the key is present, including `null`.
 * - `slug`: keep "" as an explicit reset signal.
 */
export function adaptUpdatePagePayload(
  dto: UpdatePageIntentDTO,
): UpdatePagePatchInput {
  const started = Date.now();

  log.debug("studio.adapter.pages.update.start", {
    hasName: "name" in dto,
    hasSeoTitle: "seoTitle" in dto,
    hasSeoDescription: "seoDescription" in dto,
    hasSlug: "slug" in dto,
    hasSitemap: "sitemap" in dto,
    hasParentId: "parentId" in dto,
  });

  const out: UpdatePagePatchInput = {};

  if ("name" in dto && typeof dto.name === "string") {
    out.name = trimOrKeep(dto.name);
  }

  if ("seoTitle" in dto) {
    out.seoTitle =
      dto.seoTitle !== null && typeof dto.seoTitle === "string"
        ? trimOrKeep(dto.seoTitle)
        : null;
  }

  if ("seoDescription" in dto) {
    out.seoDescription =
      dto.seoDescription !== null && typeof dto.seoDescription === "string"
        ? trimOrKeep(dto.seoDescription) || null
        : null;
  }

  if ("slug" in dto && typeof dto.slug === "string") {
    const s = toSlugIntentInput(dto.slug);

    // Update: "" is an explicit reset signal.
    out.slug = s;
  }

  if ("parentId" in dto) {
    out.parentId = dto.parentId;
  }

  if ("paginationEnabled" in dto) {
    out.paginationEnabled = dto.paginationEnabled;
  }

  if ("sitemap" in dto) {
    out.sitemap = normalizeSitemap(dto.sitemap);
  }

  if ("expectedDraftStructureRevision" in dto) {
    out.expectedDraftStructureRevision = dto.expectedDraftStructureRevision;
  }
  if ("expectedPrimaryMenuRevision" in dto) {
    out.expectedPrimaryMenuRevision = dto.expectedPrimaryMenuRevision;
  }
  if ("expectedLegalMenuRevision" in dto) {
    out.expectedLegalMenuRevision = dto.expectedLegalMenuRevision;
  }

  log.debug("studio.adapter.pages.update.end", {
    ms: Date.now() - started,
    outKeys: Object.keys(out),
  });

  return out;
}
