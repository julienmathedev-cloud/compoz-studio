"use client";
/**
 * @file apps/studio/src/app/preview/pages/[slug]/PagePreviewClient.tsx
 * @layer app/preview/pages
 */

import { useEffect, useMemo } from "react";
import type { PageSummaryDTO } from "@compoz/core/domain/pages/dto";
import type { SiteIndexDTO } from "@compoz/core/domain/site/dto";
import { log } from "@compoz/infra/lib/log";
import { SitePageRenderer } from "@compoz/ui/renderer/SitePageRenderer";
import { resolvePublicUi } from "@compoz/ui/site/skins/resolvePublicUi";
import type { PageRenderShape } from "@compoz/validation/pages/page";
import { usePreviewOverride } from "@compoz/studio/features/preview/hooks/usePreviewOverride";
import { PreviewShell } from "@compoz/studio/features/preview/PreviewShell";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function __hrefForSlug(slug: string) {
  if (slug === "home" || slug === "") return "/site";
  return `/site/${slug}`;
}

function __computePager(args: {
  page: { id: string; parentId: string | null; paginationEnabled?: boolean };
  index: SiteIndexDTO;
}) {
  const { page, index } = args;

  const enabled = Boolean(page.paginationEnabled);
  if (!enabled) return { enabled: false, prev: null, next: null };

  const siblings = (index.pages ?? []).filter(
    (p) => p.parentId === page.parentId,
  );

  if (siblings.length <= 1) return { enabled: true, prev: null, next: null };

  const i = siblings.findIndex((p) => p.id === page.id);
  if (i < 0) return { enabled: true, prev: null, next: null };

  const prev = i > 0 ? siblings[i - 1] : null;
  const next = i < siblings.length - 1 ? siblings[i + 1] : null;

  return {
    enabled: true,
    prev: prev ? { href: __hrefForSlug(prev.slug), label: prev.title } : null,
    next: next ? { href: __hrefForSlug(next.slug), label: next.title } : null,
  };
}

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
      (p) => p.slug === slug || (slug === "home" && p.slug === ""),
    );

    return found ?? null;
  }, [slug, visibleIndex]);

  const pager = useMemo(() => {
    if (!visibleIndex) return { enabled: false, prev: null, next: null };
    if (!visiblePage) return { enabled: false, prev: null, next: null };
    if (!currentFromIndex) return { enabled: false, prev: null, next: null };

    return __computePager({
      page: {
        id: currentFromIndex.id,
        parentId: currentFromIndex.parentId,
        paginationEnabled: Boolean(visiblePage.paginationEnabled),
      },
      index: visibleIndex,
    });
  }, [visibleIndex, visiblePage, currentFromIndex]);

  const flags = useMemo(
    () => ({
      slug,
      siteIndex: { hasBaseline: Boolean(visibleIndex) },
      page: {
        hasBaseline: Boolean(page.baseline),
        hasOverride: Boolean(page.override),
        title: (visiblePage?.title ?? "").trim(),
        blocks: blocks.length,
        paginationEnabled: Boolean(visiblePage?.paginationEnabled),
      },
      fromIndex: { hasCurrent: Boolean(currentFromIndex) },
      pager: {
        enabled: Boolean(pager?.enabled),
        hasPrev: Boolean(pager?.prev),
        hasNext: Boolean(pager?.next),
      },
    }),
    [
      slug,
      visibleIndex,
      page.baseline,
      page.override,
      visiblePage?.title,
      visiblePage?.paginationEnabled,
      blocks.length,
      currentFromIndex,
      pager,
    ],
  );

  useEffect(() => {
    log.debug("[preview][page.flags]", flags);
  }, [flags]);

  // 1) Tant que l’index n’est pas là : gating strict OK (handshake)
  if (!visibleIndex) return null;

  // 2) Index OK mais page introuvable ou pas de baseline envoyée
  if (!visiblePage || !currentFromIndex) {
    return null;
  }

  // 4) OK : rendu normal
  return (
    <PreviewShell>
      <SitePageRenderer
        ui={resolvePublicUi()}
        pageTitle={visiblePage.title}
        blocks={blocks}
        pager={pager}
      />
    </PreviewShell>
  );
}

PagePreviewClient.displayName = "PagePreviewClient";
