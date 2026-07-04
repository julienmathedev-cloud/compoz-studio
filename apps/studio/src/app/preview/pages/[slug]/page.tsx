/**
 * @file apps/studio/src/app/preview/pages/[slug]/page.tsx
 * @layer studio/app
 *
 * @description
 * Preview d’une page complète (V0.5) — reçoit baseline/override via postMessage.
 */

import { PagePreviewClient } from "@compoz/studio/app/preview/pages/[slug]/PagePreviewClient";
import { getWebsiteId } from "@compoz/studio/lib/pages/draft-page-loaders";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";
import { resolveSiteRuntimeFeatures } from "@compoz/ui/site/skins/resolveSiteRuntimeFeatures";

type PagePreviewPageProps = Readonly<{
  params: Promise<Readonly<{ slug: string }>>;
}>;

export default async function PagePreviewPage({
  params,
}: PagePreviewPageProps) {
  const { slug } = await unwrapParams(params);
  const websiteId = await getWebsiteId();
  const runtimeFeatures = resolveSiteRuntimeFeatures(websiteId);

  return (
    <PagePreviewClient
      slug={String(slug ?? "").trim()}
      runtimeFeatures={runtimeFeatures}
    />
  );
}

PagePreviewPage.displayName = "PagePreviewPage";
