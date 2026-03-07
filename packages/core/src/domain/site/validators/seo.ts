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
 * Options d'exécution pour la validation.
 *
 * @remarks
 * - Injection `isProd` : le domaine ne dépend pas de `process.env`.
 * - En prod, on exige `https:` si `baseUrl` est renseignée.
 */
export type AssertSeoSettingsOptions = Readonly<{
  /** Indique si l'environnement courant doit appliquer les contraintes "prod". */
  isProd: boolean;
}>;

/**
 * Vérifie les invariants SEO bloquants côté domaine.
 *
 * @remarks
 * - `baseUrl` est optionnelle (warning si absente géré ailleurs).
 * - Si `baseUrl` est renseignée : doit être une URL absolue valide.
 * - En prod (`opts.isProd=true`) : si `baseUrl` est renseignée, elle doit être en HTTPS.
 *
 * @throws DomainError
 * - `EC.SEO_TITLE_REQUIRED`
 * - `EC.SEO_TITLE_TEMPLATE_MISSING_PLACEHOLDER`
 * - `EC.SEO_BASEURL_INVALID`
 * - `EC.SEO_BASEURL_HTTPS_REQUIRED`
 */
export function assertSeoSettings(
  seo: SeoSettings,
  opts: AssertSeoSettingsOptions = { isProd: false },
): void {
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

  // Invariant : si `baseUrl` est définie (non vide), URL absolue valide
  // (+ https en prod selon `opts.isProd`)
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

    if (opts.isProd && u.protocol !== "https:") {
      throw new DomainError({
        code: EC.SEO_BASEURL_HTTPS_REQUIRED,
        message: EC.SEO_BASEURL_HTTPS_REQUIRED,
        details: { path: ["seo", "baseUrl"], value: baseUrl },
      });
    }
  }
}
