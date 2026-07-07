/**
 * @file packages/infra/src/users/index.ts
 * @layer infra/users
 * @description Factory and HMR-safe singleton for the global UsersRepository.
 * @remarks
 * Repository implementation is selected through `USERS_REPO_IMPL`; Studio users are global and website access is carried by RBAC fields.
 */

import type { UsersRepository } from "@compoz/core/domain/users/ports/users-repository";
import { log } from "@compoz/infra/lib/log";
import { InMemoryUsersRepository } from "@compoz/infra/users/in-memory-users-repository";
import { KvUsersRepository } from "@compoz/infra/users/kv-users-repository";
import { PrismaUsersRepository } from "@compoz/infra/users/prisma-users-repository";

const logger = log.child({ ns: "infra:users", factory: "usersRepo" });

type UsersRepoImpl = "memory" | "kv" | "prisma";

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

/** Creates the concrete repository implementation selected by `USERS_REPO_IMPL`. */
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

/** Recreates the singleton when `USERS_REPO_IMPL` changes during development HMR. */
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
