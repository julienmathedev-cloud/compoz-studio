/**
 * @file packages/core/src/domain/demo/use-cases/start-demo-sandbox.types.ts
 * @layer core/domain
 *
 * @description
 * Contrat du use-case d’orchestration de démarrage d’une sandbox démo.
 *
 * @remarks
 * - Tente de réutiliser une sandbox existante si un `demoInstanceId` est fourni.
 * - Sinon crée une nouvelle sandbox à partir du Website seed.
 * - Ne gère ni cookies HTTP ni ouverture de session.
 */

import type { DemoSandbox } from "@compoz/core/domain/demo/entities/demo-sandbox";
import type { User } from "@compoz/core/domain/users/entities/user";

export interface StartDemoSandboxDeps {
  findReusableDemoSandbox: (input: { demoInstanceId: string }) => Promise<{
    sandbox: DemoSandbox;
    user: User;
    websiteId: string;
  }>;

  createDemoSandboxFromSeed: (input: {
    seedWebsiteId: string;
    expiresAt: string;
  }) => Promise<{
    demoInstanceId: string;
    websiteId: string;
    user: User;
  }>;

  registerDemoSandbox: (input: {
    demoInstanceId: string;
    userId: string;
    websiteId: string;
    expiresAt: string;
  }) => Promise<{
    sandbox: DemoSandbox;
  }>;

  nowIso?: () => string;
  ttlMs: number;
}

export type StartDemoSandboxInput = Readonly<{
  seedWebsiteId: string;
  demoInstanceId?: string;
}>;

export type StartDemoSandboxResult = Readonly<{
  mode: "reused" | "created";
  sandbox: DemoSandbox;
  user: User;
  websiteId: string;
  demoInstanceId: string;
  expiresAt: string;
}>;
