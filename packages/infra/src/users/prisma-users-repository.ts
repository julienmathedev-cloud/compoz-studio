/**
 * @file packages/infra/src/users/prisma-users-repository.ts
 * @layer infra/users
 * @description Prisma-backed UsersRepository implementation for Studio users.
 * @remarks
 * Domain RBAC uses Website wording, while Prisma stores the default website on `User.defaultWebsiteId` and website memberships in `WebsiteAccess` rows.
 */

import type {
  User,
  UserDemoMeta,
  UserRole,
  UserStatus,
  UserSummary,
} from "@compoz/core/domain/users/entities/user";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { AdminUserProvisioningTransaction } from "@compoz/core/domain/users/ports/admin-user-provisioning-transaction";
import type { UpdateAdminUserProvisioningInput } from "@compoz/core/domain/users/ports/admin-user-provisioning-transaction";
import type { UsersRepository } from "@compoz/core/domain/users/ports/users-repository";
import { Prisma } from "@compoz/infra/prisma/generated";
import type { PrismaClient } from "@compoz/infra/prisma/generated";
import { prisma } from "@compoz/infra/prisma/prisma-client";
import { UserSchema } from "@compoz/validation/users/user";
import bcrypt from "bcryptjs";

type CreateUserInput = Parameters<UsersRepository["create"]>[0];

type PrismaUserWithAccesses = {
  id: string;
  email: string;
  name: string;
  status: string;
  role: string;
  defaultWebsiteId: string | null;
  demo: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
  accesses: Array<{ websiteId: string; role: string }>;
};

function normalizeEmail(input: unknown): string {
  return String(input ?? "")
    .trim()
    .toLowerCase();
}

function normalizeId(input: unknown): string {
  return String(input ?? "")
    .trim()
    .toLowerCase();
}

function toWebsiteRole(role: UserRole): "admin" | "editor" {
  return role === "admin" ? "admin" : "editor";
}

function toDemoMeta(value: unknown): UserDemoMeta | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const candidate = value as Partial<UserDemoMeta>;

  if (
    candidate.isDemo === true &&
    typeof candidate.demoInstanceId === "string" &&
    typeof candidate.expiresAt === "string"
  ) {
    return {
      isDemo: true,
      demoInstanceId: candidate.demoInstanceId,
      expiresAt: candidate.expiresAt,
    };
  }

  return undefined;
}

function toPrismaDemoMeta(demo: UserDemoMeta): Prisma.InputJsonObject {
  return {
    isDemo: demo.isDemo,
    demoInstanceId: demo.demoInstanceId,
    expiresAt: demo.expiresAt,
  };
}

async function readPrismaUserById(client: PrismaClient, id: string) {
  return client.user.findUnique({
    where: { id },
    include: {
      accesses: {
        orderBy: [{ websiteId: "asc" }],
        select: { websiteId: true, role: true },
      },
    },
  });
}

function toDomainUser(row: PrismaUserWithAccesses): User {
  const websiteIds = row.accesses.map((access) => access.websiteId);
  const defaultWebsiteId = row.defaultWebsiteId ?? websiteIds[0] ?? "";
  const demo = toDemoMeta(row.demo);

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    status: row.status as UserStatus,
    rbac: {
      role: row.role as UserRole,
      websiteIds,
      defaultWebsiteId,
    },
    meta: {
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      ...(row.lastLoginAt
        ? { lastLoginAt: row.lastLoginAt.toISOString() }
        : {}),
    },
    ...(demo ? { demo } : {}),
  };
}

function assertValidUserForWrite(user: User, source: string): User {
  const parsed = UserSchema.parse(user);
  const defaultWebsiteId = normalizeId(parsed.rbac.defaultWebsiteId);
  const websiteIds = parsed.rbac.websiteIds.map(normalizeId).filter(Boolean);

  if (!defaultWebsiteId) {
    throw new Error(`${source}: user.rbac.defaultWebsiteId is required.`);
  }

  if (websiteIds.includes("*")) {
    throw new Error(`${source}: wildcard websiteIds are not supported.`);
  }

  if (!websiteIds.includes(defaultWebsiteId)) {
    throw new Error(
      `${source}: user.rbac.defaultWebsiteId must be included in user.rbac.websiteIds.`,
    );
  }

  return {
    ...parsed,
    email: normalizeEmail(parsed.email),
    rbac: {
      ...parsed.rbac,
      websiteIds,
      defaultWebsiteId,
    },
  };
}

