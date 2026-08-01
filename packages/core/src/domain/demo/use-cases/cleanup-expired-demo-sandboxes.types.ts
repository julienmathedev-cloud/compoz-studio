/**
 * @file packages/core/src/domain/demo/use-cases/cleanup-expired-demo-sandboxes.types.ts
 * @layer core/domain/demo
 * @description Contracts for the expired demo sandbox cleanup use case.
 */

import type { DemoSandboxRepository } from "@compoz/core/domain/demo/ports/demo-sandbox-repository";
import type { DemoSandbox } from "@compoz/core/domain/demo/entities/demo-sandbox";
import type { UsersRepository } from "@compoz/core/domain/users/ports/users-repository";

export interface DemoSandboxDataCleaner {
  deleteExpiredSandbox(
    sandbox: DemoSandbox,
    nowIso: string,
  ): Promise<"cleaned" | "skipped">;
}

export interface CleanupExpiredDemoSandboxesDeps {
  demoSandboxes: DemoSandboxRepository;
  users: UsersRepository;
  sandboxDataCleaner: DemoSandboxDataCleaner;
  nowIso?: () => string;
}

export type CleanupExpiredDemoSandboxesInput = Readonly<{
  /**
   * When true, cleanup keeps processing remaining sandboxes after an item failure.
   *
   * @default true
   */
  continueOnError?: boolean;
}>;

export type CleanupExpiredDemoSandboxesResult = Readonly<{
  total: number;
  expired: number;
  cleaned: number;
  failed: number;
  items: ReadonlyArray<{
    demoInstanceId: string;
    websiteId: string;
    userId: string;
    status: "cleaned" | "skipped" | "failed";
    error?: string;
  }>;
}>;
