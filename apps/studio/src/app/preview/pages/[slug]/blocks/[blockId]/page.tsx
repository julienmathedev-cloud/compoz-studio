/**
 * @file apps/studio/src/app/preview/pages/[slug]/blocks/[blockId]/page.tsx
 * @layer studio/app
 *
 * @description
 * Preview d’un block (V0.5) — reçoit baseline/override via postMessage.
 */

import { PageBlockPreviewClient } from "@compoz/studio/app/preview/pages/[slug]/blocks/[blockId]/PageBlockPreviewClient";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";

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

  return (
    <PageBlockPreviewClient
      slug={String(slug ?? "").trim()}
      blockId={String(blockId ?? "").trim()}
    />
  );
}

PageBlockPreviewPage.displayName = "PageBlockPreviewPage";
