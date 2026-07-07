/**
 * @file packages/core/src/domain/demo/use-cases/register-demo-sandbox.types.ts
 * @layer core/domain/demo
 * @description Contracts for registering a demo sandbox resolution record.
 * @remarks
 * This use case persists the sandbox resolution record. User creation and seed website cloning are handled outside it.
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
