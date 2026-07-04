/**
 * @file apps/studio/src/lib/demo/start-demo-sandbox.ts
 * @layer studio/lib/demo
 *
 * @description
 * Composition serveur du démarrage de sandbox démo.
 *
 * @remarks
 * - Branche les dépendances infra + auth nécessaires au use-case
 *   `startDemoSandbox`.
 * - Point d’entrée serveur réutilisable par la future route `/demo/start`.
 * - Ne gère pas encore les cookies HTTP, la session NextAuth
 *   ni la redirection finale.
 * - La sandbox démo est créée depuis un Website seed explicite.
 */

import "server-only";

import {
  DEMO_SANDBOX_TTL_MS,
  DEMO_SEED_WEBSITE_ID,
} from "@compoz/core/constants/demo/demo";
import { createDemoSandboxFromSeed } from "@compoz/core/domain/demo/use-cases/create-demo-sandbox-from-seed";
import { findReusableDemoSandbox } from "@compoz/core/domain/demo/use-cases/find-reusable-demo-sandbox";
import { registerDemoSandbox } from "@compoz/core/domain/demo/use-cases/register-demo-sandbox";
import { startDemoSandbox } from "@compoz/core/domain/demo/use-cases/start-demo-sandbox";

import { KvDemoSandboxCloner } from "@compoz/infra/demo/kv-demo-sandbox-cloner";
import { KvDemoSandboxRepository } from "@compoz/infra/demo/kv-demo-sandbox-repository";
import { KvDemoSeedReader } from "@compoz/infra/demo/kv-demo-seed-reader";
import { KvUsersRepository } from "@compoz/infra/users/kv-users-repository";

import { createUuidV7IdGenerator } from "@compoz/infra/id/uuidv7";
import { buildDemoUserPassword } from "@compoz/studio/auth/demo-auth";

type RunStartDemoSandboxInput = Readonly<{
  demoInstanceId?: string;
}>;

export async function runStartDemoSandbox({
  demoInstanceId,
}: RunStartDemoSandboxInput) {
  const users = new KvUsersRepository();
  const demoSandboxes = new KvDemoSandboxRepository();
  const seedReader = new KvDemoSeedReader();
  const sandboxCloner = new KvDemoSandboxCloner();

  const createSandbox = createDemoSandboxFromSeed({
    users,
    idGenerator: createUuidV7IdGenerator(),
    seedReader,
    sandboxCloner,
    passwordBuilder: {
      buildDemoUserPassword,
    },
  });

  const findReusableSandbox = findReusableDemoSandbox({
    demoSandboxes,
    users,
  });

  const registerSandbox = registerDemoSandbox({
    demoSandboxes,
  });

  const run = startDemoSandbox({
    findReusableDemoSandbox: findReusableSandbox,
    createDemoSandboxFromSeed: createSandbox,
    registerDemoSandbox: registerSandbox,
    ttlMs: DEMO_SANDBOX_TTL_MS,
  });

  return run({
    seedWebsiteId: DEMO_SEED_WEBSITE_ID,
    demoInstanceId,
  });
}
