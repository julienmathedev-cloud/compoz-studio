/**
 * @file packages/infra/src/http/studio/site-settings.client.ts
 * @layer infra/http/studio
 * @description Studio HTTP client for centralized site settings endpoints.
 * @remarks
 * GET requests can target a content state; PATCH requests always write to the default draft state.
 */

import {
  DEFAULT_CONTENT_STATE,
  type ContentState,
} from "@compoz/core/constants/common/content-state";
import { ENDPOINTS } from "@compoz/infra/http/endpoints";
import {
  assertJsonResponse,
  withState,
  type HttpOpts,
} from "@compoz/infra/http/internal";
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
  GetThemeResponse,
  PatchFooterResponse,
  PatchHeaderResponse,
  PatchIdentityResponse,
  PatchLegalMenuResponse,
  PatchPrimaryMenuResponse,
  PatchSeoResponse,
  PatchSocialResponse,
  PatchThemeResponse,
} from "@compoz/infra/http/studio/site-settings.types";
import type { UpdateFooterSettingsIntentDTO } from "@compoz/validation/site/settings/footer/footer-intents";
import type { UpdateHeaderSettingsOCCIntentDTO } from "@compoz/validation/site/settings/header/header-intents";
import type { UpdateIdentitySettingsOCCIntentDTO } from "@compoz/validation/site/settings/identity/identity-intents";
import type { UpdateLegalMenuSettingsOCCIntentDTO } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu-intents";
import type { UpdatePrimaryMenuSettingsOCCIntentDTO } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu-intents";
import type { UpdateSeoSettingsOCCIntentDTO } from "@compoz/validation/site/settings/seo/seo-intents";
import type { UpdateSocialSettingsOCCIntentDTO } from "@compoz/validation/site/settings/social/social-intents";
import type { UpdateThemeSettingsOCCIntentDTO } from "@compoz/validation/site/settings/theme/theme-intents";

