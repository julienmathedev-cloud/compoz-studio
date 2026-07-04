/**
 * @file packages/infra/src/site/index.ts
 * @layer infra/site
 *
 * @description
 * Factory et singleton(s) pour l’implémentation du `SiteRepository`.
 *
 * @remarks
 * Permet de choisir entre InMemory, KV ou Prisma selon la variable
 * d’environnement.
 *
 * Instanciation lazy et HMR-safe.
 *
 * Multi-website :
 * - Les implémentations sont instanciées par `websiteId`.
 * - Aucun fallback implicite n’est appliqué : le Website doit être résolu
 *   en amont par la session, le resolver public ou l’appelant applicatif.
 */

import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";
import type { SiteStatusCachePort } from "@compoz/core/domain/site/ports/site-status-cache-port";
import { log } from "@compoz/infra/lib/log";
import { requireWebsiteId } from "@compoz/infra/lib/require-website-id";
import { InMemorySiteRepository } from "@compoz/infra/site/in-memory-site-repository";
import { KvSiteRepository } from "@compoz/infra/site/kv-site-repository";
import { KvSiteStatusSnapshot } from "@compoz/infra/site/kv-site-status-snapshot";
import { PrismaSiteRepository } from "@compoz/infra/site/prisma-site-repository";

const logger = log.child({ ns: "infra:site", factory: "siteRepo" });

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type SiteRepoImpl = "memory" | "kv" | "prisma";

export type SiteRepoOptions = Readonly<{
  websiteId: string;
}>;

/* -------------------------------------------------------------------------- */
/* Repo cache HMR-safe                                                        */
/* -------------------------------------------------------------------------- */

const repoByKey = new Map<string, SiteRepository>();
let hasLoggedReuse = false;

/**
 * Résout l’implémentation de repository à utiliser.
 *
 * @remarks
 * - `memory` est utile pour des tests ou un environnement local isolé.
 * - `kv` reste le fallback d’implémentation pendant la migration.
 * - `prisma` active la nouvelle persistance PostgreSQL.
 * - Toute valeur inconnue retombe volontairement sur `kv`.
 */
function resolveSiteRepoImpl(): SiteRepoImpl {
  const raw = (process.env["SITE_REPO_IMPL"] ?? "kv").toLowerCase();

  if (raw === "memory" || raw === "kv" || raw === "prisma") {
    return raw;
  }

  logger.warn("site.repository.unknownImplFallback", {
    requestedImpl: raw,
    fallbackImpl: "kv",
  });

  return "kv";
}

function resolveWebsiteId(opts: SiteRepoOptions): string {
  return requireWebsiteId(opts.websiteId, "getSiteRepository");
}

/**
 * Retourne la clé de cache de repository.
 *
 * @remarks
 * Toutes les implémentations sont isolées par `websiteId`, y compris memory,
 * afin d’éviter une contamination entre sites pendant les tests ou le dev.
 */
function cacheKey(impl: SiteRepoImpl, websiteId: string): string {
  return `${impl}:${websiteId}`;
}

/* -------------------------------------------------------------------------- */
/* Factory                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Crée une implémentation concrète du `SiteRepository`.
 *
 * @remarks
 * - `SITE_REPO_IMPL=memory` → InMemory
 * - `SITE_REPO_IMPL=kv`     → KV, Upstash/Vercel KV
 * - `SITE_REPO_IMPL=prisma` → Prisma/PostgreSQL
 * - sinon                   → KV
 */
function createRepo(args: {
  impl: SiteRepoImpl;
  websiteId: string;
}): SiteRepository {
  const { impl, websiteId } = args;

  if (impl === "memory") {
    logger.debug("site.repository.init", { impl: "memory", websiteId });

    return new InMemorySiteRepository();
  }

  if (impl === "prisma") {
    logger.debug("site.repository.init", { impl: "prisma", websiteId });

    return new PrismaSiteRepository({ websiteId });
  }

  logger.debug("site.repository.init", { impl: "kv", websiteId });

  return new KvSiteRepository({ websiteId });
}

/**
 * Retourne le repository avec cache HMR-safe.
 *
 * @remarks
 * Le cache est par `websiteId` pour éviter tout partage involontaire entre
 * Websites, quelle que soit l’implémentation choisie.
 */
export function getSiteRepository(opts: SiteRepoOptions): SiteRepository {
  const impl = resolveSiteRepoImpl();
  const websiteId = resolveWebsiteId(opts);
  const key = cacheKey(impl, websiteId);

  const existing = repoByKey.get(key);

  if (existing) {
    if (!hasLoggedReuse) {
      logger.debug("site.repository.reuse", { key, websiteId });
      hasLoggedReuse = true;
    }

    return existing;
  }

  const created = createRepo({ impl, websiteId });

  repoByKey.set(key, created);
  hasLoggedReuse = true;

  return created;
}

/* -------------------------------------------------------------------------- */
/* SiteStatusCachePort                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Pas de singleton : éviter tout cache mémoire involontaire
 * en dev/HMR et avec des instances long-lived.
 *
 * @remarks
 * Même lorsque `SITE_REPO_IMPL=prisma`, le cache/read-model de statut reste
 * volontairement géré par KV pour cette phase de migration.
 */
export function getSiteStatusCache(opts: SiteRepoOptions): SiteStatusCachePort {
  const websiteId = requireWebsiteId(opts.websiteId, "getSiteStatusCache");

  return new KvSiteStatusSnapshot({ websiteId });
}
