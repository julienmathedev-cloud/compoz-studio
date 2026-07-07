/**
 * @file packages/infra/src/http/studio/users.client.ts
 * @layer infra/http/studio
 * @description Studio HTTP client for admin user listing and CRUD operations.
 * @remarks
 * User routes currently live under the Studio `admin` segment for legacy compatibility.
 */

import { ENDPOINTS } from "@compoz/infra/http/endpoints";
import {
  assertJsonResponse,
  encodeSegment,
  type HttpOpts,
} from "@compoz/infra/http/internal";
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

export const adminUsersStudioApi = {
  async list(opts?: HttpOpts): Promise<GetUsersResponse> {
    return logSpan(
      "compoz:studio:svc:users",
      { endpoint: ENDPOINTS.STUDIO.USERS.base, method: "GET" },
      async () => {
        const res = await apiFetch<GetUsersResponse>(
          ENDPOINTS.STUDIO.USERS.base,
          {
            method: "GET",
            ...(opts ?? {}),
          },
        );

        return assertJsonResponse(res, "adminUsersStudioApi.list");
      },
    );
  },

  async getById(userId: string, opts?: HttpOpts): Promise<GetUserByIdResponse> {
    return logSpan(
      "compoz:studio:svc:users",
      { endpoint: ENDPOINTS.STUDIO.USERS.byId("<userId>"), method: "GET" },
      async () => {
        const res = await apiFetch<GetUserByIdResponse>(
          ENDPOINTS.STUDIO.USERS.byId(encodeSegment(userId)),
          { method: "GET", ...(opts ?? {}) },
        );

        return assertJsonResponse(res, "adminUsersStudioApi.getById");
      },
    );
  },

  async create(
    payload: CreateUserIntentDTO,
    opts?: HttpOpts,
  ): Promise<CreateUserResponse> {
    return logSpan(
      "compoz:studio:svc:users",
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

        return assertJsonResponse(res, "adminUsersStudioApi.create");
      },
    );
  },

  async update(
    userId: string,
    payload: UpdateUserIntentDTO,
    opts?: HttpOpts,
  ): Promise<UpdateUserResponse> {
    return logSpan(
      "compoz:studio:svc:users",
      { endpoint: ENDPOINTS.STUDIO.USERS.byId("<userId>"), method: "PATCH" },
      async () => {
        const res = await apiFetch<UpdateUserResponse>(
          ENDPOINTS.STUDIO.USERS.byId(encodeSegment(userId)),
          { method: "PATCH", body: JSON.stringify(payload), ...(opts ?? {}) },
        );

        return assertJsonResponse(res, "adminUsersStudioApi.update");
      },
    );
  },

  async remove(userId: string, opts?: HttpOpts): Promise<DeleteUserResponse> {
    return logSpan(
      "compoz:studio:svc:users",
      { endpoint: ENDPOINTS.STUDIO.USERS.byId("<userId>"), method: "DELETE" },
      async () => {
        const res = await apiFetch<DeleteUserResponse>(
          ENDPOINTS.STUDIO.USERS.byId(encodeSegment(userId)),
          { method: "DELETE", ...(opts ?? {}) },
        );

        return assertJsonResponse(res, "adminUsersStudioApi.remove");
      },
    );
  },
} as const;
