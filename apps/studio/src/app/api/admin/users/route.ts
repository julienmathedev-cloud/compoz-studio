/**
 * @file apps/studio/src/app/api/admin/users/route.ts
 * @layer studio/app/api
 *
 * @description
 * Studio admin API route for listing and creating users.
 *
 * @remarks
 * - `POST` creates users with email, name, RBAC, and password data.
 * - No draft/published state is involved because users are global Studio data.
 */

import "server-only";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import type { UserDTO, UserSummaryDTO } from "@compoz/core/domain/users/dto";
import { createUser } from "@compoz/core/domain/users/use-cases/create-user";
import { readJsonOr400 } from "@compoz/infra/http/read-json";
import type {
  CreateUserResponse,
  GetUsersResponse,
} from "@compoz/infra/http/studio/users.types";
import { getIdGenerator } from "@compoz/infra/id/index";
import { log, logSpan } from "@compoz/infra/lib/log";
import { getUsersRepository } from "@compoz/infra/users";
import { adaptCreateUserPayload } from "@compoz/studio/app/api/_adapters/users/users";
import { requireAdminSession } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import {
  CreateUserIntentSchema,
  type CreateUserIntentDTO,
} from "@compoz/validation/users/user-intents";

export async function GET(req: Request) {
  const NS = "api.studio.admin.users.GET" as const;

  return handleRoute(NS, req, async () => {
    await requireAdminSession();

    return logSpan(NS, { ns: NS, method: "GET" }, async () => {
      const usersRepo = getUsersRepository();
      await usersRepo.ensureBase();

      const users = await usersRepo.list();

      const res: GetUsersResponse = { users: users as UserSummaryDTO[] };
      return res;
    });
  });
}

export async function POST(req: Request) {
  const NS = "api.studio.admin.users.POST" as const;

  return handleRoute(NS, req, async () => {
    await requireAdminSession();

    return logSpan(NS, { ns: NS, method: "POST" }, async () => {
      const lg = log.child({ ns: NS });

      const raw = await readJsonOr400(req);

      const dto: CreateUserIntentDTO = parseDTOOrHttp(
        CreateUserIntentSchema,
        raw,
        {
          message: EC.INVALID_ARGUMENT,
          extras: { where: "api.studio.admin.users.POST.payload" },
        },
      );

      const usersRepo = getUsersRepository();
      await usersRepo.ensureBase();

      const idGenerator = getIdGenerator();
      const runCreate = createUser({ users: usersRepo, idGenerator });

      const payload = adaptCreateUserPayload(dto);
      const { user } = await runCreate(payload);

      lg.debug("route.user.created", {
        userId: user.id,
        email: user.email,
        role: user.rbac?.role,
      });

      const res: CreateUserResponse = { user: user as UserDTO };
      return res;
    });
  });
}
