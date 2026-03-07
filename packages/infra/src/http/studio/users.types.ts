/**
 * @file packages/infra/src/http/studio/users.types.ts
 * @layer infra/http/studio
 * @description
 * DTO SoT des réponses users (Studio).
 *
 * @remarks
 * - Aligné sur les routes Next côté Studio (préfixées via ENDPOINTS).
 * - Aucun import depuis `app/api/...`
 */

import type { UserDTO, UserSummaryDTO } from "@compoz/core/domain/users/dto";

/* -------------------------------------------------------------------------- */
/* Users                                                                      */
/* -------------------------------------------------------------------------- */

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
