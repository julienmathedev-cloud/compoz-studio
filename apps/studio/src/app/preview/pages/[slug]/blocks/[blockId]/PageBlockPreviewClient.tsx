"use client";

/**
 * @file apps/studio/src/app/preview/pages/[slug]/blocks/[blockId]/PageBlockPreviewClient.tsx
 * @layer studio/app
 *
 * @description
 * Client de preview d’un block (V0.5).
 *
 * @remarks
 * - Couche client : utilise `usePreviewOverride` pour récupérer le block.
 * - Affiche le block si visible, sinon rien (empty géré par le wrapper preview).
 * - Le skin UI est fourni par `SiteUiProvider` monté dans `PreviewProviders`.
 * - Le thème CSS est fourni par `ThemeProvider` monté dans `PreviewProviders`.
 */

import { useMemo } from "react";

import { usePreviewOverride } from "@compoz/studio/features/preview/hooks/usePreviewOverride";
import type { BlockShape } from "@compoz/validation/pages/blocks/block";

import { BlocksRenderer } from "@compoz/ui/renderer/BlocksRenderer";
import { useSiteUi } from "@compoz/ui/site/providers/SiteUiProvider";

type PageBlockPreviewClientProps = Readonly<{
  slug: string;
  blockId: string;
}>;

export function PageBlockPreviewClient({
  slug,
  blockId,
}: PageBlockPreviewClientProps) {
  const scope = useMemo(() => `pageBlock:${slug}:${blockId}`, [slug, blockId]);

  const block = usePreviewOverride<BlockShape>(scope);
  const visible = block.override ?? block.baseline;
  const ui = useSiteUi();

  if (!visible) return null;

  return (
    <div className="h-dvh min-h-0 min-w-0 overflow-y-auto">
      <BlocksRenderer
        blocks={[visible]}
        cellsUi={ui.cells}
        blockUi={ui.blockSection}
      />
    </div>
  );
}

PageBlockPreviewClient.displayName = "PageBlockPreviewClient";
