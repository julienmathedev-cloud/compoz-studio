/**
 * @file packages/core/src/domain/demo/use-cases/find-reusable-demo-sandbox.types.ts
 * @layer core/domain/demo
 * @description Contracts for resolving a reusable demo sandbox.
 * @remarks
 * This use case resolves an existing sandbox by `demoInstanceId`, checks consistency with the linked user, and leaves HTTP cookie/session handling outside the core domain.
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
  websiteId: string;
}>;
