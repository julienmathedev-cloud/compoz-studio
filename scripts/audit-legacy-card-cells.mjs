/**
 * @file scripts/audit-legacy-card-cells.mjs
 *
 * Audit read-only des anciennes cells cards / cardsExtended / structuredCard
 * dans toute la base KV / Upstash Redis.
 *
 * Usage:
 * node scripts/audit-legacy-card-cells.mjs
 */

const LEGACY_KINDS = new Set(["cards", "cardsExtended", "structuredCard"]);

const REST_URL =
  process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;

const REST_TOKEN =
  process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

if (!REST_URL || !REST_TOKEN) {
  console.error(
    [
      "❌ Variables d'environnement manquantes.",
      "",
      "Attendues :",
      "- KV_REST_API_URL + KV_REST_API_TOKEN",
      "ou",
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

function findLegacyCells(value, path = "$", matches = []) {
  if (!value || typeof value !== "object") return matches;

  if (
    !Array.isArray(value) &&
    typeof value.kind === "string" &&
    LEGACY_KINDS.has(value.kind)
  ) {
    matches.push({
      path,
      kind: value.kind,
      id: typeof value.id === "string" ? value.id : null,
      itemCount: Array.isArray(value.items) ? value.items.length : null,
    });
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      findLegacyCells(item, `${path}[${index}]`, matches);
    });

    return matches;
  }

  for (const [key, child] of Object.entries(value)) {
    findLegacyCells(child, `${path}.${key}`, matches);
  }

  return matches;
}

async function scanKeys() {
  const keys = [];

  let cursor = "0";

  do {
    const result = await redis([
      "SCAN",

      cursor,

      "MATCH",

      "compoz:*:draft:pages:*",

      "COUNT",

      "500",
    ]);

    cursor = String(result[0]);

    keys.push(
      ...result[1].filter((key) => {
        const tenantId = key.split(":")[1];

        return tenantId && !tenantId.startsWith("demo-");
      }),
    );
  } while (cursor !== "0");

  return keys;
}

async function main() {
  console.log("🔎 Scan KV en cours...");

  const keys = await scanKeys();
  const report = [];

  for (const key of keys) {
    const raw = await redis(["GET", key]);
    const parsed = safeJsonParse(raw);

    if (!parsed) continue;

    const matches = findLegacyCells(parsed);

    if (matches.length > 0) {
      report.push({
        key,
        matches,
      });
    }
  }

  console.log("");
  console.log(`📦 Clés scannées : ${keys.length}`);
  console.log(`🧩 Clés contenant d'anciennes cells : ${report.length}`);

  if (report.length === 0) {
    console.log("");
    console.log(
      "✅ Aucun reste de cards / cardsExtended / structuredCard trouvé.",
    );
    return;
  }

  console.log("");
  console.log("⚠️ Anciennes cells trouvées :");
  console.log("");

  for (const entry of report) {
    console.log(`KEY: ${entry.key}`);

    for (const match of entry.matches) {
      console.log(
        `  - ${match.kind} | id=${match.id ?? "unknown"} | items=${
          match.itemCount ?? "unknown"
        } | path=${match.path}`,
      );
    }

    console.log("");
  }

  process.exitCode = 1;
}

main().catch((error) => {
  console.error("");
  console.error("❌ Audit échoué");
  console.error(error);
  process.exit(1);
});
