/**
 * @file packages/infra/src/websites/resolve-studio-website.postgres.test.ts
 * @layer infra/websites
 * @description Real PostgreSQL proofs for Studio Website resolution and sandbox expiry.
 */

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { prisma } from "@compoz/infra/prisma/prisma-client";
import { resolveStudioWebsite } from "@compoz/infra/websites/resolve-studio-website";

const databaseUrl = process.env["TEST_DATABASE_URL"]?.trim() ?? "";
const enabled = process.env["COMPOZ_MEASUREMENT_DATABASE_GUARD"] === "1" && (() => {
  try { const url = new URL(databaseUrl); return url.hostname === "127.0.0.1" && url.port === "55432"; } catch { return false; }
})();
const skip = enabled ? false : "Local PostgreSQL measurement guard is not configured.";
const clock = () => new Date("2026-08-02T00:00:00.000Z");

async function seed(id: string, type: "site" | "sandbox", expiresAt: Date | null = null): Promise<void> {
  await prisma.website.create({ data: { id, slug: id, name: id, type, expiresAt } });
}

async function resolve(args: { activeWebsiteId?: string; defaultWebsiteId?: string; ids: string[]; role?: string }) {
  return resolveStudioWebsite({ activeWebsiteId: args.activeWebsiteId, now: clock, user: { id: "user", role: args.role ?? "admin", defaultWebsiteId: args.defaultWebsiteId, accessibleWebsiteIds: args.ids } });
}

void test("resolves a site from the admin cookie", { skip }, async () => {
  const id = `site-${randomUUID()}`;
  try { await seed(id, "site"); assert.equal((await resolve({ activeWebsiteId: id, ids: [id] })).source, "cookie"); } finally { await prisma.website.deleteMany({ where: { id } }); }
});

void test("resolves a site from defaultWebsiteId and then the first accessible site", { skip }, async () => {
  const defaultId = `site-${randomUUID()}`;
  const firstId = `site-${randomUUID()}`;
  try {
    await seed(defaultId, "site"); await seed(firstId, "site");
    assert.equal((await resolve({ defaultWebsiteId: defaultId, ids: [firstId, defaultId] })).source, "user-default");
    assert.deepEqual(await resolve({ defaultWebsiteId: "missing", ids: [firstId] }), { websiteId: firstId, slug: firstId, name: firstId, source: "first-accessible" });
  } finally { await prisma.website.deleteMany({ where: { id: { in: [defaultId, firstId] } } }); }
});

void test("resolves a valid sandbox but never an expired or expiry-less sandbox", { skip }, async () => {
  const valid = `demo-${randomUUID()}`;
  const expired = `demo-${randomUUID()}`;
  const noExpiry = `demo-${randomUUID()}`;
  try {
    await seed(valid, "sandbox", new Date("2026-08-03T00:00:00.000Z"));
    await seed(expired, "sandbox", new Date("2026-08-01T00:00:00.000Z"));
    await seed(noExpiry, "sandbox");
    assert.equal((await resolve({ defaultWebsiteId: valid, ids: [valid], role: "editor" })).websiteId, valid);
    await assert.rejects(() => resolve({ defaultWebsiteId: expired, ids: [expired], role: "editor" }));
    await assert.rejects(() => resolve({ defaultWebsiteId: noExpiry, ids: [noExpiry], role: "editor" }));
  } finally { await prisma.website.deleteMany({ where: { id: { in: [valid, expired, noExpiry] } } }); }
});

void test("falls back from an expired cookie sandbox to an accessible site without selecting expired sandboxes", { skip }, async () => {
  const expired = `demo-${randomUUID()}`;
  const site = `site-${randomUUID()}`;
  try {
    await seed(expired, "sandbox", new Date("2026-08-01T00:00:00.000Z")); await seed(site, "site");
    assert.deepEqual(await resolve({ activeWebsiteId: expired, ids: [expired, site] }), { websiteId: site, slug: site, name: site, source: "first-accessible" });
  } finally { await prisma.website.deleteMany({ where: { id: { in: [expired, site] } } }); }
});

void test("cannot resolve a demo user whose only accessible Website is expired", { skip }, async () => {
  const expired = `demo-${randomUUID()}`;
  try { await seed(expired, "sandbox", new Date("2026-08-01T00:00:00.000Z")); await assert.rejects(() => resolve({ defaultWebsiteId: expired, ids: [expired], role: "editor" })); } finally { await prisma.website.deleteMany({ where: { id: expired } }); }
});
