/**
 * @file apps/site/src/app/t/[tenantId]/robots.ts
 * @layer app/metadata
 *
 * @description
 * Route metadata `robots` pour le fallback multi-tenant /t/:tenant.
 *
 * Règle : on force NOINDEX (fallback technique, pas une URL canonique).
 *
 * URL:
 *   /t/[tenantId]/robots.txt
 */

import "server-only";

import type { MetadataRoute } from "next";
import { unwrapParams } from "@compoz/site/lib/unwrap-params";

type Params = Readonly<{
  params: Promise<Readonly<{ tenantId: string }>>;
}>;

export default async function robots({
  params,
}: Params): Promise<MetadataRoute.Robots> {
  const { tenantId } = await unwrapParams(params);

  const t = String(tenantId ?? "")
    .trim()
    .toLowerCase();

  return {
    rules: [
      {
        userAgent: "*",
        disallow: "/",
      },
    ],
    // On pointe volontairement vers le sitemap fallback du tenant (utile en debug),
    // mais ça reste noindex/disallow.
    sitemap: t ? `/t/${t}/sitemap.xml` : undefined,
  };
}
