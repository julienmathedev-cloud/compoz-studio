/**
 * @file apps/studio/src/app/api/_adapters/seo.ts
 * @layer studio/app/api/adapters
 *
 * @description
 * Studio API adapter for SEO settings update intents.
 *
 * @remarks
 * - Builds a partial domain patch from the fields present in the intent.
 * - Partially adapts `openGraph`, `twitter`, and structured data blocks.
 * - Leaves defaults and invariants such as `twitter.card` to the domain/repository layer.
 */

import type {
  SeoSettings,
  StructuredDataAddress,
  StructuredDataSettings,
} from "@compoz/core/domain/site/entities/seo";
import type { UpdateSeoSettingsInput } from "@compoz/core/domain/site/use-cases/seo/update-seo-settings.types";
import { asAssetUrlOrNull } from "@compoz/core/domain/urls/href";
import { log } from "@compoz/infra/lib/log";
import { trimOrKeep } from "@compoz/studio/lib/strings";

import type {
  OpenGraphPatchDTO,
  TwitterPatchDTO,
  UpdateSeoSettingsIntentDTO,
} from "@compoz/validation/site/settings/seo/seo-intents";

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

function adaptStructuredData(
  value: UpdateSeoSettingsIntentDTO["structuredData"],
): StructuredDataSettings {
  if (!value) {
    return {
      enabled: false,
      entityType: "organization",
    };
  }

  const address: StructuredDataAddress = {
    streetAddress: trimOptionalString(value.address?.streetAddress),
    postalCode: trimOptionalString(value.address?.postalCode),
    addressLocality: trimOptionalString(value.address?.addressLocality),
    addressRegion: trimOptionalString(value.address?.addressRegion),
    addressCountry: trimOptionalString(value.address?.addressCountry),
  };

  const cleanAddress = Object.fromEntries(
    Object.entries(address).filter(([, addressValue]) => addressValue),
  ) as StructuredDataAddress;

  return {
    enabled: value.enabled ?? false,
    entityType: value.entityType ?? "organization",
    name: trimOptionalString(value.name),
    description: trimOptionalString(value.description),
    telephone: trimOptionalString(value.telephone),
    email: trimOptionalString(value.email),
    address: Object.keys(cleanAddress).length > 0 ? cleanAddress : undefined,
    areaServed: cleanStringList(value.areaServed),
    priceRange: trimOptionalString(value.priceRange),
    openingHours: cleanStringList(value.openingHours),
  };
}

// Intent to domain patch.

/**
 * Converts an SEO intent DTO into a partial `SeoSettings` domain patch.
 *
 * Contract:
 * - Only keys present in the intent are set.
 * - Strings are trimmed; empty values become `null`.
 * - `openGraph` / `twitter`: shallow patch, only for present fields.
 * - `defaultImageUrl`: ""/null => null (explicit clear), otherwise normalized
 *   through `asAssetUrlOrNull`.
 * - `defaultImageMediaAssetId`: optional MediaAsset link, removed when the
 *   image URL is cleared or replaced without an associated id.
 */
export function adaptUpdateSeoIntent(
  dto: UpdateSeoSettingsIntentDTO,
): UpdateSeoSettingsInput {
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

  if ("baseUrl" in dto) {
    patch.baseUrl = trimNullableString(dto.baseUrl);
  }

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

  if ("robots" in dto) {
    patch.robots = trimNullableString(dto.robots);
  }

  if ("structuredData" in dto) {
    patch.structuredData = adaptStructuredData(dto.structuredData);
  }

  // OpenGraph patch.

  if ("openGraph" in dto) {
    const ogIn = dto.openGraph as OpenGraphPatchDTO | null | undefined;

    if (ogIn === null) {
      patch.openGraph = null;
    } else if (ogIn && typeof ogIn === "object") {
      const ogOut: Partial<NonNullable<SeoSettings["openGraph"]>> = {};

      if ("title" in ogIn) {
        ogOut.title = trimNullableString(ogIn.title);
      }

      if ("description" in ogIn) {
        ogOut.description = trimNullableString(ogIn.description);
      }

      if ("imageAlt" in ogIn) {
        ogOut.imageAlt = trimNullableString(ogIn.imageAlt) ?? "";
      }

      if ("defaultImageUrl" in ogIn) {
        const raw = ogIn.defaultImageUrl;

        if (raw === null) {
          ogOut.defaultImageUrl = null;
        } else if (typeof raw === "string") {
          const trimmedUrl = trimOrKeep(raw);
          ogOut.defaultImageUrl =
            trimmedUrl.length === 0 ? null : asAssetUrlOrNull(trimmedUrl);
        }

        /**
         * URL is the rendering source of truth.
         *
         * If the image URL is patched but no MediaAsset id is provided,
         * the previous id must not survive. This covers manual URL edits and
         * clears, because `undefined` is usually omitted from JSON payloads.
         */
        if (!("defaultImageMediaAssetId" in ogIn)) {
          ogOut.defaultImageMediaAssetId = undefined;
        }
      }

      if ("defaultImageMediaAssetId" in ogIn) {
        ogOut.defaultImageMediaAssetId = optionalTrimmedString(
          ogIn.defaultImageMediaAssetId,
        );
      }

      /**
       * Clearing the URL always wins over any stale id still present in the
       * incoming payload.
       */
      if ("defaultImageUrl" in ogIn && !ogOut.defaultImageUrl) {
        ogOut.defaultImageMediaAssetId = undefined;
      }

      if (Object.keys(ogOut).length > 0) {
        patch.openGraph = ogOut as NonNullable<SeoSettings["openGraph"]>;
      }
    }
  }

  // Twitter patch.

  if ("twitter" in dto) {
    const twIn = dto.twitter as TwitterPatchDTO | null | undefined;

    if (twIn === null) {
      patch.twitter = null;
    } else if (twIn && typeof twIn === "object") {
      const twOut: Partial<NonNullable<SeoSettings["twitter"]>> = {};

      if ("card" in twIn && typeof twIn.card === "string") {
        twOut.card = twIn.card as NonNullable<SeoSettings["twitter"]>["card"];
      }

      if ("site" in twIn) {
        twOut.site = trimNullableString(twIn.site);
      }

      if ("creator" in twIn) {
        twOut.creator = trimNullableString(twIn.creator);
      }

      if (Object.keys(twOut).length > 0) {
        patch.twitter = twOut as NonNullable<SeoSettings["twitter"]>;
      }
    }
  }

  log.debug("studio.adapter.seo.patch.end", {
    ms: Date.now() - started,
    outKeys: Object.keys(patch),
  });

  return { patch };
}
