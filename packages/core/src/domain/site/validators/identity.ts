/**
 * @file packages/core/src/domain/site/validators/identity.ts
 * @layer core/domain/site/validators
 * @description Blocking domain invariants for site identity settings.
 * @remarks
 * This validator does not apply defaults, normalization, or non-blocking warnings.
 */

import { assertImage } from "@compoz/core/domain/assets/validators/image";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { IdentitySettings } from "@compoz/core/domain/site/entities/identity";

export function assertIdentitySettings(identity: IdentitySettings): void {
  const siteName = identity.siteName.trim();

  if (!siteName) {
    throw new DomainError({
      code: EC.IDENTITY_SITENAME_REQUIRED,
      message: EC.IDENTITY_SITENAME_REQUIRED,
      details: { path: ["identity", "siteName"] },
    });
  }

  if (identity.logo !== null) {
    assertImage(identity.logo, ["identity", "logo"]);
  }
}
