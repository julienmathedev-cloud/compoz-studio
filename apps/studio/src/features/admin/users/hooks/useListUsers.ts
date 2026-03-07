"use client";

/**
 * @file apps/studio/src/features/admin/users/hooks/useListUsers.ts
 * @layer hooks/admin/users
 *
 * @description
 * Hook Studio React Query pour charger la liste des users (Studio).
 *
 * @remarks
 * - Orchestration UI-only (query + logs + notifications).
 * - Aucune notion de draft/published.
 * - Aucune logique métier.
 */

import { useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import type { UserSummaryDTO } from "@compoz/core/domain/users/dto";
import { adminUsersStudioApi } from "@compoz/infra/http/studio/users.client";
import { log } from "@compoz/infra/lib/log";

import { usersListKey } from "@compoz/studio/features/admin/users/cache/keys";
import { notify } from "@compoz/studio/lib/ui/notify";

type UseListUsersResult = Readonly<{
  users: ReadonlyArray<UserSummaryDTO>;
  isLoading: boolean;
}>;

const lg = log.child({ ns: "hook", name: "useListUsers" });

export function useListUsers(): UseListUsersResult {
  const t = useTranslations();
  const entityLabel = t("studio.shared.entities.users");

  const query = useQuery({
    queryKey: usersListKey(),

    queryFn: async ({ signal }): Promise<ReadonlyArray<UserSummaryDTO>> => {
      const res = await adminUsersStudioApi.list({ signal });

      // ✅ flatten route response
      const users = res.users;

      lg.debug("list.ok", { count: users.length });

      return users;
    },

    placeholderData: (prev) => prev,
  } as const);

  useEffect(() => {
    if (!query.error) return;

    notify.fromError(query.error);
    lg.error("list.failed", {
      entity: entityLabel,
      msg: String(query.error),
    });
  }, [query.error, entityLabel]);

  return {
    users: query.data ?? [],
    isLoading: query.isPending,
  } as const;
}

useListUsers.displayName = "useListUsers";
