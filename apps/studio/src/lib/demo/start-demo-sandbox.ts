/**
 * @file apps/studio/src/lib/demo/start-demo-sandbox.ts
 * @layer studio/lib/demo
 *
 * @description
 * Server composition for starting a demo sandbox.
 *
 * @remarks
 * - Wires the infrastructure, auth, seed reader, and cloner dependencies required by `startDemoSandbox`.
 * - Provides the reusable server entry point for the future `/demo/start` route.
 * - Does not handle HTTP cookies, the NextAuth session, or the final redirect yet.
 * - The demo sandbox is cloned from an explicit Website seed.
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

import { PrismaDemoSandboxCloner } from "@compoz/infra/demo/prisma-demo-sandbox-cloner";
import { PrismaDemoSandboxRepository } from "@compoz/infra/demo/prisma-demo-sandbox-repository";
import { PrismaDemoSeedReader } from "@compoz/infra/demo/prisma-demo-seed-reader";
import { createUuidV7IdGenerator } from "@compoz/infra/id/uuidv7";
import { getUsersRepository } from "@compoz/infra/users";
import { buildDemoUserPassword } from "@compoz/studio/auth/demo-auth";

type RunStartDemoSandboxInput = Readonly<{ demoInstanceId?: string }>;

export async function runStartDemoSandbox({
  demoInstanceId,
}: RunStartDemoSandboxInput) {
  const users = getUsersRepository();
  const demoSandboxes = new PrismaDemoSandboxRepository();
  const seedReader = new PrismaDemoSeedReader();
  const sandboxCloner = new PrismaDemoSandboxCloner();

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

  const startSandbox = startDemoSandbox({
    findReusableDemoSandbox: findReusableSandbox,
    createDemoSandboxFromSeed: createSandbox,
    registerDemoSandbox: registerSandbox,
    ttlMs: DEMO_SANDBOX_TTL_MS,
  });

  return startSandbox({
    seedWebsiteId: DEMO_SEED_WEBSITE_ID,
    demoInstanceId,
  });
}
