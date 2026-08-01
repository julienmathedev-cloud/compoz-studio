/**
 * @file packages/infra/src/kv/kv-redis.test.ts
 * @layer infra/kv
 * @description Tests Redis REST credential resolution without creating a client.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { resolveRedisRestCredentials } from "@compoz/infra/kv/kv-redis";

void test("resolves a complete KV REST credential pair", () => {
  assert.deepEqual(
    resolveRedisRestCredentials({
      KV_REST_API_URL: "https://kv.example.com",
      KV_REST_API_TOKEN: "kv-token",
    }),
    { url: "https://kv.example.com", token: "kv-token" },
  );
});

void test("resolves a complete Upstash Redis REST credential pair", () => {
  assert.deepEqual(
    resolveRedisRestCredentials({
      UPSTASH_REDIS_REST_URL: "https://upstash.example.com",
      UPSTASH_REDIS_REST_TOKEN: "upstash-token",
    }),
    { url: "https://upstash.example.com", token: "upstash-token" },
  );
});

void test("gives a complete KV REST pair priority over Upstash credentials", () => {
  assert.deepEqual(
    resolveRedisRestCredentials({
      KV_REST_API_URL: "https://kv.example.com",
      KV_REST_API_TOKEN: "kv-token",
      UPSTASH_REDIS_REST_URL: "https://upstash.example.com",
      UPSTASH_REDIS_REST_TOKEN: "upstash-token",
    }),
    { url: "https://kv.example.com", token: "kv-token" },
  );
});

void test("rejects a KV REST URL without its token", () => {
  assert.throws(
    () => resolveRedisRestCredentials({ KV_REST_API_URL: "https://kv.example.com" }),
    /KV_REST_API_URL and KV_REST_API_TOKEN/,
  );
});

void test("rejects a KV REST token without its URL without exposing the token", () => {
  const token = "kv-secret-token";

  assert.throws(
    () => resolveRedisRestCredentials({ KV_REST_API_TOKEN: token }),
    (error) => {
      assert.equal(error instanceof Error, true);
      return error instanceof Error && !error.message.includes(token);
    },
  );
});

void test("rejects an Upstash REST URL without its token", () => {
  assert.throws(
    () =>
      resolveRedisRestCredentials({
        UPSTASH_REDIS_REST_URL: "https://upstash.example.com",
      }),
    /UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN/,
  );
});

void test("rejects an Upstash REST token without its URL", () => {
  assert.throws(
    () => resolveRedisRestCredentials({ UPSTASH_REDIS_REST_TOKEN: "upstash-token" }),
    /UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN/,
  );
});

void test("rejects absent Redis REST configuration", () => {
  assert.throws(() => resolveRedisRestCredentials({}), /Missing Redis configuration/);
});

void test("does not combine a KV URL with an Upstash token", () => {
  assert.throws(
    () =>
      resolveRedisRestCredentials({
        KV_REST_API_URL: "https://kv.example.com",
        UPSTASH_REDIS_REST_TOKEN: "upstash-token",
      }),
    /KV_REST_API_URL and KV_REST_API_TOKEN/,
  );
});

void test("trims Redis REST credential values", () => {
  assert.deepEqual(
    resolveRedisRestCredentials({
      UPSTASH_REDIS_REST_URL: "  https://upstash.example.com  ",
      UPSTASH_REDIS_REST_TOKEN: "  upstash-token  ",
    }),
    { url: "https://upstash.example.com", token: "upstash-token" },
  );
});
