/**
 * @file scripts/audit-legacy-card-cells.mjs
 *
 * Read-only audit for remaining legacy "cardsExtended" values
 * in KV / Upstash Redis page data.
 *
 * This script does not modify data.
 *
 * Usage:
 * pnpm dlx dotenv-cli -e apps/studio/.env.local -- node scripts/audit-legacy-card-cells.mjs
 */

const LEGACY_VALUE = "cardsExtended";

const TARGET_FIELDS = new Set(["itemKind", "cardKind"]);

const DEFAULT_SCAN_PATTERNS = [
  "compoz:*:draft:pages:*",
  "compoz:*:published:pages:*",
];

const REST_URL =
  process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;

const REST_TOKEN =
  process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

if (!REST_URL || !REST_TOKEN) {
  console.error(
    [
      "❌ Missing environment variables.",
      "",
      "Expected:",
      "- KV_REST_API_URL + KV_REST_API_TOKEN",
      "or",
      "- UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN",
    ].join("\n"),
  );

  process.exit(1);
}

async function redis(command) {
  const response = await fetch(REST_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    throw new Error(
      `Redis command failed (${response.status}): ${await response.text()}`,
    );
  }

  const payload = await response.json();

  if (payload.error) {
    throw new Error(payload.error);
  }

  return payload.result;
}

function safeJsonParse(value) {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function parseCompozKey(key) {
  const [, tenantId, scope, resource, pageKey] = key.split(":");

  return {
    tenantId: tenantId ?? "unknown",
    scope: scope ?? "unknown",
    resource: resource ?? "unknown",
    pageKey: pageKey ?? "unknown",
  };
}

function shouldIgnoreKey(key) {
  const { tenantId } = parseCompozKey(key);

  return tenantId.startsWith("demo-");
}

function findLegacyCardsExtendedValues(value, path = "$", matches = []) {
  if (!value || typeof value !== "object") return matches;

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      findLegacyCardsExtendedValues(item, `${path}[${index}]`, matches);
    });

    return matches;
  }

  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;

    if (child === LEGACY_VALUE) {
      matches.push({
        path: childPath,
        field: key,
        isTargetField: TARGET_FIELDS.has(key),
        parentKind: typeof value.kind === "string" ? value.kind : null,
        parentId: typeof value.id === "string" ? value.id : null,
        itemCount: Array.isArray(value.items) ? value.items.length : null,
      });

      continue;
    }

    findLegacyCardsExtendedValues(child, childPath, matches);
  }

  return matches;
}

async function scanKeysForPattern(pattern) {
  const keys = [];
  let cursor = "0";

  do {
    const result = await redis([
      "SCAN",
      cursor,
      "MATCH",
      pattern,
      "COUNT",
      "500",
    ]);

    cursor = String(result[0]);

    keys.push(...result[1].filter((key) => !shouldIgnoreKey(key)));
  } while (cursor !== "0");

  return keys;
}

async function scanKeys() {
  const uniqueKeys = new Set();

  for (const pattern of DEFAULT_SCAN_PATTERNS) {
    const keys = await scanKeysForPattern(pattern);

    for (const key of keys) {
      uniqueKeys.add(key);
    }
  }

  return Array.from(uniqueKeys).sort();
}

async function main() {
  console.log("🔎 Scanning KV for legacy cardsExtended values...");

  const keys = await scanKeys();
  const report = [];

  for (const key of keys) {
    const raw = await redis(["GET", key]);
    const parsed = safeJsonParse(raw);

    if (!parsed) continue;

    const matches = findLegacyCardsExtendedValues(parsed);

    if (matches.length > 0) {
      report.push({
        key,
        ...parseCompozKey(key),
        matches,
      });
    }
  }

  const totalMatches = report.reduce(
    (total, entry) => total + entry.matches.length,
    0,
  );

  console.log("");
  console.log(`📦 Keys scanned: ${keys.length}`);
  console.log(`🧩 Keys containing legacy values: ${report.length}`);
  console.log(
    `🔁 Total legacy "${LEGACY_VALUE}" values found: ${totalMatches}`,
  );

  if (report.length === 0) {
    console.log("");
    console.log(`✅ No remaining "${LEGACY_VALUE}" value found.`);
    return;
  }

  console.log("");
  console.log(`⚠️ Legacy "${LEGACY_VALUE}" values found:`);
  console.log("");

  for (const entry of report) {
    console.log(`KEY: ${entry.key}`);
    console.log(
      `  tenant=${entry.tenantId} | scope=${entry.scope} | page=${entry.pageKey}`,
    );

    for (const match of entry.matches) {
      const fieldStatus = match.isTargetField
        ? "target field"
        : "unexpected field";

      console.log(
        [
          `  - ${match.field}="${LEGACY_VALUE}"`,
          `(${fieldStatus})`,
          `parentKind=${match.parentKind ?? "unknown"}`,
          `parentId=${match.parentId ?? "unknown"}`,
          `items=${match.itemCount ?? "unknown"}`,
          `path=${match.path}`,
        ].join(" | "),
      );
    }

    console.log("");
  }

  process.exitCode = 1;
}

main().catch((error) => {
  console.error("");
  console.error("❌ Audit failed");
  console.error(error);
  process.exit(1);
});
