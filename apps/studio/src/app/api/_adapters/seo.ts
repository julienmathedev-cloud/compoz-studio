/**
 * @file apps/studio/src/app/api/_adapters/seo.ts
 * @layer studio/app/api/adapters
 *
 * @description
 * Adaptateur API Studio pour les réglages SEO : convertit un intent DTO reçu
 * en patch partiel domaine (`Partial<SeoSettings>`).
 *
 * Responsabilités :
 * - trimming défensif des chaînes
 * - application uniquement des clés présentes
 * - adaptation partielle des blocs `openGraph` et `twitter`
 *
 * @remarks
 * - Draft-only côté route : pas de state dans l’intent.
 * - Les invariants et defaults (ex: twitter.card) sont garantis par le domaine/repo.
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

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

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
  legacyEnabled?: boolean,
): StructuredDataSettings {
  if (typeof value === "boolean") {
    return { enabled: value, entityType: "organization" };
  }

  if (!value) {
    return {
      enabled: legacyEnabled ?? false,
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
    enabled: value.enabled ?? legacyEnabled ?? false,
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

/* -------------------------------------------------------------------------- */
/* Intent → Domain patch                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Transforme un intent DTO SEO en patch partiel domaine `SeoSettings`.
 *
 * Contrat :
 * - Seules les clés présentes dans l’intent sont posées.
 * - Les strings sont trimées ; les valeurs vides deviennent `null`.
 * - `openGraph` / `twitter` : patch superficiel, uniquement sur les champs présents.
 * - `defaultImageUrl` : ""/null => null (clear explicite), sinon normalisé via `asAssetUrlOrNull`.
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
    hasStructuredDataEnabled: "structuredDataEnabled" in dto,
    hasOpenGraph: "openGraph" in dto,
    hasTwitter: "twitter" in dto,
  });

  const patch: Partial<SeoSettings> = {};

  /* ------------------------------ Root fields ------------------------------ */

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

  if ("structuredData" in dto || "structuredDataEnabled" in dto) {
    patch.structuredData = adaptStructuredData(
      dto.structuredData,
      dto.structuredDataEnabled,
    );
  }

  /* ------------------------------ OpenGraph ------------------------------ */

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
          const t = trimOrKeep(raw);
          ogOut.defaultImageUrl = t.length === 0 ? null : asAssetUrlOrNull(t);
        }
      }

      if (Object.keys(ogOut).length > 0) {
        patch.openGraph = ogOut as NonNullable<SeoSettings["openGraph"]>;
      }
    }
  }

  /* -------------------------------- Twitter ------------------------------- */

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
