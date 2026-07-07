/**
 * @file apps/studio/src/lib/demo/cleanup-expired-demo-sandboxes.ts
 * @layer studio/lib/demo
 *
 * @description
 * Server composition for cleaning up expired demo sandboxes.
 *
 * @remarks
 * - Wires the infrastructure dependencies required by the `cleanupExpiredDemoSandboxes` use case.
 * - Provides a reusable server entry point for a future API route or Vercel cron job.
 * - Demo cleanup may still remove KV data linked to sandboxes, but this orchestration should no longer expose generic tenant wording.
 */

import "server-only";

import { cleanupExpiredDemoSandboxes } from "@compoz/core/domain/demo/use-cases/cleanup-expired-demo-sandboxes";

import { KvDemoSandboxDataCleaner } from "@compoz/infra/demo/kv-demo-sandbox-data-cleaner";
import { KvDemoSandboxRepository } from "@compoz/infra/demo/kv-demo-sandbox-repository";
import { KvUsersRepository } from "@compoz/infra/users/kv-users-repository";

type RunCleanupExpiredDemoSandboxesInput = Readonly<{
  continueOnError?: boolean;
}>;

export async function runCleanupExpiredDemoSandboxes(
  input: RunCleanupExpiredDemoSandboxesInput = {},
) {
  const demoSandboxes = new KvDemoSandboxRepository();
  const users = new KvUsersRepository();
  const sandboxDataCleaner = new KvDemoSandboxDataCleaner();

  const run = cleanupExpiredDemoSandboxes({
    demoSandboxes,
    users,
    sandboxDataCleaner,
  });

  return run({
    continueOnError: input.continueOnError,
  });
}
