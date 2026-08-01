/**
 * @file packages/core/src/domain/demo/assert-demo-sandbox-website-identity.ts
 * @layer core/domain/demo
 * @description Canonical identity guard for a demo sandbox Website.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";

export function assertDemoSandboxWebsiteIdentity(args: {
  demoInstanceId: unknown;
  websiteId: unknown;
}): Readonly<{ demoInstanceId: string; websiteId: string }> {
  const demoInstanceId = String(args.demoInstanceId ?? "").trim();
  const websiteId = String(args.websiteId ?? "")
    .trim()
    .toLowerCase();

  if (!demoInstanceId) {
    throw new DomainError({
      code: EC.INVALID_ARGUMENT,
      message: EC.INVALID_ARGUMENT,
      details: { path: ["demoInstanceId"] },
    });
  }

  const expectedWebsiteId = `demo-${demoInstanceId}`;

  if (websiteId !== expectedWebsiteId) {
    throw new DomainError({
      code: EC.INVALID_ARGUMENT,
      message: EC.INVALID_ARGUMENT,
      details: {
        path: ["websiteId"],
        meta: {
          demoInstanceId,
          websiteId,
          expectedWebsiteId,
          reason: "DEMO_WEBSITE_IDENTITY_MISMATCH",
        },
      },
    });
  }

  return { demoInstanceId, websiteId };
}
