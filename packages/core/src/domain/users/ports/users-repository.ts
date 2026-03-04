/**
 * @file src/core/domain/users/ports/users-repository.ts
 * @layer core/domain
 */

import type {
  User,
  UserRbac,
  UserSummary,
} from "@compoz/core/domain/users/entities/user";

export type CreateUserRecord = Readonly<{
  id: string;
  email: string;
  name: string;
  password: string; // ✅ input brut (hash infra)
  rbac: UserRbac;
}>;

export interface UsersRepository {
  ensureBase(): Promise<void>;

  readById(userId: string): Promise<User | null>;
  readByEmail(email: string): Promise<User | null>;

  /** ✅ Création (avec password brut), hashé/storé côté infra */
  create(input: CreateUserRecord): Promise<User>;

  /** ✅ Update “profil” (sans password) */
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
