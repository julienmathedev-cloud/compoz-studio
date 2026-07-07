/**
 * @file packages/infra/src/http/studio/users.types.ts
 * @layer infra/http/studio
 * @description DTO contracts for Studio user endpoints.
 * @remarks
 * These DTOs stay aligned with Studio HTTP routes without importing from `app/api`.
 */

import type { UserDTO, UserSummaryDTO } from "@compoz/core/domain/users/dto";

export type GetUsersResponse = Readonly<{
  users: ReadonlyArray<UserSummaryDTO>;
}>;

export type CreateUserResponse = Readonly<{
  user: UserDTO;
}>;

export type GetUserByIdResponse = Readonly<{
  user: UserDTO;
}>;

export type UpdateUserResponse = Readonly<{
  user: UserDTO;
}>;

export type DeleteUserResponse = Readonly<{
  ok: true;
  userId: string;
}>;
