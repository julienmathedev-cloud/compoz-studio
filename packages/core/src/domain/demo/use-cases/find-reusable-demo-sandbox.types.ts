/**
 * @file packages/core/src/domain/demo/use-cases/find-reusable-demo-sandbox.types.ts
 * @layer core/domain
 * @description
 * Contrat du use-case de résolution d'une sandbox démo réutilisable.
 *
 * @remarks
 * - Ce use-case lit une sandbox existante à partir d'un `demoInstanceId`.
 * - Il vérifie ensuite la cohérence minimale avec le user associé.
 * - Il ne gère pas les cookies HTTP ni l'ouverture de session.
 */

import type { DemoSandbox } from "@compoz/core/domain/demo/entities/demo-sandbox";
import type { DemoSandboxRepository } from "@compoz/core/domain/demo/ports/demo-sandbox-repository";
import type { User } from "@compoz/core/domain/users/entities/user";
import type { UsersRepository } from "@compoz/core/domain/users/ports/users-repository";

export interface FindReusableDemoSandboxDeps {
  demoSandboxes: DemoSandboxRepository;
  users: UsersRepository;
  nowIso?: () => string;
}

export type FindReusableDemoSandboxInput = Readonly<{
  demoInstanceId: string;
}>;

export type FindReusableDemoSandboxResult = Readonly<{
  sandbox: DemoSandbox;
  user: User;
  tenantId: string;
}>;
