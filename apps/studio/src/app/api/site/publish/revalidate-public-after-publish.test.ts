/**
 * @file apps/studio/src/app/api/site/publish/revalidate-public-after-publish.test.ts
 * @layer studio/app/api
 * @description Tests bounded public revalidation observability and failures.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { Logger } from "@compoz/infra/lib/log";
import { revalidatePublicAfterPublish } from "@compoz/studio/app/api/site/publish/revalidate-public-after-publish";

type LogEntry = Readonly<{
  event: string;
  data: Record<string, unknown> | undefined;
}>;

function createLogger(entries: LogEntry[]): Pick<Logger, "debug" | "warn"> {
  return {
    debug(event, data) {
      entries.push({ event, data });
    },
    warn(event, data) {
      entries.push({ event, data });
    },
  };
}

function response(status: number): Response {
  return new Response(null, { status });
}

void test("skips public revalidation when the public origin is absent", async () => {
  let fetchCalls = 0;
  const logs: LogEntry[] = [];

  await revalidatePublicAfterPublish({
    siteBaseUrl: "   ",
    websiteSlug: "portfolio",
    slugs: ["home"],
    fetchImpl: async () => {
      fetchCalls += 1;
      return response(200);
    },
    logger: createLogger(logs),
  });

  assert.equal(fetchCalls, 0);
  assert.deepEqual(logs, []);
});

void test("posts one successful public revalidation with safe metrics", async () => {
  const logs: LogEntry[] = [];
  const requests: Array<Readonly<{ input: RequestInfo | URL; init?: RequestInit }>> = [];
  const times = [100, 112];

  await revalidatePublicAfterPublish({
    siteBaseUrl: "https://public.example",
    websiteSlug: "portfolio",
    slugs: ["home", "about"],
    timeoutMs: 321,
    fetchImpl: async (input, init) => {
      requests.push({ input, init });
      return response(200);
    },
    nowMs: () => times.shift() ?? 112,
    logger: createLogger(logs),
  });

  assert.equal(requests.length, 1);
  assert.equal(requests[0]?.input, "https://public.example/api/revalidate");
  assert.equal(requests[0]?.init?.method, "POST");
  assert.equal(requests[0]?.init?.headers instanceof Headers, false);
  assert.deepEqual(requests[0]?.init?.headers, {
    "Content-Type": "application/json",
  });
  assert.equal(
    requests[0]?.init?.body,
    JSON.stringify({ websiteSlug: "portfolio", slugs: ["home", "about"] }),
  );
  assert.deepEqual(logs, [
    {
      event: "publish.revalidate.public.succeeded",
      data: {
        websiteSlug: "portfolio",
        slugsCount: 2,
        durationMs: 12,
        timeoutMs: 321,
        status: 200,
      },
    },
  ]);
});

void test("sends the configured secret without exposing it in logs", async () => {
  const logs: LogEntry[] = [];
  let headers: HeadersInit | undefined;
  const secret = "not-for-logs";

  await revalidatePublicAfterPublish({
    siteBaseUrl: "https://public.example",
    websiteSlug: "portfolio",
    slugs: ["home"],
    secret,
    fetchImpl: async (_input, init) => {
      headers = init?.headers;
      return response(204);
    },
    logger: createLogger(logs),
  });

  assert.deepEqual(headers, {
    "Content-Type": "application/json",
    "x-revalidate-secret": secret,
  });
  assert.equal(JSON.stringify(logs).includes(secret), false);
  assert.equal(JSON.stringify(logs).includes("home"), false);
  assert.equal(JSON.stringify(logs).includes("headers"), false);
  assert.equal(JSON.stringify(logs).includes("body"), false);
});

void test("rejects and logs an HTTP failure without response content", async () => {
  const logs: LogEntry[] = [];
  let fetchCalls = 0;
  const times = [50, 58];

  await assert.rejects(revalidatePublicAfterPublish({
    siteBaseUrl: "https://public.example",
    websiteSlug: "portfolio",
    slugs: ["home", "about"],
    timeoutMs: 321,
    fetchImpl: async () => {
      fetchCalls += 1;
      return response(500);
    },
    nowMs: () => times.shift() ?? 58,
    logger: createLogger(logs),
  }), /public_revalidate_http_failed/);

  assert.equal(fetchCalls, 1);
  assert.deepEqual(logs, [
    {
      event: "publish.revalidate.public.failed",
      data: {
        failureKind: "http",
        status: 500,
        websiteSlug: "portfolio",
        slugsCount: 2,
        durationMs: 8,
        timeoutMs: 321,
      },
    },
  ]);
});

void test("rejects and logs a network failure", async () => {
  const logs: LogEntry[] = [];
  const times = [20, 29];

  await assert.rejects(revalidatePublicAfterPublish({
    siteBaseUrl: "https://public.example",
    websiteSlug: "portfolio",
    slugs: ["home"],
    timeoutMs: 321,
    fetchImpl: async () => {
      throw new Error("network unavailable");
    },
    nowMs: () => times.shift() ?? 29,
    logger: createLogger(logs),
  }), /public_revalidate_network_failed/);

  assert.deepEqual(logs, [
    {
      event: "publish.revalidate.public.failed",
      data: {
        failureKind: "network",
        websiteSlug: "portfolio",
        slugsCount: 1,
        durationMs: 9,
        timeoutMs: 321,
      },
    },
  ]);
});

void test("aborts a stalled fetch at the configured timeout and logs it distinctly", async () => {
  const logs: LogEntry[] = [];
  let receivedSignal: AbortSignal | undefined;

  await assert.rejects(revalidatePublicAfterPublish({
    siteBaseUrl: "https://public.example",
    websiteSlug: "portfolio",
    slugs: ["home"],
    timeoutMs: 5,
    fetchImpl: async (_input, init) => new Promise<Response>((_resolve, reject) => {
      receivedSignal = init?.signal ?? undefined;
      receivedSignal?.addEventListener("abort", () => {
        reject(new Error("aborted by test"));
      }, { once: true });
    }),
    nowMs: () => 100,
    logger: createLogger(logs),
  }), /public_revalidate_timeout/);

  assert.equal(receivedSignal instanceof AbortSignal, true);
  assert.equal(receivedSignal?.aborted, true);
  assert.deepEqual(logs, [
    {
      event: "publish.revalidate.public.failed",
      data: {
        failureKind: "timeout",
        websiteSlug: "portfolio",
        slugsCount: 1,
        durationMs: 0,
        timeoutMs: 5,
      },
    },
  ]);
});
