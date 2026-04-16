/**
 * @file migrate-default-to-demo.ts
 * @description
 * Migration KV : copie compoz:default:* → compoz:demo:*
 */

import { getUpstashRedis, parseRedisJson } from "@compoz/infra/kv/kv-redis";
import { kvCmd } from "@compoz/infra/kv/kv-telemetry";

const SOURCE_TENANT = "default";
const TARGET_TENANT = "demo";

function buildPattern(): string {
  return `compoz:${SOURCE_TENANT}:*`;
}

function transformKey(key: string): string {
  return key.replace(`compoz:${SOURCE_TENANT}:`, `compoz:${TARGET_TENANT}:`);
}

function transformValue(value: unknown): unknown {
  const parsed = parseRedisJson<any>(value);

  if (parsed && typeof parsed === "object") {
    if (parsed.tenantId === SOURCE_TENANT) {
      return {
        ...parsed,
        tenantId: TARGET_TENANT,
      };
    }
  }

  return value;
}

export async function migrateDefaultToDemo() {
  const redis = getUpstashRedis();

  console.log("🚀 Migration default → demo");

  const keys = await kvCmd("kv.migrate.keys", "other", () =>
    redis.keys(buildPattern()),
  );

  if (!keys || keys.length === 0) {
    console.log("⚠️ Aucun key trouvée");
    return;
  }

  console.log(`🔍 ${keys.length} clés trouvées`);

  let created = 0;
  let skipped = 0;

  for (const key of keys) {
    const newKey = transformKey(key);

    const exists = await kvCmd("kv.migrate.exists", "other", () =>
      redis.exists(newKey),
    );

    if (exists) {
      console.log(`⏭️ Skip (existe déjà): ${newKey}`);
      skipped++;
      continue;
    }

    const value = await kvCmd("kv.migrate.get", "get", () => redis.get(key));

    const transformed = transformValue(value);

    await kvCmd("kv.migrate.set", "set", () => redis.set(newKey, transformed));

    console.log(`✅ ${key} → ${newKey}`);
    created++;
  }

  console.log("🎉 Migration terminée");
  console.log(`➡️ Created: ${created}`);
  console.log(`➡️ Skipped: ${skipped}`);
}

void migrateDefaultToDemo()
  .then(() => {
    console.log("✅ Script terminé");
  })
  .catch((error) => {
    console.error("❌ Script en erreur");
    console.error(error);
    process.exit(1);
  });
