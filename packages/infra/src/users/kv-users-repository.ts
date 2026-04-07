/**
 * @file packages/infra/src/users/kv-users-repository.ts
 * @layer infra/users
 * @description
 * Implémentation KV (Upstash Redis) du UsersRepository (Studio users).
 *
 * Stockage :
 * - user doc : compoz:studio:users:user:<userId> (JSON)
 * - index email -> userId : compoz:studio:users:userByEmail:<emailLower>
 * - password hash : compoz:studio:users:pwd:<userId>
 */

import bcrypt from "bcryptjs";

import type {
  User,
  UserSummary,
} from "@compoz/core/domain/users/entities/user";
import type { UsersRepository } from "@compoz/core/domain/users/ports/users-repository";

import { getUpstashRedis, parseRedisJson } from "@compoz/infra/kv/kv-redis";
import { kvCmd } from "@compoz/infra/kv/kv-telemetry";
import { log } from "@compoz/infra/lib/log";

// ⛳️ NOTE: idéalement ces schémas vivent dans @compoz/core (boundary validation)
import type { UserShape } from "@compoz/validation/users/user";
import { UserSchema } from "@compoz/validation/users/user";

/**
 * Namespace standard (SoT) :
 * compoz:<surface>:<layer>:<module>
 */
const lg = log.child({ ns: "compoz:studio:repo:users", kind: "kv" });

/* -------------------------------------------------------------------------- */
/* Types (SoT = port)                                                         */
/* -------------------------------------------------------------------------- */

type CreateUserInput = Parameters<UsersRepository["create"]>[0];

/* -------------------------------------------------------------------------- */
/* Keys                                                                       */
/* -------------------------------------------------------------------------- */

const USERS_NS = "compoz:studio:users" as const;

function userKey(userId: string): string {
  return `${USERS_NS}:user:${userId}`;
}

function emailIndexKey(emailLower: string): string {
  return `${USERS_NS}:userByEmail:${emailLower}`;
}

function pwdKey(userId: string): string {
  return `${USERS_NS}:pwd:${userId}`;
}

function userKeyPattern(): string {
  return `${USERS_NS}:user:*`;
}

function userIdFromKey(key: string): string | null {
  const parts = String(key ?? "").split(":");
  const id = parts[parts.length - 1];
  return id ? id.trim() : null;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function normalizeEmail(email: unknown): string {
  return String(email ?? "")
    .trim()
    .toLowerCase();
}

function kvCtx(base: string): string {
  // ctx stable, sans key ni id
  return `users.${base}`;
}

function toDomainUser(u: UserShape): User {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    status: u.status,
    rbac: u.rbac,
    meta: u.meta,
    demo: u.demo,
  };
}

/* -------------------------------------------------------------------------- */
/* Repository                                                                 */
/* -------------------------------------------------------------------------- */

export class KvUsersRepository implements UsersRepository {
  private readonly redis = getUpstashRedis();

  async ensureBase(): Promise<void> {
    // no-op (KV)
  }

  async readById(userId: string): Promise<User | null> {
    const id = String(userId ?? "").trim();
    if (!id) return null;

    const raw = await kvCmd(kvCtx("readById.get"), "get", () =>
      this.redis.get(userKey(id)),
    );

    const json = parseRedisJson<unknown>(raw);
    if (!json) return null;

    const parsed = UserSchema.parse(json);
    return toDomainUser(parsed);
  }

  async readByEmail(email: string): Promise<User | null> {
    const e = normalizeEmail(email);
    if (!e) return null;

    const userIdRaw = await kvCmd(kvCtx("readByEmail.getIndex"), "get", () =>
      this.redis.get(emailIndexKey(e)),
    );

    const id = typeof userIdRaw === "string" ? userIdRaw.trim() : "";
    if (!id) return null;

    return this.readById(id);
  }

