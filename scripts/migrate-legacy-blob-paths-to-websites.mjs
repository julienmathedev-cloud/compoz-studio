/**
 * @file scripts/migrate-legacy-blob-paths-to-websites.mjs
 *
 * Migrates referenced legacy Vercel Blob paths from:
 * tenants/<websiteId>/...
 *
 * to:
 * websites/<websiteId>/...
 *
 * Scope:
 * - Prisma MediaAsset rows only
 * - Only MediaAsset rows actually referenced in SiteSettings/Page JSON
 *   by mediaAssetId or by url are migrated
 *
 * Non-destructive:
 * - Does not delete old Vercel Blob files
 * - Does not scan/copy orphan blobs
 * - Dry-run by default unless --apply is passed
 *
 * Usage:
 * pnpm dlx dotenv-cli -e apps/studio/.env.local -e apps/site/.env.local -- pnpm exec tsx scripts/migrate-legacy-blob-paths-to-websites.mjs --website renaud --dry-run
 * pnpm dlx dotenv-cli -e apps/studio/.env.local -e apps/site/.env.local -- pnpm exec tsx scripts/migrate-legacy-blob-paths-to-websites.mjs --website renaud --apply
 */

const LEGACY_PREFIX = "tenants";
const TARGET_PREFIX = "websites";

const SETTINGS_FIELDS = [
  "header",
  "footer",
  "primaryMenu",
  "legalMenu",
  "social",
  "identity",
  "seo",
  "theme",
];

function parseArgs(argv) {
  const args = {
    apply: false,
    dryRun: false,
    websiteIds: [],
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--apply") {
      args.apply = true;
      continue;
    }

    if (arg === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    if (arg === "--website") {
      const websiteId = String(argv[i + 1] ?? "").trim();

      if (!websiteId) {
        throw new Error("Missing value for --website <websiteId>");
      }

      args.websiteIds.push(websiteId);
      i += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (args.apply && args.dryRun) {
    throw new Error("Use only one of --apply or --dry-run.");
  }

  if (args.websiteIds.length === 0) {
    throw new Error("Missing required argument: --website <websiteId>");
  }

  return {
    mode: args.apply ? "apply" : "dry-run",
    websiteIds: [...new Set(args.websiteIds)],
  };
}

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function isLegacyKeyForWebsite(key, websiteId) {
  return key.startsWith(`${LEGACY_PREFIX}/${websiteId}/`);
}

function toTargetKey(key, websiteId) {
  return key.replace(
    `${LEGACY_PREFIX}/${websiteId}/`,
    `${TARGET_PREFIX}/${websiteId}/`,
  );
}

function rewriteBlobUrl(rawUrl, targetKey) {
  const url = new URL(rawUrl);

  url.pathname = `/${targetKey}`;

  return url.toString();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceEverywhere(value, replacements) {
  if (typeof value === "string") {
    let next = value;

    for (const { from, to } of replacements) {
      next = next.replace(new RegExp(escapeRegExp(from), "g"), to);
    }

    return next;
  }

  if (Array.isArray(value)) {
    return value.map((child) => replaceEverywhere(child, replacements));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      replaceEverywhere(child, replacements),
    ]),
  );
}

function stableStringify(value) {
  return JSON.stringify(sortJson(value));
}

function sortJson(value) {
  if (Array.isArray(value)) {
    return value.map(sortJson);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => [key, sortJson(child)]),
  );
}

function contentContains(content, needle) {
  if (!needle) {
    return false;
  }

  return JSON.stringify(content).includes(needle);
}

function isAssetReferenced(asset, contentRows) {
  const id = nonEmptyString(asset.id);
  const url = nonEmptyString(asset.url);

  for (const row of contentRows) {
    const byId = contentContains(row.content, id);
    const byUrl = contentContains(row.content, url);

    if (byId || byUrl) {
      return { byId, byUrl };
    }
  }

  return {
    byId: false,
    byUrl: false,
  };
}

function pickSettings(row) {
  return Object.fromEntries(
    SETTINGS_FIELDS.map((field) => [field, row[field]]),
  );
}

function settingsSelect() {
  return {
    id: true,
    state: true,
    ...Object.fromEntries(SETTINGS_FIELDS.map((field) => [field, true])),
  };
}

