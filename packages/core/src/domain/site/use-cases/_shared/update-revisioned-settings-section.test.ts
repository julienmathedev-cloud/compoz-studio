/**
 * @file packages/core/src/domain/site/use-cases/_shared/update-revisioned-settings-section.test.ts
 * @layer core/domain/site/use-cases
 * @description Unit tests for the shared revisioned settings-section OCC helper.
 * @remarks The fixture combines scalar and atomic composite fields to cover three-way merge and bounded CAS retry behavior.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import { equalJsonValue } from "@compoz/core/domain/revisions/json-value-equality";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";
import { updateRevisionedSettingsSection } from "@compoz/core/domain/site/use-cases/_shared/update-revisioned-settings-section";

type Section = Readonly<{
  title: string;
  enabled: boolean;
  metadata: Readonly<Record<string, unknown>>;
}>;

const BASELINE: Section = {
  title: "Baseline",
  enabled: true,
  metadata: { source: "baseline" },
};

function createContext(options?: Readonly<{
  reads?: ReadonlyArray<Readonly<{ settings: Section; revision: number }>>;
  casResults?: Array<Readonly<{ settings: Section; revision: number }> | null>;
  validate?: (settings: Section) => void;
}>) {
  const reads = options?.reads ?? [{ settings: BASELINE, revision: 1 }];
  const casResults = options?.casResults ?? [];
  const casInputs: Array<Readonly<{ expectedRevision: number; settings: Section }>> = [];
  let readCount = 0;
  let ensureBaseCount = 0;

  const repo = {
    ensureBase: async () => {
      ensureBaseCount += 1;
    },
  } as unknown as SiteRepository;

  const run = (input: Readonly<{
    baseline: Section;
    patch: Partial<Section>;
    expectedRevision?: number;
  }>) =>
    updateRevisionedSettingsSection({
      repo,
      input,
      resourceId: "fixture",
      fields: ["title", "enabled", "metadata"],
      readCurrent: async () => reads[Math.min(readCount++, reads.length - 1)],
      compareAndSet: async (expectedRevision, settings) => {
        casInputs.push({ expectedRevision, settings });
        return casResults.shift() ?? null;
      },
      equals: (field, left, right) =>
        field === "metadata" ? equalJsonValue(left, right) : Object.is(left, right),
      validate: options?.validate,
    });

  return {
    run,
    casInputs,
    getReadCount: () => readCount,
    getEnsureBaseCount: () => ensureBaseCount,
  };
}

async function expectDomainError(
  run: () => Promise<unknown>,
  code: string,
): Promise<DomainError> {
  try {
    await run();
    assert.fail("Expected a DomainError");
  } catch (error) {
    assert.ok(error instanceof DomainError);
    assert.equal(error.code, code);
    return error;
  }
}

void test("requires a revision before ensuring the base", async () => {
  const context = createContext();

  await assert.rejects(
    () => context.run({ baseline: BASELINE, patch: { enabled: false } }),
    (error: unknown) =>
      error instanceof DomainError && error.code === ERROR_CODES.REVISION_REQUIRED,
  );
  assert.equal(context.getEnsureBaseCount(), 0);
});

void test("ensures the base and persists a scalar local change at the current revision", async () => {
  const persisted = { settings: { ...BASELINE, title: "Local" }, revision: 2 };
  const context = createContext({ casResults: [persisted] });

  const result = await context.run({
    baseline: BASELINE,
    patch: { title: "Local" },
    expectedRevision: 1,
  });

  assert.deepEqual(result, { ...persisted, outcome: "updated" });
  assert.equal(context.getEnsureBaseCount(), 1);
  assert.deepEqual(context.casInputs, [
    { expectedRevision: 1, settings: persisted.settings },
  ]);
});

void test("keeps server-only and same concurrent changes without CAS", async () => {
  const serverOnly = { ...BASELINE, enabled: false };
  const sameChange = { ...BASELINE, title: "Same" };
  const serverOnlyContext = createContext({
    reads: [{ settings: serverOnly, revision: 2 }],
  });
  const sameChangeContext = createContext({
    reads: [{ settings: sameChange, revision: 2 }],
  });

  assert.deepEqual(
    await serverOnlyContext.run({
      baseline: BASELINE,
      patch: { enabled: true },
      expectedRevision: 1,
    }),
    { settings: serverOnly, revision: 2, outcome: "noChanges" },
  );
  assert.deepEqual(
    await sameChangeContext.run({
      baseline: BASELINE,
      patch: { title: "Same" },
      expectedRevision: 1,
    }),
    { settings: sameChange, revision: 2, outcome: "noChanges" },
  );
  assert.deepEqual(serverOnlyContext.casInputs, []);
  assert.deepEqual(sameChangeContext.casInputs, []);
});

void test("merges disjoint local and server changes before CAS", async () => {
  const current = { ...BASELINE, enabled: false };
  const persisted = { settings: { ...current, title: "Local" }, revision: 3 };
  const context = createContext({
    reads: [{ settings: current, revision: 2 }],
    casResults: [persisted],
  });

  assert.deepEqual(
    await context.run({
      baseline: BASELINE,
      patch: { title: "Local" },
      expectedRevision: 1,
    }),
    { ...persisted, outcome: "updated" },
  );
  assert.deepEqual(context.casInputs, [
    { expectedRevision: 2, settings: persisted.settings },
  ]);
});

void test("reports every divergent field with complete conflict details", async () => {
  const context = createContext({
    reads: [
      {
        settings: {
          title: "Server",
          enabled: true,
          metadata: { source: "server" },
        },
        revision: 4,
      },
    ],
  });

  const error = await expectDomainError(
    () =>
      context.run({
        baseline: BASELINE,
        patch: {
          title: "Local",
          metadata: { source: "local" },
        },
        expectedRevision: 1,
      }),
    ERROR_CODES.SETTINGS_SECTION_REVISION_CONFLICT,
  );

  assert.deepEqual(error.details, {
    resourceId: "fixture",
    expectedRevision: 1,
    currentRevision: 4,
    conflictingPaths: ["title", "metadata"],
  });
  assert.deepEqual(context.casInputs, []);
});

void test("uses structural equality for atomic composite values", async () => {
  const sameComposite = { ...BASELINE, metadata: { source: "baseline" } };
  const sameContext = createContext({
    reads: [{ settings: sameComposite, revision: 2 }],
  });
  const divergentContext = createContext({
    reads: [{ settings: { ...BASELINE, metadata: { source: "server" } }, revision: 2 }],
  });

  assert.deepEqual(
    await sameContext.run({
      baseline: BASELINE,
      patch: { metadata: { source: "baseline" } },
      expectedRevision: 1,
    }),
    { settings: sameComposite, revision: 2, outcome: "noChanges" },
  );
  const error = await expectDomainError(
    () =>
      divergentContext.run({
        baseline: BASELINE,
        patch: { metadata: { source: "local" } },
        expectedRevision: 1,
      }),
    ERROR_CODES.SETTINGS_SECTION_REVISION_CONFLICT,
  );

  assert.deepEqual(error.details, {
    resourceId: "fixture",
    expectedRevision: 1,
    currentRevision: 2,
    conflictingPaths: ["metadata"],
  });
  assert.deepEqual(sameContext.casInputs, []);
});

void test("validates the merged value on every CAS attempt", async () => {
  const validated: Section[] = [];
  const persisted = {
    settings: { ...BASELINE, enabled: false, title: "Local" },
    revision: 3,
  };
  const context = createContext({
    reads: [
      { settings: BASELINE, revision: 1 },
      { settings: { ...BASELINE, enabled: false }, revision: 2 },
    ],
    casResults: [null, persisted],
    validate: (settings) => validated.push(settings),
  });

  assert.deepEqual(
    await context.run({
      baseline: BASELINE,
      patch: { title: "Local" },
      expectedRevision: 1,
    }),
    { ...persisted, outcome: "updated" },
  );
  assert.deepEqual(validated, [
    { ...BASELINE, title: "Local" },
    persisted.settings,
  ]);
  assert.deepEqual(
    context.casInputs.map((input) => input.expectedRevision),
    [1, 2],
  );
  assert.equal(context.getReadCount(), 2);
});

void test("stops after three lost CAS races and does not persist no-ops", async () => {
  const racing = createContext({
    reads: [
      { settings: BASELINE, revision: 1 },
      { settings: BASELINE, revision: 2 },
      { settings: BASELINE, revision: 3 },
    ],
    casResults: [null, null, null],
  });
  const noOp = createContext();

  await assert.rejects(
    () =>
      racing.run({
        baseline: BASELINE,
        patch: { title: "Local" },
        expectedRevision: 1,
      }),
    (error: unknown) =>
      error instanceof DomainError && error.code === ERROR_CODES.CONFLICT,
  );
  assert.equal(racing.casInputs.length, 3);
  assert.deepEqual(
    await noOp.run({ baseline: BASELINE, patch: {}, expectedRevision: 1 }),
    { settings: BASELINE, revision: 1, outcome: "noChanges" },
  );
  assert.deepEqual(noOp.casInputs, []);
});

void test("retains the initial expected revision in a conflict after a retry", async () => {
  const context = createContext({
    reads: [
      { settings: BASELINE, revision: 1 },
      { settings: { ...BASELINE, title: "Server" }, revision: 2 },
    ],
    casResults: [null],
  });

  const error = await expectDomainError(
    () =>
      context.run({
        baseline: BASELINE,
        patch: { title: "Local" },
        expectedRevision: 1,
      }),
    ERROR_CODES.SETTINGS_SECTION_REVISION_CONFLICT,
  );

  assert.deepEqual(error.details, {
    resourceId: "fixture",
    expectedRevision: 1,
    currentRevision: 2,
    conflictingPaths: ["title"],
  });
});
