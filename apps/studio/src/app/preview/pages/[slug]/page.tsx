/**
 * @file apps/studio/src/app/preview/pages/[slug]/page.tsx
 * @layer studio/app
 *
 * @description
 * Server route for previewing a full page inside the Studio preview iframe.
 */

import { PagePreviewClient } from "@compoz/studio/app/preview/pages/[slug]/PagePreviewClient";
import { getWebsiteId } from "@compoz/studio/lib/pages/draft-page-loaders";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";
import { STUDIO_PATH } from "@compoz/core/constants/web/paths";
import type { RichTextLinkContext } from "@compoz/ui/lib/links/rich-text-link-resolver";
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
  const normalizedSlug = String(slug ?? "").trim();
  const linkContext: RichTextLinkContext = {
    currentPath: `${STUDIO_PATH.preview}/pages/${encodeURIComponent(normalizedSlug)}`,
    internalBases: [],
  };

  return (
    <PagePreviewClient
      slug={normalizedSlug}
      runtimeFeatures={runtimeFeatures}
      linkContext={linkContext}
    />
  );
}

PagePreviewPage.displayName = "PagePreviewPage";
