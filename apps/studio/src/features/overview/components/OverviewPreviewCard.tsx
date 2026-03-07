"use client";

/**
 * @file apps/studio/src/features/overview/components/OverviewPreviewCard.tsx
 * @layer ui/studio/overview
 *
 * @description
 * Carte de preview “overview” : affiche la page Home dans l’iframe preview.
 * Injecte les baselines settings + la baseline `page:home` via handshake `ready`.
 *
 * @remarks
 * - Utilise `useStudioPreview` pour piloter l’iframe et le bridge preview.
 * - Injecte chaque baseline via `useStudioPreviewBaselineScope` pour éviter la duplication d’effet.
 * - La preview Home dépend du shell public (`header`, `identity`, `primaryMenu`, `social`, `footer`, `legalMenu`)
 *   ainsi que de `siteIndex` et `page:home`.
 * - Strictement UI-only : aucune logique métier.
 */

import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";

import { DEFAULT_CONTENT_STATE } from "@compoz/core/constants/common/content-state";
import type { SiteIndexDTO } from "@compoz/core/domain/site/dto";
import { log } from "@compoz/infra/lib/log";
import { useStudioPreviewBaselineScope } from "@compoz/studio/features/_shared/hooks/useStudioPreviewBaselineScope";
import { useListPageBlocks } from "@compoz/studio/features/pages/blocks/hooks/useListPageBlocks";
import { PreviewFrame } from "@compoz/studio/features/preview/PreviewFrame";
import { useStudioPreview } from "@compoz/studio/features/preview/hooks/useStudioPreview";
import { useSettingsBundle } from "@compoz/studio/features/settings/bundle/useSettingsBundle";
import { useReadSiteIndex } from "@compoz/studio/features/site-index/useReadSiteIndex";
import { toBlockShapeFromDTO } from "@compoz/ui/pages/mappers/block-shape";
import { toLegalMenuSettingsShapeFromDTO } from "@compoz/ui/settings/mappers/legal-menu-shape";
import { toPrimaryMenuSettingsShapeFromDTO } from "@compoz/ui/settings/mappers/primary-menu-shape";
import { toSocialSettingsShapeFromDTO } from "@compoz/ui/settings/mappers/social-shape";
import type { BlockShape } from "@compoz/validation/pages/blocks/block";
import type { PageRenderShape } from "@compoz/validation/pages/page";
import type { FooterSettingsShape } from "@compoz/validation/site/settings/footer/footer";
import type { HeaderSettingsShape } from "@compoz/validation/site/settings/header/header";
import type { IdentitySettingsShape } from "@compoz/validation/site/settings/identity/identity";
import type { LegalMenuSettingsShape } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu";
import type { PrimaryMenuSettingsShape } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu";
import type { SocialSettingsShape } from "@compoz/validation/site/settings/social/social";

const lg = log.child({
  ns: "ui",
  area: "studio",
  name: "OverviewPreviewCard",
});

type SettingsBaselineEntry = Readonly<{
  scope:
    | "header"
    | "identity"
    | "primaryMenu"
    | "footer"
    | "legalMenu"
    | "social";
  baseline: unknown | null;
}>;

