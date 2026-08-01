/**
 * @file apps/studio/src/app/api/admin/users/[userId]/route.ts
 * @layer studio/app/api
 *
 * @description
 * Studio admin API route for reading, deleting, and updating a user by ID.
 *
 * @remarks
 * - `PATCH` updates users through a partial patch, including optional password changes.
 * - No draft/published state is involved because users are global Studio data.
 */

import "server-only";

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import type { UserDTO } from "@compoz/core/domain/users/dto";
import { deleteUser } from "@compoz/core/domain/users/use-cases/delete-user";
import { updateUser } from "@compoz/core/domain/users/use-cases/update-user";
import { throwHttp } from "@compoz/http/http-error";
import { readJsonOr400 } from "@compoz/infra/http/read-json";
import type {
  DeleteUserResponse,
  GetUserByIdResponse,
  UpdateUserResponse,
} from "@compoz/infra/http/studio/users.types";
import { log, logSpan } from "@compoz/infra/lib/log";
import { getUsersRepository } from "@compoz/infra/users";
import { adaptUpdateUserPayload } from "@compoz/studio/app/api/_adapters/users/users";
import { requireAdminSession } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import { UserIdParamSchema } from "@compoz/validation/users/user";
import {
  UpdateUserIntentSchema,
  type UpdateUserIntentDTO,
} from "@compoz/validation/users/user-intents";

export async function GET(req: Request, ctx: { params: unknown }) {
  const NS = "api.studio.admin.users.id.GET" as const;

  return handleRoute(NS, req, async () => {
    await requireAdminSession();

    return logSpan(NS, { ns: NS, method: "GET" }, async () => {
      const params = await unwrapParams(ctx.params);

      const { userId } = parseDTOOrHttp(UserIdParamSchema, params, {
        message: EC.INVALID_ARGUMENT,
        extras: { where: "api.studio.admin.users.id.GET.params" },
      });

      const usersRepo = getUsersRepository();
      await usersRepo.ensureBase();

      const user = await usersRepo.readById(userId);

      if (!user) {
        throwHttp(404, { code: EC.USER_NOT_FOUND, message: EC.USER_NOT_FOUND });
      }

      const res: GetUserByIdResponse = { user: user as UserDTO };
      return res;
    });
  });
}

export async function DELETE(req: Request, ctx: { params: unknown }) {
  const NS = "api.studio.admin.users.id.DELETE" as const;

  return handleRoute(NS, req, async () => {
    await requireAdminSession();

    return logSpan(NS, { ns: NS, method: "DELETE" }, async () => {
      const lg = log.child({ ns: NS });

      const params = await unwrapParams(ctx.params);

      const { userId } = parseDTOOrHttp(UserIdParamSchema, params, {
        message: EC.INVALID_ARGUMENT,
        extras: { where: "api.studio.admin.users.id.DELETE.params" },
      });

      const usersRepo = getUsersRepository();
      await usersRepo.ensureBase();

      const runDelete = deleteUser({ users: usersRepo });
      await runDelete({ userId });

      lg.debug("route.user.deleted", { userId });

      const res: DeleteUserResponse = { ok: true, userId };
      return res;
    });
  });
}

export async function PATCH(req: Request, ctx: { params: unknown }) {
  const NS = "api.studio.admin.users.id.PATCH" as const;

  return handleRoute(NS, req, async () => {
    await requireAdminSession();

    return logSpan(NS, { ns: NS, method: "PATCH" }, async () => {
      const lg = log.child({ ns: NS });

      const params = await unwrapParams(ctx.params);

      const { userId } = parseDTOOrHttp(UserIdParamSchema, params, {
        message: EC.INVALID_ARGUMENT,
        extras: { where: "api.studio.admin.users.id.PATCH.params" },
      });

      const body = await readJsonOr400(req);

      const dto: UpdateUserIntentDTO = parseDTOOrHttp(
        UpdateUserIntentSchema,
        body,
        {
          message: EC.VALIDATION_ERROR,
          extras: { where: "api.studio.admin.users.id.PATCH.payload" },
        },
      );

      const usersRepo = getUsersRepository();
      await usersRepo.ensureBase();

      const payload = adaptUpdateUserPayload(dto);

      const runUpdate = updateUser({
        users: usersRepo,
        adminUserProvisioning: usersRepo,
      });
      const { user } = await runUpdate({ userId, ...payload });

      lg.debug("route.user.updated", {
        userId: user.id,
        email: user.email,
        role: user.rbac?.role,
      });

      const res: UpdateUserResponse = { user: user as UserDTO };
      return res;
    });
  });
}
