/**
 * @file packages/infra/src/demo/prisma-demo-sandbox-data-cleaner.postgres.test.ts
 * @layer infra/demo
 * @description Real PostgreSQL proofs for atomic expired demo sandbox cleanup.
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
import { PrismaDemoSandboxDataCleaner } from "@compoz/infra/demo/prisma-demo-sandbox-data-cleaner";
import { prisma } from "@compoz/infra/prisma/prisma-client";
import { Prisma } from "@compoz/infra/prisma/generated";

const now = "2026-08-02T00:00:00.000Z";
const databaseUrl = process.env["TEST_DATABASE_URL"]?.trim() ?? "";
const enabled = process.env["COMPOZ_MEASUREMENT_DATABASE_GUARD"] === "1" && (() => {
  try { const url = new URL(databaseUrl); return url.hostname === "127.0.0.1" && url.port === "55432"; } catch { return false; }
})();
const skip = enabled ? false : "Local PostgreSQL measurement guard is not configured.";

function settings() {
  return { header: DEFAULT_HEADER_SETTINGS as unknown as Prisma.InputJsonValue, footer: DEFAULT_FOOTER_SETTINGS as unknown as Prisma.InputJsonValue, primaryMenu: DEFAULT_PRIMARY_MENU_SETTINGS as unknown as Prisma.InputJsonValue, legalMenu: DEFAULT_LEGAL_MENU_SETTINGS as unknown as Prisma.InputJsonValue, social: DEFAULT_SOCIAL_SETTINGS as unknown as Prisma.InputJsonValue, identity: DEFAULT_IDENTITY_SETTINGS as unknown as Prisma.InputJsonValue, seo: DEFAULT_SEO_SETTINGS as unknown as Prisma.InputJsonValue, theme: DEFAULT_THEME_SETTINGS as unknown as Prisma.InputJsonValue };
}

async function fixture(args: { expiresAt?: Date | null; sandboxExpiresAt?: Date; instance?: string } = {}) {
  const instance = args.instance ?? randomUUID();
  const websiteId = `demo-${instance}`;
  const userId = `demo-user-${instance}`;
  const expiresAt = args.expiresAt === undefined ? new Date("2026-08-01T00:00:00.000Z") : args.expiresAt;
  const sandboxExpiresAt = args.sandboxExpiresAt ?? new Date("2026-08-01T00:00:00.000Z");
  await prisma.website.create({ data: { id: websiteId, slug: websiteId, name: "Sandbox", type: "sandbox", expiresAt, siteSettings: { create: { state: "draft", ...settings() } }, pages: { create: { state: "draft", pageId: "home", parentPageId: null, slug: "/", name: "Home", seoTitle: null, seoDescription: null, blocks: [], sitemap: Prisma.JsonNull, paginationEnabled: false, position: 0, metaCreatedAt: new Date(now), metaUpdatedAt: new Date(now) } }, mediaAssets: { create: { provider: "vercel_blob", kind: "image", key: `key-${instance}`, url: "https://blob.test/image", filename: "image.png" } } } });
  await prisma.user.create({ data: { id: userId, email: `${instance}@example.test`, name: "Demo", status: "active", role: "editor", defaultWebsiteId: websiteId, passwordHash: "x", demo: { isDemo: true, demoInstanceId: instance, expiresAt: sandboxExpiresAt.toISOString() }, accesses: { create: { websiteId, role: "editor" } }, demoSandboxes: { create: { demoInstanceId: instance, websiteId, expiresAt: sandboxExpiresAt } } } });
  return { demoInstanceId: instance, userId, websiteId, expiresAt: sandboxExpiresAt.toISOString(), createdAt: now };
}

async function clean(ids: { websiteId: string; userId: string }): Promise<void> {
  await prisma.website.deleteMany({ where: { id: ids.websiteId } });
  await prisma.user.deleteMany({ where: { id: ids.userId } });
}

void test("cleans Website, User, access, DemoSandbox, Page, settings, and MediaAsset without Blob I/O", { skip }, async () => {
  const sandbox = await fixture();
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = async (...args) => { fetchCalls += 1; return originalFetch(...args); };
  try {
    assert.equal(await new PrismaDemoSandboxDataCleaner().deleteExpiredSandbox(sandbox, now), "cleaned");
    assert.equal(await prisma.website.count({ where: { id: sandbox.websiteId } }), 0);
    assert.equal(await prisma.user.count({ where: { id: sandbox.userId } }), 0);
    assert.equal(await prisma.websiteAccess.count({ where: { userId: sandbox.userId, websiteId: sandbox.websiteId } }), 0);
    assert.equal(await prisma.demoSandbox.count({ where: { demoInstanceId: sandbox.demoInstanceId } }), 0);
    assert.equal(await prisma.page.count({ where: { websiteId: sandbox.websiteId } }), 0);
    assert.equal(await prisma.siteSettings.count({ where: { websiteId: sandbox.websiteId } }), 0);
    assert.equal(await prisma.mediaAsset.count({ where: { websiteId: sandbox.websiteId } }), 0);
    assert.equal(fetchCalls, 0);
  } finally { globalThis.fetch = originalFetch; await clean(sandbox); }
});

void test("preserves seed sites, regular sites, and another sandbox", { skip }, async () => {
  const expired = await fixture();
  const other = await fixture({ instance: randomUUID(), expiresAt: new Date("2026-08-03T00:00:00.000Z"), sandboxExpiresAt: new Date("2026-08-03T00:00:00.000Z") });
  const seed = `seed-${randomUUID()}`;
  const site = `site-${randomUUID()}`;
  try {
    await prisma.website.createMany({ data: [{ id: seed, slug: seed, name: "Seed", type: "site" }, { id: site, slug: site, name: "Site", type: "site" }] });
    await new PrismaDemoSandboxDataCleaner().deleteExpiredSandbox(expired, now);
    assert.equal(await prisma.website.count({ where: { id: { in: [seed, site, other.websiteId] } } }), 3);
  } finally { await clean(expired); await clean(other); await prisma.website.deleteMany({ where: { id: { in: [seed, site] } } }); }
});

void test("rejects mismatched IDs before deletion", { skip }, async () => {
  const sandbox = await fixture();
  try {
    await assert.rejects(() => new PrismaDemoSandboxDataCleaner().deleteExpiredSandbox({ ...sandbox, demoInstanceId: "alpha", websiteId: "demo-beta" }, now));
    assert.equal(await prisma.website.count({ where: { id: sandbox.websiteId } }), 1);
    assert.equal(await prisma.user.count({ where: { id: sandbox.userId } }), 1);
  } finally { await clean(sandbox); }
});

void test("skips a sandbox extended before its transaction and preserves every record", { skip }, async () => {
  const sandbox = await fixture({ expiresAt: new Date("2026-08-03T00:00:00.000Z"), sandboxExpiresAt: new Date("2026-08-03T00:00:00.000Z") });
  try {
    assert.equal(await new PrismaDemoSandboxDataCleaner().deleteExpiredSandbox(sandbox, now), "skipped");
    assert.equal(await prisma.website.count({ where: { id: sandbox.websiteId } }), 1);
    assert.equal(await prisma.user.count({ where: { id: sandbox.userId } }), 1);
  } finally { await clean(sandbox); }
});

void test("skips Websites without expiresAt or with a future expiresAt", { skip }, async () => {
  const withoutExpiry = await fixture({ expiresAt: null });
  const future = await fixture({ expiresAt: new Date("2026-08-03T00:00:00.000Z") });
  try {
    const cleaner = new PrismaDemoSandboxDataCleaner();
    assert.equal(await cleaner.deleteExpiredSandbox(withoutExpiry, now), "skipped");
    assert.equal(await cleaner.deleteExpiredSandbox(future, now), "skipped");
    assert.equal(await prisma.website.count({ where: { id: { in: [withoutExpiry.websiteId, future.websiteId] } } }), 2);
  } finally { await clean(withoutExpiry); await clean(future); }
});

void test("is idempotent after a successful cleanup", { skip }, async () => {
  const sandbox = await fixture();
  try {
    const cleaner = new PrismaDemoSandboxDataCleaner();
    assert.equal(await cleaner.deleteExpiredSandbox(sandbox, now), "cleaned");
    assert.equal(await cleaner.deleteExpiredSandbox(sandbox, now), "skipped");
  } finally { await clean(sandbox); }
});

void test("rolls back the whole transaction when User deletion fails", { skip }, async () => {
  const sandbox = await fixture();
  const mutablePrisma = prisma as unknown as {
    $transaction: (callback: (tx: unknown) => Promise<unknown>) => Promise<unknown>;
  };
  const original = mutablePrisma.$transaction;
  try {
    mutablePrisma.$transaction = async (callback) => original.call(prisma, async (tx) => callback(new Proxy(tx as object, {
      get(target, property, receiver) {
        if (property !== "user") return Reflect.get(target, property, receiver);
        const users = Reflect.get(target, property, receiver) as object;
        return new Proxy(users, { get(userTarget, userProperty, userReceiver) {
          if (userProperty === "delete") return async () => { throw new Error("injected user delete failure"); };
          return Reflect.get(userTarget, userProperty, userReceiver);
        } });
      },
    })));
    await assert.rejects(() => new PrismaDemoSandboxDataCleaner().deleteExpiredSandbox(sandbox, now), /injected user delete failure/);
    assert.equal(await prisma.website.count({ where: { id: sandbox.websiteId } }), 1);
    assert.equal(await prisma.user.count({ where: { id: sandbox.userId } }), 1);
    assert.equal(await prisma.websiteAccess.count({ where: { userId: sandbox.userId, websiteId: sandbox.websiteId } }), 1);
  } finally { mutablePrisma.$transaction = original; await clean(sandbox); }
});
