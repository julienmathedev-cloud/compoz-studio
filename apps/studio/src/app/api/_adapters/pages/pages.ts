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
type MutableUpdatePagePatchInput = {
  -readonly [K in keyof UpdatePagePatchInput]: UpdatePagePatchInput[K];
};

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
  sitemap: CreatePageIntentDTO["sitemap"] | undefined,
): CreatePageInput["sitemap"] | undefined {
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
    hasMetadataChanges: Boolean(dto.metadataChanges),
    hasParentChange: Boolean(dto.parentChange),
  });

  const out: MutableUpdatePagePatchInput = {};

  if (dto.metadataChanges) {
    const changes = dto.metadataChanges.changes;
    out.metadataChanges = {
      expectedMetaRevision: dto.metadataChanges.expectedMetaRevision,
      changes: {
        ...(changes.name
          ? {
              name: {
                baseline: trimOrKeep(changes.name.baseline),
                local: trimOrKeep(changes.name.local),
              },
            }
          : {}),
        ...(changes.slug
          ? {
              slug: {
                baseline: toSlugIntentInput(changes.slug.baseline),
                local: toSlugIntentInput(changes.slug.local),
              },
            }
          : {}),
        ...(changes.seoTitle
          ? {
              seoTitle: {
                baseline:
                  changes.seoTitle.baseline === null
                    ? null
                    : trimOrKeep(changes.seoTitle.baseline),
                local:
                  changes.seoTitle.local === null
                    ? null
                    : trimOrKeep(changes.seoTitle.local),
              },
            }
          : {}),
        ...(changes.seoDescription
          ? {
              seoDescription: {
                baseline:
                  changes.seoDescription.baseline === null
                    ? null
                    : trimOrKeep(changes.seoDescription.baseline) || null,
                local:
                  changes.seoDescription.local === null
                    ? null
                    : trimOrKeep(changes.seoDescription.local) || null,
              },
            }
          : {}),
        ...(changes.sitemap ? { sitemap: changes.sitemap } : {}),
        ...(changes.paginationEnabled
          ? { paginationEnabled: changes.paginationEnabled }
          : {}),
      },
    };
  }

  if (dto.parentChange) {
    out.parentChange = {
      baseline:
        dto.parentChange.baseline === null
          ? null
          : trimOrKeep(dto.parentChange.baseline),
      local:
        dto.parentChange.local === null
          ? null
          : trimOrKeep(dto.parentChange.local),
      expectedDraftStructureRevision:
        dto.parentChange.expectedDraftStructureRevision,
    };
  }

  log.debug("studio.adapter.pages.update.end", {
    ms: Date.now() - started,
    outKeys: Object.keys(out),
  });

  return out;
}
