/**
 * @file packages/ui/src/site/mappers/social-shape.ts
 * @layer ui/site/mappers
 *
 * @description
 * Mapper "shared runtime" Social :
 * - DTO domaine -> SocialSettingsShape (frontière stable)
 *
 * @remarks
 * - Utilisé par site (public) ET studio (preview / renderer).
 * - Ici, pas de RHF, pas d’intents API, pas de normalisation "draft".
 * - On fait uniquement : DTO -> shape "frontière".
 */

import type {
  SocialItemDTO,
  SocialSettingsDTO,
} from "@compoz/core/domain/site/dto";

import type {
  SocialItemShape,
  SocialSettingsShape,
} from "@compoz/validation/site/settings/social/social";

import { trimKeepEmpty } from "@compoz/ui/lib/form-utils";

function toHrefString(v: unknown): string {
  // DTO attendu string | null | undefined. Si jamais "dirty", on force une string best-effort.
  return typeof v === "string" ? v : String(v ?? "");
}

/** DTO -> Shape : item (renderer). */
function toSocialSettingsItemShapeFromDTO(it: SocialItemDTO): SocialItemShape {
  return {
    kind: it.kind,
    href: trimKeepEmpty(toHrefString(it.href)),
  };
}

/**
 * Domaine (DTO) -> Renderer (Shape)
 * Contrat : retourne une shape stable pour le renderer (arrays mutables).
 */
export function toSocialSettingsShapeFromDTO(
  dto: SocialSettingsDTO | null | undefined,
): SocialSettingsShape {
  return {
    items: (dto?.items ?? []).map(toSocialSettingsItemShapeFromDTO),
  };
}
