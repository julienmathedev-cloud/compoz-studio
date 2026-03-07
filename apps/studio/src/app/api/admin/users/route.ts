/**
 * @file apps/studio/src/app/api/admin/users/route.ts
 * @layer studio/app/api
 *
 * @description
 * Route API Studio (admin) pour la création et le listing des users.
 *
 * Responsabilités :
 * - GET  : liste des users (résumés).
 * - POST : crée un user (email/name/rbac + password).
 *
 * @remarks
 * - Admin-only : garanti par `requireAdminSession()`.
 * - Pas de state draft/published ici : users = données Studio globales.
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

// -------------------------------------------------
// GET /api/admin/users → list users
// -------------------------------------------------

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

// -------------------------------------------------
// POST /api/admin/users → create user
// -------------------------------------------------

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
