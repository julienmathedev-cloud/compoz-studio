/**
 * @file scripts/migrate-auth-access-domains-to-prisma.mjs
 *
 * Migrates Studio users, website access rows, and host/domain mappings to Prisma.
 *
 * Usage:
 * pnpm dlx dotenv-cli -e apps/studio/.env.local -e apps/site/.env.local -- node scripts/migrate-auth-access-domains-to-prisma.mjs --dry-run
 * pnpm dlx dotenv-cli -e apps/studio/.env.local -e apps/site/.env.local -- node scripts/migrate-auth-access-domains-to-prisma.mjs --apply --verify
 */

const USERS_NS = "compoz:studio:users";

function parseArgs(argv) {
  const args = {
    apply: false,
    dryRun: false,
    includeDemoUsers: false,
    includeLocalDomains: false,
    tenantByHostJson: "",
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

    if (arg === "--include-local-domains") {
      args.includeLocalDomains = true;
      continue;
    }

    if (arg === "--include-demo-users") {
      args.includeDemoUsers = true;
      continue;
    }

    if (arg === "--tenant-by-host-json") {
      const value = String(argv[i + 1] ?? "").trim();

      if (!value) {
        throw new Error("Missing value for --tenant-by-host-json.");
      }

      args.tenantByHostJson = value;
      i += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (args.apply && args.dryRun) {
    throw new Error("Invalid arguments: --apply and --dry-run cannot be used together.");
  }

  return {
    includeDemoUsers: args.includeDemoUsers,
    includeLocalDomains: args.includeLocalDomains,
    mode: args.apply ? "apply" : "dry-run",
    tenantByHostJson: args.tenantByHostJson,
    verify: args.verify,
  };
}

function normalizeEmail(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function normalizeId(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function normalizeHost(raw) {
  const h = String(raw ?? "")
    .trim()
    .toLowerCase();

  if (!h) return "";

  const noPort = h.includes(":") ? h.split(":")[0] : h;
  return noPort.startsWith("www.") ? noPort.slice(4) : noPort;
}

function parseTenantByHostJson(raw, sourceLabel) {
  if (!raw) return [];

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`${sourceLabel} is set but is not valid JSON.`);
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${sourceLabel} must be a JSON object.`);
  }

  const out = [];

  for (const [rawHost, tenantId] of Object.entries(parsed)) {
    const host = normalizeHost(rawHost);
    const websiteId = normalizeId(tenantId);

    if (host && websiteId) {
      out.push({ host, rawHost, websiteId });
    }
  }

  return out;
}

function resolveTenantByHostJson(options) {
  if (options.tenantByHostJson) {
    return {
      raw: options.tenantByHostJson,
      source: "--tenant-by-host-json",
    };
  }

  return {
    raw: process.env["COMPOZ_TENANT_BY_HOST_JSON"] ?? "",
    source: "COMPOZ_TENANT_BY_HOST_JSON",
  };
}

function isLocalHost(host) {
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".localhost") ||
    host.endsWith(".lvh.me")
  );
}

function userPasswordKey(userId) {
  return `${USERS_NS}:pwd:${userId}`;
}

function userKey(userId) {
  return `${USERS_NS}:user:${userId}`;
}

function userKeyPattern() {
  return `${USERS_NS}:user:*`;
}

function userIdFromKey(key) {
  const parts = String(key ?? "").split(":");
  const id = parts[parts.length - 1];
  return id ? id.trim() : null;
}

function isDemoTenant(tenantId) {
  return String(tenantId ?? "").startsWith("demo-");
}

function isDemoUser(user) {
  return user?.demo?.isDemo === true || isDemoTenant(user?.rbac?.defaultTenantId);
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toKvUser(json) {
  if (!isObject(json)) return null;
  if (!isObject(json.rbac) || !isObject(json.meta)) return null;
  if (!Array.isArray(json.rbac.tenantIds)) return null;

  const id = String(json.id ?? "").trim();
  const email = normalizeEmail(json.email);
  const name = String(json.name ?? "").trim();
  const status = String(json.status ?? "").trim();
  const role = String(json.rbac.role ?? "").trim();
  const defaultTenantId = normalizeId(json.rbac.defaultTenantId);
  const createdAt = String(json.meta.createdAt ?? "").trim();
  const updatedAt = String(json.meta.updatedAt ?? "").trim();

  if (!id || !email || !name || !createdAt || !updatedAt) return null;
  if (!["active", "disabled"].includes(status)) return null;
  if (!["admin", "editor"].includes(role)) return null;
  if (!defaultTenantId) return null;

  return {
    id,
    email,
    name,
    status,
    rbac: {
      role,
      tenantIds: json.rbac.tenantIds.map(normalizeId).filter(Boolean),
      defaultTenantId,
    },
    meta: {
      createdAt,
      updatedAt,
      lastLoginAt: json.meta.lastLoginAt,
    },
    demo: isObject(json.demo) ? json.demo : undefined,
  };
}

function toWebsiteRole(userRole) {
  return userRole === "admin" ? "admin" : "editor";
}

function printHeader({ mode, verify }) {
  console.log("Auth/access/domain KV -> Prisma migration");
  console.log(`Mode: ${mode}${verify ? " + verify" : ""}`);
  console.log("");
}

function printPlan(plan) {
  console.log("Plan");
  console.log(`- KV users found: ${plan.totalUsers}`);
  console.log(`- Users with password hash: ${plan.usersWithHash}`);
  console.log(`- Missing password hashes: ${plan.missingHashUserIds.length}`);
  console.log(`- Users to upsert: ${plan.usersToUpsert.length}`);
  console.log(`- Users skipped: ${plan.skippedUsers.length}`);
  console.log(`- Demo users skipped: ${plan.demoUsersSkipped.length}`);
  console.log(`- WebsiteAccess rows to upsert: ${plan.accessRows.length}`);
  console.log(`- WebsiteDomain rows to upsert: ${plan.domainRows.length}`);
  console.log(`- Unknown tenantIds skipped: ${plan.unknownTenantIds.length}`);
  console.log(`- defaultWebsiteId skipped: ${plan.defaultWebsiteSkipped.length}`);

  if (plan.domainRows.length === 0) {
    console.log("- Domains: skipped, no usable tenant-by-host entries");
  }

  for (const skipped of plan.skippedUsers) {
    console.warn(`- Skipped user ${skipped.userId}: ${skipped.reason}`);
  }

  for (const skipped of plan.demoUsersSkipped) {
    console.warn(`- Demo user skipped: ${skipped.userId}`);
  }

  for (const tenantId of plan.unknownTenantIds) {
    console.warn(`- Skipped unknown tenantId: ${tenantId}`);
  }

  for (const item of plan.defaultWebsiteSkipped) {
    console.warn(
      `- defaultWebsiteId skipped for user ${item.userId}: ${item.defaultWebsiteId}`,
    );
  }

  console.log("");
}

function printDomainMappingSummary(domainPlan) {
  console.log("Domain mapping summary");
  console.log(`- Source: ${domainPlan.source}`);
  console.log(`- Raw entries count: ${domainPlan.rawEntriesCount}`);
  console.log(
    `- Normalized usable domains count: ${domainPlan.normalizedUsableDomainsCount}`,
  );
  console.log(
    `- Skipped local/dev domains count: ${domainPlan.skippedLocalDomains.length}`,
  );
  console.log(
    `- Skipped unknown website domains count: ${domainPlan.skippedUnknownDomains.length}`,
  );

  for (const item of domainPlan.skippedLocalDomains) {
    console.warn(
      `- Skipped local/dev domain: host=${item.host} rawHost=${item.rawHost} websiteId=${item.websiteId}`,
    );
  }

  for (const item of domainPlan.skippedUnknownDomains) {
    console.warn(
      `- Skipped domain with unknown website: host=${item.host} rawHost=${item.rawHost} websiteId=${item.websiteId}`,
    );
  }

  console.log("");
}

function groupAccessRowsByWebsite(accessRows) {
  const groups = new Map();

  for (const row of accessRows) {
    const group = groups.get(row.websiteId) ?? {
      roles: new Map(),
      userIds: new Set(),
      websiteId: row.websiteId,
    };

    group.userIds.add(row.userId);
    group.roles.set(row.role, (group.roles.get(row.role) ?? 0) + 1);
    groups.set(row.websiteId, group);
  }

  return [...groups.values()].sort((a, b) =>
    a.websiteId.localeCompare(b.websiteId),
  );
}

function formatRoleCounts(roles) {
  return [...roles.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([role, count]) => `${role}:${count}`)
    .join(", ");
}

function printDryRunSummary({ domainPlan, existingState, plan }) {
  console.log("Existing Prisma websites");

  for (const website of [...existingState.websites].sort((a, b) =>
    a.id.localeCompare(b.id),
  )) {
    console.log(`- id=${website.id} type=${website.type}`);
  }

  console.log("");
  console.log("WebsiteAccess summary by websiteId");

  const accessGroups = groupAccessRowsByWebsite(plan.accessRows);

  if (accessGroups.length === 0) {
    console.log("- none");
  }

  for (const group of accessGroups) {
    console.log(
      `- websiteId=${group.websiteId} users=${group.userIds.size} roles=${formatRoleCounts(group.roles)}`,
    );
  }

  console.log("");
  console.log("Planned WebsiteAccess rows");

  if (plan.accessRows.length === 0) {
    console.log("- none");
  }

  for (const row of [...plan.accessRows].sort((a, b) => {
    const websiteOrder = a.websiteId.localeCompare(b.websiteId);
    if (websiteOrder !== 0) return websiteOrder;

    return a.userId.localeCompare(b.userId);
  })) {
    console.log(
      `- userId=${row.userId} websiteId=${row.websiteId} role=${row.role}`,
    );
  }

  console.log("");
  printDomainMappingSummary(domainPlan);

  console.log("Planned WebsiteDomain rows");

  if (plan.domainRows.length === 0) {
    console.log("- none");
  }

  for (const row of [...plan.domainRows].sort((a, b) =>
    a.host.localeCompare(b.host),
  )) {
    console.log(
      `- host=${row.host} rawHost=${row.rawHost} websiteId=${row.websiteId} isPrimary=${row.isPrimary}`,
    );
  }

  console.log("");
}

function printApplyReport(result) {
  console.log("Apply");
  console.log(`- Users upserted: ${result.usersUpserted}`);
  console.log(`- WebsiteAccess rows upserted: ${result.accessRowsUpserted}`);
  console.log(`- WebsiteDomain rows upserted: ${result.domainRowsUpserted}`);
  console.log("- Deletes: none");
  console.log("- Password resets: none");
  console.log("- Pages/SiteSettings/MediaAsset/DemoSandbox: unchanged");
  console.log("");
}

function printVerifyReport(result) {
  console.log("Verify");
  console.log(`- Migrated user count: ${result.migratedUserCount}`);
  console.log(`- Skipped user count: ${result.skippedUserCount}`);
  console.log(`- Demo users skipped: ${result.demoUsersSkippedCount}`);
  console.log(`- Missing hash count: ${result.missingHashCount}`);
  console.log(`- WebsiteAccess count: ${result.websiteAccessCount}`);
  console.log(`- WebsiteDomain count: ${result.websiteDomainCount}`);
  console.log(`- Unknown tenantIds skipped: ${result.unknownTenantIds.length}`);
  console.log(
    `- defaultWebsiteId validity: ${result.defaultWebsiteIdValid ? "OK" : "MISMATCH"}`,
  );
  console.log(`- Relationships: ${result.relationshipsValid ? "OK" : "MISMATCH"}`);

  for (const message of result.messages) {
    console.warn(`  ${message}`);
  }

  console.log("");
}

async function registerTypescriptLoader() {
  const { register } = await import("tsx/esm/api");
  register();
}

async function loadRuntime() {
  const [{ getUpstashRedis, parseRedisJson }, { prisma }] = await Promise.all([
    import("@compoz/infra/kv/kv-redis"),
    import("@compoz/infra/prisma/prisma-client"),
  ]);

  return { getUpstashRedis, parseRedisJson, prisma };
}

async function readKvUsers({ getUpstashRedis, parseRedisJson }) {
  const redis = getUpstashRedis();
  const keys = await redis.keys(userKeyPattern());

  if (!Array.isArray(keys) || keys.length === 0) return [];

  const raws = await redis.mget(...keys);

  if (!Array.isArray(raws) || raws.length === 0) return [];

  const users = [];

  for (let i = 0; i < raws.length; i += 1) {
    const json = parseRedisJson(raws[i]);
    if (!json) continue;

    const user = toKvUser(json);

    if (!user) {
      console.warn(
        `- Skipped invalid KV user document at ${userKey(userIdFromKey(keys[i]))}`,
      );
      continue;
    }

    users.push(user);
  }

  return users
    .filter((user) => Boolean(String(user.id ?? "").trim()))
    .sort((a, b) => a.email.localeCompare(b.email));
}

async function readPasswordHashPresence({ getUpstashRedis, users }) {
  const redis = getUpstashRedis();
  const out = new Map();

  for (const user of users) {
    const raw = await redis.get(userPasswordKey(user.id));
    const hash = typeof raw === "string" ? raw.trim() : "";

    out.set(user.id, {
      hasHash: Boolean(hash),
      hash,
    });
  }

  return out;
}

async function readExistingPrismaState(prisma) {
  const [websites, users, accesses, domains] = await Promise.all([
    prisma.website.findMany({ select: { id: true, type: true } }),
    prisma.user.findMany({ select: { id: true, email: true, defaultWebsiteId: true } }),
    prisma.websiteAccess.findMany({
      select: { userId: true, websiteId: true, role: true },
    }),
    prisma.websiteDomain.findMany({
      select: { host: true, websiteId: true, isPrimary: true },
    }),
  ]);

  return { accesses, domains, users, websites };
}

function findDomainConflicts({ existingDomains, domainRows }) {
  const existingByHost = new Map(
    existingDomains.map((domain) => [domain.host, domain.websiteId]),
  );

  const conflicts = [];

  for (const domain of domainRows) {
    const ownerWebsiteId = existingByHost.get(domain.host);
    if (ownerWebsiteId && ownerWebsiteId !== domain.websiteId) {
      conflicts.push({
        host: domain.host,
        existingWebsiteId: ownerWebsiteId,
        nextWebsiteId: domain.websiteId,
      });
    }
  }

  return conflicts;
}

function buildDomainPlan({
  domainMappings,
  includeLocalDomains,
  source,
  websiteIds,
}) {
  const byHost = new Map();
  const skippedLocalDomains = [];
  const skippedUnknownDomains = [];

  for (const mapping of domainMappings) {
    if (isLocalHost(mapping.host) && !includeLocalDomains) {
      skippedLocalDomains.push(mapping);
      continue;
    }

    if (!websiteIds.has(mapping.websiteId)) {
      skippedUnknownDomains.push(mapping);
      continue;
    }

    const existing = byHost.get(mapping.host);

    if (existing && existing.websiteId !== mapping.websiteId) {
      throw new Error(
        `Conflicting tenant-by-host entries after normalization for host ${mapping.host}: ${existing.websiteId} and ${mapping.websiteId}.`,
      );
    }

    if (!existing) {
      byHost.set(mapping.host, mapping);
    }
  }

  const primarySeen = new Set();
  const rows = [];

  for (const mapping of [...byHost.values()].sort((a, b) =>
    a.host.localeCompare(b.host),
  )) {
    const isPrimary = !primarySeen.has(mapping.websiteId);
    primarySeen.add(mapping.websiteId);

    rows.push({
      host: mapping.host,
      rawHost: mapping.rawHost,
      websiteId: mapping.websiteId,
      isPrimary,
    });
  }

  return {
    normalizedUsableDomainsCount: rows.length,
    rawEntriesCount: domainMappings.length,
    rows,
    skippedLocalDomains,
    skippedUnknownDomains,
    source,
  };
}

function findEmailConflicts({ existingUsers, users }) {
  const existingByEmail = new Map(
    existingUsers.map((user) => [normalizeEmail(user.email), user.id]),
  );

  const conflicts = [];

  for (const user of users) {
    const ownerId = existingByEmail.get(normalizeEmail(user.email));
    if (ownerId && ownerId !== user.id) {
      conflicts.push({ email: normalizeEmail(user.email), existingUserId: ownerId, kvUserId: user.id });
    }
  }

  return conflicts;
}

function formatEmailConflicts(conflicts) {
  return conflicts
    .map(
      (conflict) =>
        `${conflict.email}: Prisma user ${conflict.existingUserId}, KV user ${conflict.kvUserId}`,
    )
    .join("; ");
}

function formatDomainConflicts(conflicts) {
  return conflicts
    .map(
      (conflict) =>
        `${conflict.host}: Prisma website ${conflict.existingWebsiteId}, env website ${conflict.nextWebsiteId}`,
    )
    .join("; ");
}

function buildPlan({
  domainPlan,
  existingState,
  hashByUserId,
  includeDemoUsers,
  users,
}) {
  const websiteIds = new Set(existingState.websites.map((website) => website.id));
  const usersToUpsert = [];
  const accessRows = [];
  const demoUsersSkipped = [];
  const skippedUsers = [];
  const unknownTenantIds = new Set();
  const defaultWebsiteSkipped = [];
  const missingHashUserIds = [];
  let usersWithHash = 0;

  for (const user of users) {
    const hashInfo = hashByUserId.get(user.id);
    const hasHash = Boolean(hashInfo?.hasHash);

    if (!hasHash) {
      missingHashUserIds.push(user.id);
      skippedUsers.push({ userId: user.id, reason: "missing password hash" });
      continue;
    }

    usersWithHash += 1;

    const defaultCandidate = normalizeId(user.rbac?.defaultTenantId);
    const defaultWebsiteId = websiteIds.has(defaultCandidate)
      ? defaultCandidate
      : null;

    const rawTenantIds = Array.isArray(user.rbac?.tenantIds)
      ? user.rbac.tenantIds
      : [];

    const tenantIds = rawTenantIds.includes("*")
      ? existingState.websites
          .filter((website) => website.type !== "sandbox")
          .map((website) => website.id)
      : rawTenantIds.map(normalizeId);

    const userAccessRows = [];
    const referencesOnlyUnknownDemoTenants =
      tenantIds.length > 0 && tenantIds.every((tenantId) => isDemoTenant(tenantId));

    for (const tenantId of tenantIds) {
      if (!tenantId || tenantId === "*") continue;

      if (!websiteIds.has(tenantId)) {
        unknownTenantIds.add(tenantId);
        continue;
      }

      userAccessRows.push({
        userId: user.id,
        websiteId: tenantId,
        role: toWebsiteRole(user.rbac.role),
      });
    }

    if (
      !includeDemoUsers &&
      userAccessRows.length === 0 &&
      referencesOnlyUnknownDemoTenants
    ) {
      demoUsersSkipped.push({ userId: user.id });
      continue;
    }

    if (defaultCandidate && !defaultWebsiteId) {
      defaultWebsiteSkipped.push({
        userId: user.id,
        defaultWebsiteId: defaultCandidate,
      });
    }

    usersToUpsert.push({
      id: user.id,
      email: normalizeEmail(user.email),
      name: user.name,
      status: user.status,
      role: user.rbac.role,
      defaultWebsiteId,
      passwordHash: hashInfo.hash,
      demo: user.demo,
      createdAt: new Date(user.meta.createdAt),
      updatedAt: new Date(user.meta.updatedAt),
      lastLoginAt: user.meta.lastLoginAt ? new Date(user.meta.lastLoginAt) : null,
      isDemo: isDemoUser(user),
    });

    accessRows.push(...userAccessRows);
  }

  return {
    accessRows: uniqueRows(accessRows, (row) => `${row.userId}:${row.websiteId}`),
    demoUsersSkipped,
    defaultWebsiteSkipped,
    domainRows: domainPlan.rows,
    missingHashUserIds,
    skippedUsers,
    totalUsers: users.length,
    unknownTenantIds: [...unknownTenantIds].sort(),
    usersToUpsert,
    usersWithHash,
  };
}

function uniqueRows(rows, getKey) {
  const seen = new Set();
  const out = [];

  for (const row of rows) {
    const key = getKey(row);
    if (seen.has(key)) continue;

    seen.add(key);
    out.push(row);
  }

  return out;
}

async function applyPlan({ plan, prisma }) {
  for (const user of plan.usersToUpsert) {
    const createUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      role: user.role,
      defaultWebsiteId: user.defaultWebsiteId,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
      ...(user.demo ? { demo: user.demo } : {}),
    };

    const updateUser = {
      email: user.email,
      name: user.name,
      status: user.status,
      role: user.role,
      defaultWebsiteId: user.defaultWebsiteId,
      passwordHash: user.passwordHash,
      lastLoginAt: user.lastLoginAt,
      ...(user.demo ? { demo: user.demo } : {}),
    };

    await prisma.user.upsert({
      where: { id: user.id },
      create: createUser,
      update: updateUser,
    });
  }

  for (const access of plan.accessRows) {
    await prisma.websiteAccess.upsert({
      where: {
        userId_websiteId: {
          userId: access.userId,
          websiteId: access.websiteId,
        },
      },
      create: access,
      update: { role: access.role },
    });
  }

  for (const domain of plan.domainRows) {
    await prisma.websiteDomain.upsert({
      where: { host: domain.host },
      create: domain,
      update: {
        websiteId: domain.websiteId,
        rawHost: domain.rawHost,
        isPrimary: domain.isPrimary,
      },
    });
  }

  return {
    accessRowsUpserted: plan.accessRows.length,
    domainRowsUpserted: plan.domainRows.length,
    usersUpserted: plan.usersToUpsert.length,
  };
}

async function verifyPlan({ plan, prisma }) {
  const [users, accesses, domains] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: plan.usersToUpsert.map((user) => user.id) } },
      select: { id: true, defaultWebsiteId: true },
    }),
    plan.accessRows.length > 0
      ? prisma.websiteAccess.findMany({
          where: {
            OR: plan.accessRows.map((row) => ({
              userId: row.userId,
              websiteId: row.websiteId,
            })),
          },
          select: { userId: true, websiteId: true, role: true },
        })
      : Promise.resolve([]),
    plan.domainRows.length > 0
      ? prisma.websiteDomain.findMany({
          where: { host: { in: plan.domainRows.map((row) => row.host) } },
          select: { host: true, websiteId: true },
        })
      : Promise.resolve([]),
  ]);

  const userById = new Map(users.map((user) => [user.id, user]));
  const accessKeys = new Set(
    accesses.map((access) => `${access.userId}:${access.websiteId}`),
  );
  const domainKeys = new Set(domains.map((domain) => domain.host));
  const messages = [];

  const missingUsers = plan.usersToUpsert.filter((user) => !userById.has(user.id));
  const missingAccessRows = plan.accessRows.filter(
    (row) => !accessKeys.has(`${row.userId}:${row.websiteId}`),
  );
  const missingDomainRows = plan.domainRows.filter(
    (row) => !domainKeys.has(row.host),
  );
  const invalidDefaults = plan.usersToUpsert.filter((expected) => {
    const actual = userById.get(expected.id);
    return actual && actual.defaultWebsiteId !== expected.defaultWebsiteId;
  });

  if (missingUsers.length > 0) {
    messages.push(`Missing users after apply: ${missingUsers.map((u) => u.id).join(", ")}`);
  }

  if (missingAccessRows.length > 0) {
    messages.push(`Missing WebsiteAccess rows: ${missingAccessRows.length}`);
  }

  if (missingDomainRows.length > 0) {
    messages.push(`Missing WebsiteDomain rows: ${missingDomainRows.length}`);
  }

  if (invalidDefaults.length > 0) {
    messages.push(`Invalid defaultWebsiteId rows: ${invalidDefaults.length}`);
  }

  return {
    defaultWebsiteIdValid: invalidDefaults.length === 0,
    messages,
    migratedUserCount: users.length,
    demoUsersSkippedCount: plan.demoUsersSkipped.length,
    missingHashCount: plan.missingHashUserIds.length,
    relationshipsValid:
      missingUsers.length === 0 &&
      missingAccessRows.length === 0 &&
      missingDomainRows.length === 0,
    skippedUserCount: plan.skippedUsers.length,
    unknownTenantIds: plan.unknownTenantIds,
    websiteAccessCount: accesses.length,
    websiteDomainCount: domains.length,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  await registerTypescriptLoader();

  const { getUpstashRedis, parseRedisJson, prisma } = await loadRuntime();
  const existingState = await readExistingPrismaState(prisma);
  const users = await readKvUsers({
    getUpstashRedis,
    parseRedisJson,
  });
  const hashByUserId = await readPasswordHashPresence({ getUpstashRedis, users });
  const tenantByHostJson = resolveTenantByHostJson(options);
  const domainMappings = parseTenantByHostJson(
    tenantByHostJson.raw,
    tenantByHostJson.source,
  );
  const websiteIds = new Set(existingState.websites.map((website) => website.id));
  const domainPlan = buildDomainPlan({
    domainMappings,
    includeLocalDomains: options.includeLocalDomains,
    source: tenantByHostJson.source,
    websiteIds,
  });

  const plan = buildPlan({
    domainPlan,
    existingState,
    hashByUserId,
    includeDemoUsers: options.includeDemoUsers,
    users,
  });

  const emailConflicts = findEmailConflicts({
    existingUsers: existingState.users,
    users: plan.usersToUpsert,
  });
  const domainConflicts = findDomainConflicts({
    domainRows: plan.domainRows,
    existingDomains: existingState.domains,
  });

  printHeader(options);
  printPlan(plan);
  printDryRunSummary({ domainPlan, existingState, plan });

  if (emailConflicts.length > 0) {
    console.error(`Email conflict detected: ${formatEmailConflicts(emailConflicts)}`);
  }

  if (domainConflicts.length > 0) {
    console.error(`Domain conflict detected: ${formatDomainConflicts(domainConflicts)}`);
  }

  if (options.mode === "apply" && emailConflicts.length > 0) {
    throw new Error("Refusing to apply because one or more Prisma users already own KV emails.");
  }

  if (options.mode === "apply" && domainConflicts.length > 0) {
    throw new Error("Refusing to apply because one or more domains already belong to another website.");
  }

  if (options.mode === "dry-run") {
    console.log("Writes: skipped dry-run");
  } else {
    const result = await applyPlan({ plan, prisma });
    printApplyReport(result);
  }

  if (options.verify) {
    const verifyResult = await verifyPlan({ plan, prisma });
    printVerifyReport(verifyResult);

    if (!verifyResult.defaultWebsiteIdValid || !verifyResult.relationshipsValid) {
      process.exitCode = 1;
    }
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);

  console.error("Migration failed.");
  console.error(message);
  process.exitCode = 1;
});
