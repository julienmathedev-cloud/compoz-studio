/**
 * @file packages/core/src/core/domain/slug/validator.ts
 * @layer core/domain
 * @description
 * Frontière Domain :
 * - `assertSlug` applique une validation bloquante (DomainError) après normalisation,
 * - `getSlugUiWarnings` produit des hints non bloquants pour guider l’UI.
 *
 * Invariant : toute entrée est normalisée (`normalizeSlug`) avant contrôle.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { UiWarning } from "@compoz/core/domain/errors/issue.types";
import { SLUG_FINAL_RE } from "@compoz/core/domain/slug/constants";
import { isReservedSlug, normalizeSlug } from "@compoz/core/domain/slug/utils";

export type SlugWarning = UiWarning<
  typeof EC.SLUG_NORMALIZED_DIFFERENT | typeof EC.SLUG_RESERVED_HINT
>;

/* -------------------------------------------------------------------------- */
/*                            Validation bloquante                             */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                             Warnings UI non-bloquants                      */
/* -------------------------------------------------------------------------- */

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
