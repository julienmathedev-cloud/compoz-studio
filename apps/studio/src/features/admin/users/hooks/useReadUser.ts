"use client";

/**
 * @file apps/studio/src/features/admin/users/hooks/useReadUser.ts
 * @layer hooks/admin/users
 *
 * @description
 * Hook admin React Query pour lire un user via l’API.
 *
 * @remarks
 * - Orchestration UI-only (query, logs, notifications).
 * - Retourne `UserDTO | null`.
 * - Aucune notion de state (users = données Studio globales).
 */

import { log } from "@compoz/infra/lib/log";
import { notify } from "@compoz/studio/lib/ui/notify";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { usersAdminApi } from "@compoz/infra/http/studio/users.client";
import { userByIdKey } from "@compoz/studio/features/admin/users/cache/keys";

import type { UserDTO } from "@compoz/core/domain/users/dto";

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
      const res = await usersAdminApi.getById(userIdKey, { signal });

      // ✅ flatten route response
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
