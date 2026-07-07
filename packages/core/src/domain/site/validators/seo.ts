/**
 * @file packages/core/src/domain/site/validators/seo.ts
 * @layer core/domain/site/validators
 * @description Blocking domain invariants for SEO settings.
 * @remarks
 * This validator does not apply defaults, normalization, or non-blocking warnings.
 */

import { TITLE_PLACEHOLDER } from "@compoz/core/constants/seo/seo";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { SeoSettings } from "@compoz/core/domain/site/entities/seo";

/** Runtime options injected by the application layer. */
export type AssertSeoSettingsOptions = Readonly<{
  isProd: boolean;
}>;

export function assertSeoSettings(
  seo: SeoSettings,
  opts: AssertSeoSettingsOptions = { isProd: false },
): void {
  const defaultTitle = seo.defaultTitle !== null ? seo.defaultTitle.trim() : "";
  if (defaultTitle.length === 0) {
    throw new DomainError({
      code: EC.SEO_TITLE_REQUIRED,
      message: EC.SEO_TITLE_REQUIRED,
      details: { path: ["seo", "defaultTitle"] },
    });
  }

  const titleTemplate =
    seo.titleTemplate !== null ? seo.titleTemplate.trim() : "";

  if (titleTemplate && !titleTemplate.includes(TITLE_PLACEHOLDER)) {
    throw new DomainError({
      code: EC.SEO_TITLE_TEMPLATE_MISSING_PLACEHOLDER,
      message: EC.SEO_TITLE_TEMPLATE_MISSING_PLACEHOLDER,
      details: { path: ["seo", "titleTemplate"] },
    });
  }

  const baseUrl = seo.baseUrl !== null ? seo.baseUrl.trim() : "";

  if (baseUrl) {
    let u: URL;
    try {
      u = new URL(baseUrl);
    } catch {
      throw new DomainError({
        code: EC.SEO_BASEURL_INVALID,
        message: EC.SEO_BASEURL_INVALID,
        details: { path: ["seo", "baseUrl"], value: baseUrl },
      });
    }

    if (opts.isProd && u.protocol !== "https:") {
      throw new DomainError({
        code: EC.SEO_BASEURL_HTTPS_REQUIRED,
        message: EC.SEO_BASEURL_HTTPS_REQUIRED,
        details: { path: ["seo", "baseUrl"], value: baseUrl },
      });
    }
  }
}
