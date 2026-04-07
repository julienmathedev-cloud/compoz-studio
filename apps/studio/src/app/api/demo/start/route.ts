/**
 * @file apps/studio/src/app/api/demo/start/route.ts
 * @layer studio/app/api
 *
 * @description
 * Route publique de démarrage d'une sandbox démo.
 *
 * @remarks
 * - Lit le cookie `compoz_demo_instance` si présent.
 * - Tente de réutiliser une sandbox existante, sinon en crée une nouvelle.
 * - Ouvre ensuite une vraie session NextAuth via le provider Credentials.
 * - Repose le cookie `compoz_demo_instance`.
 * - Redirige enfin vers le Studio.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { DEMO_INSTANCE_COOKIE_NAME } from "@compoz/core/constants/demo/demo";
import { buildDemoUserPassword } from "@compoz/studio/auth/demo-auth";
import { runStartDemoSandbox } from "@compoz/studio/lib/demo/start-demo-sandbox";

export const runtime = "nodejs";

function normalizeInternalNextPath(value: string | null): string {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return "/";
  }

  if (!raw.startsWith("/") || raw.startsWith("//")) {
    return "/";
  }

  return raw;
}

function extractCookiePairs(setCookieHeaders: string[]): string {
  return setCookieHeaders
    .map((value) => value.split(";", 1)[0]?.trim() ?? "")
    .filter(Boolean)
    .join("; ");
}

function appendSetCookieHeaders(
  response: NextResponse,
  setCookieHeaders: string[],
): void {
  for (const value of setCookieHeaders) {
    response.headers.append("set-cookie", value);
  }
}

function buildDemoInstanceCookie(args: {
  demoInstanceId: string;
  expiresAt: string;
  secure: boolean;
}): string {
  const expires = new Date(args.expiresAt).toUTCString();

  return [
    `${DEMO_INSTANCE_COOKIE_NAME}=${encodeURIComponent(args.demoInstanceId)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Expires=${expires}`,
    args.secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

async function fetchCsrfToken(origin: string) {
  const res = await fetch(`${origin}/api/auth/csrf`, {
    method: "GET",
    redirect: "manual",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch CSRF token (${res.status}).`);
  }

  const body = (await res.json()) as { csrfToken?: string };
  const csrfToken = String(body?.csrfToken ?? "").trim();

  if (!csrfToken) {
    throw new Error("Missing csrfToken from /api/auth/csrf.");
  }

  const csrfCookies =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : [];

  return { csrfToken, csrfCookies };
}

async function signInDemoUser(args: {
  origin: string;
  email: string;
  password: string;
  callbackUrl: string;
  csrfToken: string;
  csrfCookies: string[];
  incomingCookieHeader: string;
}) {
  const cookieParts = [
    args.incomingCookieHeader.trim(),
    extractCookiePairs(args.csrfCookies),
  ].filter(Boolean);

  const body = new URLSearchParams({
    email: args.email,
    password: args.password,
    csrfToken: args.csrfToken,
    callbackUrl: args.callbackUrl,
  });

  const res = await fetch(`${args.origin}/api/auth/callback/credentials`, {
    method: "POST",
    redirect: "manual",
    cache: "no-store",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: cookieParts.join("; "),
    },
    body,
  });

  const authCookies =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : [];

  if (authCookies.length === 0) {
    const location = res.headers.get("location") ?? "";
    throw new Error(
      `Credentials callback did not return session cookies (status=${res.status}, location=${location}).`,
    );
  }

  return { authCookies };
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const origin = url.origin;

  const nextPath = normalizeInternalNextPath(url.searchParams.get("next"));

  const existingDemoInstanceId =
    req.cookies.get(DEMO_INSTANCE_COOKIE_NAME)?.value ?? undefined;

  const started = await runStartDemoSandbox({
    demoInstanceId: existingDemoInstanceId,
  });

  const password = buildDemoUserPassword(started.demoInstanceId);

  const { csrfToken, csrfCookies } = await fetchCsrfToken(origin);

  const { authCookies } = await signInDemoUser({
    origin,
    email: started.user.email,
    password,
    callbackUrl: nextPath,
    csrfToken,
    csrfCookies,
    incomingCookieHeader: req.headers.get("cookie") ?? "",
  });

  const response = NextResponse.redirect(new URL(nextPath, origin));

  appendSetCookieHeaders(response, authCookies);
  response.headers.append(
    "set-cookie",
    buildDemoInstanceCookie({
      demoInstanceId: started.demoInstanceId,
      expiresAt: started.expiresAt,
      secure: url.protocol === "https:",
    }),
  );

  return response;
}
