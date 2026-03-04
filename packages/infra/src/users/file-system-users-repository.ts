/**
 * @file packages/infra/src/users/file-system-users-repository.ts
 * @layer infra/users
 * @description
 * Implémentation FileSystem du UsersRepository : lecture, écriture, suppression,
 * listing et gestion des credentials (password hash) sur disque.
 *
 * Stockage V1-like :
 * - User (sans password)     : `<userId>.json`
 * - Password hash (infra)    : `passwords/<userId>.json`
 *
 * Responsabilités :
 * - défense contre ids non sûrs, gestion ENOENT
 * - JSON invalide (skip en list / throw en readById)
 * - normalisation email en lower-case côté infra (lookup / index scan)
 */

import { promises as fs } from "node:fs";
import { join } from "node:path";

import type {
  User,
  UserSummary,
} from "@compoz/core/domain/users/entities/user";
import type {
  CreateUserRecord,
  UsersRepository,
} from "@compoz/core/domain/users/ports/users-repository";

import { isENOENT } from "@compoz/infra/lib/errors";
import {
  ensureDirForFile,
  InvalidJsonFileError,
  readJsonFile,
  writeFileAtomic,
} from "@compoz/infra/lib/fs";
import { log, logSpan } from "@compoz/infra/lib/log";

// ⚠️ bcryptjs (même choix que l’InMemory). Si tu as déjà un helper crypto infra, on pourra le centraliser.
import bcrypt from "bcryptjs";

const lg = log.child({ ns: "infra:users", kind: "fs" });

/**
 * Défense FS : un id ne doit pas permettre de traversée de chemin.
 *
 * @remarks
 * - On reste permissif (uuid/cuid/nanoid) : alnum + `_` + `-`
 */
function assertSafeUserId(userId: string) {
  const id = String(userId ?? "").trim();
  const ok = /^[a-zA-Z0-9_-]+$/.test(id);
  if (!ok) {
    throw new Error(`Unsafe userId: "${userId}"`);
  }
}

function normalizeEmail(input: unknown): string {
  return String(input ?? "")
    .trim()
    .toLowerCase();
}

function nowIso(): string {
  return new Date().toISOString();
}

/* -------------------------------------------------------------------------- */
/* File shapes                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Shape persistée côté FS pour un User.
 * -> On persiste l’entité `User` telle quelle (sans password).
 */
type UserFileShape = User;

/**
 * Shape persistée côté FS pour un password hash.
 */
type PasswordFileShape = Readonly<{
  userId: string;
  algo: "bcrypt";
  hash: string;
  updatedAt: string;
}>;

/* -------------------------------------------------------------------------- */
/* Repository                                                                 */
/* -------------------------------------------------------------------------- */

export class FileSystemUsersRepository implements UsersRepository {
  /** Racine des contenus (ex: /app/content). */
  private readonly root: string;

  constructor(contentRoot = join(process.cwd(), "content")) {
    this.root = contentRoot;
  }

  private usersDir() {
    return join(this.root, "users");
  }

  private passwordsDir() {
    return join(this.usersDir(), "passwords");
  }

  private userFileById(userId: string) {
    assertSafeUserId(userId);
    return join(this.usersDir(), `${userId}.json`);
  }

  private passwordFileById(userId: string) {
    assertSafeUserId(userId);
    return join(this.passwordsDir(), `${userId}.json`);
  }

  async ensureBase(): Promise<void> {
    return logSpan(
      "infra.users.fs.ensureBase",
      { ns: "infra:users", kind: "fs" },
      async () => {
        await ensureDirForFile(this.userFileById("placeholder"));
        await ensureDirForFile(this.passwordFileById("placeholder"));
        lg.debug("ensureBase.ok");
      },
    );
  }

  /* -------------------------------------------------------------------------- */
  /* Reads                                                                      */
  /* -------------------------------------------------------------------------- */

