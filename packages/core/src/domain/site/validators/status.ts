/**
 * @file packages/core/src/domain/site/validators/status.ts
 * @layer core/domain
 * @description
 * Validateur de contrat — SiteStatus (read-model) :
 * - protège contre les réponses JSON vides / incohérentes
 * - assure une shape minimale exploitable côté UI
 *
 * @remarks
 * Ce validateur ne remplace pas les schemas (Zod) : il garantit un contrat minimal
 * dans le domaine (utile pour routes, use-cases, tests).
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { SiteStatus } from "@compoz/core/domain/site/entities/site-status";

function isObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object";
}

/**
 * Assertion "shape minimale" pour éviter les `{}` silencieux.
 *
 * @throws DomainError(EC.INVALID_ARGUMENT) si la réponse ne respecte pas le contrat minimal.
 */
export function assertSiteStatus(x: unknown): asserts x is SiteStatus {
  if (!isObject(x)) {
    throw new DomainError({
      code: EC.INVALID_ARGUMENT,
      message: EC.INVALID_ARGUMENT,
      details: { ctx: "SiteStatus", rule: "expects_object", value: x },
    });
  }

  const o = x;

  // Pivots structurants attendus par l’UI (shape minimale)
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
