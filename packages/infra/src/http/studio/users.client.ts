/**
 * @file packages/infra/src/http/studio/users.client.ts
 * @layer infra/http
 * @description
 * Client HTTP Admin pour la gestion des users : listing, CRUD.
 *
 * Responsabilités : construction des requêtes HTTP, encodage des segments,
 * typage des réponses via DTOs domaine.
 */

import { ENDPOINTS } from "@compoz/infra/http/endpoints";
import { encodeSegment, type HttpOpts } from "@compoz/infra/http/internal";
import { apiFetch } from "@compoz/infra/lib/api-fetch";
import { logSpan } from "@compoz/infra/lib/log";

import type {
  CreateUserResponse,
  DeleteUserResponse,
  GetUserByIdResponse,
  GetUsersResponse,
  UpdateUserResponse,
} from "@compoz/infra/http/studio/users.types";

import type {
  CreateUserIntentDTO,
  UpdateUserIntentDTO,
} from "@compoz/validation/users/user-intents";

function assertJsonResponse<T>(res: T | null, errorMessage: string): T {
  // Contract: this endpoint returns JSON on success.
  if (!res) {
    throw new Error(errorMessage);
  }
  return res;
}

/* -------------------------------------------------------------------------- */
/*                               Client HTTP Admin                            */
/* -------------------------------------------------------------------------- */

export const usersAdminApi = {
  async list(opts?: HttpOpts): Promise<GetUsersResponse> {
    return logSpan(
      "infra.http.admin.users.list",
      { endpoint: ENDPOINTS.STUDIO.USERS.base, method: "GET" },
      async () => {
        const res = await apiFetch<GetUsersResponse>(
          ENDPOINTS.STUDIO.USERS.base,
          {
            method: "GET",
            ...(opts ?? {}),
          },
        );

        return assertJsonResponse(
          res,
          "usersAdminApi.list: expected JSON response, received null.",
        );
      },
    );
  },

  async getById(userId: string, opts?: HttpOpts): Promise<GetUserByIdResponse> {
    return logSpan(
      "infra.http.admin.users.getById",
      { endpoint: ENDPOINTS.STUDIO.USERS.byId("<userId>"), method: "GET" },
      async () => {
        const res = await apiFetch<GetUserByIdResponse>(
          ENDPOINTS.STUDIO.USERS.byId(encodeSegment(userId)),
          { method: "GET", ...(opts ?? {}) },
        );

        return assertJsonResponse(
          res,
          "usersAdminApi.getById: expected JSON response, received null.",
        );
      },
    );
  },

  async create(
    payload: CreateUserIntentDTO,
    opts?: HttpOpts,
  ): Promise<CreateUserResponse> {
    return logSpan(
      "infra.http.admin.users.create",
      { endpoint: ENDPOINTS.STUDIO.USERS.base, method: "POST" },
      async () => {
        const res = await apiFetch<CreateUserResponse>(
          ENDPOINTS.STUDIO.USERS.base,
          {
            method: "POST",
            body: JSON.stringify(payload),
            ...(opts ?? {}),
          },
        );

        return assertJsonResponse(
          res,
          "usersAdminApi.create: expected JSON response, received null.",
        );
      },
    );
  },

  async update(
    userId: string,
    payload: UpdateUserIntentDTO,
    opts?: HttpOpts,
  ): Promise<UpdateUserResponse> {
    return logSpan(
      "infra.http.admin.users.update",
      { endpoint: ENDPOINTS.STUDIO.USERS.byId("<userId>"), method: "PATCH" },
      async () => {
        const res = await apiFetch<UpdateUserResponse>(
          ENDPOINTS.STUDIO.USERS.byId(encodeSegment(userId)),
          { method: "PATCH", body: JSON.stringify(payload), ...(opts ?? {}) },
        );

        return assertJsonResponse(
          res,
          "usersAdminApi.update: expected JSON response, received null.",
        );
      },
    );
  },

  async remove(userId: string, opts?: HttpOpts): Promise<DeleteUserResponse> {
    return logSpan(
      "infra.http.admin.users.remove",
      { endpoint: ENDPOINTS.STUDIO.USERS.byId("<userId>"), method: "DELETE" },
      async () => {
        const res = await apiFetch<DeleteUserResponse>(
          ENDPOINTS.STUDIO.USERS.byId(encodeSegment(userId)),
          { method: "DELETE", ...(opts ?? {}) },
        );

        return assertJsonResponse(
          res,
          "usersAdminApi.remove: expected JSON response, received null.",
        );
      },
    );
  },
};
