/**
 * @file packages/infra/src/pages/index.ts
 * @layer infra/pages
 * @description Factory and HMR-safe cache for website-scoped PagesRepository instances.
 * @remarks
 * Repository implementation is selected through `PAGES_REPO_IMPL`; website scope must already be resolved by the caller.
 */

import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";
import { log } from "@compoz/infra/lib/log";
import { requireWebsiteId } from "@compoz/infra/lib/require-website-id";
import { InMemoryPagesRepository } from "@compoz/infra/pages/in-memory-pages-repository";
import { KvPagesRepository } from "@compoz/infra/pages/kv-pages-repository";
import { PrismaPagesRepository } from "@compoz/infra/pages/prisma-pages-repository";

const logger = log.child({
  ns: "compoz:studio:repo:pages",
  factory: "pagesRepo",
});

type PagesRepoImpl = "memory" | "kv" | "prisma";

export type PagesRepoOptions = Readonly<{
  websiteId: string;
}>;

const repoByKey = new Map<string, PagesRepository>();
let hasLoggedReuse = false;

/** Unknown repository implementations intentionally fall back to KV during migration. */
function resolvePagesRepoImpl(): PagesRepoImpl {
  const raw = (process.env["PAGES_REPO_IMPL"] ?? "kv").toLowerCase();

  if (raw === "memory" || raw === "kv" || raw === "prisma") {
    return raw;
  }

  logger.warn("pages.repository.unknownImplFallback", {
    requestedImpl: raw,
    fallbackImpl: "kv",
  });

  return "kv";
}

function resolveWebsiteId(opts: PagesRepoOptions): string {
  return requireWebsiteId(opts.websiteId, "getPagesRepository");
}

function cacheKey(impl: PagesRepoImpl, websiteId: string): string {
  return `${impl}:${websiteId}`;
}

function createRepo(args: {
  impl: PagesRepoImpl;
  websiteId: string;
}): PagesRepository {
  const { impl, websiteId } = args;

  if (impl === "memory") {
    logger.debug("pages.repository.init", { impl: "memory", websiteId });

    return new InMemoryPagesRepository();
  }

  if (impl === "prisma") {
    logger.debug("pages.repository.init", { impl: "prisma", websiteId });

    return new PrismaPagesRepository({ websiteId });
  }

  logger.debug("pages.repository.init", { impl: "kv", websiteId });

  return new KvPagesRepository({ websiteId });
}

export function getPagesRepository(opts: PagesRepoOptions): PagesRepository {
  const impl = resolvePagesRepoImpl();
  const websiteId = resolveWebsiteId(opts);
  const key = cacheKey(impl, websiteId);

  const existing = repoByKey.get(key);

  if (existing) {
    if (!hasLoggedReuse) {
      logger.debug("pages.repository.reuse", { key, websiteId });
      hasLoggedReuse = true;
    }

    return existing;
  }

  const created = createRepo({ impl, websiteId });

  repoByKey.set(key, created);
  hasLoggedReuse = true;

  return created;
}
