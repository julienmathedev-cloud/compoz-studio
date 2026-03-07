/**
 * @file apps/studio/src/config/siteOrigin.ts
 * @layer studio/config
 *
 * @description
 * Origine du site (ex: https://studio.compoz.studio).
 */

export function getSiteOrigin(): string {
  const origin = process.env.NEXT_PUBLIC_SITE_ORIGIN;

  if (!origin) {
    // fallback dev “safe” (évite un crash si la variable est absente)
    return "http://localhost:3001";
  }

  // supprime les trailing slashes éventuels
  return origin.replace(/\/+$/, "");
}
