/**
 * @file apps/studio/src/middleware.ts
 * @layer app/middleware
 * @description
 * Middleware d’authentification Studio (NextAuth v4) :
 * - Protège toutes les routes du Studio
 * - Laisse passer :
 *   - /api/auth/*
 *   - /[locale]/signin
 *   - assets Next (_next, favicon, etc.)
 *
 * Notes:
 * - Pour les routes API (hors /api/auth), on renvoie 401 JSON (pas de redirect)
 *   sinon le client reçoit un HTML de redirection et ça casse les handlers.
 */

import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getLocaleFromPathname(pathname: string): string | null {
  const match = /^\/([a-z]{2})(\/|$)/.exec(pathname);
  return match?.[1] ?? null;
}

function isPublicPath(pathname: string): boolean {
  // NextAuth endpoints
  if (pathname.startsWith("/api/auth")) return true;

  // Next static/assets
  if (pathname.startsWith("/_next")) return true;
  if (pathname === "/favicon.ico") return true;

  // Signin localisé
  if (/^\/[a-z]{2}\/signin(\/|$)/.test(pathname)) return true;

  // Optionnels (si tu les utilises côté Studio)
  if (pathname === "/robots.txt") return true;
  if (pathname === "/sitemap.xml") return true;
  if (pathname === "/manifest.webmanifest") return true;

  return false;
}

/* -------------------------------------------------------------------------- */
/* Middleware                                                                 */
/* -------------------------------------------------------------------------- */

export default async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (isPublicPath(pathname)) return NextResponse.next();

  const token = await getToken({
    req,
    // ✅ doit matcher la valeur utilisée dans ton authOptions.secret
    secret: process.env["AUTH_SECRET"],
  });

  // ✅ Pas de session
  if (!token) {
    // API => 401 JSON (pas de redirect)
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Pages => redirect vers signin localisé
    const url = req.nextUrl.clone();
    const locale = getLocaleFromPathname(pathname) ?? "fr";

    url.pathname = `/${locale}/signin`;

    // ✅ conserve aussi la querystring
    url.searchParams.set("next", `${pathname}${search}`);

    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
