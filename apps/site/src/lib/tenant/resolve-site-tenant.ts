/**
 * @file apps/site/src/lib/tenant/resolve-site-tenant.ts
 * @layer site/lib/tenant
 * @description
 * Résolution du tenant pour l'app Site (site public).
 *
 * Stratégies supportées :
 * - Dev : {tenant}.lvh.me -> tenant (ex: lola.lvh.me)
 * - Mapping explicite : COMPOZ_TENANT_BY_HOST_JSON["lola.com"] -> "lola"
 * - Fallback : COMPOZ_DEFAULT_TENANT_ID || "default"
 *
 * @remarks
 * - Sur *.vercel.app, on recommande le fallback /t/:tenant (pas de sous-domaines).
 * - Ce helper est "pur" (pas de Next import). Les callers fournissent host/headers.
 */

export type ResolveTenantResult =
  | { kind: "host"; tenantId: string; host: string }
  | { kind: "fallback"; tenantId: string; host: string };

function toLowerTrimmed(input: unknown): string {
  return String(input ?? "")
    .trim()
    .toLowerCase();
}

function normalizeHost(raw: string): string {
  const h = toLowerTrimmed(raw);
  if (!h) return "";

  // retire un éventuel port (ex: localhost:3001 -> localhost)
  const noPort = h.includes(":") ? h.split(":")[0] : h;

  // retire "www."
  return noPort.startsWith("www.") ? noPort.slice(4) : noPort;
}

function parseTenantByHostJson(
  raw: string | undefined,
): Record<string, string> {
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    const out: Record<string, string> = {};

    for (const [k, v] of Object.entries(parsed)) {
      const hk = normalizeHost(k);
      const tv = toLowerTrimmed(v);
      if (hk && tv) out[hk] = tv;
    }

    return out;
  } catch {
    return {};
  }
}

function tenantFromLvhMe(host: string): string | null {
  // foo.lvh.me -> foo
  if (!host.endsWith(".lvh.me")) return null;

  const parts = host.split(".");
  // ex: ["foo","lvh","me"]
  if (parts.length < 3) return null;

  const sub = toLowerTrimmed(parts[0]);
  return sub ? sub : null;
}

function isVercelHost(host: string): boolean {
  // Exemple: compoz-public.vercel.app
  return host.endsWith(".vercel.app");
}

export function resolveTenantFromHost(args: {
  hostRaw: string;
  defaultTenantId?: string;
  tenantByHostJson?: string;
}): ResolveTenantResult {
  const host = normalizeHost(args.hostRaw);

  const fallback =
    toLowerTrimmed(args.defaultTenantId ?? "default") || "default";

  // 1) Mapping explicite (prioritaire)
  const map = parseTenantByHostJson(args.tenantByHostJson);
  const mapped = host ? map[host] : "";
  if (mapped) {
    return { kind: "host", tenantId: mapped, host };
  }

  // 2) Dev lvh.me : tenant = sous-domaine
  const lvh = host ? tenantFromLvhMe(host) : null;
  if (lvh) {
    return { kind: "host", tenantId: lvh, host };
  }

  // 3) Sur Vercel, pas de sous-domaine tenant => on laisse le fallback.
  // (Le vrai tenant passera plutôt par /t/:tenant)
  if (host && isVercelHost(host)) {
    return { kind: "fallback", tenantId: fallback, host };
  }

  // 4) Fallback
  return { kind: "fallback", tenantId: fallback, host };
}