function accessWebsiteIds(user: User): string[] {
  return [...new Set(user.rbac.websiteIds.map(normalizeId).filter(Boolean))];
}

function toPrismaUserData(args: {
  user: User;
  passwordHash: string;
}) {
  const { user, passwordHash } = args;
  const websiteIds = accessWebsiteIds(user);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    status: user.status,
    role: user.rbac.role,
    defaultWebsiteId: user.rbac.defaultWebsiteId,
    passwordHash,
    createdAt: new Date(user.meta.createdAt),
    updatedAt: new Date(user.meta.updatedAt),
    lastLoginAt: user.meta.lastLoginAt ? new Date(user.meta.lastLoginAt) : null,
    ...(user.demo ? { demo: toPrismaDemoMeta(user.demo) } : {}),
    accesses: {
      create: websiteIds.map((websiteId) => ({
        websiteId,
        role: toWebsiteRole(user.rbac.role),
      })),
    },
  };
}

async function provisionStandardWebsites(
  tx: Prisma.TransactionClient,
  websiteIds: ReadonlyArray<string>,
): Promise<void> {
  if (websiteIds.length === 0) return;

  const existing = await tx.website.findMany({
    where: { id: { in: [...websiteIds] } },
    select: { id: true, type: true },
  });
  const existingById = new Map(existing.map((website) => [website.id, website]));

  for (const websiteId of websiteIds) {
    const website = existingById.get(websiteId);

    if (website && website.type !== "site") {
      throw new DomainError({
        code: EC.USER_WEBSITE_IDS_INVALID,
        message: EC.USER_WEBSITE_IDS_INVALID,
        details: {
          path: ["rbac", "websiteIds"],
          meta: { websiteId, reason: "WEBSITE_NOT_ASSIGNABLE" },
        },
      });
    }
  }

  const missingIds = websiteIds.filter((websiteId) => !existingById.has(websiteId));

  if (missingIds.length > 0) {
    await tx.website.createMany({
      data: missingIds.map((websiteId) => ({
        id: websiteId,
        slug: websiteId,
        name: websiteId,
        type: "site" as const,
      })),
      skipDuplicates: true,
    });
  }

  const resolved = await tx.website.findMany({
    where: { id: { in: [...websiteIds] } },
    select: { id: true, type: true },
  });
  const resolvedById = new Map(resolved.map((website) => [website.id, website]));

  for (const websiteId of websiteIds) {
    const website = resolvedById.get(websiteId);
    const reason = !website ? "WEBSITE_SLUG_COLLISION" : "WEBSITE_NOT_ASSIGNABLE";

    if (!website || website.type !== "site") {
      throw new DomainError({
        code: EC.USER_WEBSITE_IDS_INVALID,
        message: EC.USER_WEBSITE_IDS_INVALID,
        details: {
          path: ["rbac", "websiteIds"],
          meta: { websiteId, reason },
        },
      });
    }
  }
}

