/**
 * @file packages/infra/src/users/index.ts
 * @layer infra/users
 * @description
 * Factory et singleton(s) du UsersRepository.
 * Permet de choisir l’implémentation (KV / InMemory) via variables d’environnement.
 * Instanciation lazy et HMR-safe.
 *
 * Notes V0.5 :
 * - Les users Studio sont globaux (pas de multi-tenant).
 */

import type { UsersRepository } from "@compoz/core/domain/users/ports/users-repository";
import { log } from "@compoz/infra/lib/log";

import { InMemoryUsersRepository } from "@compoz/infra/users/in-memory-users-repository";
import { KvUsersRepository } from "@compoz/infra/users/kv-users-repository";

const lg = log.child({ ns: "infra:users", factory: "usersRepo" });

/* -------------------------------------------------------------------------- */
/* Repo cache (HMR-safe)                                                      */
/* -------------------------------------------------------------------------- */

let repoSingleton: UsersRepository | null = null;
let inited = false;

/* -------------------------------------------------------------------------- */
/* Factory                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Fabrique l’implémentation concrète du repository.
 *
 * Contrat : renvoie une instance selon la variable `USERS_REPO_IMPL` :
 * - "memory" → InMemoryUsersRepository
 * - "kv"     → KvUsersRepository
 * - défaut   → KvUsersRepository
 */
function createRepo(): UsersRepository {
  const impl = (process.env["USERS_REPO_IMPL"] ?? "kv").toLowerCase();

  if (impl === "memory") {
    lg.debug("users.repository.init", { impl: "memory" });
    return new InMemoryUsersRepository();
  }

  lg.debug("users.repository.init", { impl: "kv" });
  return new KvUsersRepository();
}

/**
 * Retourne le repository (cache HMR-safe).
 */
export function getUsersRepository(): UsersRepository {
  if (repoSingleton) {
    if (!inited) {
      lg.debug("users.repository.reuse", { impl: "singleton" });
      inited = true;
    }
    return repoSingleton;
  }

  repoSingleton = createRepo();
  inited = true;
  return repoSingleton;
}
