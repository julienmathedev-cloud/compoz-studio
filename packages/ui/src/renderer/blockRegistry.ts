/**
 * @file packages/ui/src/renderer/blockRegistry.ts
 * @layer ui/renderer
 *
 * @description
 * Registry mapping validated block kinds to their renderer components.
 */

import type { ComponentType } from "react";

import type { RichTextLinkContext } from "@compoz/ui/lib/links/rich-text-link-resolver";
import { SectionBlockRenderer } from "@compoz/ui/renderer/SectionBlockRenderer";

import type {
  SiteBlockSectionUi,
  SiteCellsUi,
  SiteRevealPresetUi,
} from "@compoz/ui/site/site-ui.types";
import type { SiteRuntimeFeatures } from "@compoz/ui/site/skins/resolveSiteRuntimeFeatures";
import type { BlockShape } from "@compoz/validation/pages/blocks/block";

export type BlockRenderer = ComponentType<{
  block: BlockShape;
  index?: number;
  variant?: "site" | "preview";
  blockUi: SiteBlockSectionUi;
  cellsUi: SiteCellsUi;
  revealUi: SiteRevealPresetUi;
  runtimeFeatures?: SiteRuntimeFeatures;
  linkContext: RichTextLinkContext;
}>;

export const blockRegistry: Record<string, BlockRenderer> = {
  section: SectionBlockRenderer,
};
