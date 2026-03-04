/**
 * @file apps/site/src/app/t/[tenantId]/sitemap.ts
 */

import "server-only";

import type { MetadataRoute } from "next";
import { notFound } from "next/navigation";

import { CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import { getSiteRepository } from "@compoz/infra/site";
import {
  canonicalFromBase,
  stripTrailingSlashes,
} from "@compoz/ui/lib/urls/formats";
import { unwrapParams } from "@compoz/site/lib/unwrap-params";

type Params = Readonly<{
  params: Promise<Readonly<{ tenantId: string }>>;
}>;

export default async function sitemap({
  params,
}: Params): Promise<MetadataRoute.Sitemap> {
  const { tenantId } = await unwrapParams(params);

  const t = String(tenantId ?? "")
    .trim()
    .toLowerCase();
  if (!t) notFound();

  const repo = getSiteRepository({ tenantId: t });
  await repo.ensureBase();

  const [index, settings] = await Promise.all([
    repo.readIndex(CONTENT_STATE.PUBLISHED),
    repo.readSettings(CONTENT_STATE.PUBLISHED),
  ]);

  if (!index) notFound();

  const pages = index.pages ?? [];
  const updatedAt = index.updatedAt;

  const baseUrl =
    stripTrailingSlashes(settings?.seo?.baseUrl) ||
    stripTrailingSlashes(process.env["NEXT_PUBLIC_SITE_URL"]) ||
    "";

  const lastModified =
    updatedAt && !Number.isNaN(Date.parse(updatedAt))
      ? new Date(updatedAt)
      : new Date();

  return pages.map((ref) => {
    const path =
      ref.slug === "home"
        ? `/t/${t}`
        : `/t/${t}/${String(ref.slug ?? "").trim()}`;

    const url = baseUrl ? (canonicalFromBase(baseUrl, path) ?? path) : path;

    return {
      url,
      lastModified,
      changeFrequency: "weekly",
      priority: ref.slug === "home" ? 1 : 0.7,
    };
  });
}