  async create(input: CreateUserInput): Promise<User> {
    const user = input?.user;
    const password = String(input?.password ?? "").trim();

    const id = String(user?.id ?? "").trim();
    if (!id) throw new Error("KvUsersRepository.create: user.id is required.");

    const emailLower = normalizeEmail(user?.email);
    if (!emailLower) {
      throw new Error("KvUsersRepository.create: user.email is required.");
    }

    if (!password) {
      throw new Error("KvUsersRepository.create: password is required.");
    }

    // (défense) si index existe déjà, on refuse
    const existing = await kvCmd(kvCtx("create.checkEmail"), "get", () =>
      this.redis.get(emailIndexKey(emailLower)),
    );

    if (typeof existing === "string" && existing.trim()) {
      throw new Error("KvUsersRepository.create: email already exists.");
    }

    // Canonicalisation email côté infra
    const toStore: User = { ...user, email: emailLower };

    // boundary validation
    UserSchema.parse(toStore);

    // 1) user doc
    await kvCmd(kvCtx("create.user.set"), "set", () =>
      this.redis.set(userKey(id), JSON.stringify(toStore)),
    );

    // 2) email index
    await kvCmd(kvCtx("create.emailIndex.set"), "set", () =>
      this.redis.set(emailIndexKey(emailLower), id),
    );

    // 3) password hash (infra-only)
    const hash = await bcrypt.hash(password, 10);

    await kvCmd(kvCtx("create.pwd.set"), "set", () =>
      this.redis.set(pwdKey(id), hash),
    );

    lg.debug("users.create.ok", { hasId: true });

    return toStore;
  }

  async put(user: User): Promise<void> {
    const id = String(user?.id ?? "").trim();
    if (!id) throw new Error("KvUsersRepository.put: user.id is required.");

    const nextEmail = normalizeEmail(user.email);
    if (!nextEmail) {
      throw new Error("KvUsersRepository.put: user.email is required.");
    }

    // Canonicalisation email côté infra
    const toStore: User = { ...user, email: nextEmail };

    // boundary validation
    UserSchema.parse(toStore);

    // Si l'email change, on doit maintenir l'index.
    const existing = await this.readById(id);
    const prevEmail = existing ? normalizeEmail(existing.email) : "";

    if (prevEmail && prevEmail !== nextEmail) {
      await kvCmd(kvCtx("put.emailIndex.delOld"), "del", () =>
        this.redis.del(emailIndexKey(prevEmail)),
      );

      await kvCmd(kvCtx("put.emailIndex.set"), "set", () =>
        this.redis.set(emailIndexKey(nextEmail), id),
      );
    } else if (!prevEmail) {
      // best-effort : assure l'index si doc présent sans index (réparation)
      await kvCmd(kvCtx("put.emailIndex.ensure"), "set", () =>
        this.redis.set(emailIndexKey(nextEmail), id),
      );
    }

    await kvCmd(kvCtx("put.user.set"), "set", () =>
      this.redis.set(userKey(id), JSON.stringify(toStore)),
    );
  }

  async putMany(users: ReadonlyArray<User>): Promise<void> {
    await this.ensureBase();
    if (users.length === 0) return;

    // V0.5 pragmatique :
    // - mset des docs user
    // - puis (best-effort) on garantit les indexes email -> id
    // (coûteux si énorme volume, mais OK pour usage admin/seed/tests).
    const docs: Record<string, string> = {};
    const indexes: Array<Promise<unknown>> = [];

    for (const u of users) {
      const id = String(u?.id ?? "").trim();
      if (!id) continue;

      const emailLower = normalizeEmail(u.email);
      if (!emailLower) continue;

      const toStore: User = { ...u, email: emailLower };
      UserSchema.parse(toStore);

      docs[userKey(id)] = JSON.stringify(toStore);

      indexes.push(
        kvCmd(kvCtx("putMany.emailIndex.set"), "set", () =>
          this.redis.set(emailIndexKey(emailLower), id),
        ),
      );
    }

    if (Object.keys(docs).length === 0) return;

    await kvCmd(kvCtx("putMany.mset"), "other", () => this.redis.mset(docs));

    // best-effort : si un index échoue, on veut quand même les docs users en place
    await Promise.allSettled(indexes);
  }

