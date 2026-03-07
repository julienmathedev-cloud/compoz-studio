// packages/core/src/domain/users/use-cases/create-user.types.ts

/**
 * @file packages/core/src/domain/users/use-cases/create-user.types.ts
 * @layer core/domain
 */

import type { IdGenerator } from "@compoz/core/domain/ports/id-generator";
import type { User, UserRbac } from "@compoz/core/domain/users/entities/user";
import type { UsersRepository } from "@compoz/core/domain/users/ports/users-repository";

export interface CreateUserDeps {
  users: UsersRepository;
  idGenerator: IdGenerator;
  nowIso?: () => string;
}

/**
 * Input du use-case (métier).
 * @remarks
 * - Le repo hash/stocke le password (infra).
 */
export type CreateUserInput = Readonly<{
  email: string;
  name: string;
  password: string;
  rbac: UserRbac;
}>;

export type CreateUserResult = Readonly<{
  user: User;
}>;
