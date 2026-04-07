"use client";

/**
 * @file apps/site/src/lib/pages/SitePageRuntimeRenderer.tsx
 * @layer site/features/pages
 *
 * @description
 * Renderer client d’une page publique en s’appuyant sur le runtime global du site.
 */

import type { SitePager } from "@compoz/ui/lib/app-helpers/site-pager";
import { SitePageRenderer } from "@compoz/ui/renderer/SitePageRenderer";
import { useSiteUi } from "@compoz/ui/site/providers/SiteUiProvider";
import type { BlockShape } from "@compoz/validation/pages/blocks/block";

type SitePageRuntimeRendererProps = Readonly<{
  blocks: ReadonlyArray<BlockShape>;
  pager?: SitePager;
}>;

export function SitePageRuntimeRenderer({
  blocks,
  pager,
}: SitePageRuntimeRendererProps) {
  const ui = useSiteUi();

  return <SitePageRenderer ui={ui} blocks={blocks} pager={pager} />;
}

SitePageRuntimeRenderer.displayName = "SitePageRuntimeRenderer";