  async readById(userId: string): Promise<User | null> {
    const id = String(userId ?? "").trim();
    if (!id) return null;

    const path = this.userFileById(id);

    return logSpan("infra.users.fs.readById", { userId: id }, async () => {
      try {
        const raw = await readJsonFile<unknown>(path);

        // Défense légère : on attend au moins { id, email, rbac, status, meta }
        const u = raw as Partial<UserFileShape> | null;

        if (!u || typeof u !== "object") {
          throw new InvalidJsonFileError(path, "Invalid user JSON shape.");
        }

        const parsedId = String(u.id ?? "").trim();
        if (!parsedId) {
          throw new InvalidJsonFileError(path, "Missing user.id.");
        }

        if (parsedId !== id) {
          lg.warn("readById.id_mismatch", {
            userId: id,
            parsedId,
          });
        }

        // Normalise email au read (cohérence)
        const email = normalizeEmail(u.email);

        const user: User = {
          id: parsedId,
          email,
          name: typeof u.name === "string" ? u.name : undefined,
          status: (u.status ?? "active") as User["status"],
          rbac: u.rbac as User["rbac"],
          meta: u.meta as User["meta"],
        };

        return user;
      } catch (e) {
        if (isENOENT(e)) return null;

        if (e instanceof InvalidJsonFileError) {
          lg.warn("readById.invalid_json", { path: e.path });
        } else {
          lg.warn("readById.failed", { userId: id, err: String(e) });
        }

        throw e;
      }
    });
  }

  async readByEmail(email: string): Promise<User | null> {
    const target = normalizeEmail(email);
    if (!target) return null;

    // V0.5 FS : scan best-effort (comme pages.readBySlug)
    const found = await this.__findByEmail(target);
    if (!found) return null;

    return this.readById(found.id);
  }

  async readManyById(ids: ReadonlyArray<string>): Promise<Array<User | null>> {
    const safeIds = ids.map((x) => String(x ?? "").trim());

    return Promise.all(
      safeIds.map((id) => (id ? this.readById(id) : Promise.resolve(null))),
    );
  }

  /* -------------------------------------------------------------------------- */
  /* Writes                                                                     */
  /* -------------------------------------------------------------------------- */

  async create(input: CreateUserRecord): Promise<User> {
    const id = String(input?.id ?? "").trim();
    const email = normalizeEmail(input?.email);
    const name = String(input?.name ?? "").trim();
    const password = String(input?.password ?? "").trim();

    if (!id || !email || !password) {
      throw new Error("FileSystemUsersRepository.create: invalid input.");
    }

    assertSafeUserId(id);

    await this.ensureBase();

    const at = nowIso();

    const user: User = {
      id,
      email,
      name: name || undefined,
      status: "active",
      rbac: input.rbac,
      meta: { createdAt: at, updatedAt: at },
    };

    const hash = await bcrypt.hash(password, 10);

    const userPath = this.userFileById(id);
    const pwdPath = this.passwordFileById(id);

    return logSpan("infra.users.fs.create", { userId: id, email }, async () => {
      await writeFileAtomic(userPath, JSON.stringify(user, null, 2), "utf-8");

      const pwdDoc: PasswordFileShape = {
        userId: id,
        algo: "bcrypt",
        hash,
        updatedAt: at,
      };

      await writeFileAtomic(pwdPath, JSON.stringify(pwdDoc, null, 2), "utf-8");

      return user;
    });
  }

  async put(user: User): Promise<void> {
    const id = String(user?.id ?? "").trim();
    if (!id) return;

    assertSafeUserId(id);

    await this.ensureBase();

    const path = this.userFileById(id);

    return logSpan(
      "infra.users.fs.put",
      { userId: id, email: user.email },
      async () => {
        const next: User = {
          ...user,
          email: normalizeEmail(user.email),
        };

        await writeFileAtomic(path, JSON.stringify(next, null, 2), "utf-8");
      },
    );
  }

  async putMany(users: ReadonlyArray<User>): Promise<void> {
    if (users.length === 0) return;

    await this.ensureBase();
    await Promise.all(users.map((u) => this.put(u)));
  }

  async setPassword(userId: string, password: string): Promise<void> {
    const id = String(userId ?? "").trim();
    const pwd = String(password ?? "").trim();
    if (!id || !pwd) return;

    assertSafeUserId(id);

    await this.ensureBase();

    // Idempotent-ish : si user absent → no-op
    const existing = await this.readById(id);
    if (!existing) return;

    const hash = await bcrypt.hash(pwd, 10);
    const path = this.passwordFileById(id);

    const doc: PasswordFileShape = {
      userId: id,
      algo: "bcrypt",
      hash,
      updatedAt: nowIso(),
    };

    await writeFileAtomic(path, JSON.stringify(doc, null, 2), "utf-8");
  }

