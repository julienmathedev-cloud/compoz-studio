"use client";

/**
 * @file apps/studio/src/features/pages/hooks/useUpdatePage.ts
 * @layer hooks/admin/pages
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { ERROR_CODES } from "@compoz/core/domain/errors/codes";
import type { PageDTO } from "@compoz/core/domain/pages/dto";
import type { SiteIndexDTO } from "@compoz/core/domain/site/dto";
import { pagesAdminApi } from "@compoz/infra/http/studio/pages.client";
import type { UpdatePageResponse } from "@compoz/infra/http/studio/pages.types";
import { log } from "@compoz/infra/lib/log";
import { withSaveLogs } from "@compoz/ui/hooks/instrumentation";
import { buildShallowDiff } from "@compoz/ui/lib/build-shallow-diff";
import type { PageFormValues } from "@compoz/validation/pages/page-form";
import type { UpdatePageIntentDTO } from "@compoz/validation/pages/page-intents";
import { pageByIdKey } from "@compoz/studio/features/pages/cache/keys";
import { toUpdatePageIntentDTOFromFormValues } from "@compoz/studio/features/pages/mappers/pages-form";
import { setSiteIndexCache } from "@compoz/studio/features/site-index/cache";
import { invalidatePageStatusDetails } from "@compoz/studio/features/site/status/invalidate";
import { notify } from "@compoz/studio/lib/ui/notify";
import {
  notifyNoChanges,
  notifyUpdated,
} from "@compoz/studio/lib/ui/notify-presets";
import { UiError } from "@compoz/studio/lib/ui/uiError";

type UseUpdatePageResult = Readonly<{
  update: (
    pageId: string,
    baseline: PageFormValues,
    next: PageFormValues,
  ) => Promise<void>;
  updatingPageId: string | null;
  isUpdating: boolean;
}>;

type UpdatePageArgs = Readonly<{
  pageId: string;
  payload: UpdatePageIntentDTO;
  fields: ReadonlyArray<string>;
}>;

type UpdatePageMutationResult = Readonly<{
  pageId: string;
  nextSlug: string;
  fields: ReadonlyArray<string>;
  page: PageDTO;
  index?: SiteIndexDTO;
}>;

const lg = log.child({ ns: "hook", name: "useUpdatePage" });

export function useUpdatePage(onSuccess?: () => void): UseUpdatePageResult {
  const t = useTranslations();
  const qc = useQueryClient();
  const entityLabel = t("admin.shared.entities.page");

  const [updatingPageId, setUpdatingPageId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationKey: ["admin", "pages", "update"] as const,

    mutationFn: async (
      args: UpdatePageArgs,
    ): Promise<UpdatePageMutationResult> => {
      const { pageId, payload, fields } = args;

      const res = await withSaveLogs(
        "useUpdatePage",
        WRITE_CONTENT_STATE,
        async () => {
          const r: UpdatePageResponse = await pagesAdminApi.update(
            pageId,
            payload,
          );
          return r;
        },
        { entity: entityLabel, fields, pageId },
      );

      // ✅ flatten route response
      const page = res.page;
      const index = (res as Partial<UpdatePageResponse>).index;

      const nextSlug = String(payload.slug ?? "").trim();
      return { pageId, nextSlug, fields, page, index } as const;
    },

    onSuccess: async ({ pageId, nextSlug, fields, page, index }) => {
      notifyUpdated(
        t("notifications.updated.title", { entity: entityLabel }),
        t("notifications.updated.description", { fields: fields.join(", ") }),
      );

      // ✅ 1) push siteIndex si fourni par la route (zéro read)
      if (index) {
        setSiteIndexCache(qc, WRITE_CONTENT_STATE, index);
      }

      // ✅ 2) seed/patch cache page-by-id (évite un GET + UI cohérente)
      qc.setQueryData(pageByIdKey(pageId, WRITE_CONTENT_STATE), page);

      // ✅ 3) status snapshot (par page)
      await invalidatePageStatusDetails(qc, pageId);

      lg.info("update.ok", { pageId, nextSlug, fields });
      onSuccess?.();
    },

    onError: (e: unknown) => {
      notify.fromError(e, UiError.unexpectedSave);
      lg.error("update.failed", { msg: String(e) });
    },

    onSettled: () => {
      setUpdatingPageId(null);
    },

    retry: false,
  });

  const update = useCallback(
    async (pageId: string, baseline: PageFormValues, next: PageFormValues) => {
      if (mutation.isPending) return;

      const pageIdKey = String(pageId ?? "").trim();
      if (!pageIdKey) {
        notify.error(
          t("uiErrors.errorGeneric"),
          t(ERROR_CODES.PAGE_ID_REQUIRED),
        );
        lg.error("update.invalidPageId", { pageId });
        return;
      }

      if (updatingPageId === pageIdKey) return;

      const uiPatch = buildShallowDiff<PageFormValues>(baseline, next) ?? null;

      if (!uiPatch) {
        notifyNoChanges(
          t("notifications.noChanges.title"),
          t("notifications.noChanges.description", { entity: entityLabel }),
        );
        return;
      }

      const payload = toUpdatePageIntentDTOFromFormValues(uiPatch);
      const fields = Object.keys(payload ?? {});

      if (fields.length === 0) {
        notifyNoChanges(
          t("notifications.noChanges.title"),
          t("notifications.noChanges.description", { entity: entityLabel }),
        );
        return;
      }

      setUpdatingPageId(pageIdKey);

      await mutation.mutateAsync({
        pageId: pageIdKey,
        payload,
        fields,
      });
    },
    [mutation, updatingPageId, t, entityLabel],
  );

  return useMemo(
    () =>
      ({
        update,
        updatingPageId,
        isUpdating: mutation.isPending,
      }) as const,
    [update, updatingPageId, mutation.isPending],
  );
}

useUpdatePage.displayName = "useUpdatePage";
