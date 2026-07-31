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
 */

import { useEffect } from "react";

import { useQuery } from "@tanstack/react-query";

import type { UserDTO } from "@compoz/core/domain/users/dto";
import { log } from "@compoz/infra/lib/log";

import { readUserQueryOptions } from "@compoz/studio/features/admin/users/hooks/read-user-query";
import { notify } from "@compoz/studio/lib/ui/notify";

type UseReadUserResult = Readonly<{
  user: UserDTO | null;
  isLoading: boolean;
}>;

const lg = log.child({ ns: "hook", name: "useReadUser" });

export function useReadUser(userId: string): UseReadUserResult {
  const userIdKey = String(userId ?? "").trim();
  const options = readUserQueryOptions(userIdKey);
  const enabled = options.enabled;

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
