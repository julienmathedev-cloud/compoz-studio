/**
 * @file apps/site/src/lib/seo/resolvePublicBaseUrl.ts
 * @layer lib/seo
 *
 * Résout une base URL “runtime” fiable pour le SEO public.
 * Priorité :
 * 1) ENV explicite (NEXT_PUBLIC_SITE_URL)
 * 2) ENV Vercel (VERCEL_URL) => https://<vercel_url>
 * 3) settings.seo.baseUrl
 * Sinon : null (pas de canonical absolu)
 */

export function resolvePublicBaseUrl(
  settingsBaseUrl?: string | null,
): URL | null {
  const envSiteUrl = String(process.env.NEXT_PUBLIC_SITE_URL ?? "").trim();
  const vercelUrl = String(process.env.VERCEL_URL ?? "").trim();
  const fromSettings = String(settingsBaseUrl ?? "").trim();

  const pick =
    envSiteUrl || (vercelUrl ? `https://${vercelUrl}` : "") || fromSettings;

  if (!pick) return null;

  try {
    return new URL(pick);
  } catch {
    // Défensif : si ENV mal formée, on préfère “pas de baseUrl” plutôt que canonicals faux
    return null;
  }
}
