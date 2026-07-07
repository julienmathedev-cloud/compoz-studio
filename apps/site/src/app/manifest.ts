/**
 * @file apps/site/src/app/manifest.ts
 * @layer site/app
 *
 * @description
 * Dynamic web app manifest for host-based public sites.
 *
 * @remarks
 * - Resolves the active Website from the request host through Prisma WebsiteDomain.
 * - Loads published settings with Prisma Website.id.
 * - Falls back to a neutral Compoz manifest when the host cannot be resolved.
 */

import type { MetadataRoute } from "next";
import { headers } from "next/headers";

import { resolvePublicWebsiteFromHost } from "@compoz/infra/websites/resolve-public-website";
import { getPublishedSettingsByWebsiteId } from "@compoz/site/lib/pages/published-page-loaders";
import { resolveIconHref } from "@compoz/ui/lib/seo/metadata-helpers";

/** Builds installable manifest icons when the favicon follows the generated size naming convention. */
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

/** Returns a safe manifest when no public Website can be resolved from the host. */
function buildFallbackManifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Compoz",
    short_name: "Compoz",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [],
  };
}

/** Resolves the Prisma Website.id from the current request host. */
async function resolveWebsiteIdFromRequest(): Promise<string | null> {
  try {
    const headersList = await headers();

    const hostRaw =
      headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "";

    const website = await resolvePublicWebsiteFromHost({ hostRaw });
    return website?.websiteId ?? null;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[site] failed to resolve manifest website", error);
    }

    return null;
  }
}

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const websiteId = await resolveWebsiteIdFromRequest();

  if (!websiteId) {
    return buildFallbackManifest();
  }

  const settings = await getPublishedSettingsByWebsiteId(websiteId);

  if (!settings) {
    return {
      id: "/",
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

  return {
    id: "/",
    name: siteName,
    short_name: siteName,
    description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: favicon ? buildManifestIcons(favicon) : undefined,
  };
}
