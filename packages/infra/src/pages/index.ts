/**
 * @file packages/infra/src/pages/index.ts
 * @layer infra/pages
 *
 * @description
 * Factory et singleton(s) du PagesRepository.
 *
 * @remarks
 * Permet de choisir l’implémentation KV / InMemory / Prisma via variable
 * d’environnement.
 *
 * Instanciation lazy et HMR-safe.
 *
 * Multi-website :
 * - Le repository est instancié par `websiteId` pour chaque implémentation.
 * - Aucun fallback implicite n’est appliqué : le scope Website doit être résolu
 *   en amont par la session, le resolver public ou l’appelant applicatif.
 */

import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";
import { log } from "@compoz/infra/lib/log";
import { requireWebsiteId } from "@compoz/infra/lib/require-website-id";
import { InMemoryPagesRepository } from "@compoz/infra/pages/in-memory-pages-repository";
import { KvPagesRepository } from "@compoz/infra/pages/kv-pages-repository";
import { PrismaPagesRepository } from "@compoz/infra/pages/prisma-pages-repository";

/**
 * Namespace standard SoT :
 * compoz:<surface>:<layer>:<module>
 */
const logger = log.child({
  ns: "compoz:studio:repo:pages",
  factory: "pagesRepo",
});

type PagesRepoImpl = "memory" | "kv" | "prisma";

export type PagesRepoOptions = Readonly<{
  websiteId: string;
}>;

/* -------------------------------------------------------------------------- */
/* Repo cache HMR-safe                                                        */
/* -------------------------------------------------------------------------- */

const repoByKey = new Map<string, PagesRepository>();
let hasLoggedReuse = false;

/**
 * Résout l’implémentation de repository à utiliser.
 *
 * @remarks
 * - `memory` est utile pour les tests ou environnements locaux isolés.
 * - `kv` reste le fallback par défaut pendant la migration.
 * - `prisma` active la persistance PostgreSQL.
 * - Toute valeur inconnue retombe volontairement sur `kv`.
 */
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

/* -------------------------------------------------------------------------- */
/* Factory                                                                    */
/* -------------------------------------------------------------------------- */

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
