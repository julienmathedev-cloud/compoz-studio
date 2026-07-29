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
import type { DraftPageStructureTransaction } from "@compoz/core/domain/pages/ports/draft-page-structure-transaction";
import type { DraftPageStructureInitializer } from "@compoz/core/domain/pages/ports/draft-page-structure-initializer";
import { PrismaDraftPageStructureTransaction } from "@compoz/infra/pages/prisma-draft-page-structure-transaction";
import { PrismaDraftPageStructureInitializer } from "@compoz/infra/pages/prisma-draft-page-structure-initializer";

const logger = log.child({
  ns: "compoz:studio:repo:pages",
  factory: "pagesRepo",
});

export type PagesRepoOptions = Readonly<{
  websiteId: string;
}>;

const repoByWebsiteId = new Map<string, PagesRepository>();
const structureByWebsiteId = new Map<string, DraftPageStructureTransaction>();
const initializerByWebsiteId = new Map<string, DraftPageStructureInitializer>();
let hasLoggedReuse = false;

function resolveWebsiteId(opts: PagesRepoOptions): string {
  return requireWebsiteId(opts.websiteId, "getPagesRepository");
}

export function getDraftPageStructureTransaction(
  opts: PagesRepoOptions,
): DraftPageStructureTransaction {
  const websiteId = resolveWebsiteId(opts);
  const existing = structureByWebsiteId.get(websiteId);
  if (existing) return existing;

  const created = new PrismaDraftPageStructureTransaction({ websiteId });
  structureByWebsiteId.set(websiteId, created);
  return created;
}

export function getDraftPageStructureInitializer(
  opts: PagesRepoOptions,
): DraftPageStructureInitializer {
  const websiteId = resolveWebsiteId(opts);
  const existing = initializerByWebsiteId.get(websiteId);
  if (existing) return existing;

  const created = new PrismaDraftPageStructureInitializer({ websiteId });
  initializerByWebsiteId.set(websiteId, created);
  return created;
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
