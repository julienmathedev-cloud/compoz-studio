/**
 * @file src/infrastructure/site/index.ts
 * @layer infra/site
 * @description
 * Factory et singleton pour l’implémentation du `SiteRepository`.
 * Permet de choisir entre FileSystem, InMemory ou KV selon la variable d’environnement.
 * Instanciation lazy et HMR-safe.
 */

import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";
import type { SiteStatusCachePort } from "@compoz/core/domain/site/ports/site-status-cache-port";

import { FileSystemSiteRepository } from "@compoz/infra/site/file-system-site-repository";
import { InMemorySiteRepository } from "@compoz/infra/site/in-memory-site-repository";
import { KvSiteRepository } from "@compoz/infra/site/kv-site-repository";
import { KvSiteStatusSnapshot } from "@compoz/infra/site/kv-site-status-snapshot";

import { log } from "@compoz/infra/lib/log";

const lg = log.child({ ns: "infra:site", factory: "siteRepo" });

/* -------------------------------------------------------------------------- */
/* SiteRepository singleton (HMR-safe)                                        */
/* -------------------------------------------------------------------------- */

let repo: SiteRepository | null = null;
let inited = false;

/**
 * Crée une implémentation concrète du `SiteRepository`.
 * Contrat :
 * - `SITE_REPO_IMPL=memory` -> InMemory
 * - `SITE_REPO_IMPL=kv`     -> KV (Upstash/Vercel KV)
 * - sinon -> FileSystem
 */
function createRepo(): SiteRepository {
  const impl = (process.env["SITE_REPO_IMPL"] ?? "fs").toLowerCase();

  if (impl === "memory") {
    lg.debug("site.repository.init", { impl: "memory" });
    return new InMemorySiteRepository();
  }

  if (impl === "kv") {
    lg.debug("site.repository.init", { impl: "kv" });
    return new KvSiteRepository();
  }

  const root = process.env["CONTENT_ROOT"] ?? undefined;
  lg.debug("site.repository.init", {
    impl: "fs",
    root: root ?? "(cwd)/content",
  });

  return new FileSystemSiteRepository(root);
}

/**
 * Retourne le singleton du `SiteRepository`.
 * Contrat : instanciation lazy, HMR-safe, réutilise l’instance existante.
 */
export function getSiteRepository(): SiteRepository {
  if (!repo) {
    repo = createRepo();
    inited = true;
  } else if (!inited) {
    lg.debug("site.repository.reuse");
    inited = true;
  }
  return repo;
}

/* -------------------------------------------------------------------------- */
/* SiteStatusCachePort (no singleton)                                         */
/* -------------------------------------------------------------------------- */

/**
 * Pas de singleton : éviter tout cache mémoire involontaire
 * (dev/HMR + instances long-lived).
 */
export function getSiteStatusCache(): SiteStatusCachePort {
  return new KvSiteStatusSnapshot();
}
