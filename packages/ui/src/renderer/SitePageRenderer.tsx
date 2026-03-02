/**
 * @file packages/ui/src/renderer/SitePageRenderer.tsx
 * @layer ui/renderer
 *
 * @description
 * Shell public : surface + H1 layout + blocks + pager.
 *
 * @remarks
 * - Le UI est résolu au niveau du shell (layout public / PreviewShell) et injecté via `PublicUiProvider`.
 * - Ici, on consomme le UI via `usePublicUi()` pour éviter le prop-drilling et garantir une source unique.
 */

import { cn } from "@compoz/ui/lib/utils";
import { BlocksRenderer } from "@compoz/ui/renderer/BlocksRenderer";
import { PublicHeading } from "@compoz/ui/site/components/atoms/PublicHeading";
import type { PublicDetailPagerLink } from "@compoz/ui/site/components/molecules/PublicDetailPager";
import { PublicDetailPager } from "@compoz/ui/site/components/molecules/PublicDetailPager";
import type { PublicGlobalUi } from "@compoz/ui/site/public-ui.types";
import type { BlockShape } from "@compoz/validation/pages/blocks/block";
import type { ReactNode } from "react";

export type SitePageRendererProps = Readonly<{
  /** Titre de page (sert au H1 layout). */
  pageTitle?: string;

  blocks?: ReadonlyArray<BlockShape>;
  children?: ReactNode;

  pager?: Readonly<{
    enabled: boolean;
    prev?: PublicDetailPagerLink | null;
    next?: PublicDetailPagerLink | null;
  }>;
  ui: PublicGlobalUi;
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
      variant="public"
    />
  ) : (
    children
  );

  const resolvedTitle = (pageTitle ?? "").trim();
  const showLayoutH1 = isBlocksMode && resolvedTitle.length > 0;

  return (
    <div className={cn(ui.body.surface)}>
      {showLayoutH1 ? (
        <PublicHeading level={1} className={cn(ui.body.pageHeading.h1)}>
          {resolvedTitle}
        </PublicHeading>
      ) : null}

      {content}

      {pager?.enabled ? (
        <PublicDetailPager
          prev={pager.prev ?? null}
          next={pager.next ?? null}
          ui={ui.pager}
        />
      ) : null}
    </div>
  );
}

SitePageRenderer.displayName = "SitePageRenderer";
