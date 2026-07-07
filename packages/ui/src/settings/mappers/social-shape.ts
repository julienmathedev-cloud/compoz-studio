/****
 * @file packages/ui/src/settings/mappers/social-shape.ts
 * @layer ui/settings/mappers
 *
 * @description
 * Maps social settings DTOs to stable runtime social settings shapes shared by site rendering and Studio preview.
 *
 * @remarks
 * API intents and draft/form-oriented normalization stay outside this boundary mapper.
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
  return typeof v === "string" ? v : String(v ?? "");
}

function toSocialSettingsItemShapeFromDTO(it: SocialItemDTO): SocialItemShape {
  return {
    id: trimKeepEmpty(String(it.id ?? "")),
    kind: it.kind,
    href: trimKeepEmpty(toHrefString(it.href)),
  };
}

export function toSocialSettingsShapeFromDTO(
  dto: SocialSettingsDTO | null | undefined,
): SocialSettingsShape {
  return {
    items: (dto?.items ?? []).map(toSocialSettingsItemShapeFromDTO),
  };
}
