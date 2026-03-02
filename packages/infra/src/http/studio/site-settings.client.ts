/**
 * @file packages/infra/src/http/studio/site-settings.client.ts
 * @layer infra/http
 * @description
 * Client HTTP Admin pour la gestion centralisée des réglages du site :
 * header, footer, menus, identity, social et SEO.
 *
 * @remarks
 * - Client HTTP pur (infra-only)
 * - Utilise les DTO SoT définis dans `site-settings.types.ts`
 * - Aucune dépendance vers app/api/... ni vers UI
 */

import {
  WRITE_CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";

import { ENDPOINTS } from "@compoz/infra/http/endpoints";
import type { HttpOpts } from "@compoz/infra/http/internal";
import { apiFetch } from "@compoz/infra/lib/api-fetch";
import { logSpan } from "@compoz/infra/lib/log";

import type {
  GetFooterResponse,
  GetHeaderResponse,
  GetIdentityResponse,
  GetLegalMenuResponse,
  GetPrimaryMenuResponse,
  GetSeoResponse,
  GetSettingsBundleResponse,
  GetSocialResponse,
  PatchFooterResponse,
  PatchHeaderResponse,
  PatchIdentityResponse,
  PatchLegalMenuResponse,
  PatchPrimaryMenuResponse,
  PatchSeoResponse,
  PatchSocialResponse,
} from "@compoz/infra/http/studio/site-settings.types";

/* -------------------------------------------------------------------------- */
/*                             Helpers internes                               */
/* -------------------------------------------------------------------------- */

function assertJsonResponse<T>(res: T | null, ctx: string): T {
  if (!res) {
    throw new Error(`${ctx}: expected JSON response, received null.`);
  }
  return res;
}

function withState(endpoint: string, state: ContentState): string {
  if (state === WRITE_CONTENT_STATE) return endpoint;
  const sep = endpoint.includes("?") ? "&" : "?";
  return `${endpoint}${sep}state=${state}`;
}

async function getResponse<TResponse>(
  endpoint: string,
  state: ContentState,
  opts: HttpOpts | undefined,
  ctx: string,
): Promise<TResponse> {
  const res = await apiFetch<TResponse>(withState(endpoint, state), {
    method: "GET",
    ...(opts ?? {}),
  });

  return assertJsonResponse(res, ctx);
}

async function patchResponse<TResponse, TPayload>(
  endpoint: string,
  payload: TPayload,
  opts: HttpOpts | undefined,
  ctx: string,
): Promise<TResponse> {
  const res = await apiFetch<TResponse>(
    withState(endpoint, WRITE_CONTENT_STATE),
    {
      method: "PATCH",
      body: JSON.stringify(payload),
      ...(opts ?? {}),
    },
  );

  return assertJsonResponse(res, ctx);
}

/* -------------------------------------------------------------------------- */
/*                               Client HTTP                                  */
/* -------------------------------------------------------------------------- */

export const settingsAdminApi = {
  bundle: {
    async get(
      state: ContentState = WRITE_CONTENT_STATE,
      opts?: HttpOpts,
    ): Promise<GetSettingsBundleResponse> {
      return logSpan(
        "infra.http.admin.settings.bundle.get",
        {
          endpoint: ENDPOINTS.STUDIO.SETTINGS.bundle,
          method: "GET",
          state,
        },
        () =>
          getResponse<GetSettingsBundleResponse>(
            ENDPOINTS.STUDIO.SETTINGS.bundle,
            state,
            opts,
            "settingsAdminApi.bundle.get",
          ),
      );
    },
  },

  header: {
    async get(
      state: ContentState = WRITE_CONTENT_STATE,
      opts?: HttpOpts,
    ): Promise<GetHeaderResponse> {
      return logSpan(
        "infra.http.admin.settings.header.get",
        { endpoint: ENDPOINTS.STUDIO.SETTINGS.header, method: "GET", state },
        () =>
          getResponse<GetHeaderResponse>(
            ENDPOINTS.STUDIO.SETTINGS.header,
            state,
            opts,
            "settingsAdminApi.header.get",
          ),
      );
    },

    async patch<TPatch extends object>(
      patch: TPatch,
      opts?: HttpOpts,
    ): Promise<PatchHeaderResponse> {
      return logSpan(
        "infra.http.admin.settings.header.patch",
        {
          endpoint: ENDPOINTS.STUDIO.SETTINGS.header,
          method: "PATCH",
          state: WRITE_CONTENT_STATE,
        },
        () =>
          patchResponse<PatchHeaderResponse, TPatch>(
            ENDPOINTS.STUDIO.SETTINGS.header,
            patch,
            opts,
            "settingsAdminApi.header.patch",
          ),
      );
    },
  },

  footer: {
    async get(
      state: ContentState = WRITE_CONTENT_STATE,
      opts?: HttpOpts,
    ): Promise<GetFooterResponse> {
      return logSpan(
        "infra.http.admin.settings.footer.get",
        { endpoint: ENDPOINTS.STUDIO.SETTINGS.footer, method: "GET", state },
        () =>
          getResponse<GetFooterResponse>(
            ENDPOINTS.STUDIO.SETTINGS.footer,
            state,
            opts,
            "settingsAdminApi.footer.get",
          ),
      );
    },

    async patch<TPatch extends object>(
      patch: TPatch,
      opts?: HttpOpts,
    ): Promise<PatchFooterResponse> {
      return logSpan(
        "infra.http.admin.settings.footer.patch",
        {
          endpoint: ENDPOINTS.STUDIO.SETTINGS.footer,
          method: "PATCH",
          state: WRITE_CONTENT_STATE,
        },
        () =>
          patchResponse<PatchFooterResponse, TPatch>(
            ENDPOINTS.STUDIO.SETTINGS.footer,
            patch,
            opts,
            "settingsAdminApi.footer.patch",
          ),
      );
    },
  },

  identity: {
    async get(
      state: ContentState = WRITE_CONTENT_STATE,
      opts?: HttpOpts,
    ): Promise<GetIdentityResponse> {
      return logSpan(
        "infra.http.admin.settings.identity.get",
        { endpoint: ENDPOINTS.STUDIO.SETTINGS.identity, method: "GET", state },
        () =>
          getResponse<GetIdentityResponse>(
            ENDPOINTS.STUDIO.SETTINGS.identity,
            state,
            opts,
            "settingsAdminApi.identity.get",
          ),
      );
    },

    async patch<TPatch extends object>(
      patch: TPatch,
      opts?: HttpOpts,
    ): Promise<PatchIdentityResponse> {
      return logSpan(
        "infra.http.admin.settings.identity.patch",
        {
          endpoint: ENDPOINTS.STUDIO.SETTINGS.identity,
          method: "PATCH",
          state: WRITE_CONTENT_STATE,
        },
        () =>
          patchResponse<PatchIdentityResponse, TPatch>(
            ENDPOINTS.STUDIO.SETTINGS.identity,
            patch,
            opts,
            "settingsAdminApi.identity.patch",
          ),
      );
    },
  },

  legalMenu: {
    async get(
      state: ContentState = WRITE_CONTENT_STATE,
      opts?: HttpOpts,
    ): Promise<GetLegalMenuResponse> {
      return logSpan(
        "infra.http.admin.settings.legalMenu.get",
        { endpoint: ENDPOINTS.STUDIO.SETTINGS.legalMenu, method: "GET", state },
        () =>
          getResponse<GetLegalMenuResponse>(
            ENDPOINTS.STUDIO.SETTINGS.legalMenu,
            state,
            opts,
            "settingsAdminApi.legalMenu.get",
          ),
      );
    },

    async patch<TPatch extends object>(
      patch: TPatch,
      opts?: HttpOpts,
    ): Promise<PatchLegalMenuResponse> {
      return logSpan(
        "infra.http.admin.settings.legalMenu.patch",
        {
          endpoint: ENDPOINTS.STUDIO.SETTINGS.legalMenu,
          method: "PATCH",
          state: WRITE_CONTENT_STATE,
        },
        () =>
          patchResponse<PatchLegalMenuResponse, TPatch>(
            ENDPOINTS.STUDIO.SETTINGS.legalMenu,
            patch,
            opts,
            "settingsAdminApi.legalMenu.patch",
          ),
      );
    },
  },

  primaryMenu: {
    async get(
      state: ContentState = WRITE_CONTENT_STATE,
      opts?: HttpOpts,
    ): Promise<GetPrimaryMenuResponse> {
      return logSpan(
        "infra.http.admin.settings.primaryMenu.get",
        {
          endpoint: ENDPOINTS.STUDIO.SETTINGS.primaryMenu,
          method: "GET",
          state,
        },
        () =>
          getResponse<GetPrimaryMenuResponse>(
            ENDPOINTS.STUDIO.SETTINGS.primaryMenu,
            state,
            opts,
            "settingsAdminApi.primaryMenu.get",
          ),
      );
    },

    async patch<TPatch extends object>(
      patch: TPatch,
      opts?: HttpOpts,
    ): Promise<PatchPrimaryMenuResponse> {
      return logSpan(
        "infra.http.admin.settings.primaryMenu.patch",
        {
          endpoint: ENDPOINTS.STUDIO.SETTINGS.primaryMenu,
          method: "PATCH",
          state: WRITE_CONTENT_STATE,
        },
        () =>
          patchResponse<PatchPrimaryMenuResponse, TPatch>(
            ENDPOINTS.STUDIO.SETTINGS.primaryMenu,
            patch,
            opts,
            "settingsAdminApi.primaryMenu.patch",
          ),
      );
    },
  },

  seo: {
    async get(
      state: ContentState = WRITE_CONTENT_STATE,
      opts?: HttpOpts,
    ): Promise<GetSeoResponse> {
      return logSpan(
        "infra.http.admin.settings.seo.get",
        { endpoint: ENDPOINTS.STUDIO.SETTINGS.seo, method: "GET", state },
        () =>
          getResponse<GetSeoResponse>(
            ENDPOINTS.STUDIO.SETTINGS.seo,
            state,
            opts,
            "settingsAdminApi.seo.get",
          ),
      );
    },

    async patch<TPatch extends object>(
      patch: TPatch,
      opts?: HttpOpts,
    ): Promise<PatchSeoResponse> {
      return logSpan(
        "infra.http.admin.settings.seo.patch",
        {
          endpoint: ENDPOINTS.STUDIO.SETTINGS.seo,
          method: "PATCH",
          state: WRITE_CONTENT_STATE,
        },
        () =>
          patchResponse<PatchSeoResponse, TPatch>(
            ENDPOINTS.STUDIO.SETTINGS.seo,
            patch,
            opts,
            "settingsAdminApi.seo.patch",
          ),
      );
    },
  },

  social: {
    async get(
      state: ContentState = WRITE_CONTENT_STATE,
      opts?: HttpOpts,
    ): Promise<GetSocialResponse> {
      return logSpan(
        "infra.http.admin.settings.social.get",
        { endpoint: ENDPOINTS.STUDIO.SETTINGS.social, method: "GET", state },
        () =>
          getResponse<GetSocialResponse>(
            ENDPOINTS.STUDIO.SETTINGS.social,
            state,
            opts,
            "settingsAdminApi.social.get",
          ),
      );
    },

    async patch<TPatch extends object>(
      patch: TPatch,
      opts?: HttpOpts,
    ): Promise<PatchSocialResponse> {
      return logSpan(
        "infra.http.admin.settings.social.patch",
        {
          endpoint: ENDPOINTS.STUDIO.SETTINGS.social,
          method: "PATCH",
          state: WRITE_CONTENT_STATE,
        },
        () =>
          patchResponse<PatchSocialResponse, TPatch>(
            ENDPOINTS.STUDIO.SETTINGS.social,
            patch,
            opts,
            "settingsAdminApi.social.patch",
          ),
      );
    },
  },
} as const;
