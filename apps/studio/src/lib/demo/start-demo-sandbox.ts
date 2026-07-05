/**
 * @file apps/studio/src/lib/demo/start-demo-sandbox.ts
 * @layer studio/lib/demo
 *
 * @description
 * Composition serveur du démarrage de sandbox démo.
 *
 * @remarks
 * - Branche les dépendances infra + auth nécessaires au use-case
 *   `startDemoSandbox`.
 * - Point d’entrée serveur réutilisable par la future route `/demo/start`.
 * - Ne gère pas encore les cookies HTTP, la session NextAuth
 *   ni la redirection finale.
 * - La sandbox démo est créée depuis un Website seed explicite.
 */

import "server-only";

import {
  DEMO_SANDBOX_TTL_MS,
  DEMO_SEED_WEBSITE_ID,
} from "@compoz/core/constants/demo/demo";
import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { DemoSandbox } from "@compoz/core/domain/demo/entities/demo-sandbox";
import type { DemoSandboxRepository } from "@compoz/core/domain/demo/ports/demo-sandbox-repository";
import type {
  DemoSandboxCloneResult,
  DemoSandboxCloner,
  DemoSandboxSeedReader,
} from "@compoz/core/domain/demo/use-cases/create-demo-sandbox-from-seed.types";
import { createDemoSandboxFromSeed } from "@compoz/core/domain/demo/use-cases/create-demo-sandbox-from-seed";
import { findReusableDemoSandbox } from "@compoz/core/domain/demo/use-cases/find-reusable-demo-sandbox";
import { registerDemoSandbox } from "@compoz/core/domain/demo/use-cases/register-demo-sandbox";
import { startDemoSandbox } from "@compoz/core/domain/demo/use-cases/start-demo-sandbox";
import type { Page } from "@compoz/core/domain/pages/entities/page";

import { getPagesRepository } from "@compoz/infra/pages";
import { createUuidV7IdGenerator } from "@compoz/infra/id/uuidv7";
import { prisma } from "@compoz/infra/prisma/prisma-client";
import { getSiteRepository } from "@compoz/infra/site";
import { getUsersRepository } from "@compoz/infra/users";
import { buildDemoUserPassword } from "@compoz/studio/auth/demo-auth";

type RunStartDemoSandboxInput = Readonly<{
  demoInstanceId?: string;
}>;

function requirePrismaRepoImpl(name: string): void {
  const value = String(process.env[name] ?? "")
    .trim()
    .toLowerCase();

  if (value !== "prisma") {
    throw new Error(
      `runStartDemoSandbox: ${name}=prisma is required for the Prisma demo flow.`,
    );
  }
}

function hasUsableSeedPages(
  pages: ReadonlyArray<{ id: string | null | undefined }> | undefined,
): boolean {
  if (!Array.isArray(pages) || pages.length === 0) {
    return false;
  }

  return pages.some((page) => String(page?.id ?? "").trim().length > 0);
}

function getPageIdsFromIndex(
  pages: ReadonlyArray<{ id: string | null | undefined }> | undefined,
): string[] {
  if (!Array.isArray(pages) || pages.length === 0) {
    return [];
  }

  const seen = new Set<string>();
  const out: string[] = [];

  for (const page of pages) {
    const pageId = String(page?.id ?? "").trim();

    if (!pageId || seen.has(pageId)) {
      continue;
    }

    seen.add(pageId);
    out.push(pageId);
  }

  return out;
}

function assertAllPagesResolved(
  pageIds: ReadonlyArray<string>,
  pages: ReadonlyArray<Page | null>,
): Page[] {
  const out: Page[] = [];

  for (let index = 0; index < pageIds.length; index += 1) {
    const page = pages[index];

    if (!page) {
      throw new Error(
        `PrismaDemoSandboxCloner.cloneSeedToWebsite: missing seed page "${pageIds[index]}".`,
      );
    }

    if (page.id !== pageIds[index]) {
      throw new Error(
        `PrismaDemoSandboxCloner.cloneSeedToWebsite: seed page order mismatch for "${pageIds[index]}".`,
      );
    }

    out.push(page);
  }

  return out;
}

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

class PrismaDemoSeedReader implements DemoSandboxSeedReader {
  async readSeedSnapshot(
    seedWebsiteId: string,
  ): Promise<{ websiteId: string }> {
    const websiteId = normalizeWebsiteId(seedWebsiteId);

    if (!websiteId) {
      throw new Error(
        "PrismaDemoSeedReader.readSeedSnapshot: websiteId is required.",
      );
    }

    const website = await prisma.website.findFirst({
      where: {
        id: websiteId,
        type: "site",
      },
      select: {
        id: true,
      },
    });

    if (!website) {
      throw new Error(
        "PrismaDemoSeedReader.readSeedSnapshot: demo seed website not found.",
      );
    }

    const site = getSiteRepository({ websiteId });
    const index = await site.readIndex(CONTENT_STATE.PUBLISHED);

    if (!hasUsableSeedPages(index.pages)) {
      throw new Error(
        "PrismaDemoSeedReader.readSeedSnapshot: demo seed is empty or invalid.",
      );
    }

    return { websiteId: website.id };
  }
}

