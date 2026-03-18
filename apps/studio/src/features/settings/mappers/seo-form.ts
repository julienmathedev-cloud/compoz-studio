/**
 * @file apps/studio/src/features/settings/mappers/seo-form.ts
 * @layer ui-mapper/studio
 * @description
 * Mappers UI SEO (studio forms) :
 * - DTO -> valeurs de formulaire RHF (draft-friendly)
 * - normalisation UI
 * - INTENTS DTO pour l’API (draft-only)
 *
 * @remarks
 * - DTO -> Shape runtime (shared, renderer) : `toSeoSettingsShapeFromDTO`
 *   dans `@compoz/ui/site/mappers/seo-shape`.
 */

import { TWITTER_CARD_TYPES } from "@compoz/core/constants/seo/seo";
import type { SeoSettingsDTO } from "@compoz/core/domain/site/dto";

import type { SeoFormValues } from "@compoz/validation/site/settings/seo/seo-form";
import type { UpdateSeoSettingsIntentDTO } from "@compoz/validation/site/settings/seo/seo-intents";

import { asBool, trimKeepEmpty } from "@compoz/ui/lib/form-utils";
import { toSeoSettingsShapeFromDTO } from "@compoz/ui/settings/mappers/seo-shape";

/* --------------------------------- helpers --------------------------------- */

const DEFAULT_TWITTER_CARD = TWITTER_CARD_TYPES[1];

/* ----------------------- Domaine (DTO) -> UI (form values) ------------------ */

export function toSeoFormValuesFromDTO(dto: SeoSettingsDTO): SeoFormValues {
  return {
    baseUrl: trimKeepEmpty(dto.baseUrl),
    defaultTitle: trimKeepEmpty(dto.defaultTitle),
    defaultDescription: trimKeepEmpty(dto.defaultDescription),
    titleTemplate: trimKeepEmpty(dto.titleTemplate),
    canonicalUrl: trimKeepEmpty(dto.canonicalUrl),
    robots: trimKeepEmpty(dto.robots),

    structuredDataEnabled:
      typeof dto.structuredDataEnabled === "boolean"
        ? dto.structuredDataEnabled
        : true,

    openGraph: {
      title: trimKeepEmpty(dto.openGraph?.title),
      description: trimKeepEmpty(dto.openGraph?.description),
      defaultImageUrl: trimKeepEmpty(dto.openGraph?.defaultImageUrl),
      imageAlt: trimKeepEmpty(dto.openGraph?.imageAlt),
    },

    twitter: {
      card: dto.twitter?.card ?? DEFAULT_TWITTER_CARD,
      site: trimKeepEmpty(dto.twitter?.site),
      creator: trimKeepEmpty(dto.twitter?.creator),
    },
  };
}

/* ---------------------------- Normalisations UI ---------------------------- */

export function normalizeSeoFormValues(values: SeoFormValues): SeoFormValues {
  return {
    baseUrl: trimKeepEmpty(values.baseUrl),
    defaultTitle: trimKeepEmpty(values.defaultTitle),
    defaultDescription: trimKeepEmpty(values.defaultDescription),
    titleTemplate: trimKeepEmpty(values.titleTemplate),
    canonicalUrl: trimKeepEmpty(values.canonicalUrl),
    robots: trimKeepEmpty(values.robots),

    structuredDataEnabled: asBool(values.structuredDataEnabled),

    openGraph: {
      title: trimKeepEmpty(values.openGraph.title),
      description: trimKeepEmpty(values.openGraph.description),
      defaultImageUrl: trimKeepEmpty(values.openGraph.defaultImageUrl),
      imageAlt: trimKeepEmpty(values.openGraph.imageAlt),
    },

    twitter: {
      card: values.twitter.card ?? DEFAULT_TWITTER_CARD,
      site: trimKeepEmpty(values.twitter.site),
      creator: trimKeepEmpty(values.twitter.creator),
    },
  };
}

/* ------------------------------ DTO -> Shape (optional re-export) ---------- */

/**
 * DTO -> Shape runtime (renderer) : convenience export côté studio.
 *
 * @remarks
 * Optionnel : tu peux supprimer cette fonction et importer directement
 * `toSeoSettingsShapeFromDTO` depuis `@compoz/ui/site/mappers/seo-shape`.
 */
export function toSeoSettingsShape(dto: SeoSettingsDTO) {
  return toSeoSettingsShapeFromDTO(dto);
}

/* ------------------------------ UI -> INTENT (API) -------------------------- */

/**
 * Transforme un INTENT UI partiel en DTO d’intent (draft-only) :
 * - Ne renvoie que les clés présentes dans `p`.
 * - Applique trim/coercition comme pour les form values complètes.
 */
export function toUpdateSeoIntentDTOFromFormValues(
  p: Partial<SeoFormValues>,
): UpdateSeoSettingsIntentDTO {
  const out: UpdateSeoSettingsIntentDTO = {};

  if ("baseUrl" in p) out.baseUrl = trimKeepEmpty(p.baseUrl);
  if ("defaultTitle" in p) out.defaultTitle = trimKeepEmpty(p.defaultTitle);
  if ("defaultDescription" in p) {
    out.defaultDescription = trimKeepEmpty(p.defaultDescription);
  }
  if ("titleTemplate" in p) out.titleTemplate = trimKeepEmpty(p.titleTemplate);
  if ("canonicalUrl" in p) out.canonicalUrl = trimKeepEmpty(p.canonicalUrl);
  if ("robots" in p) out.robots = trimKeepEmpty(p.robots);

  if ("structuredDataEnabled" in p) {
    out.structuredDataEnabled = asBool(p.structuredDataEnabled);
  }

  if ("openGraph" in p) {
    const ogIn = p.openGraph;
    if (ogIn) {
      out.openGraph = {
        title: trimKeepEmpty(ogIn.title),
        description: trimKeepEmpty(ogIn.description),
        defaultImageUrl: trimKeepEmpty(ogIn.defaultImageUrl),
        imageAlt: trimKeepEmpty(ogIn.imageAlt),
      };
    } else {
      out.openGraph = null;
    }
  }

  if ("twitter" in p) {
    const twIn = p.twitter;
    if (twIn) {
      out.twitter = {
        card: twIn.card ?? DEFAULT_TWITTER_CARD,
        site: trimKeepEmpty(twIn.site),
        creator: trimKeepEmpty(twIn.creator),
      };
    } else {
      out.twitter = null;
    }
  }

  return out;
}
