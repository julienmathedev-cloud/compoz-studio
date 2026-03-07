/**
 * @file packages/infra/src/site/index.ts
 * @layer infra/site
 * @description
 * Factory et singleton(s) pour l’implémentation du `SiteRepository`.
 * Permet de choisir entre FileSystem, InMemory ou KV selon la variable d’environnement.
 * Instanciation lazy et HMR-safe.
 *
 * ✅ Multi-tenant:
 * - Les impl KV sont instanciées par tenant (`tenantId`) pour éviter de partager un repo
 *   (et donc des clés) entre plusieurs sites.
 */

import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";
import type { SiteStatusCachePort } from "@compoz/core/domain/site/ports/site-status-cache-port";

import { InMemorySiteRepository } from "@compoz/infra/site/in-memory-site-repository";
import { KvSiteRepository } from "@compoz/infra/site/kv-site-repository";
import { KvSiteStatusSnapshot } from "@compoz/infra/site/kv-site-status-snapshot";

import { log } from "@compoz/infra/lib/log";
import { normalizeTenantId } from "@compoz/infra/lib/normalize-tenant-id";

const lg = log.child({ ns: "infra:site", factory: "siteRepo" });

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type SiteRepoOptions = {
  /** Tenant cible (siteId). Recommandé dans le Studio (via session). */
  tenantId?: string;
};

/* -------------------------------------------------------------------------- */
/* Repo cache (HMR-safe)                                                      */
/* -------------------------------------------------------------------------- */

const repoByKey = new Map<string, SiteRepository>();
let inited = false;

function cacheKey(impl: string, opts: SiteRepoOptions): string {
  const tenant = normalizeTenantId(opts.tenantId);

  if (impl === "kv") return `kv:${tenant}`;

  return `memory`;
}

/* -------------------------------------------------------------------------- */
/* Factory                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Crée une implémentation concrète du `SiteRepository`.
 * Contrat :
 * - `SITE_REPO_IMPL=memory` -> InMemory
 * - `SITE_REPO_IMPL=kv`     -> KV (Upstash/Vercel KV)  ✅ tenant-aware
 * - sinon -> FileSystem
 */
function createRepo(opts: SiteRepoOptions): SiteRepository {
  const impl = (process.env["SITE_REPO_IMPL"] ?? "fs").toLowerCase();

  if (impl === "memory") {
    lg.debug("site.repository.init", { impl: "memory" });
    return new InMemorySiteRepository();
  }

  const tenantId = normalizeTenantId(opts.tenantId);
  lg.debug("site.repository.init", { impl: "kv", tenantId });
  return new KvSiteRepository({ tenantId });
}

/**
 * Retourne le repository (cache HMR-safe).
 *
 * ✅ Multi-tenant:
 * - en KV, le cache est par `tenantId`.
 * - en FS/memory, une seule instance (V0.5).
 */
export function getSiteRepository(opts: SiteRepoOptions = {}): SiteRepository {
  const impl = (process.env["SITE_REPO_IMPL"] ?? "fs").toLowerCase();
  const key = cacheKey(impl, opts);

  const existing = repoByKey.get(key);
  if (existing) {
    if (!inited) {
      lg.debug("site.repository.reuse", { key });
      inited = true;
    }
    return existing;
  }

  const created = createRepo(opts);
  repoByKey.set(key, created);
  inited = true;

  return created;
}

/* -------------------------------------------------------------------------- */
/* SiteStatusCachePort (no singleton)                                         */
/* -------------------------------------------------------------------------- */

/**
 * Pas de singleton : éviter tout cache mémoire involontaire
 * (dev/HMR + instances long-lived).
 *
 * ✅ tenant-aware (KV)
 */
export function getSiteStatusCache(
  opts: SiteRepoOptions = {},
): SiteStatusCachePort {
  const tenantId = normalizeTenantId(opts.tenantId);
  return new KvSiteStatusSnapshot({ tenantId });
}
