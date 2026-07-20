/**
 * @file packages/infra/src/site/index.ts
 * @layer infra/site
 * @description Website-scoped factories for site repositories, status cache, and publication transactions.
 * @remarks Website scope must already be resolved by the caller.
 */

import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";
import type { PublishSiteTransaction } from "@compoz/core/domain/site/ports/publish-site-transaction";
import type { SiteStatusCachePort } from "@compoz/core/domain/site/ports/site-status-cache-port";
import { log } from "@compoz/infra/lib/log";
import { requireWebsiteId } from "@compoz/infra/lib/require-website-id";
import { KvSiteStatusSnapshot } from "@compoz/infra/site/kv-site-status-snapshot";
import { PrismaPublishSiteTransaction } from "@compoz/infra/site/prisma-publish-site-transaction";
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

/** Creates the specialized transaction boundary for one Website publication. */
export function getPublishSiteTransaction(
  opts: SiteRepoOptions,
): PublishSiteTransaction {
  const websiteId = requireWebsiteId(
    opts.websiteId,
    "getPublishSiteTransaction",
  );

  return new PrismaPublishSiteTransaction({ websiteId });
}
