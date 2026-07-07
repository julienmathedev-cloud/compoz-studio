/**
 * @file packages/core/src/domain/users/use-cases/update-user.types.ts
 * @layer core/domain/users/use-cases
 * @description Types for the update user use-case.
 * @remarks
 * This file is a type-only contract and must contain no runtime logic.
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
  password?: string;
};

export type UpdateUserResult = {
  user: User;
};

export type UpdateUserDeps = {
  users: UsersRepository;
  nowIso?: () => string;
};
