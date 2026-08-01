/**
 * @file packages/core/src/domain/demo/ports/demo-sandbox-repository.ts
 * @layer core/domain/demo
 * @description Persistence port for demo sandboxes.
 * @remarks
 * The repository stays intentionally minimal in V1: lookup is centered on `demoInstanceId` for cookie-based sandbox reuse.
 */

import type { DemoSandbox } from "@compoz/core/domain/demo/entities/demo-sandbox";

export type DemoSandboxWebsite = Readonly<{
  id: string;
  type: "site" | "sandbox";
  expiresAt: string | null;
}>;

export interface DemoSandboxRepository {
  ensureBase(): Promise<void>;

  list(): Promise<ReadonlyArray<DemoSandbox>>;

  readByDemoInstanceId(demoInstanceId: string): Promise<DemoSandbox | null>;

  readWebsiteById(websiteId: string): Promise<DemoSandboxWebsite | null>;

  put(sandbox: DemoSandbox): Promise<void>;

  /**
   * Deletes a sandbox by id without failing when it no longer exists.
   */
  deleteByDemoInstanceId(demoInstanceId: string): Promise<void>;

  existsByDemoInstanceId(demoInstanceId: string): Promise<boolean>;
}
