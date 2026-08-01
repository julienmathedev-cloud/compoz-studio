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
 * - Cleans up sandbox websites, demo users, and related Prisma records for
 *   expired sandboxes.
 */

import "server-only";

import { NextResponse } from "next/server";

import { log } from "@compoz/infra/lib/log";
import { isAuthorizedCronRequest } from "@compoz/studio/app/api/internal/demo/cleanup/cron-auth";
import { runCleanupExpiredDemoSandboxes } from "@compoz/studio/lib/demo/cleanup-expired-demo-sandboxes";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isAuthorizedCronRequest(req)) {
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

  for (const item of result.items) {
    if (item.status === "failed") {
      log.error("demo.sandbox.cleanup.failed", {
        demoInstanceId: item.demoInstanceId,
        websiteId: item.websiteId,
        userId: item.userId,
        errorName: item.error?.split(":")[0] || "Error",
      });
    }
  }

  return NextResponse.json(
    {
      ok: result.failed === 0,
      cleanup: {
        total: result.total,
        expired: result.expired,
        cleaned: result.cleaned,
        failed: result.failed,
      },
    },
    { status: result.failed > 0 ? 503 : 200 },
  );
}