export class PrismaUsersRepository
  implements UsersRepository, AdminUserProvisioningTransaction
{
  private readonly client: PrismaClient;

  constructor(opts: { client?: PrismaClient } = {}) {
    this.client = opts.client ?? prisma;
  }

  async ensureBase(): Promise<void> {
    // no-op: Prisma schema/migrations own table creation.
  }

  async readById(userId: string): Promise<User | null> {
    const id = String(userId ?? "").trim();

    if (!id) {
      return null;
    }

    const row = await readPrismaUserById(this.client, id);

    return row ? toDomainUser(row) : null;
  }

  async readByEmail(email: string): Promise<User | null> {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return null;
    }

    const row = await this.client.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        accesses: {
          orderBy: [{ websiteId: "asc" }],
          select: { websiteId: true, role: true },
        },
      },
    });

    return row ? toDomainUser(row) : null;
  }

  async create(input: CreateUserInput): Promise<User> {
    const password = String(input?.password ?? "").trim();

    if (!password) {
      throw new Error("PrismaUsersRepository.create: password is required.");
    }

    const user = assertValidUserForWrite(
      input.user,
      "PrismaUsersRepository.create",
    );
    const passwordHash = await bcrypt.hash(password, 10);
    await this.client.user.create({
      data: toPrismaUserData({ user, passwordHash }),
    });

    return user;
  }

  async put(user: User): Promise<void> {
    const next = assertValidUserForWrite(user, "PrismaUsersRepository.put");
    const websiteIds = accessWebsiteIds(next);

    await this.client.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where: { id: next.id },
        select: { id: true },
      });

      if (!existing) {
        throw new Error(
          "PrismaUsersRepository.put: invariant violation, put() was called for a missing user. Use create({ user, password }) for creation.",
        );
      }

      await tx.user.update({
        where: { id: next.id },
        data: {
          email: next.email,
          name: next.name,
          status: next.status,
          role: next.rbac.role,
          defaultWebsiteId: next.rbac.defaultWebsiteId,
          updatedAt: new Date(next.meta.updatedAt),
          lastLoginAt: next.meta.lastLoginAt
            ? new Date(next.meta.lastLoginAt)
            : null,
          demo: next.demo ? toPrismaDemoMeta(next.demo) : Prisma.JsonNull,
        },
      });

      await tx.websiteAccess.deleteMany({
        where: { userId: next.id },
      });

      if (websiteIds.length > 0) {
        await tx.websiteAccess.createMany({
          data: websiteIds.map((websiteId) => ({
            userId: next.id,
            websiteId,
            role: toWebsiteRole(next.rbac.role),
          })),
          skipDuplicates: true,
        });
      }
    });
  }

  /**
   * Persists an admin-created user and any missing standard Websites as one
   * PostgreSQL transaction. Demo provisioning intentionally keeps using
   * `create()` so it cannot create standard Websites implicitly.
   */
  async createUserWithWebsiteProvisioning(input: {
    user: User;
    password: string;
  }): Promise<User> {
    const password = String(input.password ?? "").trim();

    if (!password) {
      throw new Error(
        "PrismaUsersRepository.createUserWithWebsiteProvisioning: password is required.",
      );
    }

    const user = assertValidUserForWrite(
      input.user,
      "PrismaUsersRepository.createUserWithWebsiteProvisioning",
    );
    const passwordHash = await bcrypt.hash(password, 10);
    const websiteIds = accessWebsiteIds(user);

    await this.client.$transaction(async (tx) => {
      await provisionStandardWebsites(tx, websiteIds);
      await tx.user.create({ data: toPrismaUserData({ user, passwordHash }) });
    });

    return user;
  }

  /**
   * Persists an admin user patch atomically with RBAC Website provisioning.
   * A password hash is computed before the transaction; it is never written
   * separately from the corresponding user/access update.
   */
  async updateUserWithWebsiteProvisioning(
    input: UpdateAdminUserProvisioningInput,
  ): Promise<User> {
    const password = input.password?.trim();
    const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;

    return this.client.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where: { id: input.userId },
        include: {
          accesses: {
            orderBy: [{ websiteId: "asc" }],
            select: { websiteId: true, role: true },
          },
        },
      });

      if (!existing) {
        throw new DomainError({
          code: EC.USER_NOT_FOUND,
          message: EC.USER_NOT_FOUND,
          details: { path: ["userId"], meta: { userId: input.userId } },
        });
      }

      const data: Prisma.UserUpdateInput = {
        updatedAt: new Date(input.updatedAt),
      };
      const scalarChanges = input.scalarChanges;

      if (scalarChanges?.email && scalarChanges.email !== existing.email) {
        const conflict = await tx.user.findUnique({
          where: { email: scalarChanges.email },
          select: { id: true },
        });

        if (conflict && conflict.id !== input.userId) {
          throw new DomainError({
            code: EC.USER_EMAIL_CONFLICT,
            message: EC.USER_EMAIL_CONFLICT,
            details: { path: ["email"], meta: { email: scalarChanges.email } },
          });
        }
      }

      if (scalarChanges?.email) data.email = scalarChanges.email;
      if (scalarChanges?.name) data.name = scalarChanges.name;
      if (scalarChanges?.status) data.status = scalarChanges.status;
      if (passwordHash) data.passwordHash = passwordHash;

      const rbacChange = input.rbacChange;
      const websiteIds = rbacChange ? [...rbacChange.websiteIds] : [];

      if (rbacChange) {
        await provisionStandardWebsites(tx, websiteIds);
        data.role = rbacChange.role;
        data.defaultWebsiteId = rbacChange.defaultWebsiteId;
      }

      await tx.user.update({
        where: { id: input.userId },
        data,
      });

      if (rbacChange) {
        await tx.websiteAccess.deleteMany({ where: { userId: input.userId } });
        await tx.websiteAccess.createMany({
          data: websiteIds.map((websiteId) => ({
            userId: input.userId,
            websiteId,
            role: toWebsiteRole(rbacChange.role),
          })),
        });
      }

      const updated = await tx.user.findUniqueOrThrow({
        where: { id: input.userId },
        include: {
          accesses: {
            orderBy: [{ websiteId: "asc" }],
            select: { websiteId: true, role: true },
          },
        },
      });

      return toDomainUser(updated);
    });
  }

  async putMany(users: ReadonlyArray<User>): Promise<void> {
    for (const user of users) {
      await this.put(user);
    }
  }

  async setPassword(userId: string, password: string): Promise<void> {
    const id = String(userId ?? "").trim();
    const pwd = String(password ?? "").trim();

    if (!id || !pwd) {
      return;
    }

    const existing = await this.client.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return;
    }

    const passwordHash = await bcrypt.hash(pwd, 10);

    await this.client.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const id = String(userId ?? "").trim();

    if (!id) {
      return false;
    }

    const row = await this.client.user.findUnique({
      where: { id },
      select: { passwordHash: true },
    });

    const hash = row?.passwordHash ?? "";

    if (!hash) {
      return false;
    }

    return bcrypt.compare(String(password ?? ""), hash);
  }

  async deleteById(userId: string): Promise<void> {
    const id = String(userId ?? "").trim();

    if (!id) {
      return;
    }

    await this.client.user.deleteMany({
      where: { id },
    });
  }

  async deleteByEmail(email: string): Promise<void> {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return;
    }

    await this.client.user.deleteMany({
      where: { email: normalizedEmail },
    });
  }

  async existsById(userId: string): Promise<boolean> {
    const id = String(userId ?? "").trim();

    if (!id) {
      return false;
    }

    const count = await this.client.user.count({ where: { id } });

    return count > 0;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return false;
    }

    const count = await this.client.user.count({
      where: { email: normalizedEmail },
    });

    return count > 0;
  }

  async list(): Promise<ReadonlyArray<UserSummary>> {
    const rows = await this.client.user.findMany({
      orderBy: [{ email: "asc" }],
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
      },
    });

    return rows.map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      status: row.status as UserStatus,
    }));
  }

  async readManyById(ids: ReadonlyArray<string>): Promise<Array<User | null>> {
    const normalizedIds = ids.map((id) => String(id ?? "").trim());
    const uniqueIds = [...new Set(normalizedIds.filter(Boolean))];

    if (uniqueIds.length === 0) {
      return normalizedIds.map(() => null);
    }

    const rows = await this.client.user.findMany({
      where: { id: { in: uniqueIds } },
      include: {
        accesses: {
          orderBy: [{ websiteId: "asc" }],
          select: { websiteId: true, role: true },
        },
      },
    });

    const byId = new Map(rows.map((row) => [row.id, toDomainUser(row)]));

    return normalizedIds.map((id) => (id ? (byId.get(id) ?? null) : null));
  }
}
