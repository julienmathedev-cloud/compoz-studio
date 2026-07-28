/**
 * @file packages/infra/src/lib/get-revision-conflict-details.ts
 * @layer infra/lib/http
 * @description Safely extracts revision-conflict details from an HTTP error envelope.
 */

import {
  ERROR_CODES,
  isErrorCode,
  type ErrorCode,
} from "@compoz/core/domain/errors/codes";
import type { RevisionConflictDetails } from "@compoz/core/domain/revisions/revision.types";
import { isUnknownObject } from "@compoz/http/http-error";
import { isHttpError } from "@compoz/infra/lib/api-fetch";

function isNonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function readNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim();

  return normalized || null;
}

function readConflictingPaths(value: unknown): ReadonlyArray<string> | null {
  if (!Array.isArray(value) || value.length === 0) return null;

  const paths: string[] = [];

  for (const path of value) {
    const validPath = readNonEmptyString(path);

    if (!validPath) return null;

    paths.push(validPath);
  }

  return paths;
}

const REVISION_CONFLICT_ERROR_CODES = new Set<ErrorCode>([
  ERROR_CODES.SETTINGS_SECTION_REVISION_CONFLICT,
]);

function isRevisionConflictErrorCode(value: unknown): value is ErrorCode {
  return isErrorCode(value) && REVISION_CONFLICT_ERROR_CODES.has(value);
}

/**
 * Returns validated OCC conflict details, or null for unrelated or malformed errors.
 */
export function getRevisionConflictDetails(
  error: unknown,
): RevisionConflictDetails | null {
  if (!isHttpError(error) || !isUnknownObject(error.body)) return null;
  if (error.status !== 409) return null;

  const envelopeError = error.body["error"];

  if (!isUnknownObject(envelopeError)) return null;
  if (!isRevisionConflictErrorCode(envelopeError["code"])) {
    return null;
  }

  const details = envelopeError["details"];

  if (!isUnknownObject(details)) return null;

  const resourceId = readNonEmptyString(details["resourceId"]);
  const expectedRevision = details["expectedRevision"];
  const currentRevision = details["currentRevision"];
  const conflictingPaths = readConflictingPaths(details["conflictingPaths"]);

  if (
    !resourceId ||
    !isNonNegativeSafeInteger(expectedRevision) ||
    !isNonNegativeSafeInteger(currentRevision) ||
    !conflictingPaths
  ) {
    return null;
  }

  return {
    resourceId,
    expectedRevision,
    currentRevision,
    conflictingPaths,
  };
}
