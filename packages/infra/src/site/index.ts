/**
 * @file packages/infra/src/site/index.ts
 * @layer infra/site
 * @description Factory and HMR-safe cache for website-scoped SiteRepository instances.
 * @remarks
 * Repository implementation is selected through `SITE_REPO_IMPL`; website scope must already be resolved by the caller.
 */

import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";
import type { SiteStatusCachePort } from "@compoz/core/domain/site/ports/site-status-cache-port";
import { log } from "@compoz/infra/lib/log";
import { requireWebsiteId } from "@compoz/infra/lib/require-website-id";
import { InMemorySiteRepository } from "@compoz/infra/site/in-memory-site-repository";
import { KvSiteRepository } from "@compoz/infra/site/kv-site-repository";
import { KvSiteStatusSnapshot } from "@compoz/infra/site/kv-site-status-snapshot";
import { PrismaSiteRepository } from "@compoz/infra/site/prisma-site-repository";

const logger = log.child({ ns: "infra:site", factory: "siteRepo" });

type SiteRepoImpl = "memory" | "kv" | "prisma";

export type SiteRepoOptions = Readonly<{
  websiteId: string;
}>;

const repoByKey = new Map<string, SiteRepository>();
let hasLoggedReuse = false;

/** Unknown repository implementations intentionally fall back to KV during migration. */
function resolveSiteRepoImpl(): SiteRepoImpl {
  const raw = (process.env["SITE_REPO_IMPL"] ?? "kv").toLowerCase();

  if (raw === "memory" || raw === "kv" || raw === "prisma") {
    return raw;
  }

  logger.warn("site.repository.unknownImplFallback", {
    requestedImpl: raw,
    fallbackImpl: "kv",
  });

  return "kv";
}

function resolveWebsiteId(opts: SiteRepoOptions): string {
  return requireWebsiteId(opts.websiteId, "getSiteRepository");
}

function cacheKey(impl: SiteRepoImpl, websiteId: string): string {
  return `${impl}:${websiteId}`;
}

function createRepo(args: {
  impl: SiteRepoImpl;
  websiteId: string;
}): SiteRepository {
  const { impl, websiteId } = args;

  if (impl === "memory") {
    logger.debug("site.repository.init", { impl: "memory", websiteId });

    return new InMemorySiteRepository();
  }

  if (impl === "prisma") {
    logger.debug("site.repository.init", { impl: "prisma", websiteId });

    return new PrismaSiteRepository({ websiteId });
  }

  logger.debug("site.repository.init", { impl: "kv", websiteId });

  return new KvSiteRepository({ websiteId });
}

export function getSiteRepository(opts: SiteRepoOptions): SiteRepository {
  const impl = resolveSiteRepoImpl();
  const websiteId = resolveWebsiteId(opts);
  const key = cacheKey(impl, websiteId);

  const existing = repoByKey.get(key);

  if (existing) {
    if (!hasLoggedReuse) {
      logger.debug("site.repository.reuse", { key, websiteId });
      hasLoggedReuse = true;
    }

    return existing;
  }

  const created = createRepo({ impl, websiteId });

  repoByKey.set(key, created);
  hasLoggedReuse = true;

  return created;
}

/** Site status snapshots remain KV-backed during the Prisma migration. */
export function getSiteStatusCache(opts: SiteRepoOptions): SiteStatusCachePort {
  const websiteId = requireWebsiteId(opts.websiteId, "getSiteStatusCache");

  return new KvSiteStatusSnapshot({ websiteId });
}
