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
 *
 * Notes :
 * - Le password brut ne sort jamais du domaine/use-case : il est hashé ici.
 * - Le RBAC est stocké dans l'entité User (pas de clé séparée).
 */

import type {
  CreateUserRecord,
  UsersRepository,
} from "@compoz/core/domain/users/ports/users-repository";
import type {
  User,
  UserSummary,
} from "@compoz/core/domain/users/entities/user";

import { kvCmd } from "@compoz/infra/kv/kv-telemetry";

import { Redis } from "@upstash/redis";
import bcrypt from "bcryptjs";

// ⛳️ NOTE: idéalement ces schémas vivent dans @compoz/core (boundary validation),
// pour que @compoz/infra ne dépende pas d’un import "app".
import type { UserShape } from "@compoz/validation/users/user";
import { UserSchema } from "@compoz/validation/users/user";

/* -------------------------------------------------------------------------- */
/* Redis singleton                                                            */
/* -------------------------------------------------------------------------- */

let _redisSingleton: Redis | null = null;

function getUpstashRedis(): Redis {
  if (_redisSingleton) return _redisSingleton;

  const url =
    process.env["KV_REST_API_URL"] ?? process.env["UPSTASH_REDIS_REST_URL"];
  const token =
    process.env["KV_REST_API_TOKEN"] ?? process.env["UPSTASH_REDIS_REST_TOKEN"];

  if (!url || !token) {
    throw new Error(
      "KvUsersRepository: missing Redis env. Expected KV_REST_API_URL/KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN).",
    );
  }

  _redisSingleton = new Redis({ url, token });
  return _redisSingleton;
}

/* -------------------------------------------------------------------------- */
/* Keys                                                                       */
/* -------------------------------------------------------------------------- */

const USERS_NS = "compoz:studio:users" as const;

function userKey(userId: string) {
  return `${USERS_NS}:user:${userId}`;
}

function emailIndexKey(emailLower: string) {
  return `${USERS_NS}:userByEmail:${emailLower}`;
}

function pwdKey(userId: string) {
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

/**
 * Upstash peut renvoyer directement un objet (auto-deserialization),
 * ou une string JSON, selon la config / le contenu.
 *
 * Contrat : retourne un objet JSON exploitable ou `null`.
 */
function parseRedisJson<T>(raw: unknown): T | null {
  if (raw == null) return null;

  if (typeof raw === "object") return raw as T;

  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return null;
    return JSON.parse(s) as T;
  }

  return JSON.parse(String(raw)) as T;
}

function normalizeEmail(email: unknown): string {
  return String(email ?? "")
    .trim()
    .toLowerCase();
}

/**
 * Construit un context "stable" pour la télémétrie KV.
 * Note : on ne loggue pas la key complète (pas de PII / pas d’id dans le context).
 */
function kvCtx(base: string): string {
  return `users.${base}`;
}

function toDomainUser(u: UserShape): User {
  // Boundary validation => la forme retournée est déjà “domain-friendly”.
  // On garde un mapping explicite pour rester maître de la shape.
  return {
    id: u.id,
    email: u.email,
    name: u.name ?? undefined,
    status: u.status,
    rbac: u.rbac,
    meta: u.meta,
  };
}

/* -------------------------------------------------------------------------- */
/* Repository                                                                 */
/* -------------------------------------------------------------------------- */

export class KvUsersRepository implements UsersRepository {
  private readonly redis: Redis;

  constructor() {
    this.redis = getUpstashRedis();
  }

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

