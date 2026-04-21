"use client";

/**
 * @file apps/studio/src/features/admin/users/hooks/useDeleteUser.ts
 * @layer hooks/admin/users
 *
 * @description
 * Hook Studio React Query pour supprimer un user via l’API.
 *
 * @remarks
 * - Orchestration UI-only : mutation + notifications + cache.
 * - Supprime le cache `userById` puis invalide la liste.
 * - Expose `deletingUserId` pour désactiver la ligne ciblée.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import { adminUsersStudioApi } from "@compoz/infra/http/studio/users.client";
import { log } from "@compoz/infra/lib/log";

import {
  userByIdKey,
  usersListKey,
} from "@compoz/studio/features/admin/users/cache/keys";
import { notify } from "@compoz/studio/lib/ui/notify";
import { notifyDeleted } from "@compoz/studio/lib/ui/notify-presets";
import { UiError } from "@compoz/studio/lib/ui/uiError";

type DeleteUserArgs = Readonly<{
  userId: string;
  label?: string;
}>;

type UseDeleteUserResult = Readonly<{
  deletingUserId: string | null;
  isDeleting: boolean;
  remove: (args: DeleteUserArgs) => Promise<void>;
}>;

const lg = log.child({ ns: "hook", name: "useDeleteUser" });

export function useDeleteUser(onSuccess?: () => void): UseDeleteUserResult {
  const t = useTranslations();
  const qc = useQueryClient();

  const entityLabel = t("studio.shared.entities.users");

  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationKey: ["studio", "users", "delete"] as const,

    mutationFn: async (args: DeleteUserArgs) => {
      const userId = String(args.userId ?? "").trim();
      const fields = ["userId"] as const;

      await adminUsersStudioApi.remove(userId);

      return { ...args, userId, fields } as const;
    },

    onSuccess: async (args) => {
      notifyDeleted(
        t("notifications.deleted.title", { entity: entityLabel }),
        t("notifications.deleted.description", {
          entity: entityLabel,
          name: args.label ?? args.userId,
        }),
      );

      // 1) purge cache user-by-id (évite une UI “fantôme”)
      qc.removeQueries({
        queryKey: userByIdKey(args.userId),
        exact: true,
      });

      // 2) refresh liste (simple & safe)
      await qc.invalidateQueries({ queryKey: usersListKey() });

      lg.debug("delete.ok", { userId: args.userId, fields: args.fields });

      onSuccess?.();
    },

    onError: (e: unknown, args) => {
      notify.fromError(e, UiError.unexpectedSave);
      lg.error("delete.failed", { userId: args.userId, msg: String(e) });
    },

    onSettled: () => {
      setDeletingUserId(null);
    },

    retry: false,
  });

  const remove = useCallback(
    async (args: DeleteUserArgs) => {
      const userId = String(args.userId ?? "").trim();
      if (!userId) return;
      if (deletingUserId === userId) return;

      setDeletingUserId(userId);
      await mutation.mutateAsync({ ...args, userId });
    },
    [mutation, deletingUserId],
  );

  return {
    remove,
    deletingUserId,
    isDeleting: mutation.isPending,
  } as const;
}

useDeleteUser.displayName = "useDeleteUser";
