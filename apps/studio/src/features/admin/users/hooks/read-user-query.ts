/**
 * @file apps/studio/src/features/admin/users/hooks/read-user-query.ts
 * @layer studio/features/admin/users/hooks
 *
 * @description
 * Query options for an individual Studio user.
 */

import type { UserDTO } from "@compoz/core/domain/users/dto";
import { adminUsersStudioApi } from "@compoz/infra/http/studio/users.client";
import { userByIdKey } from "@compoz/studio/features/admin/users/cache/keys";

export function readUserQueryOptions(userId: string) {
  const userIdKey = String(userId ?? "").trim();

  return {
    queryKey: userByIdKey(userIdKey),
    enabled: Boolean(userIdKey),
    queryFn: async ({ signal }: { signal: AbortSignal }): Promise<UserDTO> => {
      const response = await adminUsersStudioApi.getById(userIdKey, { signal });

      return response.user;
    },
  } as const;
}

readUserQueryOptions.displayName = "readUserQueryOptions";
