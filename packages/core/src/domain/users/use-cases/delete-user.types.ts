/**
 * @file packages/core/src/domain/users/use-cases/delete-user.types.ts
 * @layer core/domain/users/use-cases
 * @description Types for the delete user use-case.
 * @remarks
 * This file is a type-only contract and must contain no runtime logic.
 */

import type { UsersRepository } from "@compoz/core/domain/users/ports/users-repository";

export interface DeleteUserInput {
  userId: string;
}

export interface DeleteUserResult {
  ok: true;
  userId: string;
}

export interface DeleteUserDeps {
  users: UsersRepository;
}
