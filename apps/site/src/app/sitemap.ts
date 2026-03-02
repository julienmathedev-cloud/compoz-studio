/**
 * @file apps/site/src/app/sitemap.ts
 * @layer app/metadata
 *
 * @description
 * Route metadata `sitemap` (public) — génère le sitemap à partir de l’index publié.
 *
 * @remarks
 * - Next.js détecte ce fichier via son nom (`sitemap.ts`).
 * - Les URLs sont construites à partir du slug publié et de la base canonique.
 * - La date `lastModified` est dérivée de l’index (fallback: date courante).
 */

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { getSiteRepository } from "@compoz/infra/site";
import {
  canonicalFromBase,
  stripTrailingSlashes,
} from "@compoz/ui/lib/urls/formats";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteRepo = getSiteRepository();
  await siteRepo.ensureBase();

  const [index, settings] = await Promise.all([
    siteRepo.readIndex(CONTENT_STATE.PUBLISHED),
    siteRepo.readSettings(CONTENT_STATE.PUBLISHED),
  ]);

  const { pages, updatedAt } = index;

  const baseUrl =
    stripTrailingSlashes(settings?.seo?.baseUrl) ||
    stripTrailingSlashes(process.env["NEXT_PUBLIC_SITE_URL"]);

  const lastModified =
    updatedAt && !Number.isNaN(Date.parse(updatedAt))
      ? new Date(updatedAt)
      : new Date();

  return pages.map((ref) => {
    const path = ref.slug === "home" ? "" : ref.slug;

    const url = baseUrl
      ? (canonicalFromBase(baseUrl, path) ?? (path ? `/${path}` : "/"))
      : path
        ? `/${path}`
        : "/";

    return {
      url,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    };
  });
}