export function OverviewPreviewCard() {
  const t = useTranslations();

  /* ---------------------------------------------------------------------- */
  /* Settings baselines (shell public)                                      */
  /* ---------------------------------------------------------------------- */

  const { data: settingsBundle, isLoading: isLoadingSettingsBundle } =
    useSettingsBundle(DEFAULT_CONTENT_STATE);

  const headerBaselinePreview = useMemo<HeaderSettingsShape | null>(() => {
    if (!settingsBundle) return null;
    return settingsBundle.header as HeaderSettingsShape;
  }, [settingsBundle]);

  const identityBaselinePreview = useMemo<IdentitySettingsShape | null>(() => {
    if (!settingsBundle) return null;
    return settingsBundle.identity as IdentitySettingsShape;
  }, [settingsBundle]);

  const primaryMenuBaselinePreview =
    useMemo<PrimaryMenuSettingsShape | null>(() => {
      if (!settingsBundle) return null;
      return toPrimaryMenuSettingsShapeFromDTO(settingsBundle.primaryMenu);
    }, [settingsBundle]);

  const footerBaselinePreview = useMemo<FooterSettingsShape | null>(() => {
    if (!settingsBundle) return null;
    return settingsBundle.footer as FooterSettingsShape;
  }, [settingsBundle]);

  const legalMenuBaselinePreview =
    useMemo<LegalMenuSettingsShape | null>(() => {
      if (!settingsBundle) return null;
      return toLegalMenuSettingsShapeFromDTO(settingsBundle.legalMenu);
    }, [settingsBundle]);

  const socialBaselinePreview = useMemo<SocialSettingsShape | null>(() => {
    if (!settingsBundle) return null;
    return toSocialSettingsShapeFromDTO(settingsBundle.social);
  }, [settingsBundle]);

  const settingsBaselines = useMemo<readonly SettingsBaselineEntry[]>(
    () => [
      { scope: "header", baseline: headerBaselinePreview },
      { scope: "identity", baseline: identityBaselinePreview },
      { scope: "primaryMenu", baseline: primaryMenuBaselinePreview },
      { scope: "footer", baseline: footerBaselinePreview },
      { scope: "legalMenu", baseline: legalMenuBaselinePreview },
      { scope: "social", baseline: socialBaselinePreview },
    ],
    [
      headerBaselinePreview,
      identityBaselinePreview,
      primaryMenuBaselinePreview,
      footerBaselinePreview,
      legalMenuBaselinePreview,
      socialBaselinePreview,
    ],
  );

  /* ---------------------------------------------------------------------- */
  /* Home page baseline (page:home) + siteIndex baseline                    */
  /* ---------------------------------------------------------------------- */

  const slug = "home";
  const previewScope = useMemo(() => `page:${slug}`, [slug]);

  const { index: siteIndex, isLoading: isLoadingIndex } = useReadSiteIndex();

  const homePageId = useMemo(() => {
    const pages = siteIndex?.pages ?? [];
    const home = pages.find((page) => page.slug === "home" || page.slug === "");
    return home?.id ?? null;
  }, [siteIndex]);

  const { blocks: homeBlocks, isLoading: isLoadingHomeBlocks } =
    useListPageBlocks(homePageId ?? "");

  const homePageTitle = useMemo(() => {
    const pages = siteIndex?.pages ?? [];
    const home =
      pages.find((page) => page.slug === "home" || page.slug === "") ?? null;

    return home?.title ?? t("studio.shared.homeLabel");
  }, [siteIndex, t]);

  const pageBaselinePreview = useMemo<PageRenderShape>(() => {
    const pageBlocks: BlockShape[] = (homeBlocks ?? [])
      .map(toBlockShapeFromDTO)
      .filter((block): block is BlockShape => Boolean(block));

    return {
      title: homePageTitle,
      blocks: pageBlocks,
      paginationEnabled: false,
    };
  }, [homeBlocks, homePageTitle]);

  /* ---------------------------------------------------------------------- */
  /* Preview bridge                                                         */
  /* ---------------------------------------------------------------------- */

  const { ready, setBaseline, iframeRef, frame } =
    useStudioPreview<PageRenderShape>(previewScope, pageBaselinePreview);

  useStudioPreviewBaselineScope<HeaderSettingsShape>({
    scope: "header",
    baseline: headerBaselinePreview,
    ready,
    setBaseline,
    onInject: () => {
      lg.debug("overview.preview.inject.header.baseline", { scope: "header" });
    },
  });

  useStudioPreviewBaselineScope<IdentitySettingsShape>({
    scope: "identity",
    baseline: identityBaselinePreview,
    ready,
    setBaseline,
    onInject: () => {
      lg.debug("overview.preview.inject.identity.baseline", {
        scope: "identity",
      });
    },
  });

  useStudioPreviewBaselineScope<PrimaryMenuSettingsShape>({
    scope: "primaryMenu",
    baseline: primaryMenuBaselinePreview,
    ready,
    setBaseline,
    onInject: () => {
      lg.debug("overview.preview.inject.primaryMenu.baseline", {
        scope: "primaryMenu",
      });
    },
  });

  useStudioPreviewBaselineScope<FooterSettingsShape>({
    scope: "footer",
    baseline: footerBaselinePreview,
    ready,
    setBaseline,
    onInject: () => {
      lg.debug("overview.preview.inject.footer.baseline", { scope: "footer" });
    },
  });

  useStudioPreviewBaselineScope<LegalMenuSettingsShape>({
    scope: "legalMenu",
    baseline: legalMenuBaselinePreview,
    ready,
    setBaseline,
    onInject: () => {
      lg.debug("overview.preview.inject.legalMenu.baseline", {
        scope: "legalMenu",
      });
    },
  });

  useStudioPreviewBaselineScope<SocialSettingsShape>({
    scope: "social",
    baseline: socialBaselinePreview,
    ready,
    setBaseline,
    onInject: () => {
      lg.debug("overview.preview.inject.social.baseline", { scope: "social" });
    },
  });

  useStudioPreviewBaselineScope<SiteIndexDTO>({
    scope: "siteIndex",
    baseline: siteIndex,
    ready,
    setBaseline,
    onInject: () => {
      lg.debug("overview.preview.inject.siteIndex.baseline", {
        scope: "siteIndex",
      });
    },
  });

  useStudioPreviewBaselineScope<PageRenderShape>({
    scope: previewScope,
    baseline: pageBaselinePreview,
    ready,
    setBaseline,
    onInject: () => {
      lg.debug("overview.preview.inject.page.baseline", {
        scope: previewScope,
      });
    },
  });

  useEffect(() => {
    lg.debug("overview.preview.baselines", {
      hasSettingsBundle: Boolean(settingsBundle),
      settingsScopes: settingsBaselines.map((entry) => ({
        scope: entry.scope,
        hasBaseline: Boolean(entry.baseline),
        isReady: ready.isReady(entry.scope),
      })),
      hasSiteIndex: Boolean(siteIndex),
      hasHomePageId: Boolean(homePageId),
      homeBlocksCount: homeBlocks?.length ?? 0,
      readyScopes: ready.scopes,
    });
  }, [
    settingsBundle,
    settingsBaselines,
    siteIndex,
    homePageId,
    homeBlocks?.length,
    ready,
  ]);

  const isIndexReady = !isLoadingIndex && Boolean(siteIndex);
  const hasHome = Boolean(homePageId);

  const isEmpty = isIndexReady && !hasHome;
  const emptyLabel = t("studio.emptyPreview.homeMissing");

  const allSettingsBaselinesReady = settingsBaselines.every((entry) =>
    Boolean(entry.baseline),
  );

  const allSettingsScopesReady = settingsBaselines.every((entry) =>
    ready.isReady(entry.scope),
  );

  const allBaselinesReady =
    allSettingsBaselinesReady && Boolean(siteIndex) && Boolean(homePageId);

  const allScopesReady =
    allSettingsScopesReady &&
    ready.isReady("siteIndex") &&
    ready.isReady(previewScope);

  const isPreviewLoading =
    !isEmpty &&
    (!allBaselinesReady ||
      !allScopesReady ||
      isLoadingSettingsBundle ||
      isLoadingIndex ||
      isLoadingHomeBlocks);

  return (
    <PreviewFrame
      title={t("studio.shared.preview.title", {
        entity: t("studio.shared.entities.overview"),
      })}
      src={`/preview/pages/${slug}`}
      iframeRef={iframeRef}
      onLoad={frame.onLoad}
      syncDisabled
      isLoading={isPreviewLoading}
      heightClassName="h-[800px]"
      isEmpty={isEmpty}
      emptyLabel={emptyLabel}
      info={
        isEmpty
          ? t("studio.emptyPreview.homeMissing")
          : !isPreviewLoading
            ? t("studio.overviewSection.preview.ready")
            : t("studio.overviewSection.preview.loading")
      }
    />
  );
}

OverviewPreviewCard.displayName = "OverviewPreviewCard";
