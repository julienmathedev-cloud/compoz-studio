/**
 * @file packages/infra/src/pages/index.ts
 * @layer infra/pages
 * @description
 * Factory et singleton(s) du PagesRepository.
 * Permet de choisir l’implémentation (KV / InMemory) via variables d’environnement.
 * Instanciation lazy et HMR-safe.
 *
 * ✅ Multi-tenant:
 * - Le repository est instancié par `tenantId` (KV et memory).
 */

import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";
import { log } from "@compoz/infra/lib/log";
import { InMemoryPagesRepository } from "@compoz/infra/pages/in-memory-pages-repository";
import { KvPagesRepository } from "@compoz/infra/pages/kv-pages-repository";
import { normalizeTenantId } from "@compoz/infra/lib/normalize-tenant-id";

/**
 * Namespace standard (SoT) :
 * compoz:<surface>:<layer>:<module>
 */
const lg = log.child({ ns: "compoz:studio:repo:pages", factory: "pagesRepo" });

export type PagesRepoOptions = Readonly<{
  tenantId?: string;
}>;

/* -------------------------------------------------------------------------- */
/* Repo cache (HMR-safe)                                                      */
/* -------------------------------------------------------------------------- */

const repoByKey = new Map<string, PagesRepository>();
let inited = false;

function cacheKey(impl: string, opts: PagesRepoOptions): string {
  const tenant = normalizeTenantId(opts.tenantId);
  return impl === "memory" ? `memory:${tenant}` : `kv:${tenant}`;
}

/* -------------------------------------------------------------------------- */
/* Factory                                                                    */
/* -------------------------------------------------------------------------- */

function createRepo(opts: PagesRepoOptions): PagesRepository {
  const impl = (process.env["PAGES_REPO_IMPL"] ?? "kv").toLowerCase();

  if (impl === "memory") {
    const tenantId = normalizeTenantId(opts.tenantId);
    lg.debug("pages.repository.init", { impl: "memory", tenantId });
    return new InMemoryPagesRepository();
  }

  const tenantId = normalizeTenantId(opts.tenantId);
  lg.debug("pages.repository.init", { impl: "kv", tenantId });
  return new KvPagesRepository({ tenantId });
}

export function getPagesRepository(
  opts: PagesRepoOptions = {},
): PagesRepository {
  const impl = (process.env["PAGES_REPO_IMPL"] ?? "kv").toLowerCase();
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
