/**
 * @file packages/core/src/domain/site/use-cases/footer/update-footer-settings.test.ts
 * @layer core/domain/site/use-cases/footer
 * @description Unit tests for footer optimistic concurrency merging and retries.
 */

import assert from "node:assert/strict";
import test from "node:test";

import type { ContentState } from "@compoz/core/constants/common/content-state";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import { DEFAULT_HEADER_SETTINGS } from "@compoz/core/domain/site/defaults/header";
import { DEFAULT_IDENTITY_SETTINGS } from "@compoz/core/domain/site/defaults/identity";
import { DEFAULT_LEGAL_MENU_SETTINGS } from "@compoz/core/domain/site/defaults/legal-menu";
import { DEFAULT_PRIMARY_MENU_SETTINGS } from "@compoz/core/domain/site/defaults/primary-menu";
import { DEFAULT_SEO_SETTINGS } from "@compoz/core/domain/site/defaults/seo";
import { DEFAULT_SOCIAL_SETTINGS } from "@compoz/core/domain/site/defaults/social";
import { DEFAULT_THEME_SETTINGS } from "@compoz/core/domain/site/defaults/theme";
import type {
  SiteSettings,
  SiteSettingsWithRevisions,
} from "@compoz/core/domain/site/entities/site-settings";
import type {
  CompareAndSetDraftFooterInput,
  DraftFooterWithRevision,
  SiteRepository,
} from "@compoz/core/domain/site/ports/site-repository";
import { updateFooterSettings } from "@compoz/core/domain/site/use-cases/footer/update-footer-settings";

const BASELINE = { copyright: "Baseline", showYear: true };

function settingsWithFooter(
  footer = BASELINE,
  footerRevision = 1,
): SiteSettingsWithRevisions {
  return {
    settings: {
      header: DEFAULT_HEADER_SETTINGS,
      footer,
      primaryMenu: DEFAULT_PRIMARY_MENU_SETTINGS,
      legalMenu: DEFAULT_LEGAL_MENU_SETTINGS,
      social: DEFAULT_SOCIAL_SETTINGS,
      identity: DEFAULT_IDENTITY_SETTINGS,
      seo: DEFAULT_SEO_SETTINGS,
      theme: DEFAULT_THEME_SETTINGS,
    },
    revisions: {
      headerRevision: 0,
      footerRevision,
      primaryMenuRevision: 0,
      legalMenuRevision: 0,
      socialRevision: 0,
      identityRevision: 0,
      seoRevision: 0,
      themeRevision: 0,
    },
  };
}

function createRepository(options?: {
  reads?: SiteSettingsWithRevisions[];
  casResults?: Array<DraftFooterWithRevision | null>;
}) {
  const reads = options?.reads ?? [settingsWithFooter()];
  const casResults = options?.casResults ?? [];
  const casInputs: CompareAndSetDraftFooterInput[] = [];
  let readIndex = 0;
  let putSettingsCalls = 0;

  const repo: SiteRepository = {
    ensureBase: async () => undefined,
    readIndex: async () => ({ pages: [], updatedAt: "" }),
    readDraftIndexWithRevision: async () => ({
      index: { pages: [], updatedAt: "" },
      draftStructureRevision: 0,
    }),
    putIndex: async () => undefined,
    readSettings: async () => reads[0].settings,
    readSettingsWithRevisions: async () =>
      reads[Math.min(readIndex++, reads.length - 1)],
    compareAndSetDraftFooter: async (input) => {
      casInputs.push(input);
      return casResults.shift() ?? null;
    },
    putSettings: async (
      _state: ContentState,
      _settings: Readonly<SiteSettings>,
    ) => {
      putSettingsCalls += 1;
    },
  };

  return {
    repo,
    casInputs,
    getReadCount: () => readIndex,
    getPutSettingsCalls: () => putSettingsCalls,
  };
}

async function expectDomainError(
  run: () => Promise<unknown>,
  code: string,
): Promise<DomainError> {
  try {
    await run();
    assert.fail(`Expected ${code}`);
  } catch (error) {
    assert.ok(error instanceof DomainError);
    assert.equal(error.code, code);
    return error;
  }
}

void test("requires an expected footer revision", async () => {
  const { repo } = createRepository();
  const run = updateFooterSettings({ repo });

  await expectDomainError(
    () => run({ baseline: BASELINE, patch: { showYear: false } }),
    ERROR_CODES.REVISION_REQUIRED,
  );
});

