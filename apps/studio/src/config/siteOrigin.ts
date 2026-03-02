/**
 * @file apps/studio/src/config/siteOrigin.ts
 * @layer app/studio
 *
 * @description
 * Origine du site (ex: https://studio.compoz.studio).
 */

export function getPublicSiteOrigin() {
  const origin = process.env.NEXT_PUBLIC_SITE_ORIGIN;

  if (!origin) {
    // fallback dev “safe” (évite un crash si tu oublies la variable)
    return "http://localhost:3001";
  }

  return origin.replace(/\/$/, ""); // enlève le trailing slash
}
