/**
 * @file packages/core/src/domain/demo/use-cases/start-demo-sandbox.types.ts
 * @layer core/domain
 * @description
 * Contrat du use-case d'orchestration de démarrage d'une sandbox démo.
 *
 * @remarks
 * - Tente de réutiliser une sandbox existante si un `demoInstanceId` est fourni.
 * - Sinon crée une nouvelle sandbox à partir du seed.
 * - Ne gère ni cookies HTTP ni ouverture de session.
 */

import type { DemoSandbox } from "@compoz/core/domain/demo/entities/demo-sandbox";
import type { User } from "@compoz/core/domain/users/entities/user";

export interface StartDemoSandboxDeps {
  findReusableDemoSandbox: (input: { demoInstanceId: string }) => Promise<{
    sandbox: DemoSandbox;
    user: User;
    tenantId: string;
  }>;

  createDemoSandboxFromSeed: (input: {
    seedTenantId: string;
    expiresAt: string;
  }) => Promise<{
    demoInstanceId: string;
    tenantId: string;
    user: User;
  }>;

  registerDemoSandbox: (input: {
    demoInstanceId: string;
    userId: string;
    tenantId: string;
    expiresAt: string;
  }) => Promise<{
    sandbox: DemoSandbox;
  }>;

  nowIso?: () => string;
  ttlMs: number;
}

export type StartDemoSandboxInput = Readonly<{
  seedTenantId: string;
  demoInstanceId?: string;
}>;

export type StartDemoSandboxResult = Readonly<{
  mode: "reused" | "created";
  sandbox: DemoSandbox;
  user: User;
  tenantId: string;
  demoInstanceId: string;
  expiresAt: string;
}>;
