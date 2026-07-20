/**
 * @file packages/core/src/domain/site/validators/status.ts
 * @layer core/domain/site/validators
 * @description Runtime contract validators for site status read-models.
 * @remarks
 * This validator protects domain use-cases from empty or malformed JSON snapshots.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { SiteStatus } from "@compoz/core/domain/site/entities/site-status";
import type { SiteStatusDetails } from "@compoz/core/domain/site/entities/site-status-details";

function isObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || isString(value);
}

function isOptionalCanonicalIsoDate(
  value: unknown,
): value is string | undefined {
  if (value === undefined) return true;

  if (!isString(value) || value.trim() === "") return false;

  const parsed = new Date(value);

  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
}

function isWarningPath(value: unknown): boolean {
  return (
    value === undefined ||
    (Array.isArray(value) &&
      value.every((part) => isString(part) || Number.isInteger(part)))
  );
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function hasBooleanFields(
  value: unknown,
  fields: ReadonlyArray<string>,
): boolean {
  if (!isObject(value)) return false;
  return fields.every((field) => isBoolean(value[field]));
}

function hasCountFields(
  value: unknown,
  fields: ReadonlyArray<string>,
): boolean {
  if (!isObject(value)) return false;
  return fields.every((field) => isCount(value[field]));
}

function isDiffKind(value: unknown): boolean {
  return (
    value === "published" ||
    value === "new" ||
    value === "modified" ||
    value === "deleted"
  );
}

function invalidStatus(ctx: string, rule: string): never {
  throw new DomainError({
    code: EC.INVALID_ARGUMENT,
    message: EC.INVALID_ARGUMENT,
    details: { ctx, rule },
  });
}

export function assertSiteStatus(x: unknown): asserts x is SiteStatus {
  if (!isObject(x)) {
    invalidStatus("SiteStatus", "expects_object");
  }

  const o = x;
  const published = o.published;
  const counts = o.counts;

  if (
    !isObject(published) ||
    !isBoolean(published.exists) ||
    !isOptionalCanonicalIsoDate(published.lastPublishedAt) ||
    (published.lastPublishedAt !== undefined && !published.exists) ||
    !hasBooleanFields(o.hasChanges, ["site", "settings", "pages"]) ||
    !isObject(counts) ||
    !hasCountFields(counts.pages, [
      "draft",
      "published",
      "modified",
      "new",
      "deleted",
    ]) ||
    !hasCountFields(counts.blocks, [
      "draft",
      "published",
      "modified",
      "new",
      "deleted",
    ]) ||
    !hasBooleanFields(o.changedSettings, [
      "identity",
      "primaryMenu",
      "legalMenu",
      "social",
      "header",
      "footer",
      "seo",
      "theme",
    ]) ||
    (o.prePublishWarnings !== undefined &&
      (!Array.isArray(o.prePublishWarnings) ||
        !o.prePublishWarnings.every(
          (warning) =>
            isObject(warning) &&
            isString(warning.code) &&
            isWarningPath(warning.path) &&
            (warning.meta === undefined || isObject(warning.meta)),
        )))
  ) {
    invalidStatus("SiteStatus", "invalid_contract");
  }
}

export function assertSiteStatusDetails(
  x: unknown,
): asserts x is SiteStatusDetails {
  if (!isObject(x)) {
    invalidStatus("SiteStatusDetails", "expects_object");
  }

  if (
    (x.scope !== "dirty" && x.scope !== "all") ||
    !isBoolean(x.includeBlocks) ||
    !Array.isArray(x.pages)
  ) {
    invalidStatus("SiteStatusDetails", "invalid_contract");
  }

  for (const page of x.pages) {
    if (
      !isObject(page) ||
      !isString(page.id) ||
      page.id.trim() === "" ||
      !isString(page.slug) ||
      !isString(page.name) ||
      !isDiffKind(page.diff) ||
      !hasCountFields(page.blocks, [
        "draft",
        "published",
        "modified",
        "new",
        "deleted",
      ]) ||
      (x.includeBlocks && !Array.isArray(page.blockItems)) ||
      (!x.includeBlocks && page.blockItems !== undefined) ||
      (page.blockItems !== undefined &&
        (!Array.isArray(page.blockItems) ||
          !page.blockItems.every(
            (block) =>
              isObject(block) &&
              isString(block.id) &&
              block.id.trim() !== "" &&
              isOptionalString(block.type) &&
              isOptionalString(block.name) &&
              isDiffKind(block.diff),
          )))
    ) {
      invalidStatus("SiteStatusDetails", "invalid_page_contract");
    }
  }
}
