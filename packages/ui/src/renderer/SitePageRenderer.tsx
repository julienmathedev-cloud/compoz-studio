/**
 * @file packages/ui/src/renderer/SitePageRenderer.tsx
 * @layer ui/renderer
 *
 * @description
 * Renders the public site page shell with either block content or direct children.
 *
 * @remarks
 * Receives resolved UI and link context props to stay SSR-compatible; the pager
 * is kept inside the flex shell so detail pages can stick it near the footer.
 */

import type { ReactNode } from "react";

import type { RichTextLinkContext } from "@compoz/ui/lib/links/rich-text-link-resolver";
import { cn } from "@compoz/ui/lib/utils";
import { BlocksRenderer } from "@compoz/ui/renderer/BlocksRenderer";
import type { SiteDetailPagerLink } from "@compoz/ui/site/components/molecules/SiteDetailPager";
import { SiteDetailPager } from "@compoz/ui/site/components/molecules/SiteDetailPager";
import type {
  SiteGlobalUi,
  SiteRevealPresetUi,
} from "@compoz/ui/site/site-ui.types";
import type { SiteRuntimeFeatures } from "@compoz/ui/site/skins/resolveSiteRuntimeFeatures";
import type { BlockShape } from "@compoz/validation/pages/blocks/block";

export type SitePageRendererProps = Readonly<{
  blocks?: ReadonlyArray<BlockShape>;
  children?: ReactNode;

  pager?: Readonly<{
    enabled: boolean;
    prev?: SiteDetailPagerLink | null;
    next?: SiteDetailPagerLink | null;
  }>;

  ui: SiteGlobalUi;
  revealUi: SiteRevealPresetUi;
  runtimeFeatures?: SiteRuntimeFeatures;

  /** Route-aware context used to resolve and normalize Rich Text anchors. */
  linkContext: RichTextLinkContext;
}>;

export function SitePageRenderer({
  blocks,
  children,
  pager,
  ui,
  revealUi,
  runtimeFeatures,
  linkContext,
}: SitePageRendererProps) {
  const isBlocksMode = children === undefined;
  const resolvedBlocks = blocks ?? [];

  const content = isBlocksMode ? (
    <BlocksRenderer
      blocks={resolvedBlocks}
      cellsUi={ui.cells}
      blockUi={ui.blockSection}
      revealUi={revealUi}
      runtimeFeatures={runtimeFeatures}
      linkContext={linkContext}
      variant="site"
    />
  ) : (
    children
  );

  return (
    <div className={cn("flex flex-1 flex-col")}>
      {content}

      {pager?.enabled ? (
        <SiteDetailPager
          prev={pager.prev ?? null}
          next={pager.next ?? null}
          ui={ui.pager}
        />
      ) : null}
    </div>
  );
}

SitePageRenderer.displayName = "SitePageRenderer";
