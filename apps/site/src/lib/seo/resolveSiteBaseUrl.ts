/**
 * @file apps/site/src/lib/seo/resolveSiteBaseUrl.ts
 * @layer site/lib/seo
 *
 * @description
 * Résout une base URL “runtime” fiable pour le SEO du site.
 *
 * @remarks
 * Priorité :
 * 1) settings.seo.baseUrl (source de vérité du site publié)
 * 2) ENV explicite (NEXT_PUBLIC_SITE_URL)
 * 3) ENV Vercel (VERCEL_URL) => https://<vercel_url>
 * Sinon : null (pas de canonical absolu)
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
