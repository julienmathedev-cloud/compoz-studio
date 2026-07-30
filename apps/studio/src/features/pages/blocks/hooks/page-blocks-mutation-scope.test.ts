/**
 * @file apps/studio/src/features/pages/blocks/hooks/page-blocks-mutation-scope.test.ts
 * @layer studio/features/pages/blocks/hooks
 * @description Verifies all block mutations share only their own Page queue.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { pageBlocksMutationScope } from "@compoz/studio/features/pages/blocks/hooks/page-blocks-mutation-scope";

void test("same Website/Page shares a scope and different Pages do not", () => {
  const create = pageBlocksMutationScope("website", "page-a");
  const update = pageBlocksMutationScope("website", "page-a");
  const remove = pageBlocksMutationScope("website", "page-a");
  const reorder = pageBlocksMutationScope("website", "page-a");
  assert.equal(create, update);
  assert.equal(update, remove);
  assert.equal(remove, reorder);
  assert.notEqual(create, pageBlocksMutationScope("website", "page-b"));
  assert.notEqual(create, pageBlocksMutationScope("other", "page-a"));
});
