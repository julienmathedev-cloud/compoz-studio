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
import type { SiteDetailPagerLink } from "@compoz/ui/site/components/molecules/SiteDetailPager";
import { SiteDetailPager } from "@compoz/ui/site/components/molecules/SiteDetailPager";
import type { SiteGlobalUi } from "@compoz/ui/site/site-ui.types";
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
}>;

export function SitePageRenderer({
  blocks,
  children,
  pager,
  ui,
}: SitePageRendererProps) {
  const isBlocksMode = children === undefined;

  const b = blocks ?? [];

  const content = isBlocksMode ? (
    <BlocksRenderer
      blocks={b}
      cellsUi={ui.cells}
      blockUi={ui.blockSection}
      variant="site"
    />
  ) : (
    children
  );

  return (
    <div className={cn(ui.body.surface, "flex flex-1 flex-col")}>
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
