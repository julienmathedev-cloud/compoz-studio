/**
 * @file apps/studio/src/app/api/internal/demo/cleanup/cron-auth.test.ts
 * @layer studio/app/api
 * @description Authorization tests for the Vercel-compatible demo cleanup route.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { isAuthorizedCronRequest } from "@compoz/studio/app/api/internal/demo/cleanup/cron-auth";

void test("cron authorization rejects a missing secret or invalid bearer token", () => {
  assert.equal(isAuthorizedCronRequest(new Request("https://studio.test"), ""), false);
  assert.equal(
    isAuthorizedCronRequest(
      new Request("https://studio.test", {
        headers: { authorization: "Bearer incorrect" },
      }),
      "expected",
    ),
    false,
  );
});

void test("cron authorization accepts the documented Bearer contract", () => {
  assert.equal(
    isAuthorizedCronRequest(
      new Request("https://studio.test", {
        headers: { authorization: "Bearer expected" },
      }),
      "expected",
    ),
    true,
  );
});
