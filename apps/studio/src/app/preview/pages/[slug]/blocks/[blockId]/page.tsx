/**
 * @file apps/studio/src/app/preview/pages/[slug]/blocks/[blockId]/page.tsx
 * @layer app/preview
 *
 * @description
 * Preview d’un block (V0.5) — reçoit baseline/override via postMessage.
 */

import { PageBlockPreviewClient } from "@compoz/studio/app/preview/pages/[slug]/blocks/[blockId]/PageBlockPreviewClient";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";

type PageBlockPreviewProps = Readonly<{
  params: Promise<{
    slug: string;
    blockId: string;
  }>;
}>;

export default async function PageBlockPreviewPage({
  params,
}: PageBlockPreviewProps) {
  const { slug, blockId } = await unwrapParams(params);
  return <PageBlockPreviewClient slug={slug} blockId={blockId} />;
}

PageBlockPreviewPage.displayName = "PageBlockPreviewPage";
