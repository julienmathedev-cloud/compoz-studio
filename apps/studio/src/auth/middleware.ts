/**
 * @file apps/studio/src/auth/middleware.ts
 * @layer studio/auth
 *
 * @description
 * Studio authentication middleware for NextAuth v4.
 *
 * @remarks
 * - Protects Studio routes by default.
 * - Allows public auth, demo bootstrap, sign-in, and static asset routes.
 * - API routes outside `/api/auth` return JSON 401 instead of redirecting,
 *   so client handlers do not receive redirect HTML.
 */

import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function getLocaleFromPathname(pathname: string): string | null {
  const match = /^\/([a-z]{2})(\/|$)/.exec(pathname);
  return match?.[1] ?? null;
}

function isPublicPath(pathname: string): boolean {
  // NextAuth endpoints.
  if (pathname.startsWith("/api/auth")) return true;

  // Demo bootstrap endpoints.
  if (pathname === "/api/demo/start") return true;
  if (pathname === "/demo/start") return true;

  // Next static assets.
  if (pathname.startsWith("/_next")) return true;
  if (pathname === "/favicon.ico") return true;

  // Localized sign-in route.
  if (/^\/[a-z]{2}\/signin(\/|$)/.test(pathname)) return true;

  if (pathname === "/robots.txt") return true;
  if (pathname === "/sitemap.xml") return true;
  if (pathname === "/manifest.webmanifest") return true;

  return false;
}

export default async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (isPublicPath(pathname)) return NextResponse.next();

  const token = await getToken({
    req,
    // Must match the value used by authOptions.secret.
    secret: process.env["AUTH_SECRET"],
  });

  if (!token) {
    // API routes return JSON instead of redirect HTML.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = req.nextUrl.clone();
    const locale = getLocaleFromPathname(pathname) ?? "fr";

    url.pathname = `/${locale}/signin`;

    url.searchParams.set("next", `${pathname}${search}`);

    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
