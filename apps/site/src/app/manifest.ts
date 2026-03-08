/**
 * @file apps/site/src/app/manifest.ts
 * @layer site/app
 *
 * @description
 * Web manifest dynamique du site public publié.
 *
 * @remarks
 * - Multi-tenant : résolu à partir des settings publiés du tenant courant.
 * - Utilise l’identité publiée (nom, favicon).
 * - Fournit un fallback safe si aucun settings publié n’est disponible.
 */

import type { MetadataRoute } from "next";

import { getPublishedSettings } from "@compoz/site/lib/pages/published-page-loaders";
import { resolveSiteBaseUrl } from "@compoz/site/lib/seo/resolveSiteBaseUrl";
import { resolveIconHref } from "@compoz/ui/lib/seo/metadata-helpers";

function buildManifestIcons(favicon: string): MetadataRoute.Manifest["icons"] {
  if (favicon.includes("-32.png")) {
    return [
      {
        src: favicon.replace("-32.png", "-192.png"),
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: favicon.replace("-32.png", "-512.png"),
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: favicon.replace("-32.png", "-180.png"),
        sizes: "180x180",
        type: "image/png",
      },
    ];
  }

  return [
    {
      src: favicon,
      sizes: "any",
      type: "image/png",
    },
  ];
}

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getPublishedSettings();

  if (!settings) {
    return {
      name: "Site",
      short_name: "Site",
      description: "Site web publié avec Compoz.",
      start_url: "/",
      scope: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#ffffff",
    };
  }

  const siteName = (settings.identity?.siteName ?? "").trim() || "Site";
  const description =
    (settings.seo?.defaultDescription ?? "").trim() ||
    `${siteName} — Site officiel.`;

  const favicon = resolveIconHref(settings.identity?.faviconUrl);
  const metadataBase = resolveSiteBaseUrl(settings.seo?.baseUrl);

  return {
    name: siteName,
    short_name: siteName,
    description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: favicon ? buildManifestIcons(favicon) : undefined,
    id: metadataBase ? metadataBase.toString() : "/",
  };
}
