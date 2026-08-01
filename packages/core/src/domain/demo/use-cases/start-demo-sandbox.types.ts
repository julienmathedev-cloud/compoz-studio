/**
 * @file packages/core/src/domain/demo/use-cases/start-demo-sandbox.types.ts
 * @layer core/domain/demo
 * @description Contracts for starting a demo sandbox.
 * @remarks
 * This use case reuses an existing sandbox when `demoInstanceId` is provided, otherwise creates one from the seed website. HTTP cookies and session opening are handled outside the core domain.
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

  rollbackProvisionedSandbox: (input: {
    demoInstanceId: string;
    userId: string;
    websiteId: string;
  }) => Promise<void>;

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
