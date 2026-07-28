/**
 * @file apps/studio/src/app/api/_adapters/seo.ts
 * @layer studio/app/api/adapters
 * @description Studio API adapter for SEO settings update intents.
 * @remarks The transport accepts partial composite patches. This adapter completes each present composite from the normalized client baseline so the domain receives atomic, complete values.
 */

import { DEFAULT_SEO_SETTINGS } from "@compoz/core/domain/site/defaults/seo";
import type {
  OpenGraphSettings,
  SeoSettings,
  StructuredDataAddress,
  StructuredDataSettings,
  TwitterSettings,
} from "@compoz/core/domain/site/entities/seo";
import type { UpdateSeoSettingsInput } from "@compoz/core/domain/site/use-cases/seo/update-seo-settings.types";
import { asAssetUrlOrNull } from "@compoz/core/domain/urls/href";
import { log } from "@compoz/infra/lib/log";
import { trimOrKeep } from "@compoz/studio/lib/strings";
import type {
  OpenGraphPatchDTO,
  StructuredDataPatchDTO,
  TwitterPatchDTO,
  UpdateSeoSettingsIntentDTO,
  UpdateSeoSettingsOCCIntentDTO,
} from "@compoz/validation/site/settings/seo/seo-intents";

function hasOwnProperty(value: object, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function trimNullableString(value: string | null | undefined): string | null {
  if (value === null || typeof value === "undefined") return null;

  const trimmed = trimOrKeep(value);
  return trimmed.length > 0 ? trimmed : null;
}

function trimOptionalString(
  value: string | null | undefined,
): string | undefined {
  if (value === null || typeof value === "undefined") return undefined;

  const trimmed = trimOrKeep(value);
  return trimmed.length > 0 ? trimmed : undefined;
}

function optionalTrimmedString(
  value: string | null | undefined,
): string | undefined {
  const trimmed = trimOrKeep(value ?? "");
  return trimmed.length > 0 ? trimmed : undefined;
}

function cleanStringList(
  values: ReadonlyArray<string | null> | null | undefined,
): string[] | undefined {
  if (!values) return undefined;

  const cleaned = values
    .map((value) => trimOrKeep(value ?? ""))
    .filter(Boolean);

  return cleaned.length > 0 ? cleaned : undefined;
}

function adaptOpenGraphUrl(
  value: string | null | undefined,
): OpenGraphSettings["defaultImageUrl"] {
  if (value === null || typeof value === "undefined") return null;

  const trimmed = trimOrKeep(value);
  return trimmed.length === 0 ? null : asAssetUrlOrNull(trimmed);
}

function adaptStructuredDataAddress(
  baseline: StructuredDataAddress | undefined,
  patch: StructuredDataPatchDTO["address"] | undefined,
): StructuredDataAddress | undefined {
  if (!patch) return baseline ? { ...baseline } : undefined;

  const streetAddress = hasOwnProperty(patch, "streetAddress")
    ? trimOptionalString(patch.streetAddress)
    : baseline?.streetAddress;
  const postalCode = hasOwnProperty(patch, "postalCode")
    ? trimOptionalString(patch.postalCode)
    : baseline?.postalCode;
  const addressLocality = hasOwnProperty(patch, "addressLocality")
    ? trimOptionalString(patch.addressLocality)
    : baseline?.addressLocality;
  const addressRegion = hasOwnProperty(patch, "addressRegion")
    ? trimOptionalString(patch.addressRegion)
    : baseline?.addressRegion;
  const addressCountry = hasOwnProperty(patch, "addressCountry")
    ? trimOptionalString(patch.addressCountry)
    : baseline?.addressCountry;

  if (
    !streetAddress &&
    !postalCode &&
    !addressLocality &&
    !addressRegion &&
    !addressCountry
  ) {
    return undefined;
  }

  return {
    ...(streetAddress ? { streetAddress } : {}),
    ...(postalCode ? { postalCode } : {}),
    ...(addressLocality ? { addressLocality } : {}),
    ...(addressRegion ? { addressRegion } : {}),
    ...(addressCountry ? { addressCountry } : {}),
  };
}

function adaptStructuredDataPatch(
  baseline: StructuredDataSettings,
  patch: UpdateSeoSettingsIntentDTO["structuredData"],
): StructuredDataSettings {
  if (!patch) return { ...baseline };

  const name = hasOwnProperty(patch, "name")
    ? trimOptionalString(patch.name)
    : baseline.name;
  const description = hasOwnProperty(patch, "description")
    ? trimOptionalString(patch.description)
    : baseline.description;
  const telephone = hasOwnProperty(patch, "telephone")
    ? trimOptionalString(patch.telephone)
    : baseline.telephone;
  const email = hasOwnProperty(patch, "email")
    ? trimOptionalString(patch.email)
    : baseline.email;
  const priceRange = hasOwnProperty(patch, "priceRange")
    ? trimOptionalString(patch.priceRange)
    : baseline.priceRange;
  const areaServed = hasOwnProperty(patch, "areaServed")
    ? cleanStringList(patch.areaServed)
    : baseline.areaServed ? [...baseline.areaServed] : undefined;
  const openingHours = hasOwnProperty(patch, "openingHours")
    ? cleanStringList(patch.openingHours)
    : baseline.openingHours ? [...baseline.openingHours] : undefined;
  const address = adaptStructuredDataAddress(baseline.address, patch.address);

  return {
    enabled: hasOwnProperty(patch, "enabled")
      ? patch.enabled ?? false
      : baseline.enabled,
    entityType: hasOwnProperty(patch, "entityType")
      ? patch.entityType ?? "organization"
      : baseline.entityType,
    ...(name ? { name } : {}),
    ...(description ? { description } : {}),
    ...(telephone ? { telephone } : {}),
    ...(email ? { email } : {}),
    ...(address ? { address } : {}),
    ...(areaServed ? { areaServed } : {}),
    ...(priceRange ? { priceRange } : {}),
    ...(openingHours ? { openingHours } : {}),
  };
}

function emptyOpenGraph(): OpenGraphSettings {
  return {
    title: null,
    description: null,
    defaultImageUrl: null,
    imageAlt: "",
  };
}

function adaptOpenGraphPatch(
  baseline: SeoSettings["openGraph"],
  patch: OpenGraphPatchDTO,
): OpenGraphSettings {
  const source = baseline ?? emptyOpenGraph();
  const defaultImageUrl = hasOwnProperty(patch, "defaultImageUrl")
    ? adaptOpenGraphUrl(patch.defaultImageUrl)
    : source.defaultImageUrl;
  const defaultImageMediaAssetId = hasOwnProperty(
    patch,
    "defaultImageMediaAssetId",
  )
    ? optionalTrimmedString(patch.defaultImageMediaAssetId)
    : hasOwnProperty(patch, "defaultImageUrl")
      ? undefined
      : source.defaultImageMediaAssetId;

  return {
    title: hasOwnProperty(patch, "title")
      ? trimNullableString(patch.title)
      : source.title,
    description: hasOwnProperty(patch, "description")
      ? trimNullableString(patch.description)
      : source.description,
    defaultImageUrl,
    imageAlt: hasOwnProperty(patch, "imageAlt")
      ? trimNullableString(patch.imageAlt) ?? ""
      : source.imageAlt,
    ...(defaultImageUrl !== null && defaultImageMediaAssetId
      ? { defaultImageMediaAssetId }
      : {}),
  };
}

function adaptTwitterPatch(
  baseline: SeoSettings["twitter"],
  patch: TwitterPatchDTO,
): TwitterSettings {
  const source = baseline ?? DEFAULT_SEO_SETTINGS.twitter;

  if (!source) {
    throw new Error("DEFAULT_SEO_SETTINGS.twitter must be complete.");
  }

  return {
    card: hasOwnProperty(patch, "card") ? patch.card ?? source.card : source.card,
    site: hasOwnProperty(patch, "site")
      ? trimNullableString(patch.site)
      : source.site,
    creator: hasOwnProperty(patch, "creator")
      ? trimNullableString(patch.creator)
      : source.creator,
  };
}

function adaptOpenGraphBaseline(
  value: UpdateSeoSettingsOCCIntentDTO["baseline"]["openGraph"],
): SeoSettings["openGraph"] {
  if (value === null) return null;

  return {
    title: trimNullableString(value.title),
    description: trimNullableString(value.description),
    defaultImageUrl: adaptOpenGraphUrl(value.defaultImageUrl),
    imageAlt: trimOrKeep(value.imageAlt),
    ...(optionalTrimmedString(value.defaultImageMediaAssetId)
      ? {
          defaultImageMediaAssetId: optionalTrimmedString(
            value.defaultImageMediaAssetId,
          ),
        }
      : {}),
  };
}

function adaptTwitterBaseline(
  value: UpdateSeoSettingsOCCIntentDTO["baseline"]["twitter"],
): SeoSettings["twitter"] {
  return value === null
    ? null
    : {
        card: value.card,
        site: trimNullableString(value.site),
        creator: trimNullableString(value.creator),
      };
}

function adaptSeoBaseline(
  baseline: UpdateSeoSettingsOCCIntentDTO["baseline"],
): SeoSettings {
  const openGraph = adaptOpenGraphBaseline(baseline.openGraph);
  const twitter = adaptTwitterBaseline(baseline.twitter);

  return {
    baseUrl: trimNullableString(baseline.baseUrl),
    defaultTitle: trimNullableString(baseline.defaultTitle),
    titleTemplate: trimNullableString(baseline.titleTemplate),
    defaultDescription: trimNullableString(baseline.defaultDescription),
    canonicalUrl: trimNullableString(baseline.canonicalUrl),
    robots: trimNullableString(baseline.robots),
    openGraph,
    twitter,
    structuredData: adaptStructuredDataPatch(
      DEFAULT_SEO_SETTINGS.structuredData,
      baseline.structuredData,
    ),
  };
}

/**
 * Converts an SEO intent DTO into a partial domain patch.
 *
 * Transport composites may be sub-patches. Each composite explicitly present
 * in the patch is completed from the normalized baseline before it reaches the
 * domain, where Open Graph, Twitter, and structured data are atomic values.
 */
export function adaptUpdateSeoIntent(
  intent: UpdateSeoSettingsOCCIntentDTO,
): UpdateSeoSettingsInput {
  const baseline = adaptSeoBaseline(intent.baseline);
  const dto = intent.patch;
  const started = Date.now();

  log.debug("studio.adapter.seo.patch.start", {
    hasBaseUrl: "baseUrl" in dto,
    hasDefaultTitle: "defaultTitle" in dto,
    hasDefaultDescription: "defaultDescription" in dto,
    hasTitleTemplate: "titleTemplate" in dto,
    hasCanonicalUrl: "canonicalUrl" in dto,
    hasRobots: "robots" in dto,
    hasStructuredData: "structuredData" in dto,
    hasOpenGraph: "openGraph" in dto,
    hasTwitter: "twitter" in dto,
  });

  const patch: Partial<SeoSettings> = {};

  if ("baseUrl" in dto) patch.baseUrl = trimNullableString(dto.baseUrl);
  if ("defaultTitle" in dto) {
    patch.defaultTitle = trimNullableString(dto.defaultTitle);
  }
  if ("defaultDescription" in dto) {
    patch.defaultDescription = trimNullableString(dto.defaultDescription);
  }
  if ("titleTemplate" in dto) {
    patch.titleTemplate = trimNullableString(dto.titleTemplate);
  }
  if ("canonicalUrl" in dto) {
    patch.canonicalUrl = trimNullableString(dto.canonicalUrl);
  }
  if ("robots" in dto) patch.robots = trimNullableString(dto.robots);

  if ("structuredData" in dto) {
    patch.structuredData = adaptStructuredDataPatch(
      baseline.structuredData,
      dto.structuredData,
    );
  }

  if ("openGraph" in dto && dto.openGraph !== undefined) {
    patch.openGraph =
      dto.openGraph === null
        ? null
        : adaptOpenGraphPatch(baseline.openGraph, dto.openGraph);
  }

  if ("twitter" in dto && dto.twitter !== undefined) {
    patch.twitter =
      dto.twitter === null
        ? null
        : adaptTwitterPatch(baseline.twitter, dto.twitter);
  }

  log.debug("studio.adapter.seo.patch.end", {
    ms: Date.now() - started,
    outKeys: Object.keys(patch),
  });

  return {
    baseline,
    patch,
    expectedRevision: intent.expectedRevision,
  };
}
