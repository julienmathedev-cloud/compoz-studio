"use client";

/**
 * @file apps/studio/src/features/admin/tenant/hooks/useSetActiveTenant.ts
 * @layer hooks/admin/tenant
 *
 * @description
 * Hook admin pour définir le tenant actif (cookie httpOnly) via mutation.
 *
 * @remarks
 * - Orchestration UI-only (mutation + logs + notifications).
 * - La route valide: session + role + tenant autorisé.
 */

import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { tenantAdminApi } from "@compoz/infra/http/studio/tenant.client";
import { log } from "@compoz/infra/lib/log";
import { notify } from "@compoz/studio/lib/ui/notify";
import { UiError } from "@compoz/studio/lib/ui/uiError";

const lg = log.child({ ns: "hook", name: "useSetActiveTenant" });

type UseSetActiveTenantResult = Readonly<{
  setActiveTenant: (tenantId: string) => Promise<void>;
  isSaving: boolean;
}>;

export function useSetActiveTenant(): UseSetActiveTenantResult {
  const t = useTranslations();
  const entityLabel = t("admin.shared.entities.tenant");

  const mutation = useMutation({
    mutationKey: ["admin", "tenant", "active"] as const,

    mutationFn: async (tenantId: string) => {
      const next = String(tenantId ?? "")
        .trim()
        .toLowerCase();
      if (!next) throw new Error("Missing tenantId");
      return tenantAdminApi.setActiveTenant(next);
    },

    onSuccess: (res) => {
      lg.info("setActiveTenant.ok", { tenantId: res.tenantId });
    },

    onError: (e: unknown) => {
      notify.fromError(e, UiError.unexpectedSave);
      lg.error("setActiveTenant.failed", {
        entity: entityLabel,
        msg: String(e),
      });
    },

    retry: false,
  });

  return {
    setActiveTenant: async (tenantId) => {
      await mutation.mutateAsync(tenantId);
    },
    isSaving: mutation.isPending,
  } as const;
}

useSetActiveTenant.displayName = "useSetActiveTenant";
