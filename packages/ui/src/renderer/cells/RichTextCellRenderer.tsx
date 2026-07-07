/**
 * @file packages/ui/src/renderer/cells/RichTextCellRenderer.tsx
 * @layer ui/renderer/cells
 *
 * @description
 * Renders a validated TipTap rich text HTML cell.
 *
 * @remarks
 * The renderer uses `dangerouslySetInnerHTML`; sanitization must happen upstream in the content pipeline or in a dedicated pass.
 */

import type { RichTextCellShape } from "@compoz/validation/pages/blocks/cells/cell";

import { cn } from "@compoz/ui/lib/utils";
import { SiteReveal } from "@compoz/ui/site/components/atoms/SiteReveal";
import type {
  SiteRevealPresetUi,
  SiteRichTextUi,
} from "@compoz/ui/site/site-ui.types";

export type RichTextCellRendererProps = Readonly<{
  cell?: RichTextCellShape | null;
  ui: SiteRichTextUi;
  revealUi: SiteRevealPresetUi;
}>;

export function RichTextCellRenderer({
  cell,
  ui,
  revealUi,
}: RichTextCellRendererProps) {
  if (!cell) return null;

  const html = typeof cell.content === "string" ? cell.content : "";
  if (!html) return null;

  const reveal = cell.reveal === true;

  const content = (
    <div
      className={cn(
        ui.root,
        "whitespace-pre-wrap [&_p:empty]:min-h-[1em] [&_p:empty]:my-1",
      )}
      data-reveal={reveal ? "true" : "false"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );

  return reveal ? (
    <SiteReveal revealUi={revealUi}>{content}</SiteReveal>
  ) : (
    content
  );
}

RichTextCellRenderer.displayName = "RichTextCellRenderer";
