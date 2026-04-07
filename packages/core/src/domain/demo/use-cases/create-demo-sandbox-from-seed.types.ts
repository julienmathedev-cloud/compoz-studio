/**
 * @file packages/core/src/domain/demo/use-cases/create-demo-sandbox-from-seed.types.ts
 * @layer core/domain
 * @description
 * Contrat du use-case de création d'une sandbox démo à partir du tenant seed.
 *
 * @remarks
 * - Ce use-case crée une sandbox entièrement nouvelle.
 * - Il ne gère pas la réutilisation d'une sandbox existante.
 * - Il ne gère pas non plus la session HTTP / cookies.
 */

import type { IdGenerator } from "@compoz/core/domain/ports/id-generator";
import type { User } from "@compoz/core/domain/users/entities/user";
import type { UsersRepository } from "@compoz/core/domain/users/ports/users-repository";

export type DemoSandboxSeedSnapshot = Readonly<{
  tenantId: string;
}>;

export type DemoSandboxCloneResult = Readonly<{
  tenantId: string;
}>;

export interface DemoSandboxSeedReader {
  readSeedSnapshot: (seedTenantId: string) => Promise<DemoSandboxSeedSnapshot>;
}

export interface DemoSandboxCloner {
  cloneSeedToTenant: (args: {
    sourceTenantId: string;
    targetTenantId: string;
  }) => Promise<DemoSandboxCloneResult>;
}

export interface DemoSandboxPasswordBuilder {
  buildDemoUserPassword: (demoInstanceId: string) => string;
}

export interface CreateDemoSandboxFromSeedDeps {
  users: UsersRepository;
  idGenerator: IdGenerator;
  seedReader: DemoSandboxSeedReader;
  sandboxCloner: DemoSandboxCloner;
  passwordBuilder: DemoSandboxPasswordBuilder;
  nowIso?: () => string;
}

export type CreateDemoSandboxFromSeedInput = Readonly<{
  seedTenantId: string;
  expiresAt: string;
}>;

export type CreateDemoSandboxFromSeedResult = Readonly<{
  demoInstanceId: string;
  tenantId: string;
  user: User;
}>;
