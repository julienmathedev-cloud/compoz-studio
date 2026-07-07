/**
 * @file packages/ui/src/lib/seo/metadata-helpers.ts
 * @layer ui/lib/seo
 * @description SEO metadata helpers for URL resolution and title template normalization.
 * @remarks
 * Best-effort helpers only; strong URL security validation belongs outside this module.
 */

function safeUrl(input: string | null | undefined): URL | undefined {
  const s = (input ?? "").trim();
  if (!s) return undefined;

  try {
    return new URL(s);
  } catch {
    return undefined;
  }
}

export function resolveAssetUrl(
  raw: string | null | undefined,
  metadataBase?: URL,
): string | undefined {
  const s = (raw ?? "").trim();
  if (!s) return undefined;

  const abs = safeUrl(s);
  if (abs) return abs.toString();

  if (metadataBase) {
    try {
      return new URL(s, metadataBase).toString();
    } catch {
      return s;
    }
  }

  return s;
}

export function ensureTitleTemplate(
  template: string,
  siteTitle: string,
): string {
  const t = template.trim();
  if (!t) return `%s — ${siteTitle}`;
  if (t.includes("%s")) return t;
  return `%s — ${siteTitle}`;
}

export function resolveIconHref(
  raw: string | null | undefined,
): string | undefined {
  const s = (raw ?? "").trim();
  if (!s) return undefined;

  const abs = safeUrl(s);
  if (abs) return abs.toString();

  if (s.startsWith("//")) return `https:${s}`;
  if (s.startsWith("/")) return s;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(s)) return `https://${s}`;

  return s;
}

export function toSafeUrl(input: string | null | undefined): URL | undefined {
  return safeUrl(input);
}
