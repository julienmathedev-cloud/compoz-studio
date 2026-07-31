/**
 * @file packages/infra/src/site/kv-site-status-snapshot.test.ts
 * @layer infra/site
 * @description Unit tests for versioned, best-effort status snapshots.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { SiteStatus } from "@compoz/core/domain/site/entities/site-status";
import type { SiteStatusDetails } from "@compoz/core/domain/site/entities/site-status-details";
import { KvSiteStatusSnapshot } from "@compoz/infra/site/kv-site-status-snapshot";

type Call = Readonly<{ method: string; key: string; value?: string; ex?: number }>;

function createRedis(seed: Record<string, unknown> = {}) {
  const values = new Map<string, unknown>(Object.entries(seed));
  const calls: Call[] = [];
  let fail: string | undefined;

  return {
    calls,
    values,
    failNext(method: string) {
      fail = method;
    },
    redis: {
      async get(key: string): Promise<unknown> {
        calls.push({ method: "get", key });
        if (fail === "get") {
          fail = undefined;
          throw new Error("unavailable");
        }
        return values.get(key) ?? null;
      },
      async set(key: string, value: string, options: { ex: number }): Promise<unknown> {
        calls.push({ method: "set", key, value, ex: options.ex });
        if (fail === "set") {
          fail = undefined;
          throw new Error("unavailable");
        }
        values.set(key, value);
        return "OK";
      },
      async incr(key: string): Promise<unknown> {
        calls.push({ method: "incr", key });
        if (fail === "incr") {
          fail = undefined;
          throw new Error("unavailable");
        }
        const next = Number(values.get(key) ?? 0) + 1;
        values.set(key, next);
        return next;
      },
      async expire(key: string, seconds: number): Promise<unknown> {
        calls.push({ method: "expire", key, ex: seconds });
        if (fail === "expire") {
          fail = undefined;
          throw new Error("unavailable");
        }
        return 1;
      },
    },
  };
}

const status: SiteStatus = {
  published: { exists: false },
  hasChanges: { site: false, settings: false, pages: false },
  counts: {
    pages: { draft: 0, published: 0, modified: 0, new: 0, deleted: 0 },
    blocks: { draft: 0, published: 0, modified: 0, new: 0, deleted: 0 },
  },
  changedSettings: {
    identity: false, primaryMenu: false, legalMenu: false, social: false,
    header: false, footer: false, seo: false, theme: false,
  },
};

function details(args: Partial<SiteStatusDetails> = {}): SiteStatusDetails {
  return {
    scope: "dirty",
    includeBlocks: false,
    pages: [],
    ...args,
  };
}

function snapshot(redis: ReturnType<typeof createRedis>, websiteId = "website-a") {
  return new KvSiteStatusSnapshot({ websiteId, redis: redis.redis });
}

void test("isolates status and detail snapshot keys by website and every detail variant", async () => {
  const fake = createRedis();
  const a = snapshot(fake, "website-a");
  const b = snapshot(fake, "website-b");

  await a.putStatusSnapshot(status);
  await b.putStatusSnapshot(status);
  await a.putStatusDetailsSnapshot({ scope: "dirty", includeBlocks: false, pageId: null }, details());
  await a.putStatusDetailsSnapshot({ scope: "all", includeBlocks: false }, details({ scope: "all" }));
  await a.putStatusDetailsSnapshot({ scope: "dirty", includeBlocks: true }, details({ includeBlocks: true }));
  await a.putStatusDetailsSnapshot({ scope: "dirty", includeBlocks: false, pageId: "page-1" }, details({ pages: [{ id: "page-1", slug: "one", name: "One", diff: "new", blocks: { draft: 0, published: 0, modified: 0, new: 0, deleted: 0 } }] }));
  await a.putStatusDetailsSnapshot({ scope: "dirty", includeBlocks: false, pageId: "page-2" }, details({ pages: [{ id: "page-2", slug: "two", name: "Two", diff: "new", blocks: { draft: 0, published: 0, modified: 0, new: 0, deleted: 0 } }] }));

  const keys = fake.calls.filter((call) => call.method === "set").map((call) => call.key);
  assert.equal(new Set(keys).size, keys.length);
  assert.ok(keys.some((key) => key.includes("website-a:status:snapshot")));
  assert.ok(keys.some((key) => key.includes("website-b:status:snapshot")));
  assert.ok(keys.some((key) => key.includes(":dirty:0:page:all")));
  assert.ok(keys.some((key) => key.includes(":all:0:page:all")));
  assert.ok(keys.some((key) => key.includes(":dirty:1:page:all")));
  assert.ok(keys.some((key) => key.endsWith(":page:page-1")));
  assert.ok(keys.some((key) => key.endsWith(":page:page-2")));
});

void test("reads only valid global snapshots and treats invalid generations and Redis errors as misses", async () => {
  const fake = createRedis();
  const cache = snapshot(fake);
  assert.equal(await cache.readStatusSnapshot(), null);

  const key = "compoz:website-a:status:snapshot:format:v1:generation:v0";
  for (const raw of [
    JSON.stringify({ formatVersion: 1, value: status }),
    null,
    "{invalid",
    JSON.stringify({ value: status }),
    JSON.stringify({ formatVersion: 2, value: status }),
    JSON.stringify({ formatVersion: 1, value: { published: {} } }),
  ]) {
    fake.values.set(key, raw);
    const value = await cache.readStatusSnapshot();
    if (raw === JSON.stringify({ formatVersion: 1, value: status })) assert.deepEqual(value, status);
    else assert.equal(value, null);
  }

  const invalidGeneration = createRedis({ "compoz:website-a:status:version": -1 });
  assert.equal(await snapshot(invalidGeneration).readStatusSnapshot(), null);
  invalidGeneration.values.set("compoz:website-a:status:version", "1.5");
  assert.equal(await snapshot(invalidGeneration).readStatusSnapshot(), null);
  fake.failNext("get");
  assert.equal(await snapshot(fake).readStatusSnapshot(), null);
});

void test("writes validated global envelopes at the current version with a 900 second TTL", async () => {
  const fake = createRedis({ "compoz:website-a:status:version": 3 });
  await snapshot(fake).putStatusSnapshot(status);
  const write = fake.calls.find((call) => call.method === "set");
  assert.ok(write);
  assert.equal(write.key, "compoz:website-a:status:snapshot:format:v1:generation:v3");
  assert.equal(write.ex, 900);
  assert.deepEqual(JSON.parse(write.value ?? ""), { formatVersion: 1, value: status });

  const invalid = createRedis();
  await snapshot(invalid).putStatusSnapshot({ published: { exists: false } } as SiteStatus);
  assert.equal(invalid.calls.some((call) => call.method === "set"), false);
  fake.failNext("set");
  await snapshot(fake).putStatusSnapshot(status);
});

void test("validates detail variants, targeted page contents, and detail write TTL", async () => {
  const fake = createRedis();
  const cache = snapshot(fake);
  const queried = { scope: "dirty" as const, includeBlocks: false, pageId: "page-1" };
  await cache.putStatusDetailsSnapshot(queried, details({ pages: [{ id: "page-1", slug: "one", name: "One", diff: "new", blocks: { draft: 0, published: 0, modified: 0, new: 0, deleted: 0 } }] }));
  assert.equal(fake.calls.at(-1)?.ex, 900);
  assert.equal((await cache.readStatusDetailsSnapshot(queried))?.pages[0]?.id, "page-1");

  const key = fake.calls.find((call) => call.method === "set")?.key;
  assert.ok(key);
  const envelope = (value: SiteStatusDetails) => JSON.stringify({ formatVersion: 1, value });
  fake.values.set(key, envelope(details({ scope: "all" })));
  assert.equal(await cache.readStatusDetailsSnapshot(queried), null);
  fake.values.set(key, envelope(details({ includeBlocks: true, pages: [] })));
  assert.equal(await cache.readStatusDetailsSnapshot(queried), null);
  fake.values.set(key, envelope(details({ pages: [{ id: "other", slug: "other", name: "Other", diff: "new", blocks: { draft: 0, published: 0, modified: 0, new: 0, deleted: 0 } }] })));
  assert.equal(await cache.readStatusDetailsSnapshot(queried), null);
  fake.values.set(key, envelope(details()));
  assert.deepEqual(await cache.readStatusDetailsSnapshot(queried), details());
  await cache.putStatusDetailsSnapshot({ scope: "dirty", includeBlocks: false }, details());
  assert.deepEqual(
    await cache.readStatusDetailsSnapshot({ scope: "dirty", includeBlocks: false }),
    details(),
  );
});

void test("invalidates independent status generations, memoizes successful versions, and attempts both invalidations", async () => {
  const fake = createRedis();
  const cache = snapshot(fake);
  assert.equal(await cache.invalidateStatus(), true);
  assert.deepEqual(fake.calls.slice(0, 2).map((call) => [call.method, call.key, call.ex]), [
    ["incr", "compoz:website-a:status:version", undefined],
    ["expire", "compoz:website-a:status:version", 7200],
  ]);
  await cache.putStatusSnapshot(status);
  assert.deepEqual(await cache.readStatusSnapshot(), status);
  assert.equal(fake.calls.filter((call) => call.key === "compoz:website-a:status:version" && call.method === "get").length, 0);
  assert.equal(await cache.invalidateStatusDetails(), true);
  assert.ok(fake.calls.some((call) => call.key === "compoz:website-a:statusDetails:version"));

  for (const method of ["incr", "expire"] as const) {
    const failing = createRedis();
    failing.failNext(method);
    assert.equal(await snapshot(failing).invalidateStatus(), false);
    const failingDetails = createRedis();
    failingDetails.failNext(method);
    assert.equal(await snapshot(failingDetails).invalidateStatusDetails(), false);
  }

  const mixed = createRedis();
  mixed.failNext("incr");
  assert.equal(await snapshot(mixed).invalidateAll(), false);
  assert.ok(mixed.calls.some((call) => call.key === "compoz:website-a:statusDetails:version"));
});

void test("invalidateAll returns true only when both version bumps complete", async () => {
  for (const [statusInvalidates, detailsInvalidates, expected] of [
    [true, true, true],
    [false, true, false],
    [true, false, false],
    [false, false, false],
  ] as const) {
    let increments = 0;
    const redis = {
      get: async () => null,
      set: async () => "OK",
      incr: async () => {
        increments += 1;
        if ((increments === 1 && !statusInvalidates) || (increments === 2 && !detailsInvalidates)) {
          throw new Error("unavailable");
        }
        return 1;
      },
      expire: async () => 1,
    };
    assert.equal(
      await new KvSiteStatusSnapshot({ websiteId: "website-a", redis }).invalidateAll(),
      expected,
    );
    assert.equal(increments, 2);
  }
});
