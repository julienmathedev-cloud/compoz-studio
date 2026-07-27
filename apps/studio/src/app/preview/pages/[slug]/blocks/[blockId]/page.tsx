/**
 * @file apps/studio/src/app/preview/pages/[slug]/blocks/[blockId]/page.tsx
 * @layer studio/app
 *
 * @description
 * Server route for previewing a single page block inside the Studio preview iframe.
 */

import { PageBlockPreviewClient } from "@compoz/studio/app/preview/pages/[slug]/blocks/[blockId]/PageBlockPreviewClient";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";
import { STUDIO_PATH } from "@compoz/core/constants/web/paths";
import type { RichTextLinkContext } from "@compoz/ui/lib/links/rich-text-link-resolver";

type PageBlockPreviewProps = Readonly<{
  params: Promise<
    Readonly<{
      slug: string;
      blockId: string;
    }>
  >;
}>;

export default async function PageBlockPreviewPage({
  params,
}: PageBlockPreviewProps) {
  const { slug, blockId } = await unwrapParams(params);
  const normalizedSlug = String(slug ?? "").trim();
  const normalizedBlockId = String(blockId ?? "").trim();
  const linkContext: RichTextLinkContext = {
    currentPath: `${STUDIO_PATH.preview}/pages/${encodeURIComponent(normalizedSlug)}/blocks/${encodeURIComponent(normalizedBlockId)}`,
    internalBases: [],
  };

  return (
    <PageBlockPreviewClient
      slug={normalizedSlug}
      blockId={normalizedBlockId}
      linkContext={linkContext}
    />
  );
}

PageBlockPreviewPage.displayName = "PageBlockPreviewPage";