async function getResponse<TResponse>(
  endpoint: string,
  state: ContentState,
  opts: HttpOpts | undefined,
  ctx: string,
): Promise<TResponse> {
  const res = await apiFetch<TResponse>(withState(endpoint, state), {
    method: "GET",
    cache: "no-store",
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
    withState(endpoint, DEFAULT_CONTENT_STATE),
    {
      method: "PATCH",
      body: JSON.stringify(payload),
      ...(opts ?? {}),
    },
  );

  const json = await assertJsonResponse(res, ctx);

  return json;
}

export const settingsStudioApi = {
  bundle: {
    async get(
      state: ContentState = DEFAULT_CONTENT_STATE,
      opts?: HttpOpts,
    ): Promise<GetSettingsBundleResponse> {
      return logSpan(
        "compoz:studio:svc:site-settings",
        { endpoint: ENDPOINTS.STUDIO.SETTINGS.bundle, method: "GET", state },
        () =>
          getResponse<GetSettingsBundleResponse>(
            ENDPOINTS.STUDIO.SETTINGS.bundle,
            state,
            opts,
            "settingsStudioApi.bundle.get",
          ),
      );
    },
  },

  header: {
    async get(
      state: ContentState = DEFAULT_CONTENT_STATE,
      opts?: HttpOpts,
    ): Promise<GetHeaderResponse> {
      return logSpan(
        "compoz:studio:svc:site-settings",
        { endpoint: ENDPOINTS.STUDIO.SETTINGS.header, method: "GET", state },
        () =>
          getResponse<GetHeaderResponse>(
            ENDPOINTS.STUDIO.SETTINGS.header,
            state,
            opts,
            "settingsStudioApi.header.get",
          ),
      );
    },

    async patch(
      patch: UpdateHeaderSettingsOCCIntentDTO,
      opts?: HttpOpts,
    ): Promise<PatchHeaderResponse> {
      return logSpan(
        "compoz:studio:svc:site-settings",
        {
          endpoint: ENDPOINTS.STUDIO.SETTINGS.header,
          method: "PATCH",
          state: DEFAULT_CONTENT_STATE,
        },
        () =>
          patchResponse<PatchHeaderResponse, UpdateHeaderSettingsOCCIntentDTO>(
            ENDPOINTS.STUDIO.SETTINGS.header,
            patch,
            opts,
            "settingsStudioApi.header.patch",
          ),
      );
    },
  },

  footer: {
    async get(
      state: ContentState = DEFAULT_CONTENT_STATE,
      opts?: HttpOpts,
    ): Promise<GetFooterResponse> {
      return logSpan(
        "compoz:studio:svc:site-settings",
        { endpoint: ENDPOINTS.STUDIO.SETTINGS.footer, method: "GET", state },
        () =>
          getResponse<GetFooterResponse>(
            ENDPOINTS.STUDIO.SETTINGS.footer,
            state,
            opts,
            "settingsStudioApi.footer.get",
          ),
      );
    },

    async patch(
      patch: UpdateFooterSettingsIntentDTO,
      opts?: HttpOpts,
    ): Promise<PatchFooterResponse> {
      return logSpan(
        "compoz:studio:svc:site-settings",
        {
          endpoint: ENDPOINTS.STUDIO.SETTINGS.footer,
          method: "PATCH",
          state: DEFAULT_CONTENT_STATE,
        },
        () =>
          patchResponse<PatchFooterResponse, UpdateFooterSettingsIntentDTO>(
            ENDPOINTS.STUDIO.SETTINGS.footer,
            patch,
            opts,
            "settingsStudioApi.footer.patch",
          ),
      );
    },
  },

  identity: {
    async get(
      state: ContentState = DEFAULT_CONTENT_STATE,
      opts?: HttpOpts,
    ): Promise<GetIdentityResponse> {
      return logSpan(
        "compoz:studio:svc:site-settings",
        { endpoint: ENDPOINTS.STUDIO.SETTINGS.identity, method: "GET", state },
        () =>
          getResponse<GetIdentityResponse>(
            ENDPOINTS.STUDIO.SETTINGS.identity,
            state,
            opts,
            "settingsStudioApi.identity.get",
          ),
      );
    },

    async patch(
      patch: UpdateIdentitySettingsOCCIntentDTO,
      opts?: HttpOpts,
    ): Promise<PatchIdentityResponse> {
      return logSpan(
        "compoz:studio:svc:site-settings",
        {
          endpoint: ENDPOINTS.STUDIO.SETTINGS.identity,
          method: "PATCH",
          state: DEFAULT_CONTENT_STATE,
        },
        () =>
          patchResponse<PatchIdentityResponse, UpdateIdentitySettingsOCCIntentDTO>(
            ENDPOINTS.STUDIO.SETTINGS.identity,
            patch,
            opts,
            "settingsStudioApi.identity.patch",
          ),
      );
    },
  },

  legalMenu: {
    async get(
      state: ContentState = DEFAULT_CONTENT_STATE,
      opts?: HttpOpts,
    ): Promise<GetLegalMenuResponse> {
      return logSpan(
        "compoz:studio:svc:site-settings",
        { endpoint: ENDPOINTS.STUDIO.SETTINGS.legalMenu, method: "GET", state },
        () =>
          getResponse<GetLegalMenuResponse>(
            ENDPOINTS.STUDIO.SETTINGS.legalMenu,
            state,
            opts,
            "settingsStudioApi.legalMenu.get",
          ),
      );
    },

    async patch(
      patch: UpdateLegalMenuSettingsOCCIntentDTO,
      opts?: HttpOpts,
    ): Promise<PatchLegalMenuResponse> {
      return logSpan(
        "compoz:studio:svc:site-settings",
        {
          endpoint: ENDPOINTS.STUDIO.SETTINGS.legalMenu,
          method: "PATCH",
          state: DEFAULT_CONTENT_STATE,
        },
        () =>
          patchResponse<PatchLegalMenuResponse, UpdateLegalMenuSettingsOCCIntentDTO>(
            ENDPOINTS.STUDIO.SETTINGS.legalMenu,
            patch,
            opts,
            "settingsStudioApi.legalMenu.patch",
          ),
      );
    },
  },

  primaryMenu: {
    async get(
      state: ContentState = DEFAULT_CONTENT_STATE,
      opts?: HttpOpts,
    ): Promise<GetPrimaryMenuResponse> {
      return logSpan(
        "compoz:studio:svc:site-settings",
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
            "settingsStudioApi.primaryMenu.get",
          ),
      );
    },

    async patch(
      patch: UpdatePrimaryMenuSettingsOCCIntentDTO,
      opts?: HttpOpts,
    ): Promise<PatchPrimaryMenuResponse> {
      return logSpan(
        "compoz:studio:svc:site-settings",
        {
          endpoint: ENDPOINTS.STUDIO.SETTINGS.primaryMenu,
          method: "PATCH",
          state: DEFAULT_CONTENT_STATE,
        },
        () =>
          patchResponse<PatchPrimaryMenuResponse, UpdatePrimaryMenuSettingsOCCIntentDTO>(
            ENDPOINTS.STUDIO.SETTINGS.primaryMenu,
            patch,
            opts,
            "settingsStudioApi.primaryMenu.patch",
          ),
      );
    },
  },

  seo: {
    async get(
      state: ContentState = DEFAULT_CONTENT_STATE,
      opts?: HttpOpts,
    ): Promise<GetSeoResponse> {
      return logSpan(
        "compoz:studio:svc:site-settings",
        { endpoint: ENDPOINTS.STUDIO.SETTINGS.seo, method: "GET", state },
        () =>
          getResponse<GetSeoResponse>(
            ENDPOINTS.STUDIO.SETTINGS.seo,
            state,
            opts,
            "settingsStudioApi.seo.get",
          ),
      );
    },

    async patch(
      patch: UpdateSeoSettingsOCCIntentDTO,
      opts?: HttpOpts,
    ): Promise<PatchSeoResponse> {
      return logSpan(
        "compoz:studio:svc:site-settings",
        {
          endpoint: ENDPOINTS.STUDIO.SETTINGS.seo,
          method: "PATCH",
          state: DEFAULT_CONTENT_STATE,
        },
        () =>
          patchResponse<PatchSeoResponse, UpdateSeoSettingsOCCIntentDTO>(
            ENDPOINTS.STUDIO.SETTINGS.seo,
            patch,
            opts,
            "settingsStudioApi.seo.patch",
          ),
      );
    },
  },

  social: {
    async get(
      state: ContentState = DEFAULT_CONTENT_STATE,
      opts?: HttpOpts,
    ): Promise<GetSocialResponse> {
      return logSpan(
        "compoz:studio:svc:site-settings",
        { endpoint: ENDPOINTS.STUDIO.SETTINGS.social, method: "GET", state },
        () =>
          getResponse<GetSocialResponse>(
            ENDPOINTS.STUDIO.SETTINGS.social,
            state,
            opts,
            "settingsStudioApi.social.get",
          ),
      );
    },

    async patch(
      patch: UpdateSocialSettingsOCCIntentDTO,
      opts?: HttpOpts,
    ): Promise<PatchSocialResponse> {
      return logSpan(
        "compoz:studio:svc:site-settings",
        {
          endpoint: ENDPOINTS.STUDIO.SETTINGS.social,
          method: "PATCH",
          state: DEFAULT_CONTENT_STATE,
        },
        () =>
          patchResponse<PatchSocialResponse, UpdateSocialSettingsOCCIntentDTO>(
            ENDPOINTS.STUDIO.SETTINGS.social,
            patch,
            opts,
            "settingsStudioApi.social.patch",
          ),
      );
    },
  },

  theme: {
    async get(
      state: ContentState = DEFAULT_CONTENT_STATE,
      opts?: HttpOpts,
    ): Promise<GetThemeResponse> {
      return logSpan(
        "compoz:studio:svc:site-settings",
        { endpoint: ENDPOINTS.STUDIO.SETTINGS.theme, method: "GET", state },
        () =>
          getResponse<GetThemeResponse>(
            ENDPOINTS.STUDIO.SETTINGS.theme,
            state,
            opts,
            "settingsStudioApi.theme.get",
          ),
      );
    },

    async patch(
      patch: UpdateThemeSettingsOCCIntentDTO,
      opts?: HttpOpts,
    ): Promise<PatchThemeResponse> {
      return logSpan(
        "compoz:studio:svc:site-settings",
        {
          endpoint: ENDPOINTS.STUDIO.SETTINGS.theme,
          method: "PATCH",
          state: DEFAULT_CONTENT_STATE,
        },
        () =>
          patchResponse<PatchThemeResponse, UpdateThemeSettingsOCCIntentDTO>(
            ENDPOINTS.STUDIO.SETTINGS.theme,
            patch,
            opts,
            "settingsStudioApi.theme.patch",
          ),
      );
    },
  },
} as const;
