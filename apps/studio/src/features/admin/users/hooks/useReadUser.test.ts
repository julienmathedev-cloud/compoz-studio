/**
 * @file apps/studio/src/features/admin/users/hooks/useReadUser.test.ts
 * @layer studio/features/admin/users/hooks
 * @description Guards individual user queries against cross-user placeholder data.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { readUserQueryOptions } from "@compoz/studio/features/admin/users/hooks/read-user-query";

void test("individual user queries do not retain prior-user placeholder data", () => {
  const userA = readUserQueryOptions("user-a");
  const userB = readUserQueryOptions("user-b");

  assert.notDeepEqual(userA.queryKey, userB.queryKey);
  assert.equal("placeholderData" in userB, false);
});
