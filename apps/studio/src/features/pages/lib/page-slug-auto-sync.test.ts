/**
 * @file apps/studio/src/features/pages/lib/page-slug-auto-sync.test.ts
 * @layer studio/features/pages/lib
 * @description Unit tests for page-form slug auto-generation state.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { SITE_PATH } from "@compoz/core/constants/web/paths";
import {
  createSlugAutoSyncState,
  getAutoSlugFromName,
} from "@compoz/studio/features/pages/lib/page-slug-auto-sync";

import type { PageFormValues } from "@compoz/validation/pages/page-form";

const EMPTY_FORM: PageFormValues = {
  name: "",
  seoTitle: null,
  seoDescription: null,
  parentId: null,
  slug: "",
  sitemap: null,
  paginationEnabled: false,
};

void test("derives a slug from the title for a genuinely new empty page", () => {
  const state = createSlugAutoSyncState({
    initialValues: EMPTY_FORM,
    mode: "create",
  });

  assert.equal(
    getAutoSlugFromName({
      name: "À propos de Julien Mathé",
      slug: "",
      state,
    }),
    "a-propos-de-julien-mathe",
  );
});

void test("keeps auto-syncing while the slug remains auto-generated", () => {
  const state = createSlugAutoSyncState({
    initialValues: EMPTY_FORM,
    mode: "create",
  });

  const firstSlug = getAutoSlugFromName({
    name: "À propos",
    slug: "",
    state,
  });

  assert.equal(firstSlug, "a-propos");

  assert.equal(
    getAutoSlugFromName({
      name: "À propos de Julien Mathé",
      slug: firstSlug ?? "",
      state,
    }),
    "a-propos-de-julien-mathe",
  );
});

void test("keeps a custom slug when the title changes or its field is revisited", () => {
  const state = createSlugAutoSyncState({
    initialValues: { ...EMPTY_FORM, slug: "a-propos-de-julien-mathe" },
    mode: "create",
  });

  assert.equal(state.locked, true);
  assert.equal(
    getAutoSlugFromName({
      name: "À propos",
      slug: "a-propos-de-julien-mathe",
      state,
    }),
    null,
  );
});

void test("keeps the persisted slug when editing a page", () => {
  const state = createSlugAutoSyncState({
    initialValues: { ...EMPTY_FORM, slug: "presentation" },
    mode: "edit",
  });

  assert.equal(
    getAutoSlugFromName({ name: "Nouveau titre", slug: "presentation", state }),
    null,
  );
});

void test("never derives a slug from a temporarily empty edit form", () => {
  const state = createSlugAutoSyncState({
    initialValues: EMPTY_FORM,
    mode: "edit",
  });

  assert.equal(state.locked, true);
  assert.equal(
    getAutoSlugFromName({
      name: "À propos",
      slug: "",
      state,
    }),
    null,
  );
});

void test("treats the home path as a real initialized slug", () => {
  const state = createSlugAutoSyncState({
    initialValues: { ...EMPTY_FORM, slug: SITE_PATH.home },
    mode: "edit",
  });

  assert.equal(state.locked, true);
  assert.equal(
    getAutoSlugFromName({
      name: "Accueil",
      slug: SITE_PATH.home,
      state,
    }),
    null,
  );
});
