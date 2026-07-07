/**
 * @file packages/infra/src/demo/kv-demo-sandbox-repository.ts
 * @layer infra/demo
 * @description KV repository for demo sandbox metadata.
 * @remarks
 * Sandboxes are stored by `demoInstanceId` and listed for expiration cleanup.
 */

import type { DemoSandbox } from "@compoz/core/domain/demo/entities/demo-sandbox";
import type { DemoSandboxRepository } from "@compoz/core/domain/demo/ports/demo-sandbox-repository";
import { getUpstashRedis, parseRedisJson } from "@compoz/infra/kv/kv-redis";
import { kvCmd } from "@compoz/infra/kv/kv-telemetry";
import {
  DemoSandboxSchema,
  type DemoSandboxShape,
} from "@compoz/validation/demo/demo-sandbox";

const DEMO_NS = "compoz:studio:demo" as const;

function sandboxKey(demoInstanceId: string): string {
  return `${DEMO_NS}:sandbox:${demoInstanceId}`;
}

function sandboxKeyPattern(): string {
  return `${DEMO_NS}:sandbox:*`;
}

function normalizeDemoInstanceId(value: unknown): string {
  return String(value ?? "").trim();
}

function kvCtx(base: string): string {
  return `demo.sandbox.${base}`;
}

function toDomainSandbox(input: DemoSandboxShape): DemoSandbox {
  return {
    demoInstanceId: input.demoInstanceId,
    userId: input.userId,
    websiteId: input.websiteId,
    expiresAt: input.expiresAt,
    createdAt: input.createdAt,
  };
}

export class KvDemoSandboxRepository implements DemoSandboxRepository {
  private readonly redis = getUpstashRedis();

  async ensureBase(): Promise<void> {
    // no-op for KV-backed storage
  }

  async list(): Promise<ReadonlyArray<DemoSandbox>> {
    const keys = await kvCmd(kvCtx("list.keys"), "other", () =>
      this.redis.keys(sandboxKeyPattern()),
    );

    if (!Array.isArray(keys) || keys.length === 0) {
      return [];
    }

    const raws = await kvCmd(kvCtx("list.mget"), "other", () =>
      this.redis.mget(...keys),
    );

    if (!Array.isArray(raws) || raws.length === 0) {
      return [];
    }

    const out: DemoSandbox[] = [];

    for (const raw of raws) {
      const json = parseRedisJson<unknown>(raw);

      if (!json) {
        continue;
      }

      try {
        const parsed = DemoSandboxSchema.parse(json);
        out.push(toDomainSandbox(parsed));
      } catch {
        // Skip corrupted documents during cleanup listing.
      }
    }

    return out;
  }

  async readByDemoInstanceId(
    demoInstanceId: string,
  ): Promise<DemoSandbox | null> {
    const id = normalizeDemoInstanceId(demoInstanceId);

    if (!id) {
      return null;
    }

    const raw = await kvCmd(kvCtx("readByDemoInstanceId.get"), "get", () =>
      this.redis.get(sandboxKey(id)),
    );

    const json = parseRedisJson<unknown>(raw);

    if (!json) {
      return null;
    }

    const parsed = DemoSandboxSchema.parse(json);

    return toDomainSandbox(parsed);
  }

  async put(sandbox: DemoSandbox): Promise<void> {
    const demoInstanceId = normalizeDemoInstanceId(sandbox?.demoInstanceId);

    if (!demoInstanceId) {
      throw new Error(
        "KvDemoSandboxRepository.put: sandbox.demoInstanceId is required.",
      );
    }

    const parsed = DemoSandboxSchema.parse(sandbox);

    await kvCmd(kvCtx("put.set"), "set", () =>
      this.redis.set(sandboxKey(demoInstanceId), JSON.stringify(parsed)),
    );
  }

  async deleteByDemoInstanceId(demoInstanceId: string): Promise<void> {
    const id = normalizeDemoInstanceId(demoInstanceId);

    if (!id) {
      return;
    }

    await kvCmd(kvCtx("deleteByDemoInstanceId.del"), "del", () =>
      this.redis.del(sandboxKey(id)),
    );
  }

  async existsByDemoInstanceId(demoInstanceId: string): Promise<boolean> {
    const id = normalizeDemoInstanceId(demoInstanceId);

    if (!id) {
      return false;
    }

    const count = await kvCmd(
      kvCtx("existsByDemoInstanceId.exists"),
      "other",
      () => this.redis.exists(sandboxKey(id)),
    );

    return count === 1;
  }
}
