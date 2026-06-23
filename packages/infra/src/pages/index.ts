/**
 * @file packages/infra/src/pages/index.ts
 * @layer infra/pages
 * @description
 * Factory et singleton(s) du PagesRepository.
 * Permet de choisir l’implémentation (KV / InMemory / Prisma) via variable
 * d’environnement.
 * Instanciation lazy et HMR-safe.
 *
 * ✅ Multi-tenant:
 * - Le repository est instancié par `tenantId` pour chaque implémentation.
 */

import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";

import { log } from "@compoz/infra/lib/log";
import { normalizeTenantId } from "@compoz/infra/lib/normalize-tenant-id";
import { InMemoryPagesRepository } from "@compoz/infra/pages/in-memory-pages-repository";
import { KvPagesRepository } from "@compoz/infra/pages/kv-pages-repository";
import { PrismaPagesRepository } from "@compoz/infra/pages/prisma-pages-repository";

/**
 * Namespace standard (SoT) :
 * compoz:<surface>:<layer>:<module>
 */
const lg = log.child({ ns: "compoz:studio:repo:pages", factory: "pagesRepo" });

type PagesRepoImpl = "memory" | "kv" | "prisma";

export type PagesRepoOptions = Readonly<{
  tenantId?: string;
}>;

/* -------------------------------------------------------------------------- */
/* Repo cache (HMR-safe)                                                      */
/* -------------------------------------------------------------------------- */

const repoByKey = new Map<string, PagesRepository>();
let inited = false;

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

  lg.warn("pages.repository.unknownImplFallback", {
    requestedImpl: raw,
    fallbackImpl: "kv",
  });

  return "kv";
}

function cacheKey(impl: PagesRepoImpl, opts: PagesRepoOptions): string {
  const tenant = normalizeTenantId(opts.tenantId);
  return `${impl}:${tenant}`;
}

/* -------------------------------------------------------------------------- */
/* Factory                                                                    */
/* -------------------------------------------------------------------------- */

function createRepo(opts: PagesRepoOptions): PagesRepository {
  const impl = resolvePagesRepoImpl();
  const tenantId = normalizeTenantId(opts.tenantId);

  if (impl === "memory") {
    lg.debug("pages.repository.init", { impl: "memory", tenantId });
    return new InMemoryPagesRepository();
  }

  if (impl === "prisma") {
    lg.debug("pages.repository.init", { impl: "prisma", tenantId });
    return new PrismaPagesRepository({ tenantId });
  }

  lg.debug("pages.repository.init", { impl: "kv", tenantId });
  return new KvPagesRepository({ tenantId });
}

export function getPagesRepository(
  opts: PagesRepoOptions = {},
): PagesRepository {
  const impl = resolvePagesRepoImpl();
  const key = cacheKey(impl, opts);

  const existing = repoByKey.get(key);
  if (existing) {
    if (!inited) {
      lg.debug("pages.repository.reuse", { key });
      inited = true;
    }

    return existing;
  }

  const created = createRepo(opts);
  repoByKey.set(key, created);
  inited = true;

  return created;
}
