/**
 * @file apps/studio/src/features/pages/lib/page-form-parent-rebase.test.ts
 * @layer studio/features/pages/lib
 * @description Tests RHF parent-only rebasing after a structure conflict.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { createFormControl } from "react-hook-form";

import { applyPageFormParentRebase } from "@compoz/studio/features/pages/lib/page-form-parent-rebase";
import type { PageFormValues } from "@compoz/validation/pages/page-form";

const BASELINE: PageFormValues = {
  name: "Initial",
  slug: "initial",
  seoTitle: null,
  seoDescription: null,
  parentId: "parent-a",
  sitemap: null,
  paginationEnabled: false,
};

void test("parent-only rebase displays server root and preserves dirty local metadata", () => {
  const form = createFormControl<PageFormValues>({
    defaultValues: BASELINE,
  });
  form.subscribe({
    formState: {
      values: true,
      dirtyFields: true,
      touchedFields: true,
      errors: true,
    },
    callback: () => undefined,
  });
  form.register("name");
  form.register("seoTitle");
  form.register("paginationEnabled");
  form.register("parentId");
  form.setValue("name", "Local name", {
    shouldDirty: true,
    shouldTouch: true,
  });
  form.setValue("seoTitle", "Local SEO", {
    shouldDirty: true,
    shouldTouch: true,
  });
  form.setValue("paginationEnabled", true, {
    shouldDirty: true,
    shouldTouch: true,
  });
  form.setValue("parentId", "parent-b", {
    shouldDirty: true,
    shouldTouch: true,
  });
  form.setError("name", { type: "manual", message: "Name error" });
  let patchCalls = 0;

  const nextResetBaseline = applyPageFormParentRebase(
    BASELINE,
    form.resetField,
    null,
  );

  assert.equal(patchCalls, 0);
  assert.equal(form.getValues("parentId"), null);
  assert.equal(form.getFieldState("parentId").isDirty, false);
  assert.equal(form.getValues("name"), "Local name");
  assert.equal(form.getValues("seoTitle"), "Local SEO");
  assert.equal(form.getValues("paginationEnabled"), true);
  assert.equal(form.getFieldState("name").isDirty, true);
  assert.equal(form.getFieldState("seoTitle").isDirty, true);
  assert.equal(
    form.getFieldState("paginationEnabled").isDirty,
    true,
  );
  assert.equal(form.getFieldState("name").isTouched, true);
  assert.equal(form.getFieldState("name").error?.message, "Name error");
  assert.equal(nextResetBaseline.name, "Initial");
  assert.equal(nextResetBaseline.parentId, null);

  form.setValue("parentId", "parent-c", {
    shouldDirty: true,
    shouldTouch: true,
  });
  patchCalls += 1;

  assert.equal(form.getValues("parentId"), "parent-c");
  assert.equal(form.getFieldState("parentId").isDirty, true);
  assert.equal(patchCalls, 1);
});

void test("parent-only rebase supports a non-null server parent", () => {
  const form = createFormControl<PageFormValues>({
    defaultValues: BASELINE,
  });
  form.subscribe({
    formState: { values: true, dirtyFields: true },
    callback: () => undefined,
  });
  form.register("parentId");
  form.setValue("parentId", "parent-b", { shouldDirty: true });

  const nextResetBaseline = applyPageFormParentRebase(
    BASELINE,
    form.resetField,
    "parent-c",
  );

  assert.equal(form.getValues("parentId"), "parent-c");
  assert.equal(form.getFieldState("parentId").isDirty, false);
  assert.equal(nextResetBaseline.parentId, "parent-c");
});
