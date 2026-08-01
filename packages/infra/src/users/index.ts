/**
 * @file packages/infra/src/users/index.ts
 * @layer infra/users
 * @description Factory and HMR-safe singleton for the global Prisma UsersRepository.
 * @remarks Studio users are global and website access is carried by RBAC fields.
 */

import { log } from "@compoz/infra/lib/log";
import { PrismaUsersRepository } from "@compoz/infra/users/prisma-users-repository";

const logger = log.child({ ns: "infra:users", factory: "usersRepo" });

let repoSingleton: PrismaUsersRepository | null = null;

export function getUsersRepository(): PrismaUsersRepository {
  if (repoSingleton) {
    logger.debug("users.repository.reuse");

    return repoSingleton;
  }

  logger.debug("users.repository.init");

  repoSingleton = new PrismaUsersRepository();

  return repoSingleton;
}
