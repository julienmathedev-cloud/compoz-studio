"use client";

/**
 * @file apps/studio/src/features/admin/website/useSetActiveWebsite.ts
 * @layer studio/features/admin/website
 *
 * @description
 * Hook admin pour définir le Website actif via mutation.
 *
 * @remarks
 * - Orchestration UI-only : mutation + logs + notifications.
 * - La route API valide la session, le rôle et l’accès au Website demandé.
 * - Le Website actif est persisté côté serveur via cookie httpOnly.
 */

import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { websiteStudioApi } from "@compoz/infra/http/studio/website.client";
import { log } from "@compoz/infra/lib/log";

import { notify } from "@compoz/studio/lib/ui/notify";
import { UiError } from "@compoz/studio/lib/ui/uiError";

const NS = "studio.features.admin.website.useSetActiveWebsite";
const logger = log.child({ ns: NS });

type UseSetActiveWebsiteResult = Readonly<{
  setActiveWebsite: (websiteId: string) => Promise<void>;
  isSaving: boolean;
}>;

function requireWebsiteId(value: unknown, field = "websiteId"): string {
  const websiteId = String(value ?? "").trim();

  if (!websiteId) {
    throw new Error(`${field} is required`);
  }

  return websiteId;
}

export function useSetActiveWebsite(): UseSetActiveWebsiteResult {
  const t = useTranslations();
  const entityLabel = t("studio.shared.entities.website");

  const mutation = useMutation({
    mutationKey: ["admin", "website", "active"] as const,

    mutationFn: async (websiteId: string) => {
      const nextWebsiteId = requireWebsiteId(websiteId, "websiteId");

      return websiteStudioApi.setActiveWebsite(nextWebsiteId);
    },

    onSuccess: (res) => {
      logger.debug("hook.admin.website.setActiveWebsite.done", {
        websiteId: res.websiteId,
      });
    },

    onError: (error: unknown) => {
      notify.fromError(error, UiError.unexpectedSave);

      logger.error("hook.admin.website.setActiveWebsite.failed", {
        entity: entityLabel,
        msg: String(error),
      });
    },

    retry: false,
  });

  return {
    setActiveWebsite: async (websiteId: string) => {
      await mutation.mutateAsync(websiteId);
    },
    isSaving: mutation.isPending,
  };
}

useSetActiveWebsite.displayName = "useSetActiveWebsite";
