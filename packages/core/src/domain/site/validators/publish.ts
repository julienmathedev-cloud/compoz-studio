/**
 * @file packages/core/src/domain/site/validators/publish.ts
 * @layer core/domain
 * @description
 * Génération des avertissements non bloquants lors de la publication du site,
 * “Index-only + warnings optionnels dépendants des settings (si fournis)”.
 *
 * @remarks
 * - Ces warnings n’empêchent pas la publication.
 * - Les avertissements dépendant d’autres sources (pages, settings) sont gérés
 *   directement dans le use-case `publishSite`.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import {
  DomainError,
  isDomainErrorLike,
} from "@compoz/core/domain/errors/domain-error";
import type { UiWarning } from "@compoz/core/domain/errors/issue.types";
import type {
  IdentitySettings,
  SeoSettings,
} from "@compoz/core/domain/site/entities";
import type { SiteIndex } from "@compoz/core/domain/site/entities/site-index";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import { assertIdentitySettings } from "@compoz/core/domain/site/validators/identity";
import { assertSeoSettings } from "@compoz/core/domain/site/validators/seo";
import { HOME_SLUG } from "@compoz/core/domain/slug/constants";

/** Codes d’avertissements possibles lors d’une publication. */
export type PublishWarningCode =
  | typeof EC.PUBLISH_EMPTY_INDEX
  | typeof EC.PUBLISH_SETTINGS_COPY_FAILED
  | typeof EC.PUBLISH_PAGE_MISSING
  | typeof EC.PUBLISH_PAGE_DELETE_FAILED
  // Warnings “site live” (V0.5)
  | typeof EC.PUBLISH_HOME_MISSING
  | typeof EC.PUBLISH_PRIMARY_MENU_EMPTY
  | typeof EC.PUBLISH_LEGAL_MENU_EMPTY
  | typeof EC.PUBLISH_SOCIAL_EMPTY
  | typeof EC.PUBLISH_IDENTITY_LOGO_MISSING
  | typeof EC.PUBLISH_IDENTITY_FAVICON_MISSING
  | typeof EC.PUBLISH_SEO_OG_IMAGE_MISSING
  | typeof EC.PUBLISH_SEO_ROBOTS_NOINDEX
  | typeof EC.PUBLISH_SEO_BASEURL_MISSING;

/** Type métier pour les warnings de publication. */
export type PublishWarning = UiWarning<PublishWarningCode>;

/**
 * Inspecte l’index source avant publication et génère les warnings associés.
 *
 * @remarks
 * - Index-only : toujours calculé.
 * - Live warnings : calculés si `settings` est fourni (V0.5).
 */
export function publishWarnings(
  index: SiteIndex,
  settings?: Pick<
    SiteSettings,
    "identity" | "seo" | "primaryMenu" | "legalMenu" | "social"
  >,
): ReadonlyArray<PublishWarning> {
  const warnings: PublishWarning[] = [];

  /* --- index vide --- */
  if (index.pages.length === 0) {
    warnings.push({ code: EC.PUBLISH_EMPTY_INDEX, path: ["pages"] });
    // On continue : d’autres warnings peuvent être utiles.
  }

  /* --- home absente de l’index --- */
  const hasHome = index.pages.some((p) => p.slug === HOME_SLUG);
  if (!hasHome) {
    warnings.push({ code: EC.PUBLISH_HOME_MISSING, path: ["pages", "home"] });
  }

  /* --- live warnings (settings) --- */
  if (settings) {
    const primaryItems = settings.primaryMenu?.items ?? [];
    if (primaryItems.length === 0) {
      warnings.push({
        code: EC.PUBLISH_PRIMARY_MENU_EMPTY,
        path: ["primaryMenu", "items"],
      });
    }

    const legalItems = settings.legalMenu?.items ?? [];
    if (legalItems.length === 0) {
      warnings.push({
        code: EC.PUBLISH_LEGAL_MENU_EMPTY,
        path: ["legalMenu", "items"],
      });
    }

    const socialItems = settings.social?.items ?? [];
    if (socialItems.length === 0) {
      warnings.push({
        code: EC.PUBLISH_SOCIAL_EMPTY,
        path: ["social", "items"],
      });
    }

    const logoUrl = (settings.identity?.logoUrl ?? "").trim();
    const faviconUrl = (settings.identity?.faviconUrl ?? "").trim();
    if (!logoUrl) {
      warnings.push({
        code: EC.PUBLISH_IDENTITY_LOGO_MISSING,
        path: ["identity", "logoUrl"],
      });
    }
    if (!faviconUrl) {
      warnings.push({
        code: EC.PUBLISH_IDENTITY_FAVICON_MISSING,
        path: ["identity", "faviconUrl"],
      });
    }

    const ogImg = (settings.seo?.openGraph?.defaultImageUrl ?? "").trim();
    if (!ogImg) {
      warnings.push({
        code: EC.PUBLISH_SEO_OG_IMAGE_MISSING,
        path: ["seo", "openGraph", "defaultImageUrl"],
      });
    }

    const robots = (settings.seo?.robots ?? "").toLowerCase();
    if (robots.includes("noindex")) {
      warnings.push({
        code: EC.PUBLISH_SEO_ROBOTS_NOINDEX,
        path: ["seo", "robots"],
      });
    }

    const baseUrl = (settings.seo?.baseUrl ?? "").trim();

    // baseUrl manquante -> warning (source canonique recommandée)
    // (l’invariant bloquant est seulement : si renseignée, elle doit être valide)
    if (!baseUrl) {
      warnings.push({
        code: EC.PUBLISH_SEO_BASEURL_MISSING,
        path: ["seo", "baseUrl"],
      });
    }
  }

  return warnings;
}

/**
 * Invariants bloquants : `IdentitySettings` + `SeoSettings`.
 *
 * @remarks
 * - Injection `isProd` pour délier les validateurs du runtime (pas de `process.env` dans le domaine).
 */
export function assertPublishInvariantsOrThrowValidationError(input: {
  identity: unknown;
  seo: unknown;
  isProd: boolean;
}) {
  try {
    assertIdentitySettings(input.identity as IdentitySettings);
    assertSeoSettings(input.seo as SeoSettings, { isProd: input.isProd });
  } catch (e) {
    if (isDomainErrorLike(e)) {
      throw new DomainError({
        code: EC.VALIDATION_ERROR,
        message: e.code,
        details: {
          issues: [
            {
              code: e.code,
            },
          ],
        },
        cause: e,
      });
    }
    throw e;
  }
}
