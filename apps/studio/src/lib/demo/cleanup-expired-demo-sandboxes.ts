/**
 * @file apps/studio/src/lib/demo/cleanup-expired-demo-sandboxes.ts
 * @layer studio/lib/demo
 *
 * @description
 * Composition serveur du cleanup des sandboxes démo expirées.
 *
 * @remarks
 * - Branche les dépendances infra nécessaires au use-case
 *   `cleanupExpiredDemoSandboxes`.
 * - Point d’entrée serveur réutilisable par une future route API
 *   ou une tâche cron Vercel.
 * - La démo peut encore nettoyer des données KV associées aux sandboxes,
 *   mais l’orchestration ne doit plus exposer de vocabulaire tenant générique.
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
