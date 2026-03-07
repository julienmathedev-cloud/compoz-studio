"use client";

/**
 * @file apps/studio/src/features/pages/hooks/useCreatePage.ts
 * @layer hooks/studio/pages
 *
 * @description
 * Hook studio React Query pour créer une page draft via l’API.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { pagesStudioApi } from "@compoz/infra/http/studio/pages.client";
import { log } from "@compoz/infra/lib/log";
import { useTenantId } from "@compoz/studio/features/admin/tenant/TenantContext";
import { pageByIdKey } from "@compoz/studio/features/pages/cache/keys";
import { toCreatePageIntentDTOFromFormValues } from "@compoz/studio/features/pages/mappers/pages-form";
import { setSiteIndexCache } from "@compoz/studio/features/site-index/cache";
import {
  invalidatePageStatusViews,
  invalidateSiteStatus,
} from "@compoz/studio/features/site/status/invalidate";
import { notify } from "@compoz/studio/lib/ui/notify";
import { notifyCreated } from "@compoz/studio/lib/ui/notify-presets";
import { UiError } from "@compoz/studio/lib/ui/uiError";
import { withSaveLogs } from "@compoz/ui/hooks/instrumentation";
import type { PageFormValues } from "@compoz/validation/pages/page-form";
import type { CreatePageIntentDTO } from "@compoz/validation/pages/page-intents";

type UseCreatePageResult = Readonly<{
  create: (values: PageFormValues) => Promise<void>;
  isCreating: boolean;
}>;

const lg = log.child({ ns: "hook", name: "useCreatePage" });

export function useCreatePage(onSuccess?: () => void): UseCreatePageResult {
  const t = useTranslations();
  const qc = useQueryClient();
  const tenantId = useTenantId();
  const entityLabel = t("studio.shared.entities.page");

  const mutation = useMutation({
    mutationKey: ["t", tenantId, "studio", "pages", "create"] as const,

    mutationFn: async (values: PageFormValues) => {
      const payload: CreatePageIntentDTO =
        toCreatePageIntentDTOFromFormValues(values);

      const fields = Object.keys(payload ?? {});
      const response = await withSaveLogs(
        "useCreatePage",
        DEFAULT_CONTENT_STATE,
        () => pagesStudioApi.create(payload),
        { entity: entityLabel, fields },
      );

      return {
        payload,
        fields,
        page: response.page,
        index: response.index,
      } as const;
    },

    onSuccess: async ({ payload, fields, page, index }) => {
      notifyCreated(
        t("notifications.created.title", { entity: entityLabel }),
        t("notifications.created.description", {
          entity: entityLabel,
          name: payload.title,
        }),
      );

      lg.info("create.ok", {
        pageId: page?.id,
        slug: page?.slug,
        fields,
        pagesInIndex: index?.pages?.length ?? undefined,
      });

      const pageIdValue = String(page?.id ?? "").trim();

      if (index) {
        setSiteIndexCache(qc, tenantId, DEFAULT_CONTENT_STATE, index);
      }

      if (pageIdValue) {
        qc.setQueryData(
          pageByIdKey(tenantId, pageIdValue, DEFAULT_CONTENT_STATE),
          page,
        );
      }

      await Promise.all([
        invalidateSiteStatus(qc, tenantId),
        invalidatePageStatusViews(qc, tenantId),
      ]);

      onSuccess?.();
    },

    onError: (error: unknown) => {
      notify.fromError(error, UiError.unexpectedSave);
      lg.error("create.failed", { msg: String(error) });
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

useCreatePage.displayName = "useCreatePage";
