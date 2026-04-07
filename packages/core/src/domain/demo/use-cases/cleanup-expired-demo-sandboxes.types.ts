/**
 * @file packages/core/src/domain/demo/use-cases/cleanup-expired-demo-sandboxes.types.ts
 * @layer core/domain
 * @description
 * Contrat du use-case de cleanup des sandboxes démo expirées.
 *
 * @remarks
 * - Supprime les records sandbox expirés.
 * - Supprime les users démo associés.
 * - Déclenche le nettoyage des données du tenant sandbox associé.
 */

import type { DemoSandboxRepository } from "@compoz/core/domain/demo/ports/demo-sandbox-repository";
import type { UsersRepository } from "@compoz/core/domain/users/ports/users-repository";

export interface DemoSandboxTenantCleaner {
  deleteTenantData: (tenantId: string) => Promise<{
    keysMatched: number;
    keysDeleted: number;
  }>;
}

export interface CleanupExpiredDemoSandboxesDeps {
  demoSandboxes: DemoSandboxRepository;
  users: UsersRepository;
  tenantCleaner: DemoSandboxTenantCleaner;
  nowIso?: () => string;
}

export type CleanupExpiredDemoSandboxesInput = Readonly<{
  /**
   * Si true, le cleanup continue même si une sandbox donnée échoue.
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
    tenantId: string;
    userId: string;
    status: "cleaned" | "failed";
    keysMatched?: number;
    keysDeleted?: number;
    error?: string;
  }>;
}>;
