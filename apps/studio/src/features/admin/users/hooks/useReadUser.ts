"use client";

/**
 * @file apps/studio/src/features/admin/users/hooks/useReadUser.ts
 * @layer studio/features/admin/users/hooks
 *
 * @description
 * React Query hook for reading a Studio user through the admin API.
 *
 * @remarks
 * - Returns `UserDTO | null` depending on the selected user id.
 * - Users are global Studio data, so no draft/published state is involved.
 * - Keeps previous user data during refetches to avoid UI flicker.
 */

import { useEffect } from "react";

import { useQuery } from "@tanstack/react-query";

import type { UserDTO } from "@compoz/core/domain/users/dto";
import { adminUsersStudioApi } from "@compoz/infra/http/studio/users.client";
import { log } from "@compoz/infra/lib/log";

import { userByIdKey } from "@compoz/studio/features/admin/users/cache/keys";
import { notify } from "@compoz/studio/lib/ui/notify";

type UseReadUserResult = Readonly<{
  user: UserDTO | null;
  isLoading: boolean;
}>;

const lg = log.child({ ns: "hook", name: "useReadUser" });

export function useReadUser(userId: string): UseReadUserResult {
  const userIdKey = String(userId ?? "").trim();
  const enabled = Boolean(userIdKey);

  const options = {
    queryKey: userByIdKey(userIdKey),
    enabled,

    queryFn: async ({ signal }: { signal: AbortSignal }): Promise<UserDTO> => {
      const res = await adminUsersStudioApi.getById(userIdKey, { signal });

      // Flatten the route response for query consumers.
      return res.user;
    },

    placeholderData: (prev: UserDTO | undefined) => prev,
  } as const;

  const query = useQuery<UserDTO, Error>(options);

  useEffect(() => {
    if (!query.error) return;

    notify.fromError(query.error);
    lg.error("read.failed", {
      userId: userIdKey,
      msg: String(query.error),
    });
  }, [query.error, userIdKey]);

  return {
    user: enabled ? (query.data ?? null) : null,
    isLoading: enabled ? query.isPending : false,
  } as const;
}

useReadUser.displayName = "useReadUser";
