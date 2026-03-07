/**
 * @file packages/infra/src/http/studio/tenant.client.ts
 * @layer infra/http/studio
 *
 * @description
 * Client HTTP Studio pour gérer le tenant actif (cookie httpOnly côté serveur).
 *
 * @remarks
 * Route actuelle sous segment "admin" (legacy) :
 * - POST /api/.../admin/tenant/active
 * Le mapping est centralisé via ENDPOINTS pour faciliter une migration ultérieure.
 */

import { ENDPOINTS } from "@compoz/infra/http/endpoints";

export type SetActiveTenantResponse = Readonly<{
  ok: boolean;
  tenantId: string;
  defaultTenantId?: string;
}>;

/**
 * @description
 * Certains endpoints Studio retournent `{ data: ... }` (wrapper),
 * d'autres retournent directement le payload. Ce helper unifie la lecture.
 */
function unwrapJsonOk<T>(json: unknown): T {
  if (json && typeof json === "object" && "data" in json) {
    const data = (json as { data?: unknown }).data;
    if (data && typeof data === "object") return data as T;
  }
  return json as T;
}

export async function setActiveTenant(
  tenantId: string,
  init?: { signal?: AbortSignal },
): Promise<SetActiveTenantResponse> {
  const res = await fetch(ENDPOINTS.STUDIO.TENANT.active, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ tenantId }),
    signal: init?.signal,
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }

  const json = await res.json();
  return unwrapJsonOk<SetActiveTenantResponse>(json);
}

export const tenantStudioApi = { setActiveTenant } as const;
