/**
 * @file packages/infra/src/pages/index.ts
 * @layer infra/pages
 * @description Factory and HMR-safe cache for website-scoped Prisma PagesRepository instances.
 * @remarks Website scope must already be resolved by the caller.
 */

import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";
import { log } from "@compoz/infra/lib/log";
import { requireWebsiteId } from "@compoz/infra/lib/require-website-id";
import { PrismaPagesRepository } from "@compoz/infra/pages/prisma-pages-repository";

const logger = log.child({
  ns: "compoz:studio:repo:pages",
  factory: "pagesRepo",
});

export type PagesRepoOptions = Readonly<{
  websiteId: string;
}>;

const repoByWebsiteId = new Map<string, PagesRepository>();
let hasLoggedReuse = false;

function resolveWebsiteId(opts: PagesRepoOptions): string {
  return requireWebsiteId(opts.websiteId, "getPagesRepository");
}

export function getPagesRepository(opts: PagesRepoOptions): PagesRepository {
  const websiteId = resolveWebsiteId(opts);
  const existing = repoByWebsiteId.get(websiteId);

  if (existing) {
    if (!hasLoggedReuse) {
      logger.debug("pages.repository.reuse", { websiteId });
      hasLoggedReuse = true;
    }

    return existing;
  }

  logger.debug("pages.repository.init", { websiteId });

  const created = new PrismaPagesRepository({ websiteId });

  repoByWebsiteId.set(websiteId, created);
  hasLoggedReuse = true;

  return created;
}