void test("persists a current revision with targeted CAS", async () => {
  const persisted = {
    settings: { copyright: "Local", showYear: true },
    revision: 2,
  };
  const ctx = createRepository({ casResults: [persisted] });
  const run = updateFooterSettings({ repo: ctx.repo });

  const result = await run({
    baseline: BASELINE,
    patch: { copyright: "Local" },
    expectedRevision: 1,
  });

  assert.deepEqual(result, persisted);
  assert.deepEqual(ctx.casInputs, [
    {
      expectedRevision: 1,
      footer: { copyright: "Local", showYear: true },
    },
  ]);
  assert.equal(ctx.getPutSettingsCalls(), 0);
});

void test("merges a stale local field with a concurrent change on the other field", async () => {
  const current = { copyright: "Baseline", showYear: false };
  const persisted = {
    settings: { copyright: "Local", showYear: false },
    revision: 3,
  };
  const ctx = createRepository({
    reads: [settingsWithFooter(current, 2)],
    casResults: [persisted],
  });

  const result = await updateFooterSettings({ repo: ctx.repo })({
    baseline: BASELINE,
    patch: { copyright: "Local" },
    expectedRevision: 1,
  });

  assert.deepEqual(result, persisted);
  assert.deepEqual(ctx.casInputs[0], {
    expectedRevision: 2,
    footer: { copyright: "Local", showYear: false },
  });
});

void test("returns the server snapshot without CAS for the same concurrent change", async () => {
  const current = { copyright: "Same", showYear: true };
  const ctx = createRepository({ reads: [settingsWithFooter(current, 2)] });

  const result = await updateFooterSettings({ repo: ctx.repo })({
    baseline: BASELINE,
    patch: { copyright: "Same" },
    expectedRevision: 1,
  });

  assert.deepEqual(result, { settings: current, revision: 2 });
  assert.deepEqual(ctx.casInputs, []);
});

void test("classifies the only concurrent showYear change as the same change", async () => {
  const current = { copyright: "Baseline", showYear: false };
  const ctx = createRepository({ reads: [settingsWithFooter(current, 2)] });

  const result = await updateFooterSettings({ repo: ctx.repo })({
    baseline: BASELINE,
    patch: { showYear: false },
    expectedRevision: 1,
  });

  assert.deepEqual(result, { settings: current, revision: 2 });
  assert.deepEqual(ctx.casInputs, []);
});

void test("reports a divergent copyright conflict", async () => {
  const ctx = createRepository({
    reads: [
      settingsWithFooter({ copyright: "Server", showYear: true }, 2),
    ],
  });

  const error = await expectDomainError(
    () =>
      updateFooterSettings({ repo: ctx.repo })({
        baseline: BASELINE,
        patch: { copyright: "Local" },
        expectedRevision: 1,
      }),
    ERROR_CODES.SETTINGS_SECTION_REVISION_CONFLICT,
  );

  assert.deepEqual(error.details, {
    resourceId: "footer",
    expectedRevision: 1,
    currentRevision: 2,
    conflictingPaths: ["copyright"],
  });
});

void test("retries after one lost CAS and then succeeds", async () => {
  const persisted = {
    settings: { copyright: "Local", showYear: false },
    revision: 3,
  };
  const ctx = createRepository({
    reads: [
      settingsWithFooter(BASELINE, 1),
      settingsWithFooter({ ...BASELINE, showYear: false }, 2),
    ],
    casResults: [null, persisted],
  });

  const result = await updateFooterSettings({ repo: ctx.repo })({
    baseline: BASELINE,
    patch: { copyright: "Local" },
    expectedRevision: 1,
  });

  assert.deepEqual(result, persisted);
  assert.equal(ctx.getReadCount(), 2);
  assert.deepEqual(
    ctx.casInputs.map((input) => input.expectedRevision),
    [1, 2],
  );
});

void test("fails with a generic conflict after three lost CAS races", async () => {
  const ctx = createRepository({
    reads: [
      settingsWithFooter(BASELINE, 1),
      settingsWithFooter(BASELINE, 2),
      settingsWithFooter(BASELINE, 3),
    ],
    casResults: [null, null, null],
  });

  const error = await expectDomainError(
    () =>
      updateFooterSettings({ repo: ctx.repo })({
        baseline: BASELINE,
        patch: { copyright: "Local" },
        expectedRevision: 1,
      }),
    ERROR_CODES.CONFLICT,
  );

  assert.equal(error.details, undefined);
  assert.equal(ctx.casInputs.length, 3);
  assert.equal(ctx.getPutSettingsCalls(), 0);
});
