/**
 * @file packages/validation/src/users/user.test.ts
 * @layer validation/users
 * @description Validation tests for admin-provisioned Website IDs and RBAC invariants.
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  UserRbacSchema,
  WebsiteIdSchema,
} from "@compoz/validation/users/user";

void test("WebsiteIdSchema accepts normalized standard Website IDs", () => {
  for (const value of ["demo", "renaud", "lola-mathe", "client-2026"]) {
    assert.equal(WebsiteIdSchema.safeParse(value).success, true, value);
  }

  assert.equal(WebsiteIdSchema.parse("  CLIENT-2026 "), "client-2026");
});

void test("WebsiteIdSchema rejects unsafe or malformed standard Website IDs", () => {
  for (const value of [
    "Client A",
    "client_a",
    "client/a",
    "-client",
    "client-",
    "client--a",
    "école",
    "*",
  ]) {
    assert.equal(WebsiteIdSchema.safeParse(value).success, false, value);
  }
});

void test("RBAC rejects duplicate Website IDs and an absent default Website", () => {
  assert.equal(
    UserRbacSchema.safeParse({
      role: "editor",
      websiteIds: ["client-a", "client-a"],
      defaultWebsiteId: "client-a",
    }).success,
    false,
  );
  assert.equal(
    UserRbacSchema.safeParse({
      role: "editor",
      websiteIds: ["client-a"],
      defaultWebsiteId: "client-b",
    }).success,
    false,
  );
});
