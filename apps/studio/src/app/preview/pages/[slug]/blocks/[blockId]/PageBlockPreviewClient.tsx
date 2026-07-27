"use client";

/**
 * @file apps/studio/src/app/preview/pages/[slug]/blocks/[blockId]/PageBlockPreviewClient.tsx
 * @layer studio/app
 *
 * @description
 * Client-side preview for a single page block.
 *
 * @remarks
 * - Uses `usePreviewOverride` to resolve the block.
 * - Renders the block when visible, otherwise returns nothing because the empty state is handled by the preview wrapper.
 * - The UI skin is provided by `SiteUiProvider` mounted in `PreviewProviders`.
 * - The CSS theme is provided by `ThemeProvider` mounted in `PreviewProviders`.
 */

import { useMemo } from "react";

import { usePreviewOverride } from "@compoz/studio/features/preview/hooks/usePreviewOverride";
import type { RichTextLinkContext } from "@compoz/ui/lib/links/rich-text-link-resolver";
import { cn } from "@compoz/ui/lib/utils";
import { BlocksRenderer } from "@compoz/ui/renderer/BlocksRenderer";
import { useTheme } from "@compoz/ui/settings/theme/ThemeProvider";
import { useSiteUi } from "@compoz/ui/site/providers/SiteUiProvider";
import type { BlockShape } from "@compoz/validation/pages/blocks/block";

type PageBlockPreviewClientProps = Readonly<{
  slug: string;
  blockId: string;
  linkContext: RichTextLinkContext;
}>;

export function PageBlockPreviewClient({
  slug,
  blockId,
  linkContext,
}: PageBlockPreviewClientProps) {
  const scope = useMemo(() => `pageBlock:${slug}:${blockId}`, [slug, blockId]);

  const block = usePreviewOverride<BlockShape>(scope);
  const visible = block.override ?? block.baseline;
  const ui = useSiteUi();
  const theme = useTheme();
  const revealPreset = theme?.revealPreset ?? "fade-up";
  const revealUi = ui.reveal[revealPreset];

  if (!visible) return null;

  return (
    <div className={cn("h-dvh min-h-0 min-w-0 overflow-y-auto")}>
      <BlocksRenderer
        blocks={[visible]}
        cellsUi={ui.cells}
        blockUi={ui.blockSection}
        revealUi={revealUi}
        linkContext={linkContext}
      />
    </div>
  );
}

PageBlockPreviewClient.displayName = "PageBlockPreviewClient";
