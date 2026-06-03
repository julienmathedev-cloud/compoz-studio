"use client";

/**
 * @file apps/studio/src/app/preview/pages/[slug]/PagePreviewClient.tsx
 * @layer studio/app
 *
 * @description
 * Client preview d’une page complète (V0.5) — baseline/override via postMessage.
 *
 * @remarks
 * - Gating strict : ne rend rien tant que l’index et la page courante ne sont pas disponibles.
 * - Le rendu final est délégué à `SitePageRenderer`.
 * - Le skin UI est récupéré ici puis transmis au renderer en props.
 * - Le thème CSS est fourni par `ThemeProvider` monté dans `PreviewProviders`.
 * - Le pager est calculé via le helper partagé pour rester aligné
 *   avec le site public et les routes draft.
 */

import { useEffect, useMemo } from "react";

import type { PageSummaryDTO } from "@compoz/core/domain/pages/dto";
import type { SiteIndexDTO } from "@compoz/core/domain/site/dto";
import { HOME_SLUG } from "@compoz/core/domain/slug/constants";
import { log } from "@compoz/infra/lib/log";
import { PreviewShell } from "@compoz/studio/features/preview/PreviewShell";
import { usePreviewOverride } from "@compoz/studio/features/preview/hooks/usePreviewOverride";
import { computeSitePager } from "@compoz/ui/lib/app-helpers/site-pager";
import { toSlug } from "@compoz/ui/lib/routing/slug";
import { SitePageRenderer } from "@compoz/ui/renderer/SitePageRenderer";
import { useTheme } from "@compoz/ui/settings/theme/ThemeProvider";
import { useSiteUi } from "@compoz/ui/site/providers/SiteUiProvider";
import type { SiteRuntimeFeatures } from "@compoz/ui/site/skins/resolveSiteRuntimeFeatures";
import type { PageRenderShape } from "@compoz/validation/pages/page";

/* -------------------------------------------------------------------------- */
/* Logger                                                                     */
/* -------------------------------------------------------------------------- */

const lg = log.child({
  ns: "preview",
  area: "page",
  name: "PagePreviewClient",
});

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function hrefForDraftSlug(slug: string): string {
  const s = toSlug(slug);

  if (!s || s === HOME_SLUG) {
    return "/draft";
  }

  return `/draft/${encodeURIComponent(s)}`;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

type PagePreviewClientProps = Readonly<{
  slug: string;
  runtimeFeatures: SiteRuntimeFeatures;
}>;

export function PagePreviewClient({
  slug,
  runtimeFeatures,
}: PagePreviewClientProps) {
  const pageScope = useMemo(() => `page:${slug}`, [slug]);

  const siteIndex = usePreviewOverride<SiteIndexDTO>("siteIndex");
  const page = usePreviewOverride<PageRenderShape>(pageScope);

  const visibleIndex = siteIndex.baseline;
  const visiblePage = page.override ?? page.baseline;

  const blocks = visiblePage?.blocks ?? [];
  const ui = useSiteUi();
  const theme = useTheme();
  const revealPreset = theme?.revealPreset ?? "fade-up";
  const revealUi = ui.reveal[revealPreset];

  const currentFromIndex = useMemo<PageSummaryDTO | null>(() => {
    if (!visibleIndex) {
      return null;
    }

    const found = (visibleIndex.pages ?? []).find(
      (item) => item.slug === slug || (slug === HOME_SLUG && item.slug === ""),
    );

    return found ?? null;
  }, [slug, visibleIndex]);

  const pager = useMemo(() => {
    if (!visibleIndex || !visiblePage || !currentFromIndex) {
      return {
        enabled: false,
        prev: null,
        next: null,
      };
    }

    return computeSitePager({
      page: {
        id: currentFromIndex.id,
        parentId: currentFromIndex.parentId ?? null,
        slug: currentFromIndex.slug,
        name: currentFromIndex.name,
        paginationEnabled: Boolean(visiblePage.paginationEnabled),
      },
      index: visibleIndex,
      hrefForSlug: hrefForDraftSlug,
    });
  }, [visibleIndex, visiblePage, currentFromIndex]);

  const flags = useMemo(
    () => ({
      slug,
      siteIndex: { hasBaseline: Boolean(visibleIndex) },
      page: {
        hasBaseline: Boolean(page.baseline),
        hasOverride: Boolean(page.override),
        name: (visiblePage?.name ?? "").trim(),
        blocks: blocks.length,
        paginationEnabled: Boolean(visiblePage?.paginationEnabled),
      },
      pager: {
        enabled: pager.enabled,
        hasPrev: Boolean(pager.prev),
        hasNext: Boolean(pager.next),
      },
      fromIndex: { hasCurrent: Boolean(currentFromIndex) },
    }),
    [
      slug,
      visibleIndex,
      page.baseline,
      page.override,
      visiblePage?.name,
      visiblePage?.paginationEnabled,
      blocks.length,
      pager.enabled,
      pager.prev,
      pager.next,
      currentFromIndex,
    ],
  );

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      lg.debug("page.flags", flags);
    }
  }, [flags]);

  if (!visibleIndex) {
    return null;
  }

  if (!visiblePage || !currentFromIndex) {
    return null;
  }

  return (
    <PreviewShell ui={ui}>
      <SitePageRenderer
        ui={ui}
        blocks={blocks}
        pager={pager}
        revealUi={revealUi}
        runtimeFeatures={runtimeFeatures}
      />
    </PreviewShell>
  );
}

PagePreviewClient.displayName = "PagePreviewClient";
