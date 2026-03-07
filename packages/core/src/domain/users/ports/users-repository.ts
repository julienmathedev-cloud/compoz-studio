// packages/core/src/domain/users/ports/users-repository.ts

/**
 * @file packages/core/src/domain/users/ports/users-repository.ts
 * @layer core/domain
 */

import type {
  User,
  UserSummary,
} from "@compoz/core/domain/users/entities/user";

/**
 * Record de création pour la persistance (repo).
 * @remarks
 * - `password` est un concern infra (hash + storage).
 * - `id` est fourni par le domaine (idGenerator) pour garder le contrôle.
 */
export type CreateUserRecord = Readonly<{
  user: User; // canonique (inclut meta)
  password: string; // infra-only
}>;

export interface UsersRepository {
  ensureBase(): Promise<void>;

  readById(userId: string): Promise<User | null>;
  readByEmail(email: string): Promise<User | null>;

  create(input: CreateUserRecord): Promise<User>;

  put(user: User): Promise<void>;
  putMany(users: ReadonlyArray<User>): Promise<void>;

  setPassword(userId: string, password: string): Promise<void>;

  deleteById(userId: string): Promise<void>;
  deleteByEmail(email: string): Promise<void>;

  existsById(userId: string): Promise<boolean>;
  existsByEmail(email: string): Promise<boolean>;

  list(): Promise<ReadonlyArray<UserSummary>>;
  readManyById(ids: ReadonlyArray<string>): Promise<Array<User | null>>;
}