async function loadDependencies() {
  const { createRequire } = await import("node:module");

  const rootRequire = createRequire(import.meta.url);

  const candidatePackageJsonPaths = [
    "../apps/studio/package.json",
    "../apps/site/package.json",
    "../packages/infra/package.json",
  ];

  let blobModulePath = "";

  for (const packageJsonPath of candidatePackageJsonPaths) {
    try {
      const scopedRequire = createRequire(
        new URL(packageJsonPath, import.meta.url),
      );

      blobModulePath = scopedRequire.resolve("@vercel/blob");
      break;
    } catch {
      // Try the next package scope.
    }
  }

  if (!blobModulePath) {
    try {
      blobModulePath = rootRequire.resolve("@vercel/blob");
    } catch {
      throw new Error(
        "Cannot resolve @vercel/blob from apps/studio, apps/site, packages/infra, or workspace root.",
      );
    }
  }

  const [{ prisma }, { head, put }] = await Promise.all([
    import("@compoz/infra/prisma/prisma-client"),
    import(blobModulePath),
  ]);

  return { head, prisma, put };
}

async function readContentRows({ prisma, websiteId }) {
  const [settingsRows, pageRows] = await Promise.all([
    prisma.siteSettings.findMany({
      where: { websiteId },
      select: settingsSelect(),
      orderBy: [{ state: "asc" }, { id: "asc" }],
    }),
    prisma.page.findMany({
      where: { websiteId },
      select: {
        id: true,
        state: true,
        slug: true,
        blocks: true,
      },
      orderBy: [{ state: "asc" }, { position: "asc" }, { id: "asc" }],
    }),
  ]);

  return [
    ...settingsRows.map((row) => ({
      id: row.id,
      kind: "settings",
      state: row.state,
      content: pickSettings(row),
    })),
    ...pageRows.map((row) => ({
      id: row.id,
      kind: "page",
      slug: row.slug,
      state: row.state,
      content: row.blocks,
    })),
  ];
}

async function targetBlobExists({ head, targetUrl }) {
  try {
    await head(targetUrl);
    return true;
  } catch {
    return false;
  }
}

