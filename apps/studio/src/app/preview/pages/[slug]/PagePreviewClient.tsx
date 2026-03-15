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
 * - Preview : navigation/pager désactivés (pas de liens prev/next).
 * - Le rendu final est délégué à `SitePageRenderer` (UI site).
 */

import { useEffect, useMemo } from "react";

import type { PageSummaryDTO } from "@compoz/core/domain/pages/dto";
import type { SiteIndexDTO } from "@compoz/core/domain/site/dto";
import { log } from "@compoz/infra/lib/log";

import { SitePageRenderer } from "@compoz/ui/renderer/SitePageRenderer";
import { resolveSiteUi } from "@compoz/ui/site/skins/resolveSiteUi";

import { HOME_SLUG } from "@compoz/core/domain/slug/constants";
import { usePreviewOverride } from "@compoz/studio/features/preview/hooks/usePreviewOverride";
import { PreviewShell } from "@compoz/studio/features/preview/PreviewShell";
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
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

type PagePreviewClientProps = Readonly<{ slug: string }>;

export function PagePreviewClient({ slug }: PagePreviewClientProps) {
  const pageScope = useMemo(() => `page:${slug}`, [slug]);

  const siteIndex = usePreviewOverride<SiteIndexDTO>("siteIndex");
  const page = usePreviewOverride<PageRenderShape>(pageScope);

  const visibleIndex = siteIndex.baseline;
  const visiblePage = page.override ?? page.baseline;

  const blocks = visiblePage?.blocks ?? [];

  const currentFromIndex = useMemo<PageSummaryDTO | null>(() => {
    if (!visibleIndex) return null;

    // IMPORTANT :
    // - si slug = "home" => on accepte "" comme home
    // - sinon match strict
    const found = (visibleIndex.pages ?? []).find(
      (p) => p.slug === slug || (slug === HOME_SLUG && p.slug === ""),
    );

    return found ?? null;
  }, [slug, visibleIndex]);

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
      currentFromIndex,
    ],
  );

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      lg.debug("page.flags", flags);
    }
  }, [flags]);

  // Tant que l’index n’est pas là : gating strict OK (handshake)
  if (!visibleIndex) return null;

  // Index OK mais page introuvable ou pas de baseline envoyée
  if (!visiblePage || !currentFromIndex) return null;

  return (
    <PreviewShell>
      <SitePageRenderer ui={resolveSiteUi()} blocks={blocks} />
    </PreviewShell>
  );
}

PagePreviewClient.displayName = "PagePreviewClient";
