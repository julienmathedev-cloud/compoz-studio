/**
 * @file apps/studio/src/app/api/auth/reset-stale-session/route.ts
 * @layer studio/app/api
 * @description Clears stale Studio/Auth cookies and redirects to localized signin.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  ACTIVE_WEBSITE_COOKIE,
  LEGACY_ACTIVE_TENANT_COOKIE,
  NEXTAUTH_STUDIO_COOKIES,
} from "@compoz/studio/auth/session-cookies";
import { routing } from "@compoz/studio/i18n/routing";

type Locale = (typeof routing.locales)[number];

function isLocale(value: string): value is Locale {
  return routing.locales.includes(value as Locale);
}

function localeFromPathname(pathname: string): Locale | null {
  const maybeLocale = pathname.split("/").filter(Boolean)[0] ?? "";

  return isLocale(maybeLocale) ? maybeLocale : null;
}

function localeFromReferer(request: NextRequest): Locale {
  const referer = request.headers.get("referer");

  if (!referer) {
    return routing.defaultLocale;
  }

  try {
    const url = new URL(referer);
    return localeFromPathname(url.pathname) ?? routing.defaultLocale;
  } catch {
    return routing.defaultLocale;
  }
}

function collectAuthCookieNames(request: NextRequest): string[] {
  const baseNames = new Set<string>(NEXTAUTH_STUDIO_COOKIES);

  for (const cookie of request.cookies.getAll()) {
    for (const baseName of NEXTAUTH_STUDIO_COOKIES) {
      if (cookie.name.startsWith(`${baseName}.`)) {
        baseNames.add(cookie.name);
      }
    }
  }

  return [...baseNames];
}

function deleteCookie(response: NextResponse, name: string): void {
  response.cookies.delete({
    name,
    path: "/",
  });
}

export function GET(request: NextRequest) {
  const locale = localeFromReferer(request);
  const url = new URL(`/${locale}/signin`, request.url);
  url.searchParams.set("error", "stale-session");

  const response = NextResponse.redirect(url);

  deleteCookie(response, ACTIVE_WEBSITE_COOKIE);
  deleteCookie(response, LEGACY_ACTIVE_TENANT_COOKIE);

  for (const cookieName of collectAuthCookieNames(request)) {
    deleteCookie(response, cookieName);
  }

  return response;
}