async function copyBlobIfNeeded({
  asset,
  head,
  mode,
  put,
  targetKey,
  targetUrl,
}) {
  if (mode === "dry-run") {
    return {
      copied: false,
      skippedBecauseTargetExists: false,
      url: targetUrl,
    };
  }

  const exists = await targetBlobExists({ head, targetUrl });

  if (exists) {
    return {
      copied: false,
      skippedBecauseTargetExists: true,
      url: targetUrl,
    };
  }

  const response = await fetch(asset.url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch source blob ${asset.url}: ${response.status} ${response.statusText}`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const body = Buffer.from(arrayBuffer);

  const blob = await put(targetKey, body, {
    access: "public",
    addRandomSuffix: false,
    contentType: asset.contentType ?? undefined,
  });

  return {
    copied: true,
    skippedBecauseTargetExists: false,
    url: blob.url,
  };
}

async function rewriteSettingsRows({ mode, prisma, replacements, websiteId }) {
  const rows = await prisma.siteSettings.findMany({
    where: { websiteId },
    select: settingsSelect(),
    orderBy: [{ state: "asc" }, { id: "asc" }],
  });

  const changed = [];

  for (const row of rows) {
    const currentSettings = pickSettings(row);
    const nextSettings = replaceEverywhere(currentSettings, replacements);

    if (stableStringify(currentSettings) === stableStringify(nextSettings)) {
      continue;
    }

    changed.push({
      id: row.id,
      state: row.state,
    });

    if (mode === "apply") {
      await prisma.siteSettings.update({
        where: { id: row.id },
        data: nextSettings,
      });
    }
  }

  return changed;
}

async function rewritePageRows({ mode, prisma, replacements, websiteId }) {
  const rows = await prisma.page.findMany({
    where: { websiteId },
    select: {
      id: true,
      blocks: true,
      state: true,
      slug: true,
    },
    orderBy: [{ state: "asc" }, { position: "asc" }, { id: "asc" }],
  });

  const changed = [];

  for (const row of rows) {
    const nextBlocks = replaceEverywhere(row.blocks, replacements);

    if (stableStringify(row.blocks) === stableStringify(nextBlocks)) {
      continue;
    }

    changed.push({
      id: row.id,
      slug: row.slug,
      state: row.state,
    });

    if (mode === "apply") {
      await prisma.page.update({
        where: { id: row.id },
        data: { blocks: nextBlocks },
      });
    }
  }

  return changed;
}

async function buildPlanForWebsite({ prisma, websiteId }) {
  const website = await prisma.website.findUnique({
    where: { id: websiteId },
    select: { id: true },
  });

  if (!website) {
    throw new Error(`Unknown website: ${websiteId}`);
  }

  const [contentRows, legacyAssets] = await Promise.all([
    readContentRows({ prisma, websiteId }),
    prisma.mediaAsset.findMany({
      where: {
        websiteId,
        key: {
          startsWith: `${LEGACY_PREFIX}/${websiteId}/`,
        },
      },
      orderBy: [{ key: "asc" }, { id: "asc" }],
    }),
  ]);

  const referencedAssets = [];
  const unreferencedAssets = [];

  for (const asset of legacyAssets) {
    const reference = isAssetReferenced(asset, contentRows);

    if (reference.byId || reference.byUrl) {
      referencedAssets.push({
        asset,
        reference,
      });
      continue;
    }

    unreferencedAssets.push(asset);
  }

  return {
    contentRows,
    legacyAssets,
    referencedAssets,
    unreferencedAssets,
  };
}

async function migrateReferencedAsset({
  asset,
  head,
  mode,
  prisma,
  put,
  reference,
  replacements,
  websiteId,
}) {
  const targetKey = toTargetKey(asset.key, websiteId);
  const fallbackTargetUrl = rewriteBlobUrl(asset.url, targetKey);

  const existingTargetAsset = await prisma.mediaAsset.findUnique({
    where: {
      provider_key: {
        provider: asset.provider,
        key: targetKey,
      },
    },
    select: {
      id: true,
      key: true,
      url: true,
    },
  });

  if (existingTargetAsset && existingTargetAsset.id !== asset.id) {
    replacements.push({
      from: asset.url,
      to: existingTargetAsset.url,
    });

    replacements.push({
      from: asset.id,
      to: existingTargetAsset.id,
    });

    return {
      action: "merge-with-existing-media-asset",
      assetId: asset.id,
      copied: false,
      oldKey: asset.key,
      oldUrl: asset.url,
      reference,
      skippedBecauseTargetExists: false,
      targetAssetId: existingTargetAsset.id,
      targetKey,
      targetUrl: existingTargetAsset.url,
    };
  }

  const copyResult = await copyBlobIfNeeded({
    asset,
    head,
    mode,
    put,
    targetKey,
    targetUrl: fallbackTargetUrl,
  });

  replacements.push({
    from: asset.url,
    to: copyResult.url,
  });

  if (mode === "apply") {
    await prisma.mediaAsset.update({
      where: { id: asset.id },
      data: {
        key: targetKey,
        url: copyResult.url,
      },
    });
  }

  return {
    action: "update-media-asset",
    assetId: asset.id,
    copied: copyResult.copied,
    oldKey: asset.key,
    oldUrl: asset.url,
    reference,
    skippedBecauseTargetExists: copyResult.skippedBecauseTargetExists,
    targetAssetId: asset.id,
    targetKey,
    targetUrl: copyResult.url,
  };
}

async function migrateWebsite({ head, mode, prisma, put, websiteId }) {
  console.log("");
  console.log(`Website: ${websiteId}`);

  const plan = await buildPlanForWebsite({ prisma, websiteId });

  console.log(`- Legacy MediaAsset rows found: ${plan.legacyAssets.length}`);
  console.log(
    `- Referenced legacy MediaAsset rows: ${plan.referencedAssets.length}`,
  );
  console.log(
    `- Unreferenced legacy MediaAsset rows skipped: ${plan.unreferencedAssets.length}`,
  );

  if (plan.unreferencedAssets.length > 0) {
    for (const asset of plan.unreferencedAssets) {
      console.log(`  skipped unreferenced: ${asset.id} ${asset.key}`);
    }
  }

  const replacements = [];
  const migratedAssets = [];

  for (const { asset, reference } of plan.referencedAssets) {
    if (!isLegacyKeyForWebsite(asset.key, websiteId)) {
      continue;
    }

    const result = await migrateReferencedAsset({
      asset,
      head,
      mode,
      prisma,
      put,
      reference,
      replacements,
      websiteId,
    });

    migratedAssets.push(result);

    console.log(`  ${result.oldKey}`);
    console.log(`  -> ${result.targetKey}`);
    console.log(`  action: ${result.action}`);
    console.log(`  referenced by id: ${reference.byId ? "yes" : "no"}`);
    console.log(`  referenced by url: ${reference.byUrl ? "yes" : "no"}`);
  }

  const changedSettingsRows =
    replacements.length > 0
      ? await rewriteSettingsRows({
          mode,
          prisma,
          replacements,
          websiteId,
        })
      : [];

  const changedPageRows =
    replacements.length > 0
      ? await rewritePageRows({
          mode,
          prisma,
          replacements,
          websiteId,
        })
      : [];

  const copiedCount = migratedAssets.filter((asset) => asset.copied).length;
  const skippedExistingBlobCount = migratedAssets.filter(
    (asset) => asset.skippedBecauseTargetExists,
  ).length;
  const mergedCount = migratedAssets.filter(
    (asset) => asset.action === "merge-with-existing-media-asset",
  ).length;
  const updatedCount = migratedAssets.filter(
    (asset) => asset.action === "update-media-asset",
  ).length;

  console.log(`- Blob copies: ${copiedCount}`);
  console.log(
    `- Blob copies skipped because target exists: ${skippedExistingBlobCount}`,
  );
  console.log(
    `- MediaAsset rows ${mode === "apply" ? "updated" : "that would be updated"}: ${updatedCount}`,
  );
  console.log(
    `- MediaAsset rows merged with existing target asset: ${mergedCount}`,
  );
  console.log(
    `- SiteSettings rows ${mode === "apply" ? "rewritten" : "that would be rewritten"}: ${changedSettingsRows.length}`,
  );
  console.log(
    `- Page rows ${mode === "apply" ? "rewritten" : "that would be rewritten"}: ${changedPageRows.length}`,
  );

  if (changedSettingsRows.length > 0) {
    for (const row of changedSettingsRows) {
      console.log(`  settings ${row.state}: ${row.id}`);
    }
  }

  if (changedPageRows.length > 0) {
    for (const row of changedPageRows) {
      console.log(`  page ${row.state}: ${row.slug} (${row.id})`);
    }
  }

  return {
    blobCopies: copiedCount,
    blobCopiesSkippedBecauseTargetExists: skippedExistingBlobCount,
    legacyMediaAssetRows: plan.legacyAssets.length,
    mediaAssetRowsMergedWithExistingTarget: mergedCount,
    mediaAssetRowsUpdated: updatedCount,
    pageRowsRewritten: changedPageRows.length,
    referencedLegacyMediaAssetRows: plan.referencedAssets.length,
    settingsRowsRewritten: changedSettingsRows.length,
    unreferencedLegacyMediaAssetRowsSkipped: plan.unreferencedAssets.length,
    websiteId,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const { head, prisma, put } = await loadDependencies();

  console.log("Legacy blob path migration");
  console.log(`Mode: ${options.mode}`);
  console.log(`Websites: ${options.websiteIds.join(", ")}`);

  const results = [];

  for (const websiteId of options.websiteIds) {
    results.push(
      await migrateWebsite({
        head,
        mode: options.mode,
        prisma,
        put,
        websiteId,
      }),
    );
  }

  console.log("");
  console.log("Summary");
  console.log(JSON.stringify(results, null, 2));

  await prisma.$disconnect();
}

main().catch(async (error) => {
  const message = error instanceof Error ? error.message : String(error);

  console.error("Migration failed.");
  console.error(message);

  try {
    const { prisma } = await import("@compoz/infra/prisma/prisma-client");
    await prisma.$disconnect();
  } catch {
    // Ignore disconnect errors during failure handling.
  }

  process.exitCode = 1;
});
