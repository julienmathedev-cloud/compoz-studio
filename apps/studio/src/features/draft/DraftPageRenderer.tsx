"use client";

/**
 * @file apps/studio/src/features/draft/DraftPageRenderer.tsx
 * @layer studio/features/draft
 *
 * @description
 * Client draft page renderer used by Studio preview routes.
 *
 * @remarks
 * - Reuses the public `SitePageRenderer` with the active Studio site UI skin.
 * - Resolves reveal UI from the current theme preset before rendering blocks.
 * - Converts a nullable draft pager to the optional pager expected by the shared renderer.
 */

import type { SitePager } from "@compoz/ui/lib/app-helpers/site-pager";
import { SitePageRenderer } from "@compoz/ui/renderer/SitePageRenderer";
import { useTheme } from "@compoz/ui/settings/theme/ThemeProvider";
import { useSiteUi } from "@compoz/ui/site/providers/SiteUiProvider";
import type { SiteRuntimeFeatures } from "@compoz/ui/site/skins/resolveSiteRuntimeFeatures";
import type { BlockShape } from "@compoz/validation/pages/blocks/block";

type DraftPageRendererProps = Readonly<{
  blocks: ReadonlyArray<BlockShape>;
  pager?: SitePager | null;
  runtimeFeatures?: SiteRuntimeFeatures;
}>;

export function DraftPageRenderer({
  blocks,
  pager,
  runtimeFeatures,
}: DraftPageRendererProps) {
  const ui = useSiteUi();
  const theme = useTheme();
  const revealPreset = theme?.revealPreset ?? "fade-up";
  const revealUi = ui.reveal[revealPreset];

  return (
    <SitePageRenderer
      ui={ui}
      blocks={blocks}
      pager={pager ?? undefined}
      revealUi={revealUi}
      runtimeFeatures={runtimeFeatures}
    />
  );
}

DraftPageRenderer.displayName = "DraftPageRenderer";
