/**
 * @file packages/ui/src/renderer/BlocksRenderer.tsx
 * @layer ui/renderer
 *
 * @description
 * Dispatches validated page blocks to their registered renderer components.
 *
 * @remarks
 * Unknown or incomplete blocks are ignored to keep public rendering resilient.
 */

import type { ReactNode } from "react";

import { blockRegistry } from "@compoz/ui/renderer/blockRegistry";
import type {
  SiteBlockSectionUi,
  SiteCellsUi,
  SiteRevealPresetUi,
} from "@compoz/ui/site/site-ui.types";
import type { SiteRuntimeFeatures } from "@compoz/ui/site/skins/resolveSiteRuntimeFeatures";
import type { BlockShape } from "@compoz/validation/pages/blocks/block";

export type BlocksRendererProps = Readonly<{
  blocks?: ReadonlyArray<BlockShape> | null;
  cellsUi: SiteCellsUi;
  blockUi: SiteBlockSectionUi;
  revealUi: SiteRevealPresetUi;
  runtimeFeatures?: SiteRuntimeFeatures;
  variant?: "site" | "preview";
  className?: string;
}>;

export function BlocksRenderer({
  blocks,
  cellsUi,
  blockUi,
  revealUi,
  runtimeFeatures,
  variant = "site",
  className,
}: BlocksRendererProps) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div data-renderer="blocks" data-variant={variant} className={className}>
      {blocks.map((block, index) => {
        const Renderer = blockRegistry[block.type];

        if (!Renderer) {
          return _renderUnknownBlock(block, index);
        }

        return (
          <Renderer
            key={block.id}
            block={block}
            index={index}
            variant={variant}
            blockUi={blockUi}
            cellsUi={cellsUi}
            revealUi={revealUi}
            runtimeFeatures={runtimeFeatures}
          />
        );
      })}
    </div>
  );
}

BlocksRenderer.displayName = "BlocksRenderer";

function _renderUnknownBlock(block: BlockShape, index: number): ReactNode {
  void block;
  void index;
  return null;
}
