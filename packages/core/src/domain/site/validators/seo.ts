/**
 * @file packages/core/src/domain/site/validators/seo.ts
 * @layer core/domain
 * @description
 * Validateur métier — invariants SEO bloquants requis pour la publication.
 *
 * @remarks
 * - Ne gère ni defaults, ni normalisation, ni warnings.
 * - Lève uniquement des erreurs métier bloquantes (`DomainError`).
 * - Utilisé notamment par le use-case `publishSite`.
 */

import { TITLE_PLACEHOLDER } from "@compoz/core/constants/seo/seo";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { SeoSettings } from "@compoz/core/domain/site/entities/seo";

/**
 * Vérifie les invariants SEO bloquants côté domaine.
 *
 * @throws DomainError
 * - `EC.SEO_TITLE_REQUIRED`
 * - `EC.SEO_TITLE_TEMPLATE_MISSING_PLACEHOLDER`
 * - `EC.SEO_BASEURL_INVALID`
 * - `EC.SEO_BASEURL_HTTPS_REQUIRED`
 */
export function assertSeoSettings(seo: SeoSettings): void {
  // Invariant : `defaultTitle` requis
  const defaultTitle = seo.defaultTitle?.trim() ?? "";
  if (defaultTitle.length === 0) {
    throw new DomainError({
      code: EC.SEO_TITLE_REQUIRED,
      message: EC.SEO_TITLE_REQUIRED,
      details: { path: ["seo", "defaultTitle"] },
    });
  }

  // Invariant : si `titleTemplate` est défini, il doit contenir `%s`
  const titleTemplate = (seo.titleTemplate ?? "").trim();
  if (titleTemplate && !titleTemplate.includes(TITLE_PLACEHOLDER)) {
    throw new DomainError({
      code: EC.SEO_TITLE_TEMPLATE_MISSING_PLACEHOLDER,
      message: EC.SEO_TITLE_TEMPLATE_MISSING_PLACEHOLDER,
      details: { path: ["seo", "titleTemplate"] },
    });
  }

  // Invariant : si `baseUrl` est défini (non vide), URL absolue valide (+ https en prod)
  const baseUrl = (seo.baseUrl ?? "").trim();

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

    const isProd = process.env.NODE_ENV === "production";
    if (isProd && u.protocol !== "https:") {
      throw new DomainError({
        code: EC.SEO_BASEURL_HTTPS_REQUIRED,
        message: EC.SEO_BASEURL_HTTPS_REQUIRED,
        details: { path: ["seo", "baseUrl"], value: baseUrl },
      });
    }
  }
}
