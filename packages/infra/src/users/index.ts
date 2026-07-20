/**
 * @file packages/infra/src/users/index.ts
 * @layer infra/users
 * @description Factory and HMR-safe singleton for the global Prisma UsersRepository.
 * @remarks Studio users are global and website access is carried by RBAC fields.
 */

import type { UsersRepository } from "@compoz/core/domain/users/ports/users-repository";
import { log } from "@compoz/infra/lib/log";
import { PrismaUsersRepository } from "@compoz/infra/users/prisma-users-repository";

const logger = log.child({ ns: "infra:users", factory: "usersRepo" });

let repoSingleton: UsersRepository | null = null;

export function getUsersRepository(): UsersRepository {
  if (repoSingleton) {
    logger.debug("users.repository.reuse");

    return repoSingleton;
  }

  logger.debug("users.repository.init");

  repoSingleton = new PrismaUsersRepository();

  return repoSingleton;
}
