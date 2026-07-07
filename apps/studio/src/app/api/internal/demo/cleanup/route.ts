/**
 * @file apps/studio/src/app/api/internal/demo/cleanup/route.ts
 * @layer studio/app/api
 *
 * @description
 * Internal route that cleans up expired demo sandboxes.
 *
 * @remarks
 * - Designed to be called manually or by a Vercel cron job.
 * - Protected by a dedicated HTTP secret.
 * - Cleans up sandbox records, demo users, and KV data associated with
 *   expired sandboxes.
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
