/**
 * @file apps/studio/src/app/api/internal/demo/cleanup/route.ts
 * @layer studio/app/api
 * @description
 * Route interne de cleanup des sandboxes démo expirées.
 *
 * @remarks
 * - Destinée à être appelée manuellement ou par un cron Vercel.
 * - Protégée par un secret HTTP dédié.
 * - Déclenche le cleanup des records sandbox, users démo et données tenant associées.
 */

import "server-only";

import { NextResponse } from "next/server";

import { runCleanupExpiredDemoSandboxes } from "@compoz/studio/lib/demo/cleanup-expired-demo-sandboxes";

export const runtime = "nodejs";

const CRON_SECRET_HEADER = "x-cron-secret" as const;

function getCronSecret(): string {
  const secret = String(process.env["COMPOZ_CRON_SECRET"] ?? "").trim();

  if (!secret) {
    throw new Error("Missing COMPOZ_CRON_SECRET.");
  }

  return secret;
}

function isAuthorized(req: Request): boolean {
  const expectedSecret = getCronSecret();
  const receivedSecret = String(
    req.headers.get(CRON_SECRET_HEADER) ?? "",
  ).trim();

  return Boolean(receivedSecret) && receivedSecret === expectedSecret;
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "UNAUTHORIZED",
        },
      },
      { status: 401 },
    );
  }

  const result = await runCleanupExpiredDemoSandboxes({
    continueOnError: true,
  });

  return NextResponse.json({
    ok: true,
    cleanup: result,
  });
}
