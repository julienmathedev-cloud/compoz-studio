/**
 * @file packages/infra/src/http/studio/pages.client.ts
 * @layer infra/http/studio
 * @description Studio HTTP client for pages, page index, and page blocks.
 * @remarks
 * Request paths are encoded at the HTTP boundary, and optional content state is forwarded as a query parameter.
 */

import {
  DEFAULT_CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";
import type {
  CreateSectionBlockIntentDTO,
  ReorderBlocksIntentDTO,
  UpdateSectionBlockIntentDTO,
} from "@compoz/validation/pages/blocks/block-intents";
import type {
  CreatePageIntentDTO,
  UpdatePageIntentDTO,
} from "@compoz/validation/pages/page-intents";

import { ENDPOINTS } from "@compoz/infra/http/endpoints";
import {
  assertJsonResponse,
  encodeSegment,
  withState,
  type HttpOpts,
} from "@compoz/infra/http/internal";
import { apiFetch } from "@compoz/infra/lib/api-fetch";
import { logSpan } from "@compoz/infra/lib/log";

import type {
  AddSectionBlockResponse,
  CreatePageResponse,
  DeleteBlockResponse,
  DeletePageResponse,
  GetPageByIdResponse,
  GetPagesIndexResponse,
  ListPageBlocksResponse,
  ReorderBlocksResponse,
  ReorderChildrenResponse,
  UpdateSectionBlockResponse,
  UpdatePageResponse,
} from "@compoz/infra/http/studio/pages.types";

export const pagesStudioApi = {
  async getIndex(
    state: ContentState = DEFAULT_CONTENT_STATE,
    opts?: HttpOpts,
  ): Promise<GetPagesIndexResponse> {
    return logSpan(
      "compoz:studio:svc:pages",
      { endpoint: ENDPOINTS.STUDIO.PAGES.base, method: "GET", state },
      async () => {
        const res = await apiFetch<GetPagesIndexResponse>(
          withState(ENDPOINTS.STUDIO.PAGES.base, state),
          { method: "GET", ...(opts ?? {}) },
        );

        return assertJsonResponse(
          res,
          "pagesStudioApi.getIndex: expected JSON response, received null.",
        );
      },
    );
  },

  async getById(
    pageId: string,
    state: ContentState = DEFAULT_CONTENT_STATE,
    opts?: HttpOpts,
  ): Promise<GetPageByIdResponse> {
    return logSpan(
      "compoz:studio:svc:pages",
      {
        endpoint: ENDPOINTS.STUDIO.PAGES.byId("<pageId>"),
        method: "GET",
        state,
      },
      async () => {
        const res = await apiFetch<GetPageByIdResponse>(
          withState(ENDPOINTS.STUDIO.PAGES.byId(encodeSegment(pageId)), state),
          { method: "GET", ...(opts ?? {}) },
        );

        return assertJsonResponse(
          res,
          "pagesStudioApi.getById: expected JSON response, received null.",
        );
      },
    );
  },

  async getPageBlocks(
    pageId: string,
    state: ContentState = DEFAULT_CONTENT_STATE,
    opts?: HttpOpts,
  ): Promise<ListPageBlocksResponse> {
    const encoded = encodeSegment(pageId);
    const url = ENDPOINTS.STUDIO.PAGES.blocksById(encoded);

    return logSpan(
      "compoz:studio:svc:pages-blocks",
      {
        endpoint: ENDPOINTS.STUDIO.PAGES.blocksById("<pageId>"),
        method: "GET",
        state,
      },
      async () => {
        const res = await apiFetch<ListPageBlocksResponse>(
          withState(url, state),
          {
            method: "GET",
            ...(opts ?? {}),
          },
        );

        return assertJsonResponse(
          res,
          "pagesStudioApi.getPageBlocks: expected JSON response, received null.",
        );
      },
    );
  },

  async addBlock(
    pageId: string,
    payload: CreateSectionBlockIntentDTO,
    opts?: HttpOpts,
  ): Promise<AddSectionBlockResponse> {
    const encoded = encodeSegment(pageId);
    const url = ENDPOINTS.STUDIO.PAGES.blocksById(encoded);

    return logSpan(
      "compoz:studio:svc:pages-blocks",
      {
        endpoint: ENDPOINTS.STUDIO.PAGES.blocksById("<pageId>"),
        method: "POST",
      },
      async () => {
        const res = await apiFetch<AddSectionBlockResponse>(url, {
          method: "POST",
          body: JSON.stringify(payload),
          ...(opts ?? {}),
        });

        return assertJsonResponse(
          res,
          "pagesStudioApi.addBlock: expected JSON response, received null.",
        );
      },
    );
  },

  async updateBlock(
    pageId: string,
    blockId: string,
    payload: UpdateSectionBlockIntentDTO,
    opts?: HttpOpts,
  ): Promise<UpdateSectionBlockResponse> {
    const encodedPageId = encodeSegment(pageId);
    const encodedBlockId = encodeSegment(blockId);
    const url = `${ENDPOINTS.STUDIO.PAGES.blocksById(encodedPageId)}/${encodedBlockId}`;

    return logSpan(
      "compoz:studio:svc:pages-blocks",
      {
        endpoint: `${ENDPOINTS.STUDIO.PAGES.blocksById("<pageId>")}/<blockId>`,
        method: "PATCH",
      },
      async () => {
        const res = await apiFetch<UpdateSectionBlockResponse>(url, {
          method: "PATCH",
          body: JSON.stringify(payload),
          ...(opts ?? {}),
        });

        return assertJsonResponse(
          res,
          "pagesStudioApi.updateBlock: expected JSON response, received null.",
        );
      },
    );
  },

  async deleteBlock(
    pageId: string,
    blockId: string,
    opts?: HttpOpts,
  ): Promise<DeleteBlockResponse> {
    const encodedPageId = encodeSegment(pageId);
    const encodedBlockId = encodeSegment(blockId);
    const url = `${ENDPOINTS.STUDIO.PAGES.blocksById(encodedPageId)}/${encodedBlockId}`;

    return logSpan(
      "compoz:studio:svc:pages-blocks",
      {
        endpoint: `${ENDPOINTS.STUDIO.PAGES.blocksById("<pageId>")}/<blockId>`,
        method: "DELETE",
      },
      async () => {
        const res = await apiFetch<DeleteBlockResponse>(url, {
          method: "DELETE",
          ...(opts ?? {}),
        });

        return assertJsonResponse(
          res,
          "pagesStudioApi.deleteBlock: expected JSON response, received null.",
        );
      },
    );
  },

  async reorderBlocks(
    pageId: string,
    payload: ReorderBlocksIntentDTO,
    opts?: HttpOpts,
  ): Promise<ReorderBlocksResponse> {
    const encoded = encodeSegment(pageId);
    const url = `${ENDPOINTS.STUDIO.PAGES.blocksById(encoded)}/reorder`;

    return logSpan(
      "compoz:studio:svc:pages-blocks",
      {
        endpoint: `${ENDPOINTS.STUDIO.PAGES.blocksById("<pageId>")}/reorder`,
        method: "POST",
      },
      async () => {
        const res = await apiFetch<ReorderBlocksResponse>(url, {
          method: "POST",
          body: JSON.stringify(payload),
          ...(opts ?? {}),
        });

        return assertJsonResponse(
          res,
          "pagesStudioApi.reorderBlocks: expected JSON response, received null.",
        );
      },
    );
  },

  async create(
    payload: CreatePageIntentDTO,
    opts?: HttpOpts,
  ): Promise<CreatePageResponse> {
    return logSpan(
      "compoz:studio:svc:pages",
      { endpoint: ENDPOINTS.STUDIO.PAGES.base, method: "POST" },
      async () => {
        const res = await apiFetch<CreatePageResponse>(
          ENDPOINTS.STUDIO.PAGES.base,
          {
            method: "POST",
            body: JSON.stringify(payload),
            ...(opts ?? {}),
          },
        );

        return assertJsonResponse(
          res,
          "pagesStudioApi.create: expected JSON response, received null.",
        );
      },
    );
  },

  async update(
    pageId: string,
    payload: UpdatePageIntentDTO,
    opts?: HttpOpts,
  ): Promise<UpdatePageResponse> {
    return logSpan(
      "compoz:studio:svc:pages",
      { endpoint: ENDPOINTS.STUDIO.PAGES.byId("<pageId>"), method: "PATCH" },
      async () => {
        const res = await apiFetch<UpdatePageResponse>(
          ENDPOINTS.STUDIO.PAGES.byId(encodeSegment(pageId)),
          { method: "PATCH", body: JSON.stringify(payload), ...(opts ?? {}) },
        );

        return assertJsonResponse(
          res,
          "pagesStudioApi.update: expected JSON response, received null.",
        );
      },
    );
  },

  async remove(pageId: string, opts?: HttpOpts): Promise<DeletePageResponse> {
    return logSpan(
      "compoz:studio:svc:pages",
      { endpoint: ENDPOINTS.STUDIO.PAGES.byId("<pageId>"), method: "DELETE" },
      async () => {
        const res = await apiFetch<DeletePageResponse>(
          ENDPOINTS.STUDIO.PAGES.byId(encodeSegment(pageId)),
          { method: "DELETE", ...(opts ?? {}) },
        );

        return assertJsonResponse(
          res,
          "pagesStudioApi.remove: expected JSON response, received null.",
        );
      },
    );
  },

  async reorderChildren(
    parentId: string,
    childIds: string[],
    opts?: HttpOpts,
  ): Promise<ReorderChildrenResponse> {
    const url = `${ENDPOINTS.STUDIO.PAGES.byId(
      encodeSegment(parentId),
    )}/children/reorder`;

    return logSpan(
      "compoz:studio:svc:pages",
      {
        endpoint: `${ENDPOINTS.STUDIO.PAGES.byId("<pageId>")}/children/reorder`,
        method: "POST",
      },
      async () => {
        const res = await apiFetch<ReorderChildrenResponse>(url, {
          method: "POST",
          body: JSON.stringify({ childIds }),
          ...(opts ?? {}),
        });

        return assertJsonResponse(
          res,
          "pagesStudioApi.reorderChildren: expected JSON response, received null.",
        );
      },
    );
  },
};
