/**
 * @file packages/infra/src/site/prisma-publish-site-transaction.test.ts
 * @layer infra/site
 * @description Unit tests for publication serialization retry handling.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import { type Prisma, type PrismaClient } from "@compoz/infra/prisma/generated";
import {
  classifyRetryableSerializationConflict,
  computePublishRetryDelayMs,
  PrismaPublishSiteTransaction,
} from "@compoz/infra/site/prisma-publish-site-transaction";

const WEBSITE_ID = "website-1";
const P2034_ERROR = { code: "P2034" };
const P2010_40001_ERROR = {
  code: "P2010",
  meta: {
    driverAdapterError: {
      cause: {
        originalCode: "40001",
      },
    },
  },
};

type Attempt =
  | Readonly<{ kind: "success" }>
  | Readonly<{ kind: "commitError"; error: unknown }>
  | Readonly<{ kind: "rawError"; error: unknown }>;

function createRunner(attempts: ReadonlyArray<Attempt>) {
  let transactionCalls = 0;

  const transactionClient = {
    website: {
      upsert: async () => undefined,
      update: async () => undefined,
    },
    page: {
      deleteMany: async () => undefined,
      createMany: async () => undefined,
    },
    siteSettings: {
      upsert: async () => undefined,
    },
    $queryRaw: async () => {
      const attempt = attempts[transactionCalls - 1];
      if (attempt?.kind === "rawError") throw attempt.error;
      return [];
    },
  };

  const client = {
    $transaction: async <T>(
      callback: (transaction: Prisma.TransactionClient) => Promise<T>,
    ): Promise<T> => {
      const attempt = attempts[transactionCalls];
      transactionCalls += 1;

      if (!attempt) throw new Error("Unexpected transaction attempt.");

      const result = await callback(
        transactionClient as unknown as Prisma.TransactionClient,
      );

      if (attempt.kind === "commitError") throw attempt.error;
      return result;
    },
  } as unknown as Pick<PrismaClient, "$transaction">;

  return {
    client,
    getTransactionCalls: () => transactionCalls,
  };
}

void test("replays the complete publication callback after a P2034 commit conflict", async () => {
  const runner = createRunner([
    { kind: "commitError", error: P2034_ERROR },
    { kind: "success" },
  ]);
  const sleeps: number[] = [];
  let operationCalls = 0;
  const transaction = new PrismaPublishSiteTransaction({
    websiteId: WEBSITE_ID,
    client: runner.client,
    sleep: async (delayMs) => {
      sleeps.push(delayMs);
    },
    jitter: () => 0,
  });

  const result = await transaction.run(async () => {
    operationCalls += 1;
    return "published";
  });

  assert.equal(result, "published");
  assert.equal(runner.getTransactionCalls(), 2);
  assert.equal(operationCalls, 2);
  assert.deepEqual(sleeps, [25]);
});

void test("retries the structured P2010 SQLSTATE 40001 conflict from the lock query", async () => {
  const runner = createRunner([
    { kind: "rawError", error: P2010_40001_ERROR },
    { kind: "success" },
  ]);
  const sleeps: number[] = [];
  let operationCalls = 0;
  const transaction = new PrismaPublishSiteTransaction({
    websiteId: WEBSITE_ID,
    client: runner.client,
    sleep: async (delayMs) => {
      sleeps.push(delayMs);
    },
    jitter: () => 0,
  });

  const result = await transaction.run(async () => {
    operationCalls += 1;
    return "published";
  });

  assert.equal(result, "published");
  assert.equal(runner.getTransactionCalls(), 2);
  assert.equal(operationCalls, 1);
  assert.deepEqual(sleeps, [25]);
});

void test("propagates a P2010 with another SQLSTATE unchanged", async () => {
  const originalError = {
    code: "P2010",
    meta: {
      driverAdapterError: {
        cause: { originalCode: "23505" },
      },
    },
  };
  const runner = createRunner([{ kind: "rawError", error: originalError }]);
  const sleeps: number[] = [];
  const transaction = new PrismaPublishSiteTransaction({
    websiteId: WEBSITE_ID,
    client: runner.client,
    sleep: async (delayMs) => {
      sleeps.push(delayMs);
    },
    jitter: () => 0,
  });

  await assert.rejects(transaction.run(async () => "published"), (error) => {
    assert.equal(error, originalError);
    return true;
  });

  assert.equal(runner.getTransactionCalls(), 1);
  assert.deepEqual(sleeps, []);
});

void test("raises PUBLISH_CONFLICT after three retryable commit conflicts", async () => {
  const lastConflict = { code: "P2034", marker: "last" };
  const runner = createRunner([
    { kind: "commitError", error: { code: "P2034" } },
    { kind: "commitError", error: { code: "P2034" } },
    { kind: "commitError", error: lastConflict },
  ]);
  const sleeps: number[] = [];
  let operationCalls = 0;
  const transaction = new PrismaPublishSiteTransaction({
    websiteId: WEBSITE_ID,
    client: runner.client,
    sleep: async (delayMs) => {
      sleeps.push(delayMs);
    },
    jitter: () => 0,
  });

  await assert.rejects(transaction.run(async () => {
    operationCalls += 1;
    return "published";
  }), (error) => {
    if (!(error instanceof DomainError)) return false;

    assert.equal(error.code, ERROR_CODES.PUBLISH_CONFLICT);
    assert.equal(error.cause, lastConflict);
    assert.deepEqual(error.details, {
      operation: "publish_site",
      attempts: 3,
      conflictKind: "P2034",
    });
    return true;
  });

  assert.equal(runner.getTransactionCalls(), 3);
  assert.equal(operationCalls, 3);
  assert.deepEqual(sleeps, [25, 50]);
});

void test("does not sleep or consume jitter after an initial success", async () => {
  const runner = createRunner([{ kind: "success" }]);
  const sleeps: number[] = [];
  let jitterCalls = 0;
  const transaction = new PrismaPublishSiteTransaction({
    websiteId: WEBSITE_ID,
    client: runner.client,
    sleep: async (delayMs) => {
      sleeps.push(delayMs);
    },
    jitter: () => {
      jitterCalls += 1;
      return 0;
    },
  });

  await transaction.run(async () => "published");

  assert.equal(runner.getTransactionCalls(), 1);
  assert.deepEqual(sleeps, []);
  assert.equal(jitterCalls, 0);
});

void test("classifies only the accepted structural retry conflict shapes", () => {
  const cases: ReadonlyArray<readonly [unknown, "P2034" | "P2010_40001" | null]> = [
    [{ code: "P2034" }, "P2034"],
    [P2010_40001_ERROR, "P2010_40001"],
    [{ code: "P2010", meta: { driverAdapterError: { cause: { originalCode: "23505" } } } }, null],
    [{ code: "P2010" }, null],
    [{ code: "P2010", meta: null }, null],
    [{ code: "P2010", meta: {} }, null],
    [{ code: "P2010", meta: { driverAdapterError: {} } }, null],
    [{ code: "P2010", meta: { driverAdapterError: { cause: [] } } }, null],
    [{ code: "P2010", meta: { driverAdapterError: { cause: "40001" } } }, null],
    [{ code: "P2010", meta: { driverAdapterError: { cause: { originalCode: 40001 } } } }, null],
    [{ code: "P2010", message: "Raw query failed with SQLSTATE 40001" }, null],
    [{ code: "P2010", meta: { code: "40001" } }, null],
    [{}, null],
    [null, null],
    [undefined, null],
    ["P2034", null],
    [40001, null],
    [[], null],
  ];

  for (const [error, expected] of cases) {
    assert.equal(classifyRetryableSerializationConflict(error), expected);
  }
});

void test("computes bounded publication retry delays", () => {
  assert.equal(
    computePublishRetryDelayMs({ failedAttempt: 1, jitter: () => 0 }),
    25,
  );
  assert.equal(
    computePublishRetryDelayMs({ failedAttempt: 1, jitter: () => 1 }),
    50,
  );
  assert.equal(
    computePublishRetryDelayMs({ failedAttempt: 2, jitter: () => 0 }),
    50,
  );
  assert.equal(
    computePublishRetryDelayMs({ failedAttempt: 2, jitter: () => 1 }),
    100,
  );
  assert.equal(
    computePublishRetryDelayMs({ failedAttempt: 1, jitter: () => -1 }),
    25,
  );
  assert.equal(
    computePublishRetryDelayMs({ failedAttempt: 1, jitter: () => Number.NaN }),
    25,
  );
  assert.equal(
    computePublishRetryDelayMs({ failedAttempt: 1, jitter: () => 2 }),
    50,
  );
  assert.equal(
    computePublishRetryDelayMs({ failedAttempt: 2, jitter: () => Infinity }),
    100,
  );
  assert.equal(
    computePublishRetryDelayMs({ failedAttempt: 99, jitter: () => 1 }),
    100,
  );
});
