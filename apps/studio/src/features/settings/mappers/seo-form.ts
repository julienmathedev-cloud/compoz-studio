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

const DEFAULT_TWITTER_CARD = TWITTER_CARD_TYPES[1] ?? TWITTER_CARD_TYPES[0];

function optionalTrimmedString(
  value: string | null | undefined,
): string | undefined {
  const trimmed = trimKeepEmpty(value);

  return trimmed ? trimmed : undefined;
}

function normalizeStructuredDataFormValues(
  value: SeoFormValues["structuredData"],
): SeoFormValues["structuredData"] {
  return {
    enabled: asBool(value.enabled),
    entityType: value.entityType ?? "organization",
    name: trimKeepEmpty(value.name),
    description: trimKeepEmpty(value.description),
    telephone: trimKeepEmpty(value.telephone),
    email: trimKeepEmpty(value.email),
    address: {
      streetAddress: trimKeepEmpty(value.address?.streetAddress),
      postalCode: trimKeepEmpty(value.address?.postalCode),
      addressLocality: trimKeepEmpty(value.address?.addressLocality),
      addressRegion: trimKeepEmpty(value.address?.addressRegion),
      addressCountry: trimKeepEmpty(value.address?.addressCountry),
    },
    areaServed: (value.areaServed ?? []).map(trimKeepEmpty).filter(Boolean),
    priceRange: trimKeepEmpty(value.priceRange),
    openingHours: (value.openingHours ?? []).map(trimKeepEmpty).filter(Boolean),
  };
}

/* ----------------------- Domaine (DTO) -> UI (form values) ------------------ */

export function toSeoFormValuesFromDTO(dto: SeoSettingsDTO): SeoFormValues {
  return {
    baseUrl: trimKeepEmpty(dto.baseUrl),
    defaultTitle: trimKeepEmpty(dto.defaultTitle),
    defaultDescription: trimKeepEmpty(dto.defaultDescription),
    titleTemplate: trimKeepEmpty(dto.titleTemplate),
    canonicalUrl: trimKeepEmpty(dto.canonicalUrl),
    robots: trimKeepEmpty(dto.robots),

    structuredData: {
      enabled: dto.structuredData?.enabled ?? false,
      entityType: dto.structuredData?.entityType ?? "organization",
      name: trimKeepEmpty(dto.structuredData?.name),
      description: trimKeepEmpty(dto.structuredData?.description),
      telephone: trimKeepEmpty(dto.structuredData?.telephone),
      email: trimKeepEmpty(dto.structuredData?.email),
      address: {
        streetAddress: trimKeepEmpty(
          dto.structuredData?.address?.streetAddress,
        ),
        postalCode: trimKeepEmpty(dto.structuredData?.address?.postalCode),
        addressLocality: trimKeepEmpty(
          dto.structuredData?.address?.addressLocality,
        ),
        addressRegion: trimKeepEmpty(
          dto.structuredData?.address?.addressRegion,
        ),
        addressCountry: trimKeepEmpty(
          dto.structuredData?.address?.addressCountry,
        ),
      },
      areaServed: [...(dto.structuredData?.areaServed ?? [])],
      priceRange: trimKeepEmpty(dto.structuredData?.priceRange),
      openingHours: [...(dto.structuredData?.openingHours ?? [])],
    },

    openGraph: {
      title: trimKeepEmpty(dto.openGraph?.title),
      description: trimKeepEmpty(dto.openGraph?.description),
      defaultImageUrl: trimKeepEmpty(dto.openGraph?.defaultImageUrl),
      defaultImageMediaAssetId: optionalTrimmedString(
        dto.openGraph?.defaultImageMediaAssetId,
      ),
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

    structuredData: normalizeStructuredDataFormValues(values.structuredData),

    openGraph: {
      title: trimKeepEmpty(values.openGraph.title),
      description: trimKeepEmpty(values.openGraph.description),
      defaultImageUrl: trimKeepEmpty(values.openGraph.defaultImageUrl),
      defaultImageMediaAssetId: optionalTrimmedString(
        values.openGraph.defaultImageMediaAssetId,
      ),
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

  if ("structuredData" in p && p.structuredData) {
    const structuredData = normalizeStructuredDataFormValues(p.structuredData);

    out.structuredData = {
      enabled: structuredData.enabled,
      entityType: structuredData.entityType,
      name: structuredData.name || undefined,
      description: structuredData.description || undefined,
      telephone: structuredData.telephone || undefined,
      email: structuredData.email || undefined,
      address: Object.values(structuredData.address).some(Boolean)
        ? {
            streetAddress: structuredData.address.streetAddress || undefined,
            postalCode: structuredData.address.postalCode || undefined,
            addressLocality:
              structuredData.address.addressLocality || undefined,
            addressRegion: structuredData.address.addressRegion || undefined,
            addressCountry: structuredData.address.addressCountry || undefined,
          }
        : undefined,
      areaServed:
        structuredData.areaServed.length > 0
          ? structuredData.areaServed
          : undefined,
      priceRange: structuredData.priceRange || undefined,
      openingHours:
        structuredData.openingHours.length > 0
          ? structuredData.openingHours
          : undefined,
    };
  }

  if ("openGraph" in p) {
    const ogIn = p.openGraph;
    if (ogIn) {
      out.openGraph = {
        title: trimKeepEmpty(ogIn.title),
        description: trimKeepEmpty(ogIn.description),
        defaultImageUrl: trimKeepEmpty(ogIn.defaultImageUrl),
        defaultImageMediaAssetId: optionalTrimmedString(
          ogIn.defaultImageMediaAssetId,
        ),
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
