/**
 * @file packages/infra/src/site/index.ts
 * @layer infra/site
 * @description Factory and HMR-safe cache for website-scoped Prisma SiteRepository instances.
 * @remarks Website scope must already be resolved by the caller.
 */

import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";
import type { SiteStatusCachePort } from "@compoz/core/domain/site/ports/site-status-cache-port";
import { log } from "@compoz/infra/lib/log";
import { requireWebsiteId } from "@compoz/infra/lib/require-website-id";
import { KvSiteStatusSnapshot } from "@compoz/infra/site/kv-site-status-snapshot";
import { PrismaSiteRepository } from "@compoz/infra/site/prisma-site-repository";

const logger = log.child({ ns: "infra:site", factory: "siteRepo" });

export type SiteRepoOptions = Readonly<{
  websiteId: string;
}>;

const repoByWebsiteId = new Map<string, SiteRepository>();
let hasLoggedReuse = false;

function resolveWebsiteId(opts: SiteRepoOptions): string {
  return requireWebsiteId(opts.websiteId, "getSiteRepository");
}

export function getSiteRepository(opts: SiteRepoOptions): SiteRepository {
  const websiteId = resolveWebsiteId(opts);
  const existing = repoByWebsiteId.get(websiteId);

  if (existing) {
    if (!hasLoggedReuse) {
      logger.debug("site.repository.reuse", { websiteId });
      hasLoggedReuse = true;
    }

    return existing;
  }

  logger.debug("site.repository.init", { websiteId });

  const created = new PrismaSiteRepository({ websiteId });

  repoByWebsiteId.set(websiteId, created);
  hasLoggedReuse = true;

  return created;
}

/** Site status snapshots remain Redis-backed as a reconstructible cache. */
export function getSiteStatusCache(opts: SiteRepoOptions): SiteStatusCachePort {
  const websiteId = requireWebsiteId(opts.websiteId, "getSiteStatusCache");

  return new KvSiteStatusSnapshot({ websiteId });
}
