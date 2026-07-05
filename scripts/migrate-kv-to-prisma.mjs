/**
 * @file scripts/migrate-kv-to-prisma.mjs
 *
 * Operational migration from KV/Upstash repositories to Prisma/PostgreSQL.
 *
 * Usage:
 * pnpm dlx dotenv-cli -e apps/studio/.env.local -- node scripts/migrate-kv-to-prisma.mjs --tenant default --dry-run
 * pnpm dlx dotenv-cli -e apps/studio/.env.local -- node scripts/migrate-kv-to-prisma.mjs --tenant default --apply --verify
 */

const CONTENT_STATE = {
  DRAFT: "draft",
  PUBLISHED: "published",
};

const ALL_STATES = [CONTENT_STATE.DRAFT, CONTENT_STATE.PUBLISHED];
const DRY_RUN_MEDIA_ASSET_ID_PREFIX = "__dry_run_media_asset__";

function parseArgs(argv) {
  const args = {
    apply: false,
    dryRun: false,
    states: [],
    tenantId: "",
    verify: false,
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

    if (arg === "--verify") {
      args.verify = true;
      continue;
    }

    if (arg === "--tenant") {
      args.tenantId = String(argv[i + 1] ?? "").trim();
      i += 1;
      continue;
    }

    if (arg === "--state") {
      const state = String(argv[i + 1] ?? "").trim();
      args.states.push(state);
      i += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!args.tenantId) {
    throw new Error("Missing required argument: --tenant <tenantId>");
  }

  if (args.apply && args.dryRun) {
    throw new Error("Use only one of --apply or --dry-run.");
  }

  for (const state of args.states) {
    if (!ALL_STATES.includes(state)) {
      throw new Error(`Invalid --state value: ${state}`);
    }
  }

  const mode = args.apply ? "apply" : "dry-run";
  const states = args.states.length > 0 ? args.states : ALL_STATES;

  return {
    mode,
    states,
    tenantId: args.tenantId,
    verify: args.verify,
  };
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

function orderedIds(index) {
  return index.pages.map((page) => page.id);
}

function countFound(pages) {
  return pages.filter(Boolean).length;
}

function sameStringArray(a, b) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
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

function positiveFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function basename(pathname) {
  const parts = pathname.split("/").filter(Boolean);

  return parts.at(-1) || undefined;
}

function extensionFromKey(key) {
  const filename = basename(key) ?? "";
  const index = filename.lastIndexOf(".");

  return index >= 0 ? filename.slice(index).toLowerCase() : "";
}

function inferContentType(key) {
  const extension = extensionFromKey(key);

  if (extension === ".svg") return "image/svg+xml";
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  if (extension === ".ico") return "image/x-icon";

  return undefined;
}

function inferMediaKind({ key, preferredKind, MediaAssetKind }) {
  if (preferredKind) {
    return preferredKind;
  }

  return extensionFromKey(key) === ".svg"
    ? MediaAssetKind.svg
    : MediaAssetKind.image;
}

function parseMediaUrl(rawUrl, { MediaStorageProvider }) {
  const url = nonEmptyString(rawUrl);

  if (!url) {
    return {
      warning: "Empty media URL skipped.",
    };
  }

  if (url.startsWith("/")) {
    const parsed = new URL(url, "http://local.invalid");
    const key = parsed.pathname.replace(/^\/+/, "");

    if (!key) {
      return {
        warning: `Unsupported media URL skipped: ${url}`,
      };
    }

    return {
      provider: MediaStorageProvider.local,
      key,
      url,
    };
  }

  let parsed;

  try {
    parsed = new URL(url);
  } catch {
    return {
      warning: `Invalid media URL skipped: ${url}`,
    };
  }

  if (parsed.hostname.includes("public.blob.vercel-storage.com")) {
    const key = parsed.pathname.replace(/^\/+/, "");

    if (!key) {
      return {
        warning: `Unsupported media URL skipped: ${url}`,
      };
    }

    return {
      provider: MediaStorageProvider.vercel_blob,
      key,
      url,
    };
  }

  return {
    warning: `Unsupported media URL skipped: ${url}`,
  };
}

function createMediaReport() {
  return {
    candidatesFound: 0,
    candidatesSkipped: 0,
    rowsUpserted: 0,
    rowsWouldUpsert: 0,
    settingsFieldsAdded: [],
    pageImageFieldsAdded: [],
    warnings: [],
  };
}

function mergeMediaReports(target, source) {
  target.candidatesFound += source.candidatesFound;
  target.candidatesSkipped += source.candidatesSkipped;
  target.rowsUpserted += source.rowsUpserted;
  target.rowsWouldUpsert += source.rowsWouldUpsert;
  target.settingsFieldsAdded.push(...source.settingsFieldsAdded);
  target.pageImageFieldsAdded.push(...source.pageImageFieldsAdded);
  target.warnings.push(...source.warnings);
}

function dryRunMediaAssetId(cacheKey) {
  return `${DRY_RUN_MEDIA_ASSET_ID_PREFIX}${cacheKey}`;
}

function createMediaAssetBackfillContext({
  MediaAssetKind,
  MediaStorageProvider,
  mode,
  prisma,
  websiteId,
}) {
  const cache = new Map();

  async function getMediaAssetId({
    contentType,
    height,
    kind,
    path,
    report,
    src,
    width,
  }) {
    report.candidatesFound += 1;

    const parsed = parseMediaUrl(src, { MediaStorageProvider });

    if (parsed.warning) {
      report.candidatesSkipped += 1;
      report.warnings.push(`${path}: ${parsed.warning}`);
      return "";
    }

    const cacheKey = `${parsed.provider}:${parsed.key}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const mediaKind = inferMediaKind({
      key: parsed.key,
      preferredKind: kind,
      MediaAssetKind,
    });

    const data = {
      websiteId,
      provider: parsed.provider,
      kind: mediaKind,
      key: parsed.key,
      url: parsed.url,
      filename: basename(parsed.key),
      contentType: contentType ?? inferContentType(parsed.key),
      width: positiveFiniteNumber(width) ? Math.round(width) : undefined,
      height: positiveFiniteNumber(height) ? Math.round(height) : undefined,
    };

    if (mode === "dry-run") {
      const existing = await prisma.mediaAsset.findUnique({
        where: {
          provider_key: {
            provider: data.provider,
            key: data.key,
          },
        },
        select: { id: true },
      });

      const id = existing?.id ?? dryRunMediaAssetId(cacheKey);

      report.rowsWouldUpsert += 1;
      cache.set(cacheKey, id);

      return id;
    }

    const asset = await prisma.mediaAsset.upsert({
      where: {
        provider_key: {
          provider: data.provider,
          key: data.key,
        },
      },
      create: data,
      update: {
        websiteId: data.websiteId,
        kind: data.kind,
        url: data.url,
        filename: data.filename,
        contentType: data.contentType,
        width: data.width,
        height: data.height,
      },
      select: { id: true },
    });

    report.rowsUpserted += 1;
    cache.set(cacheKey, asset.id);

    return asset.id;
  }

  return { getMediaAssetId };
}

async function enrichSettingsMediaAssets(
  settings,
  mediaContext,
  MediaAssetKind,
) {
  const report = createMediaReport();
  const enriched = structuredClone(settings);

  const logo = enriched.identity?.logo;

  if (
    isPlainObject(logo) &&
    nonEmptyString(logo.src) &&
    positiveFiniteNumber(logo.width) &&
    positiveFiniteNumber(logo.height) &&
    !nonEmptyString(logo.mediaAssetId)
  ) {
    const mediaAssetId = await mediaContext.getMediaAssetId({
      height: logo.height,
      path: "settings.identity.logo",
      report,
      src: logo.src,
      width: logo.width,
    });

    if (mediaAssetId) {
      logo.mediaAssetId = mediaAssetId;
      report.settingsFieldsAdded.push("identity.logo.mediaAssetId");
    }
  }

  const faviconUrl = nonEmptyString(enriched.identity?.faviconUrl);

  if (faviconUrl && !nonEmptyString(enriched.identity?.faviconMediaAssetId)) {
    const mediaAssetId = await mediaContext.getMediaAssetId({
      kind: MediaAssetKind.favicon,
      path: "settings.identity.faviconUrl",
      report,
      src: faviconUrl,
    });

    if (mediaAssetId) {
      enriched.identity.faviconMediaAssetId = mediaAssetId;
      report.settingsFieldsAdded.push("identity.faviconMediaAssetId");
    }
  }

  const openGraph = enriched.seo?.openGraph;
  const defaultImageUrl = nonEmptyString(openGraph?.defaultImageUrl);

  if (defaultImageUrl && !nonEmptyString(openGraph?.defaultImageMediaAssetId)) {
    const mediaAssetId = await mediaContext.getMediaAssetId({
      kind: MediaAssetKind.image,
      path: "settings.seo.openGraph.defaultImageUrl",
      report,
      src: defaultImageUrl,
    });

    if (mediaAssetId) {
      openGraph.defaultImageMediaAssetId = mediaAssetId;
      report.settingsFieldsAdded.push("seo.openGraph.defaultImageMediaAssetId");
    }
  }

  return { enriched, report };
}

async function enrichPageMediaAssets(page, mediaContext) {
  const report = createMediaReport();

  async function cloneAndEnrich(value, path) {
    if (Array.isArray(value)) {
      const next = [];

      for (let i = 0; i < value.length; i += 1) {
        next.push(await cloneAndEnrich(value[i], `${path}[${i}]`));
      }

      return next;
    }

    if (!isPlainObject(value)) {
      return value;
    }

    const next = {};

    for (const [key, child] of Object.entries(value)) {
      next[key] = await cloneAndEnrich(child, path ? `${path}.${key}` : key);
    }

    if (
      nonEmptyString(next.src) &&
      positiveFiniteNumber(next.width) &&
      positiveFiniteNumber(next.height) &&
      !nonEmptyString(next.mediaAssetId)
    ) {
      const mediaAssetId = await mediaContext.getMediaAssetId({
        height: next.height,
        path,
        report,
        src: next.src,
        width: next.width,
      });

      if (mediaAssetId) {
        next.mediaAssetId = mediaAssetId;
        report.pageImageFieldsAdded.push(`${path}.mediaAssetId`);
      }
    }

    return next;
  }

  return {
    enriched: await cloneAndEnrich(page, `pages.${page.id || "(unknown)"}`),
    report,
  };
}

async function enrichKvDataMediaAssets({
  kvData,
  mediaContext,
  MediaAssetKind,
}) {
  const report = createMediaReport();
  const settingsResult = await enrichSettingsMediaAssets(
    kvData.settings,
    mediaContext,
    MediaAssetKind,
  );
  const pagesFound = [];

  mergeMediaReports(report, settingsResult.report);

  for (const page of kvData.pagesFound) {
    const pageResult = await enrichPageMediaAssets(page, mediaContext);

    pagesFound.push(pageResult.enriched);
    mergeMediaReports(report, pageResult.report);
  }

  return {
    ...kvData,
    pagesFound,
    settings: settingsResult.enriched,
    mediaReport: report,
  };
}

function printHeader({ mode, states, tenantId, verify }) {
  console.log("KV -> Prisma migration");
  console.log(`Tenant: ${tenantId}`);
  console.log(`Mode: ${mode}${verify ? " + verify" : ""}`);
  console.log(`States: ${states.join(", ")}`);
  console.log("");
}

function printStateReadReport(report) {
  console.log(`State: ${report.state}`);
  console.log(`- Index entries: ${report.indexEntries}`);
  console.log(`- Pages found: ${report.pagesFound}`);
  console.log(`- Missing pages: ${report.missingPageIds.length}`);
  console.log(`- Settings: OK`);

  if (report.missingPageIds.length > 0) {
    console.warn(
      `- Warning: missing KV pages referenced by index: ${report.missingPageIds.join(", ")}`,
    );
  }
}

function printMediaReport(report, mode) {
  console.log(`- MediaAsset candidates found: ${report.candidatesFound}`);
  console.log(`- MediaAsset candidates skipped: ${report.candidatesSkipped}`);

  if (mode === "dry-run") {
    console.log(
      `- MediaAsset rows that would be upserted: ${report.rowsWouldUpsert}`,
    );
    console.log(
      `- Settings mediaAssetId fields that would be added: ${report.settingsFieldsAdded.length}`,
    );
    console.log(
      `- Page image mediaAssetId fields that would be added: ${report.pageImageFieldsAdded.length}`,
    );
  } else {
    console.log(`- MediaAsset rows upserted: ${report.rowsUpserted}`);
    console.log(
      `- Settings mediaAssetId fields added: ${report.settingsFieldsAdded.length}`,
    );
    console.log(
      `- Page image mediaAssetId fields added: ${report.pageImageFieldsAdded.length}`,
    );
  }

  for (const field of report.settingsFieldsAdded) {
    console.log(`  settings: ${field}`);
  }

  for (const field of report.pageImageFieldsAdded) {
    console.log(`  page image: ${field}`);
  }

  for (const warning of report.warnings) {
    console.warn(`- Warning: ${warning}`);
  }
}

function printWriteReport(report) {
  if (report.mode === "dry-run") {
    console.log("- Writes: skipped dry-run");
    return;
  }

  console.log("- Settings written: yes");
  console.log(`- Pages written: ${report.pagesFound}`);
  console.log("- Page order written: yes");
}

function printVerifyReport(result) {
  console.log(`Verify ${result.state}`);
  console.log(`- Index count: ${result.indexCountOk ? "OK" : "MISMATCH"}`);
  console.log(`- Page count: ${result.pageCountOk ? "OK" : "MISMATCH"}`);
  console.log(`- Ordered IDs: ${result.orderedIdsOk ? "OK" : "MISMATCH"}`);
  console.log(`- Settings JSON: ${result.settingsOk ? "OK" : "DIFF"}`);
  console.log(`- Page JSON: ${result.pagesOk ? "OK" : "DIFF"}`);

  for (const message of result.messages) {
    console.warn(`  ${message}`);
  }
}

async function loadRepositories() {
  const [
    { KvSiteRepository },
    { PrismaSiteRepository },
    { KvPagesRepository },
    { PrismaPagesRepository },
    { prisma },
    { MediaAssetKind, MediaStorageProvider },
  ] = await Promise.all([
    import("@compoz/infra/site/kv-site-repository"),
    import("@compoz/infra/site/prisma-site-repository"),
    import("@compoz/infra/pages/kv-pages-repository"),
    import("@compoz/infra/pages/prisma-pages-repository"),
    import("@compoz/infra/prisma/prisma-client"),
    import("@compoz/infra/prisma/generated"),
  ]);

  return {
    KvPagesRepository,
    KvSiteRepository,
    MediaAssetKind,
    MediaStorageProvider,
    prisma,
    PrismaPagesRepository,
    PrismaSiteRepository,
  };
}

async function registerTypescriptLoader() {
  const { register } = await import("tsx/esm/api");
  register();
}

async function readKvState({ kvPagesRepo, kvSiteRepo, state }) {
  const [index, settings] = await Promise.all([
    kvSiteRepo.readIndex(state),
    kvSiteRepo.readSettings(state),
  ]);

  const pageIds = orderedIds(index);
  const pages = await kvPagesRepo.readManyById(state, pageIds);

  const pagesFound = [];
  const missingPageIds = [];

  for (let i = 0; i < pageIds.length; i += 1) {
    const page = pages[i] ?? null;

    if (page) {
      pagesFound.push(page);
      continue;
    }

    missingPageIds.push(pageIds[i]);
  }

  return {
    index,
    missingPageIds,
    pageIds,
    pagesFound,
    settings,
  };
}

async function applyState({
  index,
  pagesFound,
  prismaPagesRepo,
  prismaSiteRepo,
  settings,
  state,
}) {
  await prismaSiteRepo.ensureBase();
  await prismaPagesRepo.ensureBase();
  await prismaSiteRepo.putSettings(state, settings);
  await prismaPagesRepo.putMany(state, pagesFound);
  await prismaSiteRepo.putIndex(state, index);
}

async function verifyState({
  expectedData,
  prismaPagesRepo,
  prismaSiteRepo,
  state,
}) {
  const [prismaSettings, prismaIndex, prismaPages] = await Promise.all([
    prismaSiteRepo.readSettings(state),
    prismaSiteRepo.readIndex(state),
    prismaPagesRepo.readManyById(state, expectedData.pageIds),
  ]);

  const expectedIndexIds = orderedIds(expectedData.index);
  const prismaIndexIds = orderedIds(prismaIndex);
  const prismaFoundCount = countFound(prismaPages);

  const indexCountOk =
    expectedData.index.pages.length === prismaIndex.pages.length;
  const pageCountOk = expectedData.pagesFound.length === prismaFoundCount;
  const orderedIdsOk = sameStringArray(expectedIndexIds, prismaIndexIds);
  const settingsOk =
    stableStringify(expectedData.settings) === stableStringify(prismaSettings);
  const pagesOk = expectedData.pagesFound.every((page, index) => {
    const prismaPage = prismaPages[index];

    return stableStringify(page) === stableStringify(prismaPage);
  });

  const messages = [];

  if (!indexCountOk) {
    messages.push(
      `Expected index count ${expectedData.index.pages.length}, Prisma index count ${prismaIndex.pages.length}.`,
    );
  }

  if (!pageCountOk) {
    messages.push(
      `Expected found page count ${expectedData.pagesFound.length}, Prisma found page count ${prismaFoundCount}.`,
    );
  }

  if (!orderedIdsOk) {
    messages.push(
      `Expected ordered IDs: ${expectedIndexIds.join(", ") || "(empty)"}`,
    );
    messages.push(
      `Prisma ordered IDs: ${prismaIndexIds.join(", ") || "(empty)"}`,
    );
  }

  if (!settingsOk) {
    messages.push("Settings JSON differs from enriched expected data.");
  }

  if (!pagesOk) {
    messages.push("Page JSON differs from enriched expected data.");
  }

  return {
    indexCountOk,
    messages,
    orderedIdsOk,
    pageCountOk,
    pagesOk,
    settingsOk,
    state,
  };
}

async function migrateState({
  mediaContext,
  mode,
  repositories,
  state,
  tenantId,
  verify,
}) {
  const websiteId = tenantId;
  const kvSiteRepo = new repositories.KvSiteRepository({ websiteId });
  const kvPagesRepo = new repositories.KvPagesRepository({ websiteId });
  const prismaSiteRepo = new repositories.PrismaSiteRepository({ websiteId });
  const prismaPagesRepo = new repositories.PrismaPagesRepository({ websiteId });

  /**
   * MediaAsset rows have a FK to Website.
   *
   * The backfill enriches settings/pages by creating MediaAsset rows before
   * writing the enriched JSON, so the Website must exist before enrichment.
   */
  if (mode === "apply") {
    await prismaSiteRepo.ensureBase();
    await prismaPagesRepo.ensureBase();
  }

  const kvData = await readKvState({ kvPagesRepo, kvSiteRepo, state });
  const enrichedData = await enrichKvDataMediaAssets({
    kvData,
    mediaContext,
    MediaAssetKind: repositories.MediaAssetKind,
  });

  const report = {
    indexEntries: kvData.index.pages.length,
    missingPageIds: kvData.missingPageIds,
    mode,
    pagesFound: kvData.pagesFound.length,
    state,
  };

  printStateReadReport(report);
  printMediaReport(enrichedData.mediaReport, mode);

  if (mode === "apply") {
    await applyState({
      index: enrichedData.index,
      pagesFound: enrichedData.pagesFound,
      prismaPagesRepo,
      prismaSiteRepo,
      settings: enrichedData.settings,
      state,
    });
  }

  printWriteReport(report);
  console.log("");

  if (!verify || mode === "dry-run") {
    return { seriousVerificationFailure: false };
  }

  const verifyResult = await verifyState({
    expectedData: enrichedData,
    prismaPagesRepo,
    prismaSiteRepo,
    state,
  });

  printVerifyReport(verifyResult);
  console.log("");

  return {
    seriousVerificationFailure:
      !verifyResult.indexCountOk ||
      !verifyResult.pageCountOk ||
      !verifyResult.orderedIdsOk ||
      !verifyResult.settingsOk ||
      !verifyResult.pagesOk,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  await registerTypescriptLoader();

  const repositories = await loadRepositories();
  const mediaContext = createMediaAssetBackfillContext({
    MediaAssetKind: repositories.MediaAssetKind,
    MediaStorageProvider: repositories.MediaStorageProvider,
    mode: options.mode,
    prisma: repositories.prisma,
    websiteId: options.tenantId,
  });

  printHeader(options);

  let seriousVerificationFailure = false;

  for (const state of options.states) {
    const result = await migrateState({
      ...options,
      mediaContext,
      repositories,
      state,
    });

    seriousVerificationFailure =
      seriousVerificationFailure || result.seriousVerificationFailure;
  }

  if (seriousVerificationFailure) {
    console.error("Migration verification failed.");
    process.exitCode = 1;
    return;
  }

  console.log("Done");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);

  console.error("Migration failed.");
  console.error(message);
  process.exitCode = 1;
});
