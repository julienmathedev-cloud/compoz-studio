/**
 * @file packages/core/src/domain/site/validators/identity.ts
 * @layer core/domain
 * @description
 * Validateur métier — invariants bloquants de `IdentitySettings`.
 * Applique les règles strictes requises pour la publication du site.
 *
 * @remarks
 * - Ne gère ni defaults, ni normalisation, ni warnings.
 * - Lève uniquement des erreurs métier bloquantes (`DomainError`).
 * - Utilisé notamment par le use-case `publishSite`.
 */

import { assertImage } from "@compoz/core/domain/assets/validators/image";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { IdentitySettings } from "@compoz/core/domain/site/entities/identity";

/**
 * Vérifie les invariants métier de l’identité.
 *
 * @throws DomainError
 * - `EC.IDENTITY_SITENAME_REQUIRED`
 */
export function assertIdentitySettings(identity: IdentitySettings): void {
  // Invariant : titre requis
  const siteName = identity.siteName.trim();

  if (!siteName) {
    throw new DomainError({
      code: EC.IDENTITY_SITENAME_REQUIRED,
      message: EC.IDENTITY_SITENAME_REQUIRED,
      details: { path: ["identity", "siteName"] },
    });
  }

  // Invariant : le logo doit être une image valide s'il est défini
  if (identity.logo !== null) {
    assertImage(identity.logo, ["identity", "logo"]);
  }
}
