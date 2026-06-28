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
  ] = await Promise.all([
    import("@compoz/infra/site/kv-site-repository"),
    import("@compoz/infra/site/prisma-site-repository"),
    import("@compoz/infra/pages/kv-pages-repository"),
    import("@compoz/infra/pages/prisma-pages-repository"),
  ]);

  return {
    KvPagesRepository,
    KvSiteRepository,
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
  kvData,
  prismaPagesRepo,
  prismaSiteRepo,
  state,
}) {
  const [prismaSettings, prismaIndex, prismaPages] = await Promise.all([
    prismaSiteRepo.readSettings(state),
    prismaSiteRepo.readIndex(state),
    prismaPagesRepo.readManyById(state, kvData.pageIds),
  ]);

  const kvIndexIds = orderedIds(kvData.index);
  const prismaIndexIds = orderedIds(prismaIndex);
  const prismaFoundCount = countFound(prismaPages);

  const indexCountOk = kvData.index.pages.length === prismaIndex.pages.length;
  const pageCountOk = kvData.pagesFound.length === prismaFoundCount;
  const orderedIdsOk = sameStringArray(kvIndexIds, prismaIndexIds);
  const settingsOk =
    stableStringify(kvData.settings) === stableStringify(prismaSettings);

  const messages = [];

  if (!indexCountOk) {
    messages.push(
      `KV index count ${kvData.index.pages.length}, Prisma index count ${prismaIndex.pages.length}.`,
    );
  }

  if (!pageCountOk) {
    messages.push(
      `KV found page count ${kvData.pagesFound.length}, Prisma found page count ${prismaFoundCount}.`,
    );
  }

  if (!orderedIdsOk) {
    messages.push(
      `KV ordered IDs: ${kvIndexIds.join(", ") || "(empty)"}`,
    );
    messages.push(
      `Prisma ordered IDs: ${prismaIndexIds.join(", ") || "(empty)"}`,
    );
  }

  if (!settingsOk) {
    messages.push("Settings JSON differs after repository normalization.");
  }

  return {
    indexCountOk,
    messages,
    orderedIdsOk,
    pageCountOk,
    settingsOk,
    state,
  };
}

async function migrateState({
  mode,
  repositories,
  state,
  tenantId,
  verify,
}) {
  const kvSiteRepo = new repositories.KvSiteRepository({ tenantId });
  const kvPagesRepo = new repositories.KvPagesRepository({ tenantId });
  const prismaSiteRepo = new repositories.PrismaSiteRepository({ tenantId });
  const prismaPagesRepo = new repositories.PrismaPagesRepository({ tenantId });

  const kvData = await readKvState({ kvPagesRepo, kvSiteRepo, state });

  const report = {
    indexEntries: kvData.index.pages.length,
    missingPageIds: kvData.missingPageIds,
    mode,
    pagesFound: kvData.pagesFound.length,
    state,
  };

  printStateReadReport(report);

  if (mode === "apply") {
    await applyState({
      index: kvData.index,
      pagesFound: kvData.pagesFound,
      prismaPagesRepo,
      prismaSiteRepo,
      settings: kvData.settings,
      state,
    });
  }

  printWriteReport(report);
  console.log("");

  if (!verify) {
    return { seriousVerificationFailure: false };
  }

  const verifyResult = await verifyState({
    kvData,
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
      !verifyResult.orderedIdsOk,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  await registerTypescriptLoader();

  const repositories = await loadRepositories();

  printHeader(options);

  let seriousVerificationFailure = false;

  for (const state of options.states) {
    const result = await migrateState({
      ...options,
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
