/**
 * @file packages/infra/src/users/in-memory-users-repository.ts
 * @layer infra/users
 * @description In-memory UsersRepository implementation for tests.
 * @remarks
 * Keeps DB-like email indexing and bcrypt password hashes while leaving domain validation outside infra.
 */

import bcrypt from "bcryptjs";

import type {
  User,
  UserSummary,
} from "@compoz/core/domain/users/entities/user";
import type { UsersRepository } from "@compoz/core/domain/users/ports/users-repository";

type CreateUserInput = Parameters<UsersRepository["create"]>[0];

/** Internal id-first store with secondary email and password-hash indexes. */
type Store = Readonly<{
  byId: Map<string, User>;
  emailToId: Map<string, string>;
  pwdById: Map<string, string>;
}>;

function normalizeEmail(input: unknown): string {
  return String(input ?? "")
    .trim()
    .toLowerCase();
}

export class InMemoryUsersRepository implements UsersRepository {
  private store: Store = {
    byId: new Map(),
    emailToId: new Map(),
    pwdById: new Map(),
  };

  async ensureBase(): Promise<void> {}

  async readById(userId: string): Promise<User | null> {
    const id = String(userId ?? "").trim();
    if (!id) return null;

    const u = this.store.byId.get(id);
    return u ? structuredClone(u) : null;
  }

  async readByEmail(email: string): Promise<User | null> {
    const e = normalizeEmail(email);
    if (!e) return null;

    const id = this.store.emailToId.get(e);
    if (!id) return null;

    return this.readById(id);
  }

  async create(input: CreateUserInput): Promise<User> {
    const user = input?.user;
    const password = String(input?.password ?? "").trim();

    const id = String(user?.id ?? "").trim();
    const emailLower = normalizeEmail(user?.email);

    // Minimal infra guard before hashing and indexing.
    if (!id || !emailLower || !password) {
      throw new Error("InMemoryUsersRepository.create: invalid input.");
    }

    // Store the canonical lower-case email in the infra layer.
    const toStore: User = { ...user, email: emailLower };

    // Keep the secondary email index in sync when an id changes email.
    const prev = this.store.byId.get(id);
    if (prev?.email && prev.email !== emailLower) {
      const mapped = this.store.emailToId.get(prev.email);
      if (mapped === id) this.store.emailToId.delete(prev.email);
    }

    this.store.emailToId.set(emailLower, id);

    const hash = await bcrypt.hash(password, 10);
    this.store.pwdById.set(id, hash);

    this.store.byId.set(id, structuredClone(toStore));

    return structuredClone(toStore);
  }

  async put(user: User): Promise<void> {
    const id = String(user?.id ?? "").trim();
    const emailLower = normalizeEmail(user?.email);

    if (!id || !emailLower) return;

    const prev = this.store.byId.get(id);

    // Keep the secondary email index in sync when an email changes.
    if (prev?.email && prev.email !== emailLower) {
      const mapped = this.store.emailToId.get(prev.email);
      if (mapped === id) this.store.emailToId.delete(prev.email);
    }

    this.store.emailToId.set(emailLower, id);
    this.store.byId.set(id, structuredClone({ ...user, email: emailLower }));
  }

  async putMany(users: ReadonlyArray<User>): Promise<void> {
    if (users.length === 0) return;

    for (const u of users) {
      await this.put(u);
    }
  }

  async setPassword(userId: string, password: string): Promise<void> {
    const id = String(userId ?? "").trim();
    const pwd = String(password ?? "").trim();
    if (!id || !pwd) return;

    // Missing users are ignored, matching delete-like idempotence.
    if (!this.store.byId.has(id)) return;

    const hash = await bcrypt.hash(pwd, 10);
    this.store.pwdById.set(id, hash);
  }

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const id = String(userId ?? "").trim();
    if (!id) return false;

    const hash = this.store.pwdById.get(id) ?? "";
    if (!hash) return false;

    return bcrypt.compare(String(password ?? ""), hash);
  }

  async deleteById(userId: string): Promise<void> {
    const id = String(userId ?? "").trim();
    if (!id) return;

    const prev = this.store.byId.get(id);

    if (prev?.email) {
      const mapped = this.store.emailToId.get(prev.email);
      if (mapped === id) this.store.emailToId.delete(prev.email);
    }

    this.store.byId.delete(id);
    this.store.pwdById.delete(id);
  }

  async deleteByEmail(email: string): Promise<void> {
    const e = normalizeEmail(email);
    if (!e) return;

    const id = this.store.emailToId.get(e);
    if (!id) return;

    await this.deleteById(id);
  }

  async existsById(userId: string): Promise<boolean> {
    const id = String(userId ?? "").trim();
    if (!id) return false;
    return this.store.byId.has(id);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const e = normalizeEmail(email);
    if (!e) return false;
    return this.store.emailToId.has(e);
  }

  async readManyById(ids: ReadonlyArray<string>): Promise<Array<User | null>> {
    return ids.map((userId) => {
      const id = String(userId ?? "").trim();
      if (!id) return null;

      const u = this.store.byId.get(id);
      return u ? structuredClone(u) : null;
    });
  }

  async list(): Promise<ReadonlyArray<UserSummary>> {
    const out: UserSummary[] = [];

    for (const u of this.store.byId.values()) {
      out.push({
        id: u.id,
        email: u.email,
        name: u.name,
        status: u.status,
      });
    }

    out.sort((a, b) => a.email.localeCompare(b.email));

    return out;
  }
}
