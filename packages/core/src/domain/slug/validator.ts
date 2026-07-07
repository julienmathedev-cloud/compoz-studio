/**
 * @file packages/core/src/domain/slug/validator.ts
 * @layer core/domain/slug
 * @description Blocking slug validation and non-blocking UI warnings.
 * @remarks
 * Inputs are normalized before validation or warning generation.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { UiWarning } from "@compoz/core/domain/errors/issue.types";
import { SLUG_FINAL_RE } from "@compoz/core/domain/slug/constants";
import { isReservedSlug, normalizeSlug } from "@compoz/core/domain/slug/utils";

export type SlugWarning = UiWarning<
  typeof EC.SLUG_NORMALIZED_DIFFERENT | typeof EC.SLUG_RESERVED_HINT
>;

export function assertSlug(
  raw: string | undefined,
  path: (string | number)[] = ["slug"],
): string {
  const normalized = normalizeSlug(raw ?? "");

  if (!normalized) {
    throw new DomainError({
      code: EC.SLUG_REQUIRED,
      message: EC.SLUG_REQUIRED,
      details: { path, meta: { reason: "emptyAfterNormalization" } },
    });
  }

  if (!SLUG_FINAL_RE.test(normalized)) {
    throw new DomainError({
      code: EC.SLUG_INVALID_FORMAT,
      message: EC.SLUG_INVALID_FORMAT,
      details: { path, meta: { normalized } },
    });
  }

  if (isReservedSlug(normalized)) {
    throw new DomainError({
      code: EC.SLUG_RESERVED,
      message: EC.SLUG_RESERVED,
      details: { path, meta: { normalized, reason: "reserved" } },
    });
  }

  return normalized;
}

export function getSlugUiWarnings(
  raw: string | undefined,
  path: (string | number)[] = ["slug"],
): SlugWarning[] {
  const out: SlugWarning[] = [];
  const normalized = normalizeSlug(raw ?? "");

  if (raw && normalized && raw !== normalized) {
    out.push({
      code: EC.SLUG_NORMALIZED_DIFFERENT,
      path,
      meta: { normalized },
    });
  }

  if (normalized && isReservedSlug(normalized)) {
    out.push({
      code: EC.SLUG_RESERVED_HINT,
      path,
      meta: { normalized },
    });
  }

  return out;
}
