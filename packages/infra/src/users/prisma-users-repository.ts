/**
 * @file packages/infra/src/users/prisma-users-repository.ts
 * @layer infra/users
 * @description
 * Prisma implementation of the UsersRepository.
 *
 * The domain still uses tenant wording. In Prisma, tenant ids are Website ids:
 * - User.defaultWebsiteId -> rbac.defaultTenantId
 * - WebsiteAccess.websiteId -> rbac.tenantIds
 */

import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

import type {
  User,
  UserDemoMeta,
  UserRole,
  UserStatus,
  UserSummary,
} from "@compoz/core/domain/users/entities/user";
import type { UsersRepository } from "@compoz/core/domain/users/ports/users-repository";

import { prisma } from "@compoz/infra/prisma/prisma-client";
import { UserSchema } from "@compoz/validation/users/user";

type CreateUserInput = Parameters<UsersRepository["create"]>[0];

type PrismaUserWithAccesses = Awaited<ReturnType<typeof readPrismaUserById>>;

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

async function readPrismaUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      accesses: {
        orderBy: [{ websiteId: "asc" }],
        select: { websiteId: true, role: true },
      },
    },
  });
}

function toDomainUser(row: NonNullable<PrismaUserWithAccesses>): User {
  const tenantIds = row.accesses.map((access) => access.websiteId);
  const defaultTenantId = row.defaultWebsiteId ?? tenantIds[0] ?? "";

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    status: row.status as UserStatus,
    rbac: {
      role: row.role as UserRole,
      tenantIds,
      defaultTenantId,
    },
    meta: {
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      ...(row.lastLoginAt
        ? { lastLoginAt: row.lastLoginAt.toISOString() }
        : {}),
    },
    ...(toDemoMeta(row.demo) ? { demo: toDemoMeta(row.demo) } : {}),
  };
}

function assertValidUserForWrite(user: User, source: string): User {
  const parsed = UserSchema.parse(user);
  const defaultTenantId = normalizeId(parsed.rbac.defaultTenantId);
  const tenantIds = parsed.rbac.tenantIds.map(normalizeId).filter(Boolean);

  if (!defaultTenantId) {
    throw new Error(`${source}: user.rbac.defaultTenantId is required.`);
  }

  if (tenantIds.includes("*")) {
    throw new Error(`${source}: wildcard tenantIds are not supported.`);
  }

  if (!tenantIds.includes(defaultTenantId)) {
    throw new Error(
      `${source}: user.rbac.defaultTenantId must be included in user.rbac.tenantIds.`,
    );
  }

  return {
    ...parsed,
    email: normalizeEmail(parsed.email),
    rbac: {
      ...parsed.rbac,
      tenantIds,
      defaultTenantId,
    },
  };
}

function accessWebsiteIds(user: User): string[] {
  return [...new Set(user.rbac.tenantIds.map(normalizeId).filter(Boolean))];
}

export class PrismaUsersRepository implements UsersRepository {
  async ensureBase(): Promise<void> {
    // no-op: Prisma schema/migrations own table creation.
  }

  async readById(userId: string): Promise<User | null> {
    const id = String(userId ?? "").trim();
    if (!id) return null;

    const row = await readPrismaUserById(id);
    return row ? toDomainUser(row) : null;
  }

  async readByEmail(email: string): Promise<User | null> {
    const e = normalizeEmail(email);
    if (!e) return null;

    const row = await prisma.user.findUnique({
      where: { email: e },
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
    const websiteIds = accessWebsiteIds(user);

    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
        role: user.rbac.role,
        defaultWebsiteId: user.rbac.defaultTenantId,
        passwordHash,
        createdAt: new Date(user.meta.createdAt),
        updatedAt: new Date(user.meta.updatedAt),
        lastLoginAt: user.meta.lastLoginAt
          ? new Date(user.meta.lastLoginAt)
          : null,
        ...(user.demo ? { demo: toPrismaDemoMeta(user.demo) } : {}),
        accesses: {
          create: websiteIds.map((websiteId) => ({
            websiteId,
            role: toWebsiteRole(user.rbac.role),
          })),
        },
      },
    });

    return user;
  }

  async put(user: User): Promise<void> {
    const next = assertValidUserForWrite(user, "PrismaUsersRepository.put");
    const websiteIds = accessWebsiteIds(next);

    await prisma.$transaction(async (tx) => {
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
          defaultWebsiteId: next.rbac.defaultTenantId,
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

  async putMany(users: ReadonlyArray<User>): Promise<void> {
    for (const user of users) {
      await this.put(user);
    }
  }

  async setPassword(userId: string, password: string): Promise<void> {
    const id = String(userId ?? "").trim();
    const pwd = String(password ?? "").trim();
    if (!id || !pwd) return;

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) return;

    const passwordHash = await bcrypt.hash(pwd, 10);

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const id = String(userId ?? "").trim();
    if (!id) return false;

    const row = await prisma.user.findUnique({
      where: { id },
      select: { passwordHash: true },
    });

    const hash = row?.passwordHash ?? "";
    if (!hash) return false;

    return bcrypt.compare(String(password ?? ""), hash);
  }

  async deleteById(userId: string): Promise<void> {
    const id = String(userId ?? "").trim();
    if (!id) return;

    await prisma.user.deleteMany({
      where: { id },
    });
  }

  async deleteByEmail(email: string): Promise<void> {
    const e = normalizeEmail(email);
    if (!e) return;

    await prisma.user.deleteMany({
      where: { email: e },
    });
  }

  async existsById(userId: string): Promise<boolean> {
    const id = String(userId ?? "").trim();
    if (!id) return false;

    const count = await prisma.user.count({ where: { id } });
    return count > 0;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const e = normalizeEmail(email);
    if (!e) return false;

    const count = await prisma.user.count({ where: { email: e } });
    return count > 0;
  }

  async list(): Promise<ReadonlyArray<UserSummary>> {
    const rows = await prisma.user.findMany({
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

    const rows = await prisma.user.findMany({
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
