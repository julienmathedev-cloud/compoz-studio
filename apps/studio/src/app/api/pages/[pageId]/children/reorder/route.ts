/**
 * @file apps/studio/src/app/api/pages/[pageId]/children/reorder/route.ts
 * @layer studio/app/api
 *
 * @description
 * Studio API route for reordering child pages in the draft page index.
 *
 * @remarks
 * - Reorders only pages whose `parentId` matches the route `pageId`.
 * - Persists Page positions through the Website-locked structure transaction.
 * - Invalidates Website-scoped status snapshots because order is publishable state.
 * - The repository is scoped by Prisma Website.id.
 */

import "server-only";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import { reorderPageChildren } from "@compoz/core/domain/pages/use-cases/reorder-page-children";
import { readJsonOr400 } from "@compoz/infra/http/read-json";
import type { ReorderChildrenResponse } from "@compoz/infra/http/studio/pages.types";
import { log, logSpan } from "@compoz/infra/lib/log";
import { getDraftPageStructureTransaction } from "@compoz/infra/pages";
import { getSiteStatusCache } from "@compoz/infra/site";
import { invalidateCommittedReorderStatus } from "@compoz/studio/app/api/pages/[pageId]/children/reorder/invalidate-reorder-status";
import { requireSessionWithWebsite } from "@compoz/studio/auth/require-session";
import { handleRoute } from "@compoz/studio/lib/api/handle-route";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";
import { parseDTOOrHttp } from "@compoz/validation/http/zod-to-http";
import { PageIdParamSchema } from "@compoz/validation/pages/page";
import {
  ReorderChildrenIntentSchema,
  type ReorderChildrenIntentDTO,
} from "@compoz/validation/pages/page-intents";

export async function POST(req: Request, ctx: { params: unknown }) {
  const NS = "api.studio.pages.children.reorder.POST" as const;

  return handleRoute(NS, req, async () => {
    const { websiteId } = await requireSessionWithWebsite();

    return logSpan(
      NS,
      { ns: NS, method: "POST", state: DEFAULT_CONTENT_STATE, websiteId },
      async () => {
        const logger = log.child({ ns: NS });

        const params = await unwrapParams(ctx.params);

        const { pageId } = parseDTOOrHttp(PageIdParamSchema, params, {
          message: EC.INVALID_ARGUMENT,
          extras: { where: "api.studio.pages.children.reorder.params" },
        });

        const body = await readJsonOr400(req);
        if (
          body === null ||
          typeof body !== "object" ||
          !("expectedDraftStructureRevision" in body)
        ) {
          throw new DomainError({ code: EC.REVISION_REQUIRED });
        }

        const dto: ReorderChildrenIntentDTO = parseDTOOrHttp(
          ReorderChildrenIntentSchema,
          body,
          {
            message: EC.VALIDATION_ERROR,
            extras: { where: "api.studio.pages.children.reorder.payload" },
          },
        );

        const structure = getDraftPageStructureTransaction({ websiteId });
        const statusCache = getSiteStatusCache({ websiteId });

        const run = reorderPageChildren({
          structure,
        });

        return invalidateCommittedReorderStatus({
          websiteId,
          statusCache,
          logger,
          commit: async (): Promise<ReorderChildrenResponse> => {
            const { index, draftStructureRevision, outcome } = await run({
              parentId: pageId,
              baselineOrder: dto.baselineOrder,
              localOrder: dto.localOrder,
              expectedDraftStructureRevision:
                dto.expectedDraftStructureRevision,
            });

            logger.debug(
              outcome === "updated"
                ? "route.children.reordered"
                : "route.children.reorder.noChanges",
              {
              websiteId,
              pageId,
              count: dto.localOrder.length,
              },
            );

            return { index, draftStructureRevision, outcome };
          },
        });
      },
    );
  });
}
