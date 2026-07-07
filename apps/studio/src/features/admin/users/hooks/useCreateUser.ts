"use client";

/**
 * @file apps/studio/src/features/admin/users/hooks/useCreateUser.ts
 * @layer studio/features/admin/users/hooks
 *
 * @description
 * React Query mutation hook for creating Studio users through the admin API.
 *
 * @remarks
 * - Users are global Studio data, so no draft/published state is involved.
 * - Invalidates the admin users list after a successful creation.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { log } from "@compoz/infra/lib/log";
import { notify } from "@compoz/studio/lib/ui/notify";
import { notifyCreated } from "@compoz/studio/lib/ui/notify-presets";
import { UiError } from "@compoz/studio/lib/ui/uiError";

import { adminUsersStudioApi } from "@compoz/infra/http/studio/users.client";
import { toCreateUserIntentDTOFromFormValues } from "@compoz/studio/features/admin/users/mappers/users-form";

import { usersListKey } from "@compoz/studio/features/admin/users/cache/keys";
import type { UserFormValues } from "@compoz/validation/users/user-form";
import type { CreateUserIntentDTO } from "@compoz/validation/users/user-intents";

type UseCreateUserResult = Readonly<{
  create: (values: UserFormValues) => Promise<void>;
  isCreating: boolean;
}>;

const lg = log.child({ ns: "hook", name: "useCreateUser" });

export function useCreateUser(onSuccess?: () => void): UseCreateUserResult {
  const t = useTranslations();
  const qc = useQueryClient();
  const entityLabel = t("studio.shared.entities.user");

  const mutation = useMutation({
    mutationKey: ["studio", "users", "create"] as const,

    mutationFn: async (values: UserFormValues) => {
      const payload: CreateUserIntentDTO =
        toCreateUserIntentDTOFromFormValues(values);

      const fields = Object.keys(payload ?? {});

      const res = await adminUsersStudioApi.create(payload);

      // Flatten the route response for mutation consumers.
      const user = res.user;

      return { payload, fields, user } as const;
    },

    onSuccess: async ({ payload, fields, user }) => {
      notifyCreated(
        t("notifications.created.title", { entity: entityLabel }),
        t("notifications.created.description", {
          entity: entityLabel,
          name: payload.email,
        }),
      );

      lg.debug("create.ok", {
        userId: user?.id,
        email: user?.email,
        role: user?.rbac?.role,
        fields,
      });

      // Refresh the users list cache after creation.
      await qc.invalidateQueries({ queryKey: usersListKey() });

      onSuccess?.();
    },

    onError: (e: unknown) => {
      notify.fromError(e, UiError.unexpectedSave);
      lg.error("create.failed", { msg: String(e) });
    },

    retry: false,
  });

  return {
    create: async (values) => {
      await mutation.mutateAsync(values);
    },
    isCreating: mutation.isPending,
  } as const;
}

useCreateUser.displayName = "useCreateUser";
