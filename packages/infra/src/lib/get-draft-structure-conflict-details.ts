/**
 * @file packages/infra/src/lib/get-draft-structure-conflict-details.ts
 * @layer infra/lib/http
 * @description Safely extracts a draft-structure OCC snapshot from an HTTP 409.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import type { DraftSiteIndexWithRevisionDTO } from "@compoz/core/domain/site/dto";
import { isUnknownObject } from "@compoz/http/http-error";
import { isHttpError } from "@compoz/infra/lib/api-fetch";

export type DraftStructureConflictDetails = Readonly<{
  expectedDraftStructureRevision: number;
  currentDraftStructureRevision: number;
  current: DraftSiteIndexWithRevisionDTO;
}>;

function revision(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isIndexPage(value: unknown): boolean {
  if (!isUnknownObject(value)) return false;

  return (
    typeof value["id"] === "string" &&
    typeof value["slug"] === "string" &&
    typeof value["name"] === "string" &&
    (value["parentId"] === null || typeof value["parentId"] === "string")
  );
}

export function getDraftStructureConflictDetails(
  error: unknown,
): DraftStructureConflictDetails | null {
  if (!isHttpError(error) || error.status !== 409) return null;
  if (!isUnknownObject(error.body)) return null;

  const envelope = error.body["error"];
  if (
    !isUnknownObject(envelope) ||
    envelope["code"] !== ERROR_CODES.DRAFT_STRUCTURE_REVISION_CONFLICT
  ) {
    return null;
  }

  const details = envelope["details"];
  if (!isUnknownObject(details)) return null;

  const expected = details["expectedDraftStructureRevision"];
  const currentRevision = details["currentDraftStructureRevision"];
  const current = details["current"];
  if (
    !revision(expected) ||
    !revision(currentRevision) ||
    !isUnknownObject(current) ||
    !revision(current["draftStructureRevision"]) ||
    !isUnknownObject(current["index"]) ||
    !Array.isArray(current["index"]["pages"]) ||
    !current["index"]["pages"].every(isIndexPage) ||
    typeof current["index"]["updatedAt"] !== "string"
  ) {
    return null;
  }

  return {
    expectedDraftStructureRevision: expected,
    currentDraftStructureRevision: currentRevision,
    current:
      current as unknown as DraftSiteIndexWithRevisionDTO,
  };
}
