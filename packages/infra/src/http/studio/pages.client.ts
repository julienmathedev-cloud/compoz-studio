/**
 * @file packages/infra/src/http/studio/pages.client.ts
 * @layer infra/http
 * @description
 * Client HTTP Admin pour la gestion des pages : index, CRUD et blocks.
 *
 * Responsabilités : construction des requêtes HTTP, encodage des segments,
 * gestion optionnelle de `state`, typage des réponses via DTOs domaine.
 */

import {
  WRITE_CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";
import type {
  CreatePageIntentDTO,
  UpdatePageIntentDTO,
} from "@compoz/validation/pages/page-intents";
import { ENDPOINTS } from "@compoz/infra/http/endpoints";
import {
  encodeSegment,
  withState,
  type HttpOpts,
} from "@compoz/infra/http/internal";
import { apiFetch } from "@compoz/infra/lib/api-fetch";

import type {
  CreatePageResponse,
  DeletePageResponse,
  GetPageByIdResponse,
  GetPagesIndexResponse,
  ReorderChildrenResponse,
  UpdatePageResponse,
} from "@compoz/infra/http/studio/pages.types";

import type {
  AddLayoutSectionBlockResponse,
  DeleteBlockResponse,
  ListPageBlocksResponse,
  ReorderBlocksResponse,
  UpdateLayoutSectionBlockResponse,
} from "@compoz/infra/http/studio/pages.types";

import type {
  CreateLayoutSectionBlockIntentDTO,
  ReorderBlocksIntentDTO,
  UpdateLayoutSectionBlockIntentDTO,
} from "@compoz/validation/pages/blocks/block-intents";
import { logSpan } from "@compoz/infra/lib/log";

function assertJsonResponse<T>(res: T | null, errorMessage: string): T {
  // Contract: this endpoint returns JSON on success.
  if (!res) {
    throw new Error(errorMessage);
  }
  return res;
}

/* -------------------------------------------------------------------------- */
/*                               Client HTTP Admin                            */
/* -------------------------------------------------------------------------- */

export const pagesAdminApi = {
  async getIndex(
    state: ContentState = WRITE_CONTENT_STATE,
    opts?: HttpOpts,
  ): Promise<GetPagesIndexResponse> {
    return logSpan(
      "infra.http.admin.pages.getIndex",
      { endpoint: ENDPOINTS.STUDIO.PAGES.base, method: "GET", state },
      async () => {
        const res = await apiFetch<GetPagesIndexResponse>(
          withState(ENDPOINTS.STUDIO.PAGES.base, state),
          { method: "GET", ...(opts ?? {}) },
        );

        return assertJsonResponse(
          res,
          "pagesAdminApi.getIndex: expected JSON response, received null.",
        );
      },
    );
  },

  async getById(
    pageId: string,
    state: ContentState = WRITE_CONTENT_STATE,
    opts?: HttpOpts,
  ): Promise<GetPageByIdResponse> {
    return logSpan(
      "infra.http.admin.pages.getById",
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
          "pagesAdminApi.getById: expected JSON response, received null.",
        );
      },
    );
  },

  /* ---------------------------------------------------------------------- */
  /* Blocks — by pageId                                                     */
  /* ---------------------------------------------------------------------- */

  async getPageBlocks(
    pageId: string,
    state: ContentState = WRITE_CONTENT_STATE,
    opts?: HttpOpts,
  ): Promise<ListPageBlocksResponse> {
    const encoded = encodeSegment(pageId);
    const url = ENDPOINTS.STUDIO.PAGES.blocksById(encoded);

    return logSpan(
      "infra.http.admin.pages.blocks.list",
      {
        endpoint: ENDPOINTS.STUDIO.PAGES.blocksById("<pageId>"),
        method: "GET",
        state,
      },
      async () => {
        const res = await apiFetch<ListPageBlocksResponse>(
          withState(url, state),
          { method: "GET", ...(opts ?? {}) },
        );

        return assertJsonResponse(
          res,
          "pagesAdminApi.getPageBlocks: expected JSON response, received null.",
        );
      },
    );
  },

  async addBlock(
    pageId: string,
    payload: CreateLayoutSectionBlockIntentDTO,
    opts?: HttpOpts,
  ): Promise<AddLayoutSectionBlockResponse> {
    const encoded = encodeSegment(pageId);
    const url = ENDPOINTS.STUDIO.PAGES.blocksById(encoded);

    return logSpan(
      "infra.http.admin.pages.blocks.add",
      {
        endpoint: ENDPOINTS.STUDIO.PAGES.blocksById("<pageId>"),
        method: "POST",
      },
      async () => {
        const res = await apiFetch<AddLayoutSectionBlockResponse>(url, {
          method: "POST",
          body: JSON.stringify(payload),
          ...(opts ?? {}),
        });

        return assertJsonResponse(
          res,
          "pagesAdminApi.addBlock: expected JSON response, received null.",
        );
      },
    );
  },

  async updateBlock(
    pageId: string,
    blockId: string,
    payload: UpdateLayoutSectionBlockIntentDTO,
    opts?: HttpOpts,
  ): Promise<UpdateLayoutSectionBlockResponse> {
    const encodedPageId = encodeSegment(pageId);
    const encodedBlockId = encodeSegment(blockId);
    const url = `${ENDPOINTS.STUDIO.PAGES.blocksById(
      encodedPageId,
    )}/${encodedBlockId}`;

    return logSpan(
      "infra.http.admin.pages.blocks.update",
      {
        endpoint: `${ENDPOINTS.STUDIO.PAGES.blocksById("<pageId>")}/<blockId>`,
        method: "PATCH",
      },
      async () => {
        const res = await apiFetch<UpdateLayoutSectionBlockResponse>(url, {
          method: "PATCH",
          body: JSON.stringify(payload),
          ...(opts ?? {}),
        });

        return assertJsonResponse(
          res,
          "pagesAdminApi.updateBlock: expected JSON response, received null.",
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
    const url = `${ENDPOINTS.STUDIO.PAGES.blocksById(
      encodedPageId,
    )}/${encodedBlockId}`;

    return logSpan(
      "infra.http.admin.pages.blocks.delete",
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
          "pagesAdminApi.deleteBlock: expected JSON response, received null.",
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
      "infra.http.admin.pages.blocks.reorder",
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
          "pagesAdminApi.reorderBlocks: expected JSON response, received null.",
        );
      },
    );
  },

  /* ---------------------------------------------------------------------- */
  /* Pages CRUD                                                              */
  /* ---------------------------------------------------------------------- */

  async create(
    payload: CreatePageIntentDTO,
    opts?: HttpOpts,
  ): Promise<CreatePageResponse> {
    return logSpan(
      "infra.http.admin.pages.create",
      { endpoint: ENDPOINTS.STUDIO.PAGES.base, method: "POST" },
      async () => {
        const res = await apiFetch<CreatePageResponse>(
          ENDPOINTS.STUDIO.PAGES.base,
          { method: "POST", body: JSON.stringify(payload), ...(opts ?? {}) },
        );

        return assertJsonResponse(
          res,
          "pagesAdminApi.create: expected JSON response, received null.",
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
      "infra.http.admin.pages.update",
      { endpoint: ENDPOINTS.STUDIO.PAGES.byId("<pageId>"), method: "PATCH" },
      async () => {
        const res = await apiFetch<UpdatePageResponse>(
          ENDPOINTS.STUDIO.PAGES.byId(encodeSegment(pageId)),
          { method: "PATCH", body: JSON.stringify(payload), ...(opts ?? {}) },
        );

        return assertJsonResponse(
          res,
          "pagesAdminApi.update: expected JSON response, received null.",
        );
      },
    );
  },

  async remove(pageId: string, opts?: HttpOpts): Promise<DeletePageResponse> {
    return logSpan(
      "infra.http.admin.pages.remove",
      { endpoint: ENDPOINTS.STUDIO.PAGES.byId("<pageId>"), method: "DELETE" },
      async () => {
        const res = await apiFetch<DeletePageResponse>(
          ENDPOINTS.STUDIO.PAGES.byId(encodeSegment(pageId)),
          { method: "DELETE", ...(opts ?? {}) },
        );

        return assertJsonResponse(
          res,
          "pagesAdminApi.remove: expected JSON response, received null.",
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
      "infra.http.admin.pages.reorderChildren",
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
          "pagesAdminApi.reorderChildren: expected JSON response, received null.",
        );
      },
    );
  },
};
