/**
 * @file src/core/domain/urls/href.ts
 * @layer core/domain
 * @description
 * Définit les types d’URLs brandées du domaine et les fonctions de dérivation associées.
 * Ce module se limite au typage et au branding Domain ; toute validation de format
 * ou de sécurité est supposée traitée en amont.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import {
  isAbsoluteHttpProtocol,
  isRelativeUrl,
} from "@compoz/core/domain/urls/guards";
import { isMailtoHref } from "@compoz/core/domain/urls/mailto";

/* -------------------------------------------------------------------------- */
/* Branding                                                                    */
/* -------------------------------------------------------------------------- */

type Brand<K extends string> = { readonly __brand: K };

type RelativeUrl = string & Brand<"RelativeUrl">;
type AbsoluteHttpUrl = string & Brand<"AbsoluteHttpUrl">;
type MailtoUrl = string & Brand<"MailtoUrl">;

export type AssetUrl = RelativeUrl | AbsoluteHttpUrl;
export type AssetUrlOrNull = AssetUrl | null;
export type BrandedHref = RelativeUrl | AbsoluteHttpUrl | MailtoUrl;

/* -------------------------------------------------------------------------- */
/* URL relatives                                                               */
/* -------------------------------------------------------------------------- */

export function rel(s: string): RelativeUrl {
  if (process.env.NODE_ENV !== "production") {
    if (!isRelativeUrl(s)) {
      throw new DomainError({
        code: EC.HREF_RELATIVE_INVALID,
        message: EC.HREF_RELATIVE_INVALID,
        details: { value: String(s) },
      });
    }
  }

  return s as RelativeUrl;
}

/* -------------------------------------------------------------------------- */
/* URL absolues                                                                */
/* -------------------------------------------------------------------------- */

export function abs(s: string): AbsoluteHttpUrl {
  if (process.env.NODE_ENV !== "production") {
    try {
      const u = new URL(s);

      if (!isAbsoluteHttpProtocol(u.protocol) || !u.hostname) {
        throw new DomainError({
          code: EC.HREF_ABSOLUTE_HTTP_INVALID,
          message: EC.HREF_ABSOLUTE_HTTP_INVALID,
          details: { value: String(s) },
        });
      }
    } catch (error) {
      throw new DomainError({
        code: EC.HREF_ABSOLUTE_HTTP_INVALID,
        message: EC.HREF_ABSOLUTE_HTTP_INVALID,
        details: { value: String(s) },
        cause: error,
      });
    }
  }

  return s as AbsoluteHttpUrl;
}

/* -------------------------------------------------------------------------- */
/* Mailto                                                                      */
/* -------------------------------------------------------------------------- */

function mail(s: string): MailtoUrl {
  if (process.env.NODE_ENV !== "production") {
    if (!isMailtoHref(s)) {
      throw new DomainError({
        code: EC.HREF_MAILTO_INVALID,
        message: EC.HREF_MAILTO_INVALID,
        details: { value: String(s) },
      });
    }
  }

  return s as MailtoUrl;
}

/* -------------------------------------------------------------------------- */
/* Branding automatique (strict)                                               */
/* -------------------------------------------------------------------------- */

export function asBrandedHref(s: string): BrandedHref {
  const i = s.indexOf(":");

  if (i > 0) {
    const proto = s.slice(0, i + 1).toLowerCase();
    if (proto === "http:" || proto === "https:") return abs(s);
    if (proto === "mailto:") return mail(s);
  }

  return rel(s);
}

/* -------------------------------------------------------------------------- */
/* Branding "safe" (tolérant, pour UI)                                         */
/* -------------------------------------------------------------------------- */

function brandHrefSafe(
  input: unknown,
  prev?: BrandedHref,
): BrandedHref | undefined {
  if (typeof input !== "string") return prev;

  const s = input.trim();
  if (!s) return prev;

  const i = s.indexOf(":");

  if (i > 0) {
    const proto = s.slice(0, i + 1).toLowerCase();

    if (proto === "mailto:") {
      return isMailtoHref(s) ? mail(s) : prev;
    }

    if (proto === "http:" || proto === "https:") {
      try {
        const u = new URL(s);
        if (isAbsoluteHttpProtocol(u.protocol) && u.hostname) {
          return abs(s);
        }
      } catch {
        // invalide -> fallback prev
      }
      return prev;
    }
  }

  return isRelativeUrl(s) ? rel(s) : prev;
}

/**
 * Version "safe" spécialisée pour les AssetUrl (interdit mailto).
 */
export function brandAssetUrlSafe(
  input: unknown,
  prev?: AssetUrl,
): AssetUrl | undefined {
  const v = brandHrefSafe(input, prev);
  if (!v) return prev;

  // Si mailto -> on refuse pour AssetUrl
  return isMailHref(v) ? prev : v;
}

/* -------------------------------------------------------------------------- */
/* Helpers de discrimination                                                   */
/* -------------------------------------------------------------------------- */

function isMailHref(href: BrandedHref): href is MailtoUrl {
  return href.startsWith("mailto:");
}

export function isAbsoluteAssetUrl(u: AssetUrl): u is AbsoluteHttpUrl {
  return u.startsWith("http://") || u.startsWith("https://");
}

export function isRelativeAssetUrl(u: AssetUrl): u is RelativeUrl {
  return u.startsWith("/");
}
