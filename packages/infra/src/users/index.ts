/**
 * @file packages/infra/src/users/index.ts
 * @layer infra/users
 *
 * @description
 * Factory et singleton(s) du UsersRepository.
 *
 * @remarks
 * Permet de choisir l’implémentation KV / InMemory / Prisma via variables
 * d’environnement.
 *
 * Instanciation lazy et HMR-safe.
 *
 * Notes V0.5 :
 * - Les users Studio sont globaux.
 * - Le repository users n’est pas instancié par `websiteId`.
 * - Les accès aux Websites sont portés par `User.rbac.websiteIds` et
 *   `User.rbac.defaultWebsiteId`.
 */

import type { UsersRepository } from "@compoz/core/domain/users/ports/users-repository";
import { log } from "@compoz/infra/lib/log";
import { InMemoryUsersRepository } from "@compoz/infra/users/in-memory-users-repository";
import { KvUsersRepository } from "@compoz/infra/users/kv-users-repository";
import { PrismaUsersRepository } from "@compoz/infra/users/prisma-users-repository";

const logger = log.child({ ns: "infra:users", factory: "usersRepo" });

type UsersRepoImpl = "memory" | "kv" | "prisma";

/* -------------------------------------------------------------------------- */
/* Repo cache HMR-safe                                                        */
/* -------------------------------------------------------------------------- */

let repoSingleton: UsersRepository | null = null;
let repoImplSingleton: UsersRepoImpl | null = null;

function resolveUsersRepoImpl(): UsersRepoImpl {
  const raw = (process.env["USERS_REPO_IMPL"] ?? "kv").toLowerCase();

  if (raw === "memory" || raw === "kv" || raw === "prisma") {
    return raw;
  }

  logger.warn("users.repository.unknownImplFallback", {
    requestedImpl: raw,
    fallbackImpl: "kv",
  });

  return "kv";
}

/* -------------------------------------------------------------------------- */
/* Factory                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Fabrique l’implémentation concrète du repository.
 *
 * @remarks
 * Contrat :
 * - `USERS_REPO_IMPL=memory` → InMemoryUsersRepository
 * - `USERS_REPO_IMPL=kv`     → KvUsersRepository
 * - `USERS_REPO_IMPL=prisma` → PrismaUsersRepository
 * - défaut                   → KvUsersRepository
 */
function createRepo(impl: UsersRepoImpl): UsersRepository {
  if (impl === "memory") {
    logger.debug("users.repository.init", { impl: "memory" });

    return new InMemoryUsersRepository();
  }

  if (impl === "prisma") {
    logger.debug("users.repository.init", { impl: "prisma" });

    return new PrismaUsersRepository();
  }

  logger.debug("users.repository.init", { impl: "kv" });

  return new KvUsersRepository();
}

/**
 * Retourne le repository courant.
 *
 * @remarks
 * En dev/HMR, si `USERS_REPO_IMPL` change entre deux appels, le singleton est
 * recréé avec la nouvelle implémentation.
 */
export function getUsersRepository(): UsersRepository {
  const impl = resolveUsersRepoImpl();

  if (repoSingleton && repoImplSingleton === impl) {
    logger.debug("users.repository.reuse", { impl });

    return repoSingleton;
  }

  repoSingleton = createRepo(impl);
  repoImplSingleton = impl;

  return repoSingleton;
}
