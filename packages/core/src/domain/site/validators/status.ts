/**
 * @file packages/core/src/domain/site/validators/status.ts
 * @layer core/domain/site/validators
 * @description Minimal contract validator for the site status read-model.
 * @remarks
 * This validator protects domain use-cases from empty or malformed JSON snapshots.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { SiteStatus } from "@compoz/core/domain/site/entities/site-status";

function isObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object";
}

export function assertSiteStatus(x: unknown): asserts x is SiteStatus {
  if (!isObject(x)) {
    throw new DomainError({
      code: EC.INVALID_ARGUMENT,
      message: EC.INVALID_ARGUMENT,
      details: { ctx: "SiteStatus", rule: "expects_object", value: x },
    });
  }

  const o = x;

  const ok =
    isObject(o.published) &&
    isObject(o.hasChanges) &&
    isObject(o.counts) &&
    isObject(o.changedSettings);

  if (!ok) {
    throw new DomainError({
      code: EC.INVALID_ARGUMENT,
      message: EC.INVALID_ARGUMENT,
      details: {
        ctx: "SiteStatus",
        rule: "missing_required_sections",
        keys: Object.keys(o),
      },
    });
  }
}
