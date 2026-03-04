/**
 * @file packages/infra/src/pages/index.ts
 * @layer infra/pages
 * @description
 * Factory et singleton(s) du PagesRepository.
 * Permet de choisir l’implémentation (FileSystem / KV / InMemory) via variables d’environnement.
 * Instanciation lazy et HMR-safe.
 *
 * ✅ Multi-tenant:
 * - En KV, on instancie le repo par `tenantId`.
 */

import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";
import { log } from "@compoz/infra/lib/log";

import { FileSystemPagesRepository } from "@compoz/infra/pages/file-system-pages-repository";
import { InMemoryPagesRepository } from "@compoz/infra/pages/in-memory-pages-repository";
import { KvPagesRepository } from "@compoz/infra/pages/kv-pages-repository";

const lg = log.child({ ns: "infra:pages", factory: "pagesRepo" });

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type PagesRepoOptions = {
  tenantId?: string;
};

function normalizeTenantId(input: unknown): string {
  const t = String(input ?? "").trim();
  return t.length > 0 ? t : "default";
}

/* -------------------------------------------------------------------------- */
/* Repo cache (HMR-safe)                                                      */
/* -------------------------------------------------------------------------- */

const repoByKey = new Map<string, PagesRepository>();
let inited = false;

function cacheKey(impl: string, opts: PagesRepoOptions): string {
  const tenant = normalizeTenantId(opts.tenantId);

  if (impl === "kv") return `kv:${tenant}`;

  // FS/memory : V0.5 => pas de multi-tenant natif
  const root = process.env["CONTENT_ROOT"] ?? "(cwd)/content";
  if (impl === "fs") return `fs:${root}`;
  return `memory`;
}

/* -------------------------------------------------------------------------- */
/* Factory                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Fabrique l’implémentation concrète du repository.
 *
 * Contrat : renvoie une instance selon la variable `PAGES_REPO_IMPL` :
 * - "memory" → InMemoryPagesRepository
 * - "kv"     → KvPagesRepository ✅ tenant-aware
 * - défaut   → FileSystemPagesRepository
 */
function createRepo(opts: PagesRepoOptions): PagesRepository {
  const impl = (process.env["PAGES_REPO_IMPL"] ?? "fs").toLowerCase();

  if (impl === "memory") {
    lg.debug("pages.repository.init", { impl: "memory" });
    return new InMemoryPagesRepository();
  }

  if (impl === "kv") {
    const tenantId = normalizeTenantId(opts.tenantId);
    lg.debug("pages.repository.init", { impl: "kv", tenantId });
    return new KvPagesRepository({ tenantId });
  }

  const root = process.env["CONTENT_ROOT"] ?? undefined;

  lg.debug("pages.repository.init", {
    impl: "fs",
    root: root ?? "(cwd)/content",
  });

  return new FileSystemPagesRepository(root);
}

/**
 * Retourne le repository (cache HMR-safe).
 *
 * ✅ Multi-tenant:
 * - en KV, le cache est par `tenantId`.
 */
export function getPagesRepository(
  opts: PagesRepoOptions = {},
): PagesRepository {
  const impl = (process.env["PAGES_REPO_IMPL"] ?? "fs").toLowerCase();
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
