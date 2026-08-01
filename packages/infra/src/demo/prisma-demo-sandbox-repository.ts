/**
 * @file packages/infra/src/demo/prisma-demo-sandbox-repository.ts
 * @layer infra/demo
 * @description Prisma repository for demo sandbox metadata.
 */

import type { DemoSandbox } from "@compoz/core/domain/demo/entities/demo-sandbox";
import { assertDemoSandboxWebsiteIdentity } from "@compoz/core/domain/demo/assert-demo-sandbox-website-identity";
import type { DemoSandboxRepository } from "@compoz/core/domain/demo/ports/demo-sandbox-repository";

import { prisma } from "@compoz/infra/prisma/prisma-client";

function normalizeWebsiteId(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function normalizeDemoInstanceId(value: unknown): string {
  return String(value ?? "").trim();
}

function toDomainSandbox(row: {
  demoInstanceId: string;
  userId: string;
  websiteId: string;
  expiresAt: Date;
  createdAt: Date;
}): DemoSandbox {
  return {
    demoInstanceId: row.demoInstanceId,
    userId: row.userId,
    websiteId: row.websiteId,
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export class PrismaDemoSandboxRepository implements DemoSandboxRepository {
  async ensureBase(): Promise<void> {
    // Prisma schema/migrations own table creation.
  }

  async list(): Promise<ReadonlyArray<DemoSandbox>> {
    const rows = await prisma.demoSandbox.findMany({
      orderBy: [{ expiresAt: "asc" }],
    });

    return rows.map(toDomainSandbox);
  }

  async readByDemoInstanceId(
    demoInstanceId: string,
  ): Promise<DemoSandbox | null> {
    const id = normalizeDemoInstanceId(demoInstanceId);

    if (!id) {
      return null;
    }

    const row = await prisma.demoSandbox.findUnique({
      where: {
        demoInstanceId: id,
      },
    });

    return row ? toDomainSandbox(row) : null;
  }

  async readWebsiteById(websiteId: string) {
    const id = normalizeWebsiteId(websiteId);

    if (!id) return null;

    const row = await prisma.website.findUnique({
      where: { id },
      select: { id: true, type: true, expiresAt: true },
    });

    return row
      ? {
          id: row.id,
          type: row.type,
          expiresAt: row.expiresAt?.toISOString() ?? null,
        }
      : null;
  }

  async put(sandbox: DemoSandbox): Promise<void> {
    const demoInstanceId = normalizeDemoInstanceId(sandbox.demoInstanceId);
    const userId = String(sandbox.userId ?? "").trim();
    const websiteId = normalizeWebsiteId(sandbox.websiteId);
    const expiresAt = new Date(sandbox.expiresAt);
    const createdAt = new Date(sandbox.createdAt);

    if (!demoInstanceId || !userId || !websiteId) {
      throw new Error(
        "PrismaDemoSandboxRepository.put: sandbox is incomplete.",
      );
    }

    assertDemoSandboxWebsiteIdentity({ demoInstanceId, websiteId });

    if (
      Number.isNaN(expiresAt.getTime()) ||
      Number.isNaN(createdAt.getTime())
    ) {
      throw new Error("PrismaDemoSandboxRepository.put: invalid dates.");
    }

    await prisma.$transaction([
      prisma.website.update({
        where: { id: websiteId },
        data: { expiresAt },
      }),
      prisma.demoSandbox.upsert({
        where: { demoInstanceId },
        create: {
          demoInstanceId,
          userId,
          websiteId,
          expiresAt,
          createdAt,
        },
        update: {
          userId,
          websiteId,
          expiresAt,
        },
      }),
    ]);
  }

  async deleteByDemoInstanceId(demoInstanceId: string): Promise<void> {
    const id = normalizeDemoInstanceId(demoInstanceId);

    if (!id) {
      return;
    }

    await prisma.demoSandbox.deleteMany({
      where: {
        demoInstanceId: id,
      },
    });
  }

  async existsByDemoInstanceId(demoInstanceId: string): Promise<boolean> {
    const id = normalizeDemoInstanceId(demoInstanceId);

    if (!id) {
      return false;
    }

    const count = await prisma.demoSandbox.count({
      where: {
        demoInstanceId: id,
      },
    });

    return count > 0;
  }
}
