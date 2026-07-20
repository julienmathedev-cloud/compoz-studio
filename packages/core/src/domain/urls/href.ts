/**
 * @file packages/core/src/domain/urls/href.ts
 * @layer core/domain/urls
 * @description Branded URL types and derivation helpers for domain boundaries.
 * @remarks
 * Format and security validation are expected upstream; dev assertions can still catch invalid branding inputs.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import {
  isAbsoluteHttpProtocol,
  isHashAnchor,
  isRelativeUrl,
} from "@compoz/core/domain/urls/guards";
import { isMailtoHref } from "@compoz/core/domain/urls/mailto";

export type UrlRuntime = Readonly<{
  isProd: boolean;
}>;

let _runtime: UrlRuntime = { isProd: false };

function isProd(): boolean {
  return _runtime.isProd;
}

type Brand<K extends string> = { readonly __brand: K };

type RelativeUrl = string & Brand<"RelativeUrl">;
type AbsoluteHttpUrl = string & Brand<"AbsoluteHttpUrl">;
type HashAnchorUrl = string & Brand<"HashAnchorUrl">;
type MailtoUrl = string & Brand<"MailtoUrl">;

export type AssetUrl = RelativeUrl | AbsoluteHttpUrl | HashAnchorUrl;
export type AssetUrlOrNull = AssetUrl | null;
export type BrandedHref =
  | RelativeUrl
  | AbsoluteHttpUrl
  | HashAnchorUrl
  | MailtoUrl;

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

export function anchor(s: string): HashAnchorUrl {
  if (!isProd()) {
    if (!isHashAnchor(s)) {
      throw new DomainError({
        code: EC.HREF_RELATIVE_INVALID,
        message: EC.HREF_RELATIVE_INVALID,
        details: { value: String(s) },
      });
    }
  }

  return s as HashAnchorUrl;
}

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

export function asBrandedHref(s: string): BrandedHref {
  const trimmed = s.trim();

  if (isHashAnchor(trimmed)) return anchor(trimmed);

  const i = trimmed.indexOf(":");

  if (i > 0) {
    const proto = trimmed.slice(0, i + 1).toLowerCase();
    if (proto === "http:" || proto === "https:") return abs(trimmed);
    if (proto === "mailto:") return mail(trimmed);
  }

  return rel(trimmed);
}

function isHttpAbsoluteUrl(s: string): boolean {
  const v = s.trim().toLowerCase();
  return v.startsWith("http://") || v.startsWith("https://");
}

export function asAssetUrl(input: string): AssetUrl {
  const s = input.trim();

  if (isHttpAbsoluteUrl(s)) return abs(s);
  if (isHashAnchor(s)) return anchor(s);

  return rel(s);
}

export function asAssetUrlOrNull(
  input: string | null | undefined,
): AssetUrlOrNull {
  if (input == null) return null;
  const s = input.trim();
  if (s === "") return null;
  return asAssetUrl(s);
}
