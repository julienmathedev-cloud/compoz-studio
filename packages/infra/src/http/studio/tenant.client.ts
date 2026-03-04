/**
 * @file packages/infra/src/http/studio/tenant.client.ts
 * @layer infra/http
 *
 * @description
 * Client HTTP Studio pour gérer le tenant actif (cookie httpOnly côté serveur).
 */
export type SetActiveTenantResponse = Readonly<{
  ok: boolean;
  tenantId: string;
  defaultTenantId?: string;
}>;

function unwrapJsonOk<T>(json: unknown): T {
  if (json && typeof json === "object" && "data" in json) {
    const data = (json as { data?: unknown }).data;
    console.log("unwrapJsonOk", data);
    if (data && typeof data === "object") return data as T;
  }
  return json as T;
}

export async function setActiveTenant(
  tenantId: string,
  init?: { signal?: AbortSignal },
): Promise<SetActiveTenantResponse> {
  const res = await fetch("/api/admin/tenant/active", {
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
  const payload = unwrapJsonOk<SetActiveTenantResponse>(json);
  return payload;
}

export const tenantAdminApi = { setActiveTenant } as const;
