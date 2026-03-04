"use client";

/**
 * @file apps/studio/src/features/admin/users/hooks/useDeleteUser.ts
 * @layer hooks/admin/users
 */

import { log } from "@compoz/infra/lib/log";
import { notify } from "@compoz/studio/lib/ui/notify";
import { notifyDeleted } from "@compoz/studio/lib/ui/notify-presets";
import { UiError } from "@compoz/studio/lib/ui/uiError";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

import { usersAdminApi } from "@compoz/infra/http/studio/users.client";
import {
  userByIdKey,
  usersListKey,
} from "@compoz/studio/features/admin/users/cache/keys";

type UseDeleteUserResult = Readonly<{
  deletingUserId: string | null;
  isDeleting: boolean;
  remove: (args: DeleteUserArgs) => Promise<void>;
}>;

type DeleteUserArgs = Readonly<{
  userId: string;
  label?: string;
}>;

const lg = log.child({ ns: "hook", name: "useDeleteUser" });

export function useDeleteUser(onSuccess?: () => void): UseDeleteUserResult {
  const t = useTranslations();
  const qc = useQueryClient();

  // ✅ on réutilise une clé i18n que tu as déjà montrée (plural)
  const entityLabel = t("admin.shared.entities.users");

  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationKey: ["admin", "users", "delete"] as const,

    mutationFn: async (args: DeleteUserArgs) => {
      const userId = String(args.userId ?? "").trim();
      const fields = ["userId"] as const;

      await usersAdminApi.remove(userId);

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

      // ✅ 1) purge cache user-by-id (évite une UI “fantôme”)
      qc.removeQueries({
        queryKey: userByIdKey(args.userId),
        exact: true,
      });

      // ✅ 2) refresh liste (simple & safe)
      await qc.invalidateQueries({ queryKey: usersListKey() });

      lg.info("delete.ok", { userId: args.userId, fields: args.fields });

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
