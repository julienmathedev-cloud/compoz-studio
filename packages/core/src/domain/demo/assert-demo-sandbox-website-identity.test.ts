/**
 * @file packages/core/src/domain/demo/assert-demo-sandbox-website-identity.test.ts
 * @layer core/domain/demo
 * @description Tests the canonical demo sandbox Website identity invariant.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { assertDemoSandboxWebsiteIdentity } from "@compoz/core/domain/demo/assert-demo-sandbox-website-identity";

void test("accepts only the Website derived from the demo instance", () => {
  assert.deepEqual(
    assertDemoSandboxWebsiteIdentity({
      demoInstanceId: "instance-01",
      websiteId: "DEMO-instance-01",
    }),
    { demoInstanceId: "instance-01", websiteId: "demo-instance-01" },
  );
});

void test("rejects a mismatched demo Website before any destructive boundary", () => {
  assert.throws(
    () =>
      assertDemoSandboxWebsiteIdentity({
        demoInstanceId: "alpha",
        websiteId: "demo-beta",
      }),
    /INVALID_ARGUMENT/,
  );
});
