/**
 * @file packages/infra/src/lib/get-page-metadata-conflict-details.ts
 * @layer infra/lib/http
 * @description Safely extracts page metadata OCC details from a standard HTTP 409.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import type { PageWithRevisionsDTO } from "@compoz/core/domain/pages/dto";
import type {
  PageMetadataConflict,
  PageMetadataField,
} from "@compoz/core/domain/pages/revisions/page-metadata";
import { isUnknownObject } from "@compoz/http/http-error";
import { isHttpError } from "@compoz/infra/lib/api-fetch";
import { PageSchema } from "@compoz/validation/pages/page";

const FIELDS = new Set<PageMetadataField>([
  "name",
  "slug",
  "seoTitle",
  "seoDescription",
  "sitemap",
  "paginationEnabled",
]);

export type PageMetadataConflictDetails = Readonly<{
  expectedMetaRevision: number;
  currentMetaRevision: number;
  conflicts: ReadonlyArray<PageMetadataConflict>;
  current: PageWithRevisionsDTO;
}>;

function revision(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function page(
  value: unknown,
): value is PageWithRevisionsDTO["page"] {
  return PageSchema.safeParse(value).success;
}

function conflict(value: unknown): value is PageMetadataConflict {
  return (
    isUnknownObject(value) &&
    typeof value["field"] === "string" &&
    FIELDS.has(value["field"] as PageMetadataField) &&
    "baseline" in value &&
    "local" in value &&
    "current" in value
  );
}

export function getPageMetadataConflictDetails(
  error: unknown,
): PageMetadataConflictDetails | null {
  if (!isHttpError(error) || error.status !== 409) return null;
  if (!isUnknownObject(error.body)) return null;

  const envelope = error.body["error"];
  if (
    !isUnknownObject(envelope) ||
    envelope["code"] !== ERROR_CODES.PAGE_METADATA_REVISION_CONFLICT
  ) {
    return null;
  }

  const details = envelope["details"];
  if (!isUnknownObject(details)) return null;
  const expectedMetaRevision = details["expectedMetaRevision"];
  const currentMetaRevision = details["currentMetaRevision"];
  const conflicts = details["conflicts"];
  const current = details["current"];
  if (
    !revision(expectedMetaRevision) ||
    !revision(currentMetaRevision) ||
    !Array.isArray(conflicts) ||
    !conflicts.every(conflict) ||
    !isUnknownObject(current) ||
    !page(current["page"]) ||
    !isUnknownObject(current["revisions"]) ||
    !revision(current["revisions"]["metaRevision"]) ||
    !revision(current["revisions"]["blocksRevision"])
  ) {
    return null;
  }

  return {
    expectedMetaRevision,
    currentMetaRevision,
    conflicts,
    current: {
      page: current["page"],
      revisions: {
        metaRevision: current["revisions"]["metaRevision"],
        blocksRevision: current["revisions"]["blocksRevision"],
      },
    },
  };
}
