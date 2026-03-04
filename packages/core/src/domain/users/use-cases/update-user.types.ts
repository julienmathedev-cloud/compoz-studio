/**
 * @file packages/core/src/domain/users/use-cases/update-user.types.ts
 * @layer core/domain
 */

import type {
  User,
  UserRbac,
  UserStatus,
} from "@compoz/core/domain/users/entities/user";
import type { UsersRepository } from "@compoz/core/domain/users/ports/users-repository";

export type UpdateUserInput = {
  userId: string;
  email?: string;
  name?: string;
  status?: UserStatus;
  rbac?: UserRbac;

  /**
   * Optionnel : changement de password.
   * ⚠️ Ne fait pas partie de l'entité User.
   */
  password?: string;
};

export type UpdateUserResult = {
  user: User;
};

export type UpdateUserDeps = {
  users: UsersRepository;
  nowIso?: () => string;
};
