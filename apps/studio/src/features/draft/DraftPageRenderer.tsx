/**
 * @file apps/studio/src/features/draft/DraftPageRenderer.tsx
 * @layer ui/studio/draft
 *
 * @description
 * Page de rendu pour le DRAFT (V0.5).
 */

"use client";

import { SitePageRenderer } from "@compoz/ui/renderer/SitePageRenderer";
import { useSiteUi } from "@compoz/ui/site/providers/SiteUiProvider";
import type { BlockShape } from "@compoz/validation/pages/blocks/block";
import type { SitePager } from "@compoz/ui/lib/app-helpers/site-pager";

type DraftPageRendererProps = Readonly<{
  blocks: ReadonlyArray<BlockShape>;
  pager?: SitePager | null;
}>;

export function DraftPageRenderer({ blocks, pager }: DraftPageRendererProps) {
  const ui = useSiteUi();

  return (
    <SitePageRenderer ui={ui} blocks={blocks} pager={pager ?? undefined} />
  );
}

DraftPageRenderer.displayName = "DraftPageRenderer";
