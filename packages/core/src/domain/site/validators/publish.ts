/**
 * @file packages/core/src/domain/site/validators/publish.ts
 * @layer core/domain/site/validators
 * @description Publication warnings and blocking publish invariants.
 * @remarks
 * Warnings are non-blocking; blocking validation errors are wrapped for UI consumption.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import {
  DomainError,
  isDomainErrorLike,
} from "@compoz/core/domain/errors/domain-error";
import type { UiWarning } from "@compoz/core/domain/errors/issue.types";
import type { Page } from "@compoz/core/domain/pages/entities/page";
import { getPageH1FromBlocks } from "@compoz/core/domain/pages/seo/get-page-h1";
import type {
  IdentitySettings,
  SeoSettings,
} from "@compoz/core/domain/site/entities";
import type { SiteIndex } from "@compoz/core/domain/site/entities/site-index";
import type { SiteSettings } from "@compoz/core/domain/site/entities/site-settings";
import { assertIdentitySettings } from "@compoz/core/domain/site/validators/identity";
import { assertSeoSettings } from "@compoz/core/domain/site/validators/seo";
import { HOME_SLUG } from "@compoz/core/domain/slug/constants";

export type PublishWarningCode =
  | typeof EC.PUBLISH_EMPTY_INDEX
  | typeof EC.PUBLISH_SETTINGS_COPY_FAILED
  | typeof EC.PUBLISH_PAGE_MISSING
  | typeof EC.PUBLISH_PAGE_DELETE_FAILED
  | typeof EC.PUBLISH_PAGE_H1_MISSING
  | typeof EC.PUBLISH_HOME_MISSING
  | typeof EC.PUBLISH_PRIMARY_MENU_EMPTY
  | typeof EC.PUBLISH_LEGAL_MENU_EMPTY
  | typeof EC.PUBLISH_SOCIAL_EMPTY
  | typeof EC.PUBLISH_IDENTITY_LOGO_MISSING
  | typeof EC.PUBLISH_IDENTITY_FAVICON_MISSING
  | typeof EC.PUBLISH_SEO_OG_IMAGE_MISSING
  | typeof EC.PUBLISH_SEO_ROBOTS_NOINDEX
  | typeof EC.PUBLISH_SEO_BASEURL_MISSING;

export type PublishWarning = UiWarning<PublishWarningCode>;

/** Returns index and settings warnings that do not block publication. */
export function publishWarnings(
  index: SiteIndex,
  settings?: Pick<
    SiteSettings,
    "identity" | "seo" | "primaryMenu" | "legalMenu" | "social"
  >,
): ReadonlyArray<PublishWarning> {
  const warnings: PublishWarning[] = [];

  if (index.pages.length === 0) {
    warnings.push({ code: EC.PUBLISH_EMPTY_INDEX, path: ["pages"] });
  }

  const hasHome = index.pages.some((p) => p.slug === HOME_SLUG);
  if (!hasHome) {
    warnings.push({ code: EC.PUBLISH_HOME_MISSING, path: ["pages", "home"] });
  }

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

    const hasLogo =
      settings.identity?.logo !== null &&
      settings.identity?.logo !== undefined &&
      settings.identity.logo.src.trim().length > 0;

    const faviconUrl = (settings.identity?.faviconUrl ?? "").trim();

    if (!hasLogo) {
      warnings.push({
        code: EC.PUBLISH_IDENTITY_LOGO_MISSING,
        path: ["identity", "logo"],
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
    if (!baseUrl) {
      warnings.push({
        code: EC.PUBLISH_SEO_BASEURL_MISSING,
        path: ["seo", "baseUrl"],
      });
    }
  }

  return warnings;
}

/** Returns page-content warnings for pages actually considered for publication. */
export function publishPageWarnings(
  index: SiteIndex,
  pagesById: ReadonlyMap<string, Page>,
): ReadonlyArray<PublishWarning> {
  const warnings: PublishWarning[] = [];

  for (const ref of index.pages) {
    const page = pagesById.get(ref.id);

    if (!page) {
      warnings.push({
        code: EC.PUBLISH_PAGE_MISSING,
        path: ["pages", ref.id],
        meta: { pageId: ref.id, slug: ref.slug },
      });
      continue;
    }

    const h1 = getPageH1FromBlocks(page.blocks);
    if (!h1) {
      warnings.push({
        code: EC.PUBLISH_PAGE_H1_MISSING,
        path: ["pages", page.id, "blocks"],
        meta: { pageId: page.id, slug: page.slug },
      });
    }
  }

  return warnings;
}

/** Wraps blocking identity and SEO invariant failures into a validation error. */
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
