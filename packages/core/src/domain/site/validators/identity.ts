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

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { IdentitySettings } from "@compoz/core/domain/site/entities/identity";

/**
 * Vérifie les invariants métier de l’identité.
 *
 * @throws DomainError
 * - `EC.IDENTITY_SITENAME_REQUIRED`
 * - `EC.IDENTITY_LOGO_ALT_REQUIRED`
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

  // Invariant : logoAlt requis si un logo est défini
  const hasLogo =
    typeof identity.logoUrl === "string" && identity.logoUrl.trim() !== "";

  const logoAlt = identity.logoAlt.trim();

  if (hasLogo && !logoAlt) {
    throw new DomainError({
      code: EC.IDENTITY_LOGO_ALT_REQUIRED,
      message: EC.IDENTITY_LOGO_ALT_REQUIRED,
      details: { path: ["identity", "logoAlt"] },
    });
  }
}
