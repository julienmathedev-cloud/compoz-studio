/**
 * @file apps/studio/src/features/pages/lib/page-form-metadata-commit.test.ts
 * @layer studio/features/pages/lib
 * @description Tests metadata-only RHF commits preserve structural parent edits.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { createFormControl } from "react-hook-form";

import { commitPageFormMetadataResolution } from "@compoz/studio/features/pages/lib/page-form-metadata-commit";
import { toUpdatePageIntentDTOFromFormValues } from "@compoz/studio/features/pages/mappers/pages-form";
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

void test("metadata-only commit preserves local parent value, baseline, dirty and touched state", () => {
  const form = createFormControl<PageFormValues>({ defaultValues: BASELINE });
  form.subscribe({
    formState: { values: true, dirtyFields: true, touchedFields: true },
    callback: () => undefined,
  });
  for (const field of [
    "name",
    "slug",
    "seoTitle",
    "seoDescription",
    "sitemap",
    "paginationEnabled",
    "parentId",
  ] as const) {
    form.register(field);
  }
  form.setValue("parentId", "parent-local", {
    shouldDirty: true,
    shouldTouch: true,
  });
  form.setValue("name", "Draft", { shouldDirty: true, shouldTouch: true });
  form.setError("name", { type: "manual", message: "metadata error" });
  form.setError("parentId", { type: "manual", message: "structure error" });

  const nextBaseline = commitPageFormMetadataResolution(
    BASELINE,
    form.resetField,
    { ...BASELINE, name: "Remote", parentId: "parent-local" },
  );

  assert.equal(form.getValues("name"), "Remote");
  assert.equal(form.getFieldState("name").isDirty, false);
  assert.equal(form.getFieldState("name").isTouched, true);
  assert.equal(form.getFieldState("name").error, undefined);
  assert.equal(form.getValues("parentId"), "parent-local");
  assert.equal(form.getFieldState("parentId").isDirty, true);
  assert.equal(form.getFieldState("parentId").isTouched, true);
  assert.equal(form.getFieldState("parentId").error?.message, "structure error");
  assert.equal(nextBaseline.parentId, "parent-a");

  const nextSave = toUpdatePageIntentDTOFromFormValues({
    baseline: nextBaseline,
    local: form.getValues(),
    expectedMetaRevision: 3,
    expectedDraftStructureRevision: 9,
  });
  assert.deepEqual(nextSave.parentChange, {
    baseline: "parent-a",
    local: "parent-local",
    expectedDraftStructureRevision: 9,
  });
  assert.equal(nextSave.metadataChanges, undefined);
});

void test("metadata-only commit leaves the form clean when no parent change remains", () => {
  const form = createFormControl<PageFormValues>({ defaultValues: BASELINE });
  form.subscribe({
    formState: { values: true, isDirty: true, dirtyFields: true },
    callback: () => undefined,
  });
  for (const field of [
    "name",
    "slug",
    "seoTitle",
    "seoDescription",
    "sitemap",
    "paginationEnabled",
    "parentId",
  ] as const) {
    form.register(field);
  }
  form.setValue("name", "Draft", { shouldDirty: true });

  const nextBaseline = commitPageFormMetadataResolution(
    BASELINE,
    form.resetField,
    { ...BASELINE, name: "Saved" },
  );

  assert.equal(form.getFieldState("name").isDirty, false);
  assert.equal(form.getFieldState("parentId").isDirty, false);
  assert.equal(form.control._formState.isDirty, false);
  assert.equal(nextBaseline.name, "Saved");
  assert.equal(nextBaseline.parentId, "parent-a");
});
