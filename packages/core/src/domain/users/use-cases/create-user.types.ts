/**
 * @file packages/core/src/domain/users/use-cases/create-user.types.ts
 * @layer core/domain
 * @description
 * Types du use-case CreateUser : entrées, sorties et dépendances.
 */

import type { IdGenerator } from "@compoz/core/domain/ports/id-generator";
import type { User, UserRbac } from "@compoz/core/domain/users/entities/user";
import type { UsersRepository } from "@compoz/core/domain/users/ports/users-repository";

/**
 * Dépendances nécessaires.
 */
export interface CreateUserDeps {
  users: UsersRepository;
  idGenerator: IdGenerator;
}

/**
 * Input de création.
 * - password requis (hashé côté repo)
 */
export type CreateUserInput = Readonly<{
  email: string;
  name: string;
  password: string;
  rbac: UserRbac;
}>;

/**
 * Résultat.
 */
export type CreateUserResult = Readonly<{
  user: User;
}>;
