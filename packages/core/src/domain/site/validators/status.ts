/**
 * @file src/core/domain/site/validators/status.ts
 * @layer core/domain
 * @description
 * Validateur de contrat — SiteStatus :
 * - protège contre les réponses JSON vides / incohérentes
 * - assure une shape minimale exploitable côté UI
 *
 * @remarks
 * Ce validateur ne remplace pas les schemas (Zod) : il garantit un contrat minimal
 * dans le domaine (utile pour routes, use-cases, tests).
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { SiteStatusDTO } from "@compoz/core/domain/site/dto";

/**
 * Assertion "shape minimale" pour éviter les `{}` silencieux.
 *
 * @throws DomainError(EC.INVALID_DTO) si la réponse ne respecte pas le contrat minimal.
 */
export function assertSiteStatusDTO(x: unknown): asserts x is SiteStatusDTO {
  if (!x || typeof x !== "object") {
    throw new DomainError({
      code: EC.INVALID_ARGUMENT,
      message: EC.INVALID_ARGUMENT,
      details: { ctx: "SiteStatusDTO", rule: "expects_object", value: x },
    });
  }

  const o = x as Record<string, unknown>;

  /**
   * ✅ Règle minimale :
   * on exige au moins UN champ “structurant” attendu par l’UI.
   *
   * ⚠️ À adapter à TON DTO réel :
   * - ex: "published" | "dirty" | "dirtyParts" | "counts" | "lastPublishedAt"...
   */
  const hasSomeExpectedKey =
    "published" in o ||
    "hasChanges" in o ||
    "counts" in o ||
    "lastPublishedAt" in o;

  if (!hasSomeExpectedKey) {
    throw new DomainError({
      code: EC.INVALID_ARGUMENT,
      message: EC.INVALID_ARGUMENT,
      details: {
        ctx: "SiteStatusDTO",
        rule: "missing_expected_keys",
        keys: Object.keys(o),
      },
    });
  }
}