  async setPassword(userId: string, password: string): Promise<void> {
    const id = String(userId ?? "").trim();
    if (!id) throw new Error("KvUsersRepository.setPassword: userId required.");

    const pwd = String(password ?? "").trim();
    if (!pwd) {
      throw new Error("KvUsersRepository.setPassword: password required.");
    }

    const hash = await bcrypt.hash(pwd, 10);

    await kvCmd(kvCtx("setPassword.set"), "set", () =>
      this.redis.set(pwdKey(id), hash),
    );
  }

  async deleteById(userId: string): Promise<void> {
    const id = String(userId ?? "").trim();
    if (!id) return;

    const existing = await this.readById(id);
    const emailLower = existing ? normalizeEmail(existing.email) : "";

    if (emailLower) {
      await kvCmd(kvCtx("deleteById.emailIndex.del"), "del", () =>
        this.redis.del(emailIndexKey(emailLower)),
      );
    }

    await kvCmd(kvCtx("deleteById.user.del"), "del", () =>
      this.redis.del(userKey(id)),
    );

    await kvCmd(kvCtx("deleteById.pwd.del"), "del", () =>
      this.redis.del(pwdKey(id)),
    );
  }

  async deleteByEmail(email: string): Promise<void> {
    const e = normalizeEmail(email);
    if (!e) return;

    const u = await this.readByEmail(e);
    if (!u) return;

    await this.deleteById(u.id);
  }

  async existsById(userId: string): Promise<boolean> {
    const id = String(userId ?? "").trim();
    if (!id) return false;

    const n = await kvCmd(kvCtx("existsById.exists"), "other", () =>
      this.redis.exists(userKey(id)),
    );

    return n === 1;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const e = normalizeEmail(email);
    if (!e) return false;

    const userIdRaw = await kvCmd(kvCtx("existsByEmail.getIndex"), "get", () =>
      this.redis.get(emailIndexKey(e)),
    );

    return typeof userIdRaw === "string" && Boolean(userIdRaw.trim());
  }

  async list(): Promise<ReadonlyArray<UserSummary>> {
    const keys = await kvCmd(kvCtx("list.keys"), "other", () =>
      this.redis.keys(userKeyPattern()),
    );

    if (!Array.isArray(keys) || keys.length === 0) return [];

    const raws = await kvCmd(kvCtx("list.mget"), "other", () =>
      this.redis.mget(...keys),
    );

    if (!Array.isArray(raws) || raws.length === 0) return [];

    const out: UserSummary[] = [];

    for (let i = 0; i < raws.length; i += 1) {
      const json = parseRedisJson<unknown>(raws[i]);
      if (!json) continue;

      try {
        const parsed = UserSchema.parse(json);

        out.push({
          id: parsed.id ?? userIdFromKey(keys[i]) ?? "",
          email: parsed.email,
          name: parsed.name,
          status: parsed.status,
        });
      } catch {
        // skip doc corrompu
      }
    }

    return out
      .filter((u) => Boolean(String(u.id ?? "").trim()))
      .sort((a, b) => a.email.localeCompare(b.email));
  }

  async readManyById(ids: ReadonlyArray<string>): Promise<Array<User | null>> {
    const list = ids.map((x) => String(x ?? "").trim()).filter(Boolean);
    if (list.length === 0) return [];

    const keys = list.map((id) => userKey(id));

    const raws = await kvCmd(kvCtx("readManyById.mget"), "other", () =>
      this.redis.mget(...keys),
    );

    if (!Array.isArray(raws) || raws.length === 0) {
      return list.map(() => null);
    }

    const out: Array<User | null> = [];

    for (const raw of raws) {
      const json = parseRedisJson<unknown>(raw);
      if (!json) {
        out.push(null);
        continue;
      }

      try {
        const parsed = UserSchema.parse(json);
        out.push(toDomainUser(parsed));
      } catch {
        out.push(null);
      }
    }

    return out;
  }

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const id = String(userId ?? "").trim();
    if (!id) return false;

    const raw = await kvCmd(kvCtx("verifyPassword.getHash"), "get", () =>
      this.redis.get(pwdKey(id)),
    );

    const hash = typeof raw === "string" ? raw : "";
    if (!hash) return false;

    return bcrypt.compare(String(password ?? ""), hash);
  }
}
