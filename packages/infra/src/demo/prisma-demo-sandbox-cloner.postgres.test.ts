/**
 * @file packages/infra/src/demo/prisma-demo-sandbox-cloner.postgres.test.ts
 * @layer infra/demo
 * @description Real PostgreSQL proofs for scoped demo Website cloning and rollback.
 */

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { DEFAULT_FOOTER_SETTINGS } from "@compoz/core/domain/site/defaults/footer";
import { DEFAULT_HEADER_SETTINGS } from "@compoz/core/domain/site/defaults/header";
import { DEFAULT_IDENTITY_SETTINGS } from "@compoz/core/domain/site/defaults/identity";
import { DEFAULT_LEGAL_MENU_SETTINGS } from "@compoz/core/domain/site/defaults/legal-menu";
import { DEFAULT_PRIMARY_MENU_SETTINGS } from "@compoz/core/domain/site/defaults/primary-menu";
import { DEFAULT_SEO_SETTINGS } from "@compoz/core/domain/site/defaults/seo";
import { DEFAULT_SOCIAL_SETTINGS } from "@compoz/core/domain/site/defaults/social";
import { DEFAULT_THEME_SETTINGS } from "@compoz/core/domain/site/defaults/theme";
import { PrismaDemoSandboxCloner } from "@compoz/infra/demo/prisma-demo-sandbox-cloner";
import { prisma } from "@compoz/infra/prisma/prisma-client";
import { Prisma } from "@compoz/infra/prisma/generated";

const databaseUrl = process.env["TEST_DATABASE_URL"]?.trim() ?? "";
const enabled = process.env["COMPOZ_MEASUREMENT_DATABASE_GUARD"] === "1" && (() => {
  try {
    const url = new URL(databaseUrl);
    return url.hostname === "127.0.0.1" && url.port === "55432";
  } catch {
    return false;
  }
})();
const skip = enabled ? false : "Local PostgreSQL measurement guard is not configured.";

function settings() {
  return {
    header: DEFAULT_HEADER_SETTINGS as unknown as Prisma.InputJsonValue,
    footer: DEFAULT_FOOTER_SETTINGS as unknown as Prisma.InputJsonValue,
    primaryMenu: DEFAULT_PRIMARY_MENU_SETTINGS as unknown as Prisma.InputJsonValue,
    legalMenu: DEFAULT_LEGAL_MENU_SETTINGS as unknown as Prisma.InputJsonValue,
    social: DEFAULT_SOCIAL_SETTINGS as unknown as Prisma.InputJsonValue,
    identity: DEFAULT_IDENTITY_SETTINGS as unknown as Prisma.InputJsonValue,
    seo: DEFAULT_SEO_SETTINGS as unknown as Prisma.InputJsonValue,
    theme: DEFAULT_THEME_SETTINGS as unknown as Prisma.InputJsonValue,
  };
}

async function seedSource(id: string): Promise<void> {
  await prisma.website.create({
    data: {
      id,
      slug: id,
      name: "Seed demo",
      type: "site",
      siteSettings: { create: { state: "published", ...settings() } },
      pages: {
        create: {
          state: "published",
          pageId: "home",
          parentPageId: null,
          slug: "home",
          name: "Home",
          seoTitle: null,
          seoDescription: null,
          blocks: [],
          sitemap: Prisma.JsonNull,
          paginationEnabled: false,
          position: 0,
          metaCreatedAt: new Date("2026-08-01T00:00:00.000Z"),
          metaUpdatedAt: new Date("2026-08-01T00:00:00.000Z"),
        },
      },
    },
  });
}

async function clear(ids: string[]): Promise<void> {
  await prisma.website.deleteMany({ where: { id: { in: ids } } });
}

void test("clones a seed Website into a draft sandbox", { skip }, async () => {
  const suffix = randomUUID();
  const source = `seed-${suffix}`;
  const target = `demo-${suffix}`;
  try {
    await seedSource(source);
    const result = await new PrismaDemoSandboxCloner().cloneSeedToWebsite({
      sourceWebsiteId: source,
      demoInstanceId: suffix,
      targetWebsiteId: target,
    });
    assert.equal(result.websiteId, target);
    assert.deepEqual(await prisma.website.findUnique({ where: { id: target }, select: { type: true, sourceWebsiteId: true } }), {
      type: "sandbox",
      sourceWebsiteId: source,
    });
    assert.equal(await prisma.page.count({ where: { websiteId: target, state: "draft" } }), 1);
    assert.equal(await prisma.siteSettings.count({ where: { websiteId: target, state: "draft" } }), 1);
  } finally {
    await clear([target, source]);
  }
});

