/**
 * @file apps/site/src/lib/seo/resolveSiteBaseUrl.ts
 * @layer site/lib/seo
 *
 * @description
 * Resolves the runtime base URL used by public site SEO metadata.
 *
 * @remarks
 * Resolution priority:
 * 1) `settings.seo.baseUrl`, the published site's source of truth.
 * 2) `NEXT_PUBLIC_SITE_URL`, when configured explicitly.
 * 3) `VERCEL_URL`, normalized to `https://<vercel_url>`.
 * Returns `null` when no reliable absolute canonical base URL is available.
 */

export function resolveSiteBaseUrl(
  settingsBaseUrl?: string | null,
): URL | null {
  const fromSettings = String(settingsBaseUrl ?? "").trim();
  const envSiteUrl = String(process.env.NEXT_PUBLIC_SITE_URL ?? "").trim();
  const vercelUrl = String(process.env.VERCEL_URL ?? "").trim();

  const pick =
    fromSettings || envSiteUrl || (vercelUrl ? `https://${vercelUrl}` : "");

  if (!pick) return null;

  try {
    return new URL(pick);
  } catch {
    return null;
  }
}
