"use client";

/**
 * @file apps/studio/src/features/admin/users/hooks/useCreateUser.ts
 * @layer hooks/admin/users
 *
 * @description
 * Hook admin React Query pour créer un user (Studio) via l’API.
 *
 * @remarks
 * - Pas de state draft/published pour les users (données Studio globales).
 * - Donc pas de `withSaveLogs(state, ...)` ici.
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

      // ✅ no state for users
      const res = await adminUsersStudioApi.create(payload);

      // ✅ flatten route response
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

      // ✅ refresh list users
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