void test("rolls back only the Website it created and preserves the original error", { skip }, async () => {
  const suffix = randomUUID();
  const source = `seed-${suffix}`;
  const target = `demo-${suffix}`;
  const mutableSettings = prisma.siteSettings as unknown as {
    upsert: (args: { where?: { websiteId_state?: { websiteId?: string } } }) => unknown;
  };
  const original = mutableSettings.upsert;
  try {
    await seedSource(source);
    mutableSettings.upsert = async (args) => {
      if (args.where?.websiteId_state?.websiteId === target) throw new Error("injected after Website creation");
      return original(args);
    };
    await assert.rejects(
      () => new PrismaDemoSandboxCloner().cloneSeedToWebsite({ sourceWebsiteId: source, demoInstanceId: suffix, targetWebsiteId: target }),
      /injected after Website creation/,
    );
    assert.equal(await prisma.website.count({ where: { id: target } }), 0);
  } finally {
    mutableSettings.upsert = original;
    await clear([target, source]);
  }
});

void test("does not delete a pre-existing sandbox when Website creation collides", { skip }, async () => {
  const suffix = randomUUID();
  const source = `seed-${suffix}`;
  const target = `demo-${suffix}`;
  const userId = `user-${suffix}`;
  try {
    await seedSource(source);
    await prisma.website.create({
      data: {
        id: target, slug: target, name: "Existing sandbox", type: "sandbox",
        siteSettings: { create: { state: "draft", ...settings() } },
      },
    });
    await prisma.user.create({ data: { id: userId, email: `${suffix}@example.test`, name: "Demo", status: "active", role: "editor", defaultWebsiteId: target, passwordHash: "x", demo: { isDemo: true, demoInstanceId: suffix, expiresAt: "2026-08-02T00:00:00.000Z" }, accesses: { create: { websiteId: target, role: "editor" } } } });
    await assert.rejects(() => new PrismaDemoSandboxCloner().cloneSeedToWebsite({ sourceWebsiteId: source, demoInstanceId: suffix, targetWebsiteId: target }));
    assert.equal((await prisma.website.findUnique({ where: { id: target } }))?.name, "Existing sandbox");
    assert.equal(await prisma.siteSettings.count({ where: { websiteId: target } }), 1);
    assert.equal(await prisma.websiteAccess.count({ where: { userId, websiteId: target } }), 1);
  } finally {
    await prisma.user.deleteMany({ where: { id: userId } });
    await clear([target, source]);
  }
});

void test("never deletes a colliding site Website", { skip }, async () => {
  const suffix = randomUUID();
  const source = `seed-${suffix}`;
  const target = `demo-${suffix}`;
  try {
    await seedSource(source);
    await prisma.website.create({ data: { id: target, slug: target, name: "Client site", type: "site" } });
    await assert.rejects(() => new PrismaDemoSandboxCloner().cloneSeedToWebsite({ sourceWebsiteId: source, demoInstanceId: suffix, targetWebsiteId: target }));
    assert.equal((await prisma.website.findUnique({ where: { id: target } }))?.type, "site");
  } finally {
    await clear([target, source]);
  }
});

void test("rejects mismatched IDs and refuses to target the seed before writing", { skip }, async () => {
  const suffix = randomUUID();
  const source = `demo-${suffix}`;
  try {
    await seedSource(source);
    const cloner = new PrismaDemoSandboxCloner();
    await assert.rejects(() => cloner.cloneSeedToWebsite({ sourceWebsiteId: source, demoInstanceId: "alpha", targetWebsiteId: "demo-beta" }));
    await assert.rejects(() => cloner.cloneSeedToWebsite({ sourceWebsiteId: source, demoInstanceId: suffix, targetWebsiteId: source }));
    assert.equal((await prisma.website.findUnique({ where: { id: source } }))?.type, "site");
  } finally {
    await clear([source]);
  }
});