  /* -------------------------------------------------------------------------- */
  /* Deletes                                                                    */
  /* -------------------------------------------------------------------------- */

  async deleteById(userId: string): Promise<void> {
    const id = String(userId ?? "").trim();
    if (!id) return;

    assertSafeUserId(id);

    const userPath = this.userFileById(id);
    const pwdPath = this.passwordFileById(id);

    return logSpan("infra.users.fs.deleteById", { userId: id }, async () => {
      try {
        await fs.unlink(userPath);
      } catch (e) {
        if (!isENOENT(e)) throw e;
      }

      try {
        await fs.unlink(pwdPath);
      } catch (e) {
        if (!isENOENT(e)) throw e;
      }
    });
  }

  async deleteByEmail(email: string): Promise<void> {
    const target = normalizeEmail(email);
    if (!target) return;

    const found = await this.__findByEmail(target);
    if (!found) return;

    await this.deleteById(found.id);
  }

  /* -------------------------------------------------------------------------- */
  /* Exists                                                                     */
  /* -------------------------------------------------------------------------- */

  async existsById(userId: string): Promise<boolean> {
    const id = String(userId ?? "").trim();
    if (!id) return false;

    try {
      await fs.stat(this.userFileById(id));
      return true;
    } catch {
      return false;
    }
  }

  async existsByEmail(email: string): Promise<boolean> {
    const target = normalizeEmail(email);
    if (!target) return false;

    const found = await this.__findByEmail(target);
    return Boolean(found?.id);
  }

  /* -------------------------------------------------------------------------- */
  /* List                                                                       */
  /* -------------------------------------------------------------------------- */

  async list(): Promise<ReadonlyArray<UserSummary>> {
    const dir = this.usersDir();

    return logSpan("infra.users.fs.list", {}, async () => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        // ⚠️ On exclut le dossier "passwords"
        const jsonFiles = entries.filter(
          (e) =>
            e.isFile() &&
            e.name.endsWith(".json") &&
            e.name !== "placeholder.json",
        );

        const results = await Promise.all(
          jsonFiles.map(async (e) => {
            const filePath = join(dir, e.name);

            try {
              const raw = await readJsonFile<unknown>(filePath);
              const u = raw as Partial<UserFileShape> | null;
              if (!u || typeof u !== "object") return null;

              const id = String(u.id ?? "").trim();
              const email = normalizeEmail(u.email);

              if (!id || !email) return null;
              const name = typeof u.name === "string" ? u.name : undefined;

              return {
                id,
                email,
                ...(name ? { name } : {}),
                status: (u.status ?? "active") as UserSummary["status"],
              } satisfies UserSummary;
            } catch (err) {
              if (err instanceof InvalidJsonFileError) {
                lg.warn("list.invalid_json", { path: err.path });
                return null;
              }
              lg.warn("list.skip", { path: filePath, err: String(err) });
              return null;
            }
          }),
        );

        // Tri stable utile (admin UI/tests)
        return results
          .filter((x): x is UserSummary => x != null)
          .sort((a, b) => a.email.localeCompare(b.email));
      } catch (e) {
        if (isENOENT(e)) return [];
        throw e;
      }
    });
  }

  /* -------------------------------------------------------------------------- */
  /* Internals                                                                  */
  /* -------------------------------------------------------------------------- */

  private async __findByEmail(
    emailLower: string,
  ): Promise<{ id: string; email: string } | null> {
    const dir = this.usersDir();

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const jsonFiles = entries.filter(
        (e) => e.isFile() && e.name.endsWith(".json"),
      );

      for (const e of jsonFiles) {
        const filePath = join(dir, e.name);

        try {
          const raw = await readJsonFile<unknown>(filePath);
          const u = raw as Partial<UserFileShape> | null;
          if (!u || typeof u !== "object") continue;

          const email = normalizeEmail(u.email);
          if (email && email === emailLower) {
            const id = String(u.id ?? "").trim();
            if (!id) return null;
            return { id, email };
          }
        } catch {
          // scan best-effort : ignore invalid JSON
        }
      }

      return null;
    } catch (e) {
      if (isENOENT(e)) return null;
      throw e;
    }
  }
}
