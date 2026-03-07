"use client";

/**
 * @file apps/studio/src/features/admin/users/hooks/useUpdateUser.ts
 * @layer hooks/admin/users
 *
 * @description
 * Hook Studio React Query pour mettre à jour un user (Studio) via l’API.
 *
 * @remarks
 * - Orchestration UI-only (mutation + logs + notifications).
 * - Users = données Studio globales (pas de draft/published).
 * - `password: ""` = "no change" => on n’envoie pas.
 * - Patch construit via shallow diff (baseline -> next).
 */

import { useCallback, useMemo, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import type { UserDTO } from "@compoz/core/domain/users/dto";
import { adminUsersStudioApi } from "@compoz/infra/http/studio/users.client";
import { log } from "@compoz/infra/lib/log";

import {
  userByIdKey,
  usersListKey,
} from "@compoz/studio/features/admin/users/cache/keys";
import { notify } from "@compoz/studio/lib/ui/notify";
import {
  notifyNoChanges,
  notifyUpdated,
} from "@compoz/studio/lib/ui/notify-presets";
import { UiError } from "@compoz/studio/lib/ui/uiError";

import { buildShallowDiff } from "@compoz/ui/lib/build-shallow-diff";
import type { UserFormValues } from "@compoz/validation/users/user-form";
import type { UpdateUserIntentDTO } from "@compoz/validation/users/user-intents";

type UseUpdateUserResult = Readonly<{
  update: (
    userId: string,
    baseline: UserFormValues,
    next: UserFormValues,
  ) => Promise<void>;
  updatingUserId: string | null;
  isUpdating: boolean;
}>;

type UpdateUserArgs = Readonly<{
  userId: string;
  payload: UpdateUserIntentDTO;
  fields: ReadonlyArray<string>;
}>;

type UpdateUserMutationResult = Readonly<{
  userId: string;
  fields: ReadonlyArray<string>;
  user: UserDTO;
}>;

const lg = log.child({ ns: "hook", name: "useUpdateUser" });

/* -------------------------------------------------------------------------- */
/* UI patch -> Intent DTO                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Construit un patch API à partir d’un patch UI (shallow diff).
 *
 * @remarks
 * - `password: ""` => pas envoyé.
 */
function toUpdateUserIntentDTOFromFormPatch(
  p: Partial<UserFormValues>,
): UpdateUserIntentDTO {
  const out: UpdateUserIntentDTO = {};

  if ("email" in p && p.email !== undefined) out.email = String(p.email).trim();
  if ("name" in p && p.name !== undefined) out.name = String(p.name).trim();

  if ("password" in p && p.password !== undefined) {
    const pwd = String(p.password ?? "").trim();
    if (pwd) out.password = pwd;
  }

  if ("rbac" in p && p.rbac !== undefined) {
    out.rbac = p.rbac;
  }

  return out;
}

export function useUpdateUser(onSuccess?: () => void): UseUpdateUserResult {
  const t = useTranslations();
  const qc = useQueryClient();
  const entityLabel = t("studio.shared.entities.user");

  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationKey: ["studio", "users", "update"] as const,

    mutationFn: async (
      args: UpdateUserArgs,
    ): Promise<UpdateUserMutationResult> => {
      const { userId, payload, fields } = args;

      const res = await adminUsersStudioApi.update(userId, payload);

      // ✅ flatten route response
      const user = res.user;

      return { userId, fields, user } as const;
    },

    onSuccess: async ({ userId, fields, user }) => {
      notifyUpdated(
        t("notifications.updated.title", { entity: entityLabel }),
        t("notifications.updated.description", { fields: fields.join(", ") }),
      );

      // ✅ seed/patch cache user-by-id
      qc.setQueryData(userByIdKey(userId), user);

      // ✅ refresh list users (SoT)
      await qc.invalidateQueries({ queryKey: usersListKey() });

      lg.info("update.ok", { userId, fields });
      onSuccess?.();
    },

    onError: (e: unknown) => {
      notify.fromError(e, UiError.unexpectedSave);
      lg.error("update.failed", { msg: String(e) });
    },

    onSettled: () => {
      setUpdatingUserId(null);
    },

    retry: false,
  });

  const update = useCallback(
    async (userId: string, baseline: UserFormValues, next: UserFormValues) => {
      if (mutation.isPending) return;

      const userIdKey = String(userId ?? "").trim();
      if (!userIdKey) {
        notify.error(
          t("uiErrors.errorGeneric"),
          t(ERROR_CODES.USER_ID_REQUIRED),
        );
        lg.error("update.invalidUserId", { userId });
        return;
      }

      if (updatingUserId === userIdKey) return;

      const uiPatch = buildShallowDiff<UserFormValues>(baseline, next) ?? null;

      if (!uiPatch) {
        notifyNoChanges(
          t("notifications.noChanges.title"),
          t("notifications.noChanges.description", { entity: entityLabel }),
        );
        return;
      }

      const payload = toUpdateUserIntentDTOFromFormPatch(uiPatch);
      const fields = Object.keys(payload ?? {});

      if (fields.length === 0) {
        notifyNoChanges(
          t("notifications.noChanges.title"),
          t("notifications.noChanges.description", { entity: entityLabel }),
        );
        return;
      }

      setUpdatingUserId(userIdKey);

      await mutation.mutateAsync({
        userId: userIdKey,
        payload,
        fields,
      });
    },
    [mutation, updatingUserId, t, entityLabel],
  );

  return useMemo(
    () =>
      ({
        update,
        updatingUserId,
        isUpdating: mutation.isPending,
      }) as const,
    [update, updatingUserId, mutation.isPending],
  );
}

useUpdateUser.displayName = "useUpdateUser";
