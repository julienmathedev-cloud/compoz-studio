/**
 * @file packages/infra/src/lib/get-page-blocks-conflict-details.ts
 * @layer infra/lib/http
 * @description Strictly validates Page block OCC conflict details before Studio exposure.
 */

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import type { Block } from "@compoz/core/domain/pages/entities/block";
import type {
  BlockConflict,
  PageBlocksConflictDetails,
} from "@compoz/core/domain/pages/revisions/page-blocks.types";
import { assertBlocks } from "@compoz/core/domain/pages/validators/blocks";
import { isUnknownObject } from "@compoz/http/http-error";
import { isHttpError } from "@compoz/infra/lib/api-fetch";
import { BlockSchema } from "@compoz/validation/pages/blocks/block";

const OPERATIONS = new Set(["create", "update", "delete", "reorder"]);
const CONFLICT_KINDS = new Set(["functional", "contention"]);
const BLOCK_CONFLICT_KINDS = new Set([
  "fieldConflict",
  "blockDeleted",
  "blockChangedBeforeDelete",
  "blockTypeChanged",
  "cellTypeChanged",
  "itemTypeChanged",
  "idReused",
  "anchorMissing",
  "globalInvariant",
  "collectionIncompatible",
  "orderIncompatible",
  "revisionAhead",
]);

function revision(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function block(value: unknown): value is Block {
  if (!BlockSchema.safeParse(value).success) return false;
  try {
    assertBlocks([value as Block]);
    return true;
  } catch {
    return false;
  }
}

function fieldConflictLocation(value: unknown): boolean {
  if (!isUnknownObject(value) || typeof value["kind"] !== "string") {
    return false;
  }
  if (value["kind"] === "globalLcpOwner") return true;
  if (
    value["kind"] !== "blockField" ||
    typeof value["blockId"] !== "string" ||
    !Array.isArray(value["segments"]) ||
    value["segments"].length === 0
  ) {
    return false;
  }

  const validSegments = value["segments"].every((segment: unknown) => {
    if (!isUnknownObject(segment) || typeof segment["kind"] !== "string") {
      return false;
    }
    if (segment["kind"] === "image") return true;
    if (segment["kind"] === "field") {
      return typeof segment["name"] === "string";
    }
    return (
      [
        "row",
        "column",
        "cell",
        "identifiedItem",
        "formField",
        "structuredCardSection",
      ].includes(segment["kind"]) &&
      typeof segment["id"] === "string"
    );
  });
  const last = value["segments"].at(-1);
  return (
    validSegments &&
    isUnknownObject(last) &&
    last["kind"] === "field"
  );
}

function conflict(value: unknown): value is BlockConflict {
  if (
    !isUnknownObject(value) ||
    typeof value["kind"] !== "string" ||
    !BLOCK_CONFLICT_KINDS.has(value["kind"]) ||
    typeof value["path"] !== "string"
  ) {
    return false;
  }

  switch (value["kind"]) {
    case "fieldConflict":
      return (
        fieldConflictLocation(value["location"]) &&
        "baseline" in value &&
        "current" in value &&
        "local" in value
      );
    case "blockDeleted":
      return typeof value["blockId"] === "string";
    case "blockChangedBeforeDelete":
      return (
        typeof value["blockId"] === "string" &&
        block(value["baseline"]) &&
        block(value["current"])
      );
    case "idReused":
    case "anchorMissing":
      return typeof value["id"] === "string";
    case "globalInvariant":
      return typeof value["invariant"] === "string";
    case "revisionAhead":
      return (
        revision(value["expectedBlocksRevision"]) &&
        revision(value["currentBlocksRevision"])
      );
    case "orderIncompatible":
      return [
        "baselineOrder",
        "localOrder",
        "currentOrder",
        "addedBlockIds",
        "removedBlockIds",
      ].every(
        (key) =>
          Array.isArray(value[key]) &&
          value[key].every((id: unknown) => typeof id === "string"),
      );
    default:
      return "baseline" in value && "current" in value && "local" in value;
  }
}

export function getPageBlocksConflictDetails(
  error: unknown,
): PageBlocksConflictDetails | null {
  if (!isHttpError(error) || error.status !== 409) return null;
  if (!isUnknownObject(error.body)) return null;
  const envelope = error.body["error"];
  if (
    !isUnknownObject(envelope) ||
    envelope["code"] !== ERROR_CODES.PAGE_BLOCKS_REVISION_CONFLICT
  ) {
    return null;
  }

  const details = envelope["details"];
  if (!isUnknownObject(details)) return null;
  const current = details["current"];
  const conflicts = details["conflicts"];
  const candidateBlock = details["candidateBlock"];

  if (
    typeof details["resourceId"] !== "string" ||
    !revision(details["expectedBlocksRevision"]) ||
    !revision(details["currentBlocksRevision"]) ||
    typeof details["operation"] !== "string" ||
    !OPERATIONS.has(details["operation"]) ||
    typeof details["conflictKind"] !== "string" ||
    !CONFLICT_KINDS.has(details["conflictKind"]) ||
    !Array.isArray(details["conflictingPaths"]) ||
    !details["conflictingPaths"].every(
      (path: unknown) => typeof path === "string",
    ) ||
    !Array.isArray(conflicts) ||
    !conflicts.every(conflict) ||
    !isUnknownObject(current) ||
    !revision(current["blocksRevision"]) ||
    !Array.isArray(current["blocks"]) ||
    !current["blocks"].every(block)
  ) {
    return null;
  }

  if (candidateBlock !== undefined && !block(candidateBlock)) {
    const { candidateBlock: _invalidCandidate, ...safeDetails } = details;
    return safeDetails as PageBlocksConflictDetails;
  }

  return details as PageBlocksConflictDetails;
}
