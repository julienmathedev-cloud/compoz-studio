/**
 * @file apps/studio/src/app/preview/pages/[slug]/page.tsx
 * @layer studio/app
 *
 * @description
 * Preview d’une page complète (V0.5) — reçoit baseline/override via postMessage.
 */

import { PagePreviewClient } from "@compoz/studio/app/preview/pages/[slug]/PagePreviewClient";
import { unwrapParams } from "@compoz/studio/lib/unwrap-params";

type PagePreviewPageProps = Readonly<{
  params: Promise<Readonly<{ slug: string }>>;
}>;

export default async function PagePreviewPage({
  params,
}: PagePreviewPageProps) {
  const { slug } = await unwrapParams(params);

  return <PagePreviewClient slug={String(slug ?? "").trim()} />;
}

PagePreviewPage.displayName = "PagePreviewPage";
