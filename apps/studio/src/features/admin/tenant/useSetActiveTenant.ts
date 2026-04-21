"use client";

/**
 * @file apps/studio/src/features/admin/tenant/useSetActiveTenant.ts
 * @layer studio/features/admin/tenant
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

import { tenantStudioApi } from "@compoz/infra/http/studio/tenant.client";
import { log } from "@compoz/infra/lib/log";
import { requireTenantId } from "@compoz/ui/lib/tenant-id";

import { notify } from "@compoz/studio/lib/ui/notify";
import { UiError } from "@compoz/studio/lib/ui/uiError";

const NS = "studio.features.admin.tenant.useSetActiveTenant";
const lg = log.child({ ns: NS });

type UseSetActiveTenantResult = Readonly<{
  setActiveTenant: (tenantId: string) => Promise<void>;
  isSaving: boolean;
}>;

export function useSetActiveTenant(): UseSetActiveTenantResult {
  const t = useTranslations();
  const entityLabel = t("studio.shared.entities.tenant");

  const mutation = useMutation({
    mutationKey: ["admin", "tenant", "active"] as const,

    mutationFn: async (tenantId: string) => {
      const next = requireTenantId(tenantId, "tenantId");
      return tenantStudioApi.setActiveTenant(next);
    },

    onSuccess: (res) => {
      lg.debug("hook.admin.tenant.setActiveTenant.done", {
        tenantId: res.tenantId,
      });
    },

    onError: (e: unknown) => {
      notify.fromError(e, UiError.unexpectedSave);
      lg.error("hook.admin.tenant.setActiveTenant.failed", {
        entity: entityLabel,
        msg: String(e),
      });
    },

    retry: false,
  });

  return {
    setActiveTenant: async (tenantId: string) => {
      await mutation.mutateAsync(tenantId);
      // ✅ respecte le contrat Promise<void> (on ignore volontairement la réponse)
    },
    isSaving: mutation.isPending,
  } as const;
}

useSetActiveTenant.displayName = "useSetActiveTenant";
