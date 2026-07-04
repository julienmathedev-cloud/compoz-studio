/**
 * @file packages/infra/src/http/studio/website.client.ts
 * @layer infra/http/studio
 *
 * @description
 * Client HTTP Studio pour gérer le Website actif, via cookie httpOnly côté serveur.
 *
 * @remarks
 * Route actuelle sous segment "admin" :
 * - POST /api/.../admin/website/active
 *
 * Le mapping est centralisé via ENDPOINTS.
 */

import { ENDPOINTS } from "@compoz/infra/http/endpoints";

export type SetActiveWebsiteResponse = Readonly<{
  ok: boolean;
  websiteId: string;
  defaultWebsiteId?: string;
}>;

/**
 * @description
 * Certains endpoints Studio retournent `{ data: ... }`, d’autres retournent
 * directement le payload. Ce helper unifie la lecture.
 */
function unwrapJsonOk<T>(json: unknown): T {
  if (json && typeof json === "object" && "data" in json) {
    const data = (json as { data?: unknown }).data;

    if (data && typeof data === "object") {
      return data as T;
    }
  }

  return json as T;
}

export async function setActiveWebsite(
  websiteId: string,
  init?: { signal?: AbortSignal },
): Promise<SetActiveWebsiteResponse> {
  const res = await fetch(ENDPOINTS.STUDIO.WEBSITE.active, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ websiteId }),
    signal: init?.signal,
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");

    throw new Error(text || `HTTP ${res.status}`);
  }

  const json = await res.json();

  return unwrapJsonOk<SetActiveWebsiteResponse>(json);
}

export const websiteStudioApi = { setActiveWebsite } as const;
