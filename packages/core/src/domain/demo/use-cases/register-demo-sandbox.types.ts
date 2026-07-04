/**
 * @file packages/core/src/domain/demo/use-cases/register-demo-sandbox.types.ts
 * @layer core/domain
 *
 * @description
 * Contrat du use-case d’enregistrement d’une sandbox démo.
 *
 * @remarks
 * - Ce use-case persiste le record de résolution d’une sandbox démo.
 * - Il ne crée pas le user ni ne clone le Website seed.
 */

import type { DemoSandbox } from "@compoz/core/domain/demo/entities/demo-sandbox";
import type { DemoSandboxRepository } from "@compoz/core/domain/demo/ports/demo-sandbox-repository";

export interface RegisterDemoSandboxDeps {
  demoSandboxes: DemoSandboxRepository;
  nowIso?: () => string;
}

export type RegisterDemoSandboxInput = Readonly<{
  demoInstanceId: string;
  userId: string;
  websiteId: string;
  expiresAt: string;
}>;

export type RegisterDemoSandboxResult = Readonly<{
  sandbox: DemoSandbox;
}>;
