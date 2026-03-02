/**
 * @file packages/ui/src/site/mappers/seo-shape.ts
 * @layer ui-mappers/site
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

import type { SeoSettingsShape } from "@compoz/validation/site/settings/seo/seo";
import { trimKeepEmpty } from "@compoz/ui/lib/form-utils";

const DEFAULT_TWITTER_CARD = TWITTER_CARD_TYPES[1];

/**
 * Domaine (DTO) -> Renderer (Shape)
 * Contrat : retourne une shape stable pour le renderer (objets/arrays "mutables").
 */
export function toSeoSettingsShapeFromDTO(
  dto: SeoSettingsDTO | null | undefined,
): SeoSettingsShape {
  const d = dto ?? ({} as SeoSettingsDTO);

  return {
    baseUrl: trimKeepEmpty(d.baseUrl),
    defaultTitle: trimKeepEmpty(d.defaultTitle),
    defaultDescription: trimKeepEmpty(d.defaultDescription),
    titleTemplate: trimKeepEmpty(d.titleTemplate),
    canonicalUrl: trimKeepEmpty(d.canonicalUrl),
    robots: trimKeepEmpty(d.robots),

    structuredDataEnabled:
      typeof d.structuredDataEnabled === "boolean"
        ? d.structuredDataEnabled
        : true,

    openGraph: {
      title: trimKeepEmpty(d.openGraph?.title),
      description: trimKeepEmpty(d.openGraph?.description),
      defaultImageUrl: trimKeepEmpty(
        typeof d.openGraph?.defaultImageUrl === "string"
          ? d.openGraph.defaultImageUrl
          : "",
      ),
      imageAlt: trimKeepEmpty(d.openGraph?.imageAlt),
    },

    twitter: {
      card: d.twitter?.card ?? DEFAULT_TWITTER_CARD,
      site: trimKeepEmpty(d.twitter?.site),
      creator: trimKeepEmpty(d.twitter?.creator),
    },
  } satisfies SeoSettingsShape;
}