  async create(input: CreateUserRecord): Promise<User> {
    const id = String(input.id ?? "").trim();
    if (!id) {
      throw new Error("KvUsersRepository.create: input.id is required.");
    }

    const emailLower = normalizeEmail(input.email);
    if (!emailLower) {
      throw new Error("KvUsersRepository.create: input.email is required.");
    }

    const password = String(input.password ?? "").trim();
    if (!password) {
      throw new Error("KvUsersRepository.create: input.password is required.");
    }

    // (défense) si index existe déjà, on refuse
    const existing = await kvCmd(kvCtx("create.checkEmail"), "get", () =>
      this.redis.get(emailIndexKey(emailLower)),
    );

    if (typeof existing === "string" && existing.trim()) {
      throw new Error("KvUsersRepository.create: email already exists.");
    }

    // On construit l'entité User complète (password stocké à part)
    const now = new Date().toISOString();

    const user: User = {
      id,
      email: emailLower,
      name: String(input.name ?? "").trim() || undefined,
      status: "active",
      rbac: input.rbac,
      meta: { createdAt: now, updatedAt: now },
    };

    // boundary validation
    UserSchema.parse(user);

    // 1) user doc
    await kvCmd(kvCtx("create.user.set"), "set", () =>
      this.redis.set(userKey(id), JSON.stringify(user)),
    );

    // 2) email index
    await kvCmd(kvCtx("create.emailIndex.set"), "set", () =>
      this.redis.set(emailIndexKey(emailLower), id),
    );

    // 3) password hash
    await this.setPassword(id, password);

    return user;
  }

  async put(user: User): Promise<void> {
    const id = String(user?.id ?? "").trim();
    if (!id) throw new Error("KvUsersRepository.put: user.id is required.");

    // boundary validation
    UserSchema.parse(user);

    // Si l'email change, on doit maintenir l'index.
    const existing = await this.readById(id);

    const nextEmail = normalizeEmail(user.email);
    const prevEmail = existing ? normalizeEmail(existing.email) : "";

    if (existing && prevEmail && nextEmail && prevEmail !== nextEmail) {
      // suppression index précédent (best-effort)
      await kvCmd(kvCtx("put.emailIndex.delOld"), "del", () =>
        this.redis.del(emailIndexKey(prevEmail)),
      );

      // écriture nouvel index
      await kvCmd(kvCtx("put.emailIndex.set"), "set", () =>
        this.redis.set(emailIndexKey(nextEmail), id),
      );
    } else if (!existing && nextEmail) {
      // cas “upsert” (rare) : s’assurer que l’index existe
      await kvCmd(kvCtx("put.emailIndex.ensure"), "set", () =>
        this.redis.set(emailIndexKey(nextEmail), id),
      );
    }

    await kvCmd(kvCtx("put.user.set"), "set", () =>
      this.redis.set(userKey(id), JSON.stringify(user)),
    );
  }

  async putMany(users: ReadonlyArray<User>): Promise<void> {
    await this.ensureBase();
    if (users.length === 0) return;

    const record: Record<string, string> = {};
    for (const u of users) {
      const id = String(u?.id ?? "").trim();
      if (!id) continue;

      UserSchema.parse(u);
      record[userKey(id)] = JSON.stringify(u);
    }

    if (Object.keys(record).length === 0) return;

    await kvCmd(kvCtx("putMany.mset"), "other", () => this.redis.mset(record));
  }

  async setPassword(userId: string, password: string): Promise<void> {
    const id = String(userId ?? "").trim();
    if (!id) throw new Error("KvUsersRepository.setPassword: userId required.");

    const pwd = String(password ?? "").trim();
    if (!pwd)
      throw new Error("KvUsersRepository.setPassword: password required.");

    const hash = await bcrypt.hash(pwd, 10);

    await kvCmd(kvCtx("setPassword.set"), "set", () =>
      this.redis.set(pwdKey(id), hash),
    );
  }

  async deleteById(userId: string): Promise<void> {
    const id = String(userId ?? "").trim();
    if (!id) return;

    // Pour retirer l’index email proprement, on lit le user (best-effort).
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
    const pattern = userKeyPattern();

    const keys = await kvCmd(kvCtx("list.keys"), "other", () =>
      this.redis.keys(pattern),
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
          name: parsed.name ?? undefined,
          status: parsed.status,
        });
      } catch {
        // skip doc corrompu
      }
    }

    // tri stable (UX admin)
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

  /**
   * Vérifie un mot de passe (hash stocké en KV).
   *
   * ⚠️ Ce n'est pas dans le port UsersRepository actuellement.
   * Tu peux :
   * - soit garder cette méthode uniquement pour l’auth infra,
   * - soit définir un port AuthUsersRepository séparé (comme aujourd’hui),
   * - soit étendre le port UsersRepository plus tard.
   */
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
