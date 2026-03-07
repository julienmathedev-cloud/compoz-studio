/**
 * @file packages/ui/src/renderer/BlocksRenderer.tsx
 * @layer ui/renderer
 *
 * @description
 * Renderer site/preview : dispatcher de blocks (V0.5).
 *
 * @remarks
 * - Consomme des Shapes (frontière Zod) : `BlockShape`.
 * - Point d’entrée unique : évite de disperser des `switch` partout.
 * - Défensif : si block inconnu/incomplet → ignore (pas de crash).
 */

import type { ReactNode } from "react";

import { toStableUiKey } from "@compoz/ui/lib/keys/toStableUiKey";
import { LayoutSectionRenderer } from "@compoz/ui/renderer/LayoutSectionRenderer";
import type {
  SiteBlocksUi,
  SiteLayoutSectionUi,
} from "@compoz/ui/site/site-ui.types";
import type { BlockShape } from "@compoz/validation/pages/blocks/block";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type BlocksRendererProps = Readonly<{
  /** Blocks (ordre = ordre d’affichage). */
  blocks?: ReadonlyArray<BlockShape> | null;

  /** UI fine. */
  blocksUi: SiteBlocksUi;

  layoutUi: SiteLayoutSectionUi;

  /**
   * Variante de rendu (micro-différences éventuelles plus tard).
   *
   * @remarks
   * V0.5 : pas utilisé, mais prévu.
   */
  variant?: "site" | "preview";

  /** Classes additionnelles sur la `<div>`. */
  className?: string;
}>;

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function BlocksRenderer({
  blocks,
  blocksUi,
  layoutUi,
  variant = "site",
  className,
}: BlocksRendererProps) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div data-renderer="blocks" data-variant={variant} className={className}>
      {blocks.map((block, index) => {
        // Key stable : block.id est requis par schema.
        const key = toStableUiKey({ id: String(block.id) }, index);

        // Dispatch par type.
        switch (block.type) {
          case "layoutSection":
            return (
              <LayoutSectionRenderer
                key={key}
                block={block}
                variant={variant}
                layoutUi={layoutUi}
                blocksUi={blocksUi}
              />
            );

          default:
            return _renderUnknownBlock(block, index);
        }
      })}
    </div>
  );
}

BlocksRenderer.displayName = "BlocksRenderer";

/* -------------------------------------------------------------------------- */
/* Internals                                                                  */
/* -------------------------------------------------------------------------- */

function _renderUnknownBlock(block: BlockShape, index: number): ReactNode {
  // V0.5 : safe fallback minimal → ignore.
  // Si tu veux debugger : retourne un placeholder (attention prod).
  void block;
  void index;
  return null;
}
