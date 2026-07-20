/**
 * @file apps/studio/src/lib/demo/cleanup-expired-demo-sandboxes.ts
 * @layer studio/lib/demo
 *
 * @description
 * Server composition for cleaning up expired demo sandboxes.
 *
 * @remarks
 * - Wires the infrastructure dependencies required by the `cleanupExpiredDemoSandboxes` use case.
 * - Provides the server entry point used by the internal cleanup API route, which can be called manually or by a Vercel cron job.
 * - Deletes Prisma sandbox websites and relies on database cascades for their related records.
 */

import "server-only";

import { cleanupExpiredDemoSandboxes } from "@compoz/core/domain/demo/use-cases/cleanup-expired-demo-sandboxes";

import { PrismaDemoSandboxDataCleaner } from "@compoz/infra/demo/prisma-demo-sandbox-data-cleaner";
import { PrismaDemoSandboxRepository } from "@compoz/infra/demo/prisma-demo-sandbox-repository";
import { getUsersRepository } from "@compoz/infra/users";

type RunCleanupExpiredDemoSandboxesInput = Readonly<{
  continueOnError?: boolean;
}>;

export async function runCleanupExpiredDemoSandboxes(
  input: RunCleanupExpiredDemoSandboxesInput = {},
) {
  const demoSandboxes = new PrismaDemoSandboxRepository();
  const users = getUsersRepository();
  const sandboxDataCleaner = new PrismaDemoSandboxDataCleaner();

  const cleanupSandboxes = cleanupExpiredDemoSandboxes({
    demoSandboxes,
    users,
    sandboxDataCleaner,
  });

  return cleanupSandboxes({
    continueOnError: input.continueOnError,
  });
}
