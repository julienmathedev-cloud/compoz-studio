/**
 * @file scripts/audit-legacy-card-cells.mjs
 *
 * Read-only audit for remaining legacy card cell values
 * in KV / Upstash Redis page data.
 *
 * This script does not modify data.
 *
 * It checks for:
 * - cards
 * - cardsExtended
 * - structuredCard
 * - extendedCard
 *
 * Expected new value:
 * - cardCollection
 *
 * Usage:
 * pnpm dlx dotenv-cli -e apps/studio/.env.local -- node scripts/audit-legacy-card-cells.mjs
 */

const LEGACY_VALUES = new Set([
  "cards",
  "cardsExtended",
  "structuredCard",
  "extendedCard",
]);

const NEW_VALUE = "cardCollection";

const TARGET_FIELDS = new Set(["kind", "cellKind"]);

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
  const [, websiteId, scope, resource, pageKey] = key.split(":");

  return {
    websiteId: websiteId ?? "unknown",
    scope: scope ?? "unknown",
    resource: resource ?? "unknown",
    pageKey: pageKey ?? "unknown",
  };
}

function shouldIgnoreKey(key) {
  const { websiteId } = parseCompozKey(key);

  return websiteId.startsWith("demo-");
}

function findCardValues(value, path = "$", matches = []) {
  if (!value || typeof value !== "object") return matches;

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      findCardValues(item, `${path}[${index}]`, matches);
    });

    return matches;
  }

  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;

    if (typeof child === "string") {
      const isTargetField = TARGET_FIELDS.has(key);
      const isLegacy = isTargetField && LEGACY_VALUES.has(child);
      const isNewValue = isTargetField && child === NEW_VALUE;

      if (isLegacy || isNewValue) {
        matches.push({
          path: childPath,
          field: key,
          value: child,
          isLegacy,
          isTargetField,
          parentKind: typeof value.kind === "string" ? value.kind : null,
          parentId: typeof value.id === "string" ? value.id : null,
          itemCount: Array.isArray(value.items) ? value.items.length : null,
        });
      }

      continue;
    }

    findCardValues(child, childPath, matches);
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
  console.log("🔎 Scanning KV for legacy card values...");

  const keys = await scanKeys();
  const legacyReport = [];
  let totalNewValues = 0;

  for (const key of keys) {
    const raw = await redis(["GET", key]);
    const parsed = safeJsonParse(raw);

    if (!parsed) continue;

    const matches = findCardValues(parsed);
    const legacyMatches = matches.filter((match) => match.isLegacy);
    const newMatches = matches.filter((match) => match.value === NEW_VALUE);

    totalNewValues += newMatches.length;

    if (legacyMatches.length > 0) {
      legacyReport.push({
        key,
        ...parseCompozKey(key),
        matches: legacyMatches,
      });
    }
  }

  const totalLegacyMatches = legacyReport.reduce(
    (total, entry) => total + entry.matches.length,
    0,
  );

  console.log("");
  console.log(`📦 Keys scanned: ${keys.length}`);
  console.log(`🧩 Keys containing legacy values: ${legacyReport.length}`);
  console.log(`🔁 Total legacy values found: ${totalLegacyMatches}`);
  console.log(`✅ Total "${NEW_VALUE}" values found: ${totalNewValues}`);

  if (legacyReport.length === 0) {
    console.log("");
    console.log("✅ No remaining legacy card value found.");
    return;
  }

  console.log("");
  console.log("⚠️ Legacy card values found:");
  console.log("");

  for (const entry of legacyReport) {
    console.log(`KEY: ${entry.key}`);
    console.log(
      `  website=${entry.websiteId} | scope=${entry.scope} | page=${entry.pageKey}`,
    );

    for (const match of entry.matches) {
      const fieldStatus = match.isTargetField
        ? "target field"
        : "unexpected field";

      console.log(
        [
          `  - ${match.field}="${match.value}"`,
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
