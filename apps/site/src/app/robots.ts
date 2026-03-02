/**
 * @file apps/site/src/app/robots.ts
 * @layer app/metadata
 *
 * @description
 * Route metadata `robots` (public) — directives d’indexation + lien sitemap.
 *
 * @remarks
 * - Next.js détecte ce fichier via son nom (`robots.ts`).
 * - Les directives sont dérivées des settings SEO publiés.
 */

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { getSiteRepository } from "@compoz/infra/site";
import {
  canonicalFromBase,
  stripTrailingSlashes,
} from "@compoz/ui/lib/urls/formats";
import type { MetadataRoute } from "next";

/**
 * Indique si un token (ex: `noindex`) est présent dans une chaîne robots.
 */
function hasToken(s: string | undefined, token: string): boolean {
  return !!s
    ?.toLowerCase()
    .split(",")
    .map((t) => t.trim())
    .includes(token.toLowerCase());
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const repo = getSiteRepository();
  const settings = await repo.readSettings(CONTENT_STATE.PUBLISHED);

  const robotsStr = settings.seo?.robots;
  const baseUrl = stripTrailingSlashes(settings.seo?.baseUrl);

  const disallowAll = hasToken(robotsStr, "noindex");

  return {
    rules: [
      {
        userAgent: "*",
        allow: disallowAll ? undefined : "/",
        disallow: disallowAll ? "/" : undefined,
      },
    ],
    host: baseUrl || undefined,
    sitemap: baseUrl ? canonicalFromBase(baseUrl, "sitemap.xml") : undefined,
  };
}