class PrismaDemoSandboxCloner implements DemoSandboxCloner {
  async cloneSeedToWebsite(args: {
    sourceWebsiteId: string;
    targetWebsiteId: string;
  }): Promise<DemoSandboxCloneResult> {
    const sourceWebsiteId = normalizeWebsiteId(args.sourceWebsiteId);
    const targetWebsiteId = normalizeWebsiteId(args.targetWebsiteId);

    if (!sourceWebsiteId) {
      throw new Error(
        "PrismaDemoSandboxCloner.cloneSeedToWebsite: sourceWebsiteId is required.",
      );
    }

    if (!targetWebsiteId) {
      throw new Error(
        "PrismaDemoSandboxCloner.cloneSeedToWebsite: targetWebsiteId is required.",
      );
    }

    const sourceWebsite = await prisma.website.findFirst({
      where: {
        id: sourceWebsiteId,
        type: "site",
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!sourceWebsite) {
      throw new Error(
        "PrismaDemoSandboxCloner.cloneSeedToWebsite: source website not found.",
      );
    }

    const sourceSite = getSiteRepository({ websiteId: sourceWebsiteId });
    const sourcePages = getPagesRepository({ websiteId: sourceWebsiteId });

    const [settings, index] = await Promise.all([
      sourceSite.readSettings(CONTENT_STATE.PUBLISHED),
      sourceSite.readIndex(CONTENT_STATE.PUBLISHED),
    ]);

    if (!settings) {
      throw new Error(
        "PrismaDemoSandboxCloner.cloneSeedToWebsite: source settings not found.",
      );
    }

    const pageIds = getPageIdsFromIndex(index.pages);

    const rawPages =
      pageIds.length > 0
        ? await sourcePages.readManyById(CONTENT_STATE.PUBLISHED, pageIds)
        : [];

    const pages = assertAllPagesResolved(pageIds, rawPages);

    try {
      await prisma.website.create({
        data: {
          id: targetWebsiteId,
          slug: targetWebsiteId,
          name: `${sourceWebsite.name} demo`,
          type: "sandbox",
          sourceWebsiteId: sourceWebsite.id,
        },
      });

      const targetSite = getSiteRepository({ websiteId: targetWebsiteId });
      const targetPages = getPagesRepository({ websiteId: targetWebsiteId });

      await targetSite.ensureBase();
      await targetPages.ensureBase();

      await targetSite.putSettings(CONTENT_STATE.DRAFT, settings);

      if (pages.length > 0) {
        await targetPages.putMany(CONTENT_STATE.DRAFT, pages);
      }

      await targetSite.putIndex(CONTENT_STATE.DRAFT, index);
    } catch (error) {
      await this.deleteSandboxWebsite(targetWebsiteId).catch(() => undefined);

      throw error;
    }

    return {
      websiteId: targetWebsiteId,
    };
  }

  async deleteSandboxWebsite(websiteId: string): Promise<void> {
    const targetWebsiteId = normalizeWebsiteId(websiteId);

    if (!targetWebsiteId) {
      return;
    }

    const mediaAssets = await prisma.mediaAsset.count({
      where: {
        websiteId: targetWebsiteId,
      },
    });

    if (mediaAssets > 0) {
      return;
    }

    await prisma.website.deleteMany({
      where: {
        id: targetWebsiteId,
        type: "sandbox",
      },
    });
  }
}

class PrismaDemoSandboxRepository implements DemoSandboxRepository {
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

  async put(sandbox: DemoSandbox): Promise<void> {
    const demoInstanceId = normalizeDemoInstanceId(sandbox.demoInstanceId);
    const userId = String(sandbox.userId ?? "").trim();
    const websiteId = normalizeWebsiteId(sandbox.websiteId);
    const expiresAt = new Date(sandbox.expiresAt);
    const createdAt = new Date(sandbox.createdAt);

    if (!demoInstanceId || !userId || !websiteId) {
      throw new Error("PrismaDemoSandboxRepository.put: sandbox is incomplete.");
    }

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

export async function runStartDemoSandbox({
  demoInstanceId,
}: RunStartDemoSandboxInput) {
  requirePrismaRepoImpl("USERS_REPO_IMPL");
  requirePrismaRepoImpl("SITE_REPO_IMPL");
  requirePrismaRepoImpl("PAGES_REPO_IMPL");

  const users = getUsersRepository();
  const demoSandboxes = new PrismaDemoSandboxRepository();
  const seedReader = new PrismaDemoSeedReader();
  const sandboxCloner = new PrismaDemoSandboxCloner();

  const createSandbox = createDemoSandboxFromSeed({
    users,
    idGenerator: createUuidV7IdGenerator(),
    seedReader,
    sandboxCloner,
    passwordBuilder: {
      buildDemoUserPassword,
    },
  });

  const findReusableSandbox = findReusableDemoSandbox({
    demoSandboxes,
    users,
  });

  const registerSandbox = registerDemoSandbox({
    demoSandboxes,
  });

  const run = startDemoSandbox({
    findReusableDemoSandbox: findReusableSandbox,
    createDemoSandboxFromSeed: createSandbox,
    registerDemoSandbox: registerSandbox,
    ttlMs: DEMO_SANDBOX_TTL_MS,
  });

  return run({
    seedWebsiteId: DEMO_SEED_WEBSITE_ID,
    demoInstanceId,
  });
}
