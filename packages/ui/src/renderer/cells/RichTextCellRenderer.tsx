/**
 * @file packages/ui/src/renderer/cells/RichTextCellRenderer.tsx
 * @layer ui/renderer/cells
 *
 * @description
 * Renders a validated TipTap rich text HTML cell.
 *
 * @remarks
 * The persisted HTML must be sanitized upstream. Before rendering, anchor
 * destinations and attributes are normalized from the active site link
 * context to support public, fallback, draft, preview, and legacy content.
 */

import type { RichTextCellShape } from "@compoz/validation/pages/blocks/cells/cell";

import type { RichTextLinkContext } from "@compoz/ui/lib/links/rich-text-link-resolver";
import { normalizeRichTextLinksHtml } from "@compoz/ui/lib/rich-text-links";
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
  linkContext: RichTextLinkContext;
}>;

export function RichTextCellRenderer({
  cell,
  ui,
  revealUi,
  linkContext,
}: RichTextCellRendererProps) {
  if (!cell) return null;

  const html = typeof cell.content === "string" ? cell.content : "";
  if (!html) return null;

  const normalizedHtml = normalizeRichTextLinksHtml({
    html,
    context: linkContext,
  });

  const reveal = cell.reveal === true;

  const content = (
    <div
      className={cn(
        ui.root,
        "whitespace-pre-wrap [&_p:empty]:min-h-[1em] [&_p:empty]:my-1",
      )}
      data-reveal={reveal ? "true" : "false"}
      dangerouslySetInnerHTML={{ __html: normalizedHtml }}
    />
  );

  return reveal ? (
    <SiteReveal revealUi={revealUi}>{content}</SiteReveal>
  ) : (
    content
  );
}

RichTextCellRenderer.displayName = "RichTextCellRenderer";
