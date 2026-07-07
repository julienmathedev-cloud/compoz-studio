/**
 * @file apps/studio/src/app/api/_adapters/identity.ts
 * @layer studio/app/api/adapters
 *
 * @description
 * Studio API adapter for identity settings update intents.
 *
 * @remarks
 * - Builds a partial domain patch from the fields present in the intent.
 * - Normalizes logo and favicon asset fields before domain writes.
 * - Leaves state handling to the route.
 */

import { asAssetUrlOrNull } from "@compoz/core/domain/urls/href";
import { log } from "@compoz/infra/lib/log";
import { trimOrKeep } from "@compoz/studio/lib/strings";

import type { IdentitySettings } from "@compoz/core/domain/site/entities/identity";
import type { UpdateIdentitySettingsInput } from "@compoz/core/domain/site/use-cases/identity/update-identity-settings.types";
import type { UpdateIdentitySettingsIntentDTO } from "@compoz/validation/site/settings/identity/identity-intents";

function optionalTrimmedString(
  value: string | null | undefined,
): string | undefined {
  const trimmed = typeof value === "string" ? value.trim() : "";

  return trimmed ? trimmed : undefined;
}

export function adaptUpdateIdentityIntent(
  dto: UpdateIdentitySettingsIntentDTO,
): UpdateIdentitySettingsInput {
  const started = Date.now();

  log.debug("studio.adapter.identity.patch.start", {
    hasSiteName: typeof dto.siteName === "string",
    hasTagline: "tagline" in dto,
    hasLogo: dto.logo !== undefined,
    hasFaviconUrl: dto.faviconUrl !== undefined,
    hasFaviconMediaAssetId: dto.faviconMediaAssetId !== undefined,
  });

  const patch: Partial<IdentitySettings> = {};

  if (typeof dto.siteName === "string") {
    patch.siteName = trimOrKeep(dto.siteName);
  }

  if ("tagline" in dto) {
    if (dto.tagline === null) {
      patch.tagline = null;
    } else if (typeof dto.tagline === "string") {
      const v = trimOrKeep(dto.tagline);
      patch.tagline = v.length === 0 ? null : v;
    }
  }

  // Logo rules:
  // - undefined -> unchanged
  // - null -> clear
  // - image object -> field-by-field normalization
  if ("logo" in dto) {
    if (dto.logo === null) {
      patch.logo = null;
    } else if (dto.logo !== undefined) {
      const mediaAssetId = optionalTrimmedString(dto.logo.mediaAssetId);

      patch.logo = {
        src: trimOrKeep(dto.logo.src),
        alt: trimOrKeep(dto.logo.alt),
        width: dto.logo.width,
        height: dto.logo.height,
        ...(mediaAssetId ? { mediaAssetId } : {}),
      };
    }
  }

  // Favicon rules:
  // - undefined -> unchanged
  // - null / "" -> clear
  // - string -> normalize
  // - faviconUrl is the rendering source; when it changes without an associated
  //   id, the previous mediaAssetId must not survive.
  if ("faviconUrl" in dto) {
    patch.faviconUrl = asAssetUrlOrNull(dto.faviconUrl);

    /**
     * URL is the rendering source of truth.
     *
     * If the favicon URL is patched but no MediaAsset id is provided,
     * the previous id must not survive. This covers manual URL edits and
     * clears, because `undefined` is usually omitted from JSON payloads.
     */
    if (!("faviconMediaAssetId" in dto)) {
      patch.faviconMediaAssetId = undefined;
    }
  }

  if ("faviconMediaAssetId" in dto) {
    patch.faviconMediaAssetId = optionalTrimmedString(dto.faviconMediaAssetId);
  }

  /**
   * Clearing the URL always wins over any stale id still present in the
   * incoming payload.
   */
  if ("faviconUrl" in dto && patch.faviconUrl === null) {
    patch.faviconMediaAssetId = undefined;
  }

  log.debug("studio.adapter.identity.patch.end", {
    ms: Date.now() - started,
    outKeys: Object.keys(patch),
  });

  return { patch };
}
