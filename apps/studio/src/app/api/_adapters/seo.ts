/**
 * @file apps/studio/src/app/api/_adapters/seo.ts
 * @layer api/adapters
 * @description
 * Adaptateur API Admin pour les réglages SEO : convertit un intent DTO reçu
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

import type { SeoSettings } from "@compoz/core/domain/site/entities/seo";
import type { UpdateSeoSettingsInput } from "@compoz/core/domain/site/use-cases/seo/update-seo-settings.types";
import { asAssetUrlOrNull } from "@compoz/core/domain/urls/derive";
import { log } from "@compoz/infra/lib/log";
import { trimClearableOrUndef } from "@compoz/studio/lib/strings";

import type {
  OpenGraphPatchDTO,
  TwitterPatchDTO,
  UpdateSeoSettingsIntentDTO,
} from "@compoz/validation/site/settings/seo/seo-intents";

/* -------------------------------------------------------------------------- */
/* Intent → Domain patch                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Transforme un intent DTO SEO en patch partiel domaine `SeoSettings`.
 *
 * Contrat :
 * - Seules les clés présentes dans l’intent sont posées.
 * - Les strings sont trimées ; les valeurs vides deviennent `undefined` (donc clé omise).
 * - `openGraph` / `twitter` : patch superficiel, uniquement sur les champs présents.
 * - `defaultImageUrl` : ""/null => null (clear explicite), sinon normalisé via `asAssetUrlOrNull`.
 */
export function adaptUpdateSeoIntent(
  dto: UpdateSeoSettingsIntentDTO,
): UpdateSeoSettingsInput {
  const started = Date.now();

  log.debug("admin.adapter.seo.patch.start", {
    hasBaseUrl: "baseUrl" in dto,
    hasDefaultTitle: "defaultTitle" in dto,
    hasDefaultDescription: "defaultDescription" in dto,
    hasOpenGraph: "openGraph" in dto,
    hasTwitter: "twitter" in dto,
  });

  const patch: Partial<SeoSettings> = {};

  /* ------------------------------ Root fields ------------------------------ */

  if ("baseUrl" in dto) {
    const v = trimClearableOrUndef(dto.baseUrl);
    if (v !== undefined) patch.baseUrl = v;
  }

  if ("defaultTitle" in dto) {
    const v = trimClearableOrUndef(dto.defaultTitle);
    if (v !== undefined) patch.defaultTitle = v;
  }

  if ("defaultDescription" in dto) {
    const v = trimClearableOrUndef(dto.defaultDescription);
    if (v !== undefined) patch.defaultDescription = v;
  }

  if ("titleTemplate" in dto) {
    const v = trimClearableOrUndef(dto.titleTemplate);
    if (v !== undefined) patch.titleTemplate = v;
  }

  if ("canonicalUrl" in dto) {
    const v = trimClearableOrUndef(dto.canonicalUrl);
    if (v !== undefined) patch.canonicalUrl = v;
  }

  if ("robots" in dto) {
    const v = trimClearableOrUndef(dto.robots);
    if (v !== undefined) patch.robots = v;
  }

  if (
    "structuredDataEnabled" in dto &&
    typeof dto.structuredDataEnabled === "boolean"
  ) {
    patch.structuredDataEnabled = dto.structuredDataEnabled;
  }

  /* ------------------------------ OpenGraph ------------------------------ */

  if ("openGraph" in dto) {
    const ogIn = dto.openGraph as OpenGraphPatchDTO | undefined;

    if (ogIn && typeof ogIn === "object") {
      const ogOut: NonNullable<SeoSettings["openGraph"]> = {};

      if ("title" in ogIn) {
        const v = trimClearableOrUndef(ogIn.title);
        if (v !== undefined) ogOut.title = v;
      }

      if ("description" in ogIn) {
        const v = trimClearableOrUndef(ogIn.description);
        if (v !== undefined) ogOut.description = v;
      }

      if ("imageAlt" in ogIn) {
        const v = trimClearableOrUndef(ogIn.imageAlt);
        if (v !== undefined) ogOut.imageAlt = v;
      }

      if ("defaultImageUrl" in ogIn) {
        const raw = ogIn.defaultImageUrl;

        // Clear explicite (null ou "")
        if (raw === null) {
          ogOut.defaultImageUrl = null;
        } else if (typeof raw === "string") {
          const t = raw.trim();
          ogOut.defaultImageUrl = t.length === 0 ? null : asAssetUrlOrNull(t);
        }
      }

      if (Object.keys(ogOut).length > 0) patch.openGraph = ogOut;
    }
  }

  /* -------------------------------- Twitter ------------------------------- */

  if ("twitter" in dto) {
    const twIn = dto.twitter as TwitterPatchDTO | undefined;

    if (twIn && typeof twIn === "object") {
      const twOut: Partial<NonNullable<SeoSettings["twitter"]>> = {};

      if ("card" in twIn && typeof twIn.card === "string") {
        // Le domaine/defaults garantissent une valeur cohérente au read
        twOut.card = twIn.card as NonNullable<SeoSettings["twitter"]>["card"];
      }

      if ("site" in twIn) {
        const v = trimClearableOrUndef(twIn.site);
        if (v !== undefined) twOut.site = v;
      }

      if ("creator" in twIn) {
        const v = trimClearableOrUndef(twIn.creator);
        if (v !== undefined) twOut.creator = v;
      }

      if (Object.keys(twOut).length > 0) {
        patch.twitter = twOut as NonNullable<SeoSettings["twitter"]>;
      }
    }
  }

  log.debug("admin.adapter.seo.patch.end", {
    ms: Date.now() - started,
    outKeys: Object.keys(patch),
  });

  return { patch };
}
