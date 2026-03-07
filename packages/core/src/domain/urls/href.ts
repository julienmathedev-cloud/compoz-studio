/**
 * @file src/core/domain/urls/href.ts
 * @layer core/domain
 * @description
 * Définit les types d’URLs brandées du domaine et les fonctions de dérivation associées.
 * Ce module se limite au typage et au branding Domain ; toute validation de format
 * ou de sécurité est supposée traitée en amont.
 *
 * @remarks
 * - Runtime injecté : aucune dépendance à `process.env` dans ce module.
 * - En prod, on évite les assertions coûteuses (on suppose les entrées déjà validées en amont).
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import {
  isAbsoluteHttpProtocol,
  isRelativeUrl,
} from "@compoz/core/domain/urls/guards";
import { isMailtoHref } from "@compoz/core/domain/urls/mailto";

/* -------------------------------------------------------------------------- */
/* Runtime                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Options runtime pour contrôler les assertions "dev".
 *
 * @remarks
 * - `isProd=true` => pas d'assertions (supposé validé par schemas/validators).
 * - `isProd=false` => assertions strictes pour détecter les erreurs tôt.
 */
export type UrlRuntime = Readonly<{
  isProd: boolean;
}>;

/** Runtime par défaut (dev-friendly). À overrider via `setUrlRuntime`. */
let _runtime: UrlRuntime = { isProd: false };

/**
 * Configure le runtime du module (à appeler au boot côté infra/app).
 *
 * @example
 * setUrlRuntime({ isProd: runtime.isProd })
 */
export function setUrlRuntime(next: UrlRuntime): void {
  _runtime = next;
}

/** Lecture interne du runtime (encapsulé pour centraliser la règle). */
function isProd(): boolean {
  return _runtime.isProd;
}

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
  if (!isProd()) {
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
  if (!isProd()) {
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
  if (!isProd()) {
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

function isHttpAbsoluteUrl(s: string): boolean {
  const v = s.trim().toLowerCase();
  return v.startsWith("http://") || v.startsWith("https://");
}

/**
 * Convertit une string **déjà validée** en `AssetUrl`.
 * - http(s) => abs()
 * - sinon   => rel()
 */
export function asAssetUrl(input: string): AssetUrl {
  const s = input.trim();
  return isHttpAbsoluteUrl(s) ? abs(s) : rel(s);
}

/**
 * Variante tolérante (optionnels) :
 * - null/undefined/"" => null
 * - sinon => asAssetUrl
 */
export function asAssetUrlOrNull(
  input: string | null | undefined,
): AssetUrlOrNull {
  if (input == null) return null;
  const s = input.trim();
  if (s === "") return null;
  return isHttpAbsoluteUrl(s) ? abs(s) : rel(s);
}
