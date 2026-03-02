/**
 * @file packages/infra/src/pages/index.ts
 * @layer infra/pages
 * @description
 * Factory et singleton du PagesRepository.
 * Permet de choisir l’implémentation (FileSystem / KV / InMemory) via variables d’environnement.
 * Instanciation lazy et HMR-safe.
 */

import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";
import { log } from "@compoz/infra/lib/log";

import { FileSystemPagesRepository } from "@compoz/infra/pages/file-system-pages-repository";
import { InMemoryPagesRepository } from "@compoz/infra/pages/in-memory-pages-repository";
import { KvPagesRepository } from "@compoz/infra/pages/kv-pages-repository";

const lg = log.child({ ns: "infra:pages", factory: "pagesRepo" });

/**
 * Instance singleton (HMR-safe).
 *
 * @remarks
 * - `repo` n’est créé qu’une seule fois dans le process.
 * - `inited` sert à éviter des re-init indésirables sous HMR.
 */
let repo: PagesRepository | null = null;
let inited = false;

/**
 * Fabrique l’implémentation concrète du repository.
 *
 * Contrat : renvoie une instance selon la variable `PAGES_REPO_IMPL` :
 * - "memory" → InMemoryPagesRepository
 * - "kv"     → KvPagesRepository
 * - défaut   → FileSystemPagesRepository
 */
function createRepo(): PagesRepository {
  const impl = (process.env["PAGES_REPO_IMPL"] ?? "fs").toLowerCase();

  if (impl === "memory") {
    lg.debug("pages.repository.init", { impl: "memory" });
    return new InMemoryPagesRepository();
  }

  if (impl === "kv") {
    lg.debug("pages.repository.init", { impl: "kv" });
    return new KvPagesRepository();
  }

  const root = process.env["CONTENT_ROOT"] ?? undefined;

  lg.debug("pages.repository.init", {
    impl: "fs",
    root: root ?? "(cwd)/content",
  });

  return new FileSystemPagesRepository(root);
}

/**
 * Retourne le singleton global PagesRepository.
 *
 * Contrat : lazy instantiation, stable en HMR.
 */
export function getPagesRepository(): PagesRepository {
  if (!repo) {
    repo = createRepo();
    inited = true;
  } else if (!inited) {
    lg.debug("pages.repository.reuse");
    inited = true;
  }
  return repo;
}
