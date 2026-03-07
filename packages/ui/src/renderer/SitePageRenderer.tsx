/**
 * @file packages/ui/src/renderer/SitePageRenderer.tsx
 * @layer ui/renderer
 *
 * @description
 * Shell site public : surface + H1 layout + blocks + pager.
 *
 * @remarks
 * - Le UI est résolu au niveau du shell (layout site / preview shell) et injecté via le provider site.
 * - Ici, on consomme le UI via `ui` (props) pour éviter le prop-drilling en cascade.
 */

import type { ReactNode } from "react";

import { cn } from "@compoz/ui/lib/utils";
import { BlocksRenderer } from "@compoz/ui/renderer/BlocksRenderer";
import { SiteHeading } from "@compoz/ui/site/components/atoms/SiteHeading";
import type { SiteDetailPagerLink } from "@compoz/ui/site/components/molecules/SiteDetailPager";
import { SiteDetailPager } from "@compoz/ui/site/components/molecules/SiteDetailPager";
import type { SiteGlobalUi } from "@compoz/ui/site/site-ui.types";
import type { BlockShape } from "@compoz/validation/pages/blocks/block";

export type SitePageRendererProps = Readonly<{
  /** Titre de page (sert au H1 layout). */
  pageTitle?: string;

  blocks?: ReadonlyArray<BlockShape>;
  children?: ReactNode;

  pager?: Readonly<{
    enabled: boolean;
    prev?: SiteDetailPagerLink | null;
    next?: SiteDetailPagerLink | null;
  }>;

  ui: SiteGlobalUi;
}>;

function isFullBleedBlock(block: BlockShape | undefined) {
  if (!block) return false;
  if (block.type !== "layoutSection") return false; // V0.5 : seul type
  return block.containerMode === "fullBleed";
}

export function SitePageRenderer({
  pageTitle,
  blocks,
  children,
  pager,
  ui,
}: SitePageRendererProps) {
  const isBlocksMode = children === undefined;

  const b = blocks ?? [];

  const firstIsFull = isBlocksMode && isFullBleedBlock(b[0]);
  const lastIsFull = isBlocksMode && isFullBleedBlock(b[b.length - 1]);

  // ⚠️ Important : pas de px/max-w ici (sinon tu casses le fullBleed)
  const paddingClass = cn(
    // padding “page” conditionnel (ok)
    firstIsFull ? "pt-0" : ui.body.paddingTop,
    lastIsFull ? "pb-0" : ui.body.paddingBottom,
  );

  const content = isBlocksMode ? (
    <BlocksRenderer
      blocks={b}
      blocksUi={ui.blocks}
      layoutUi={ui.layoutSection}
      className={cn(ui.body.spacing, paddingClass)}
      variant="site"
    />
  ) : (
    children
  );

  const resolvedTitle = (pageTitle ?? "").trim();
  const showLayoutH1 = isBlocksMode && resolvedTitle.length > 0;

  return (
    <div className={cn(ui.body.surface)}>
      {showLayoutH1 ? (
        <SiteHeading level={1} className={cn(ui.body.pageHeading.h1)}>
          {resolvedTitle}
        </SiteHeading>
      ) : null}

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
