"use client";

/**
 * @file apps/studio/src/features/pages/hooks/useCreatePage.ts
 * @layer hooks/admin/pages
 *
 * @description
 * Hook admin React Query pour créer une page (draft) via l’API.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { log } from "@compoz/infra/lib/log";
import { notify } from "@compoz/studio/lib/ui/notify";
import { notifyCreated } from "@compoz/studio/lib/ui/notify-presets";
import { withSaveLogs } from "@compoz/ui/hooks/instrumentation";

import { pagesAdminApi } from "@compoz/infra/http/studio/pages.client";
import { toCreatePageIntentDTOFromFormValues } from "@compoz/studio/features/pages/mappers/pages-form";
import { setSiteIndexCache } from "@compoz/studio/features/site-index/cache";
import {
  invalidateSiteStatus,
  invalidateSiteStatusDetails,
} from "@compoz/studio/features/site/status/invalidate";
import { UiError } from "@compoz/studio/lib/ui/uiError";

import { useTenantId } from "@compoz/studio/features/admin/context/TenantContext";
import { pageByIdKey } from "@compoz/studio/features/pages/cache/keys";
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
  const entityLabel = t("admin.shared.entities.page");
  const tenantId = useTenantId();

  const mutation = useMutation({
    mutationKey: ["t", tenantId, "admin", "pages", "create"] as const,

    mutationFn: async (values: PageFormValues) => {
      const payload: CreatePageIntentDTO =
        toCreatePageIntentDTOFromFormValues(values);

      const fields = Object.keys(payload ?? {});

      const res = await withSaveLogs(
        "useCreatePage",
        WRITE_CONTENT_STATE,
        () => pagesAdminApi.create(payload),
        { entity: entityLabel, fields },
      );

      // ✅ flatten route response
      const page = res.page;
      const index = res.index;

      return { payload, fields, page, index } as const;
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

      // ✅ 1) push immédiat dans le cache: siteIndex (plus d’invalidate/read)
      if (index) {
        setSiteIndexCache(qc, tenantId, WRITE_CONTENT_STATE, index);
      }

      // ✅ 2) seed le cache du read "page by id" (évite un GET si l’UI navigue ensuite)
      if (page?.id) {
        qc.setQueryData(
          pageByIdKey(tenantId, page.id, WRITE_CONTENT_STATE),
          page,
        );
      }

      // ✅ 3) statusDetails dépend de l’index → on invalide (snapshot)
      await Promise.all([
        invalidateSiteStatus(qc, tenantId),
        invalidateSiteStatusDetails(qc, tenantId),
      ]);

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

useCreatePage.displayName = "useCreatePage";
