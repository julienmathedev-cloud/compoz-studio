/**
 * @file packages/ui/src/site/mappers/seo-shape.ts
 * @layer ui/site/mappers
 *
 * @description
 * Mapper "shared runtime" SEO :
 * - DTO domaine -> SeoSettingsShape (frontière stable)
 *
 * @remarks
 * - Utilisé par site (public) ET par studio (preview / renderer).
 * - Ici, pas de RHF, pas d'intents API, pas de normalisation "draft".
 * - On fait uniquement : DTO -> shape "frontière" (strings, bools, defaults stables).
 */

import { TWITTER_CARD_TYPES } from "@compoz/core/constants/seo/seo";
import type { SeoSettingsDTO } from "@compoz/core/domain/site/dto";

import { trimKeepEmpty } from "@compoz/ui/lib/form-utils";
import type { SeoSettingsShape } from "@compoz/validation/site/settings/seo/seo";

const DEFAULT_TWITTER_CARD = TWITTER_CARD_TYPES[1] ?? TWITTER_CARD_TYPES[0];

/**
 * Domaine (DTO) -> Renderer (Shape)
 * Contrat : retourne une shape stable pour le renderer (objets/arrays "mutables").
 */
export function toSeoSettingsShapeFromDTO(
  dto: SeoSettingsDTO | null | undefined,
): SeoSettingsShape {
  return {
    baseUrl: trimKeepEmpty(dto?.baseUrl),
    defaultTitle: trimKeepEmpty(dto?.defaultTitle),
    defaultDescription: trimKeepEmpty(dto?.defaultDescription),
    titleTemplate: trimKeepEmpty(dto?.titleTemplate),
    canonicalUrl: trimKeepEmpty(dto?.canonicalUrl),
    robots: trimKeepEmpty(dto?.robots),

    structuredDataEnabled:
      typeof dto?.structuredDataEnabled === "boolean"
        ? dto.structuredDataEnabled
        : true,

    openGraph: {
      title: trimKeepEmpty(dto?.openGraph?.title),
      description: trimKeepEmpty(dto?.openGraph?.description),
      defaultImageUrl: trimKeepEmpty(dto?.openGraph?.defaultImageUrl),
      imageAlt: trimKeepEmpty(dto?.openGraph?.imageAlt),
    },

    twitter: {
      card: dto?.twitter?.card ?? DEFAULT_TWITTER_CARD,
      site: trimKeepEmpty(dto?.twitter?.site),
      creator: trimKeepEmpty(dto?.twitter?.creator),
    },
  } satisfies SeoSettingsShape;
}
