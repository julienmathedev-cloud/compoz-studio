/**
 * @file packages/infra/src/users/in-memory-users-repository.ts
 * @layer infra/users
 * @description
 * Implémentation InMemory du UsersRepository pour tests unitaires et e2e.
 *
 * Responsabilités :
 * - stockage en mémoire process-local
 * - indexation id-first (Map id -> User)
 * - index secondaire email -> id (lookup "DB-like")
 * - gestion d’un store de password hash (infra concern)
 * - clonage structuré pour éviter les mutations croisées
 * - respect strict de l’interface UsersRepository
 *
 * @remarks
 * - Aucune validation métier (format email, RBAC, unicité) : le domaine tranche.
 * - Comportement idempotent : delete sur user absent ne jette pas.
 */

import bcrypt from "bcryptjs";

import type {
  CreateUserRecord,
  UsersRepository,
} from "@compoz/core/domain/users/ports/users-repository";
import type {
  User,
  UserSummary,
} from "@compoz/core/domain/users/entities/user";

/**
 * Store interne :
 * - byId : id -> User
 * - emailToId : emailLower -> id
 * - pwdById : id -> bcrypt hash
 */
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

function nowIso(): string {
  return new Date().toISOString();
}

export class InMemoryUsersRepository implements UsersRepository {
  private store: Store = {
    byId: new Map(),
    emailToId: new Map(),
    pwdById: new Map(),
  };

  async ensureBase(): Promise<void> {
    // no-op (in-memory)
  }

  /* -------------------------------------------------------------------------- */
  /* Reads                                                                      */
  /* -------------------------------------------------------------------------- */

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

  /* -------------------------------------------------------------------------- */
  /* Writes                                                                     */
  /* -------------------------------------------------------------------------- */

  async create(input: CreateUserRecord): Promise<User> {
    const id = String(input?.id ?? "").trim();
    const email = normalizeEmail(input?.email);
    const name = String(input?.name ?? "").trim();
    const password = String(input?.password ?? "").trim();

    // Contrat infra minimal : si pas d'id/email/password => on refuse.
    if (!id || !email || !password) {
      throw new Error("InMemoryUsersRepository.create: invalid input.");
    }

    const at = nowIso();

    const user: User = {
      id,
      email,
      name: name || undefined,
      status: "active",
      rbac: structuredClone(input.rbac),
      meta: { createdAt: at, updatedAt: at },
    };

    // Nettoyage index si même id existait déjà avec un autre email
    const prev = this.store.byId.get(id);
    if (prev?.email && prev.email !== email) {
      const mapped = this.store.emailToId.get(prev.email);
      if (mapped === id) this.store.emailToId.delete(prev.email);
    }

    // Index email -> id (si un autre id utilisait cet email, on remplace le mapping)
    this.store.emailToId.set(email, id);

    // Password hash (infra)
    const hash = await bcrypt.hash(password, 10);
    this.store.pwdById.set(id, hash);

    // Stockage user
    this.store.byId.set(id, structuredClone(user));

    return structuredClone(user);
  }

  async put(user: User): Promise<void> {
    const id = String(user?.id ?? "").trim();
    const email = normalizeEmail(user?.email);

    if (!id || !email) return;

    const prev = this.store.byId.get(id);

    // Si changement d'email, on nettoie l'ancien index.
    if (prev?.email && prev.email !== email) {
      const mapped = this.store.emailToId.get(prev.email);
      if (mapped === id) this.store.emailToId.delete(prev.email);
    }

    this.store.emailToId.set(email, id);
    this.store.byId.set(id, structuredClone({ ...user, email }));
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

    // Idempotent-ish : si user absent, on ne jette pas (comme delete)
    if (!this.store.byId.has(id)) return;

    const hash = await bcrypt.hash(pwd, 10);
    this.store.pwdById.set(id, hash);
  }

  /* -------------------------------------------------------------------------- */
  /* Deletes                                                                    */
  /* -------------------------------------------------------------------------- */

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

  /* -------------------------------------------------------------------------- */
  /* Exists                                                                     */
  /* -------------------------------------------------------------------------- */

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

  /* -------------------------------------------------------------------------- */
  /* Bulk reads                                                                 */
  /* -------------------------------------------------------------------------- */

  async readManyById(ids: ReadonlyArray<string>): Promise<Array<User | null>> {
    return ids.map((userId) => {
      const id = String(userId ?? "").trim();
      if (!id) return null;

      const u = this.store.byId.get(id);
      return u ? structuredClone(u) : null;
    });
  }

  /* -------------------------------------------------------------------------- */
  /* List                                                                       */
  /* -------------------------------------------------------------------------- */

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

    // Tri stable (optionnel) : pratique en tests
    out.sort((a, b) => a.email.localeCompare(b.email));

    return out;
  }
}
