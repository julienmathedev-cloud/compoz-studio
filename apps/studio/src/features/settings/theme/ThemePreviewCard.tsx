"use client";

/**
 * @file apps/studio/src/features/settings/theme/ThemePreviewCard.tsx
 * @layer studio/features/settings/theme
 *
 * @description
 * Live preview card for theme changes rendered against the public home page.
 *
 * @remarks
 * - Injects the theme draft together with public shell baselines so the preview matches the real site chrome.
 * - Also injects `siteIndex` and `page:home` baselines because the theme preview renders a full page, not an isolated theme sample.
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
import type { ThemeSettingsShape } from "@compoz/validation/site/settings/theme/theme";

const lg = log.child({
  ns: "ui",
  area: "studio",
  name: "ThemePreviewCard",
});

type ThemePreviewCardProps = Readonly<{
  themeValue: ThemeSettingsShape | null;
  isLoadingTheme?: boolean;
}>;

type SettingsBaselineEntry = Readonly<{
  scope:
    | "header"
    | "identity"
    | "primaryMenu"
    | "footer"
    | "legalMenu"
    | "social"
    | "theme";
  baseline: unknown | null;
}>;

export function ThemePreviewCard({
  themeValue,
  isLoadingTheme = false,
}: ThemePreviewCardProps) {
  const t = useTranslations();

  // The theme preview needs public shell settings to render the same chrome as the live site.
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
      { scope: "theme", baseline: themeValue },
    ],
    [
      headerBaselinePreview,
      identityBaselinePreview,
      primaryMenuBaselinePreview,
      footerBaselinePreview,
      legalMenuBaselinePreview,
      socialBaselinePreview,
      themeValue,
    ],
  );

  // The preview renders the home page so theme changes are shown in realistic content.
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

  const homePageName = useMemo(() => {
    const pages = siteIndex?.pages ?? [];
    const home =
      pages.find((page) => page.slug === "home" || page.slug === "") ?? null;

    return home?.name ?? t("studio.shared.homeLabel");
  }, [siteIndex, t]);

  const pageBaselinePreview = useMemo<PageRenderShape>(() => {
    const pageBlocks: BlockShape[] = (homeBlocks ?? [])
      .map(toBlockShapeFromDTO)
      .filter((block): block is BlockShape => Boolean(block));

    return {
      name: homePageName,
      seoTitle: null,
      seoDescription: null,
      blocks: pageBlocks,
      paginationEnabled: false,
    };
  }, [homeBlocks, homePageName]);

  // Every scope must be ready before the iframe can display a complete themed page.
  const { ready, setBaseline, iframeRef, frame } =
    useStudioPreview<PageRenderShape>(previewScope, {
      baseline: pageBaselinePreview,
      liveEnabled: true,
    });

  useStudioPreviewBaselineScope<ThemeSettingsShape>({
    scope: "theme",
    baseline: themeValue,
    ready,
    setBaseline,
    onInject: () => {
      lg.debug("theme.preview.inject.theme.baseline", { scope: "theme" });
    },
  });

  useStudioPreviewBaselineScope<HeaderSettingsShape>({
    scope: "header",
    baseline: headerBaselinePreview,
    ready,
    setBaseline,
  });

  useStudioPreviewBaselineScope<IdentitySettingsShape>({
    scope: "identity",
    baseline: identityBaselinePreview,
    ready,
    setBaseline,
  });

  useStudioPreviewBaselineScope<PrimaryMenuSettingsShape>({
    scope: "primaryMenu",
    baseline: primaryMenuBaselinePreview,
    ready,
    setBaseline,
  });

  useStudioPreviewBaselineScope<FooterSettingsShape>({
    scope: "footer",
    baseline: footerBaselinePreview,
    ready,
    setBaseline,
  });

  useStudioPreviewBaselineScope<LegalMenuSettingsShape>({
    scope: "legalMenu",
    baseline: legalMenuBaselinePreview,
    ready,
    setBaseline,
  });

  useStudioPreviewBaselineScope<SocialSettingsShape>({
    scope: "social",
    baseline: socialBaselinePreview,
    ready,
    setBaseline,
  });

  useStudioPreviewBaselineScope<SiteIndexDTO>({
    scope: "siteIndex",
    baseline: siteIndex,
    ready,
    setBaseline,
  });

  useStudioPreviewBaselineScope<PageRenderShape>({
    scope: previewScope,
    baseline: pageBaselinePreview,
    ready,
    setBaseline,
  });

  useEffect(() => {
    lg.debug("theme.preview.baselines", {
      hasTheme: Boolean(themeValue),
      hasSettingsBundle: Boolean(settingsBundle),
      hasSiteIndex: Boolean(siteIndex),
      hasHomePageId: Boolean(homePageId),
      homeBlocksCount: homeBlocks?.length ?? 0,
      readyScopes: ready.scopes,
    });
  }, [
    themeValue,
    settingsBundle,
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
      isLoadingTheme ||
      isLoadingSettingsBundle ||
      isLoadingIndex ||
      isLoadingHomeBlocks);

  return (
    <PreviewFrame
      title={t("studio.shared.preview.title", {
        entity: t("studio.shared.entities.theme"),
      })}
      src={`/preview/pages/${slug}`}
      iframeRef={iframeRef}
      onLoad={frame.onLoad}
      isLoading={isPreviewLoading}
      heightClassName="h-[800px]"
      isEmpty={isEmpty}
      emptyLabel={emptyLabel}
      info={
        isEmpty
          ? t("studio.emptyPreview.homeMissing")
          : t("studio.shared.preview.infoLive")
      }
    />
  );
}

ThemePreviewCard.displayName = "ThemePreviewCard";
