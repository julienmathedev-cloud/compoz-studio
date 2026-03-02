"use client";

/**
 * @file apps/studio/src/features/overview/OverviewPreviewCard.tsx
 * @layer ui/overview
 *
 * @description
 * Carte de preview “overview” : affiche la page home dans l’iframe preview.
 * Injecte les baselines settings + la baseline `page:home` via handshake `ready`.
 */

import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";

import { log } from "@compoz/infra/lib/log";
import { useAdminPreview } from "@compoz/studio/features/preview/hooks/useAdminPreview";
import { PreviewFrame } from "@compoz/studio/features/preview/PreviewFrame";

import type { FooterSettingsShape } from "@compoz/validation/site/settings/footer/footer";
import type { HeaderSettingsShape } from "@compoz/validation/site/settings/header/header";
import type { IdentitySettingsShape } from "@compoz/validation/site/settings/identity/identity";
import type { LegalMenuSettingsShape } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu";
import type { PrimaryMenuSettingsShape } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu";
import type { SocialSettingsShape } from "@compoz/validation/site/settings/social/social";

import { WRITE_CONTENT_STATE } from "@compoz/core/constants/common/content-state";

import { useSettingsBundle } from "@compoz/studio/features/settings/bundle/useSettingsBundle";

import type { SiteIndexDTO } from "@compoz/core/domain/site/dto";
import { toBlockShapeFromDTO } from "@compoz/ui/pages/mappers/block-shape";
import { toLegalMenuSettingsShapeFromDTO } from "@compoz/ui/settings/mappers/legal-menu-shape";
import { toPrimaryMenuSettingsShapeFromDTO } from "@compoz/ui/settings/mappers/primary-menu-shape";
import { toSocialSettingsShapeFromDTO } from "@compoz/ui/settings/mappers/social-shape";
import type { BlockShape } from "@compoz/validation/pages/blocks/block";
import type { PageRenderShape } from "@compoz/validation/pages/page";
import { useListPageBlocks } from "@compoz/studio/features/pages/blocks/hooks/useListPageBlocks";
import { useReadSiteIndex } from "@compoz/studio/features/site-index/useReadSiteIndex";

const lg = log.child({ ns: "ui", comp: "OverviewPreviewCard" });

export function OverviewPreviewCard() {
  const t = useTranslations();

  /* ---------------------------------------------------------------------- */
  /* Settings baselines (shell public)                                       */
  /* ---------------------------------------------------------------------- */

  const { data: settingsBundle, isLoading: isLoadingSettingsBundle } =
    useSettingsBundle(WRITE_CONTENT_STATE);

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

  /* ---------------------------------------------------------------------- */
  /* Home page baseline (page:home) + siteIndex baseline                     */
  /* ---------------------------------------------------------------------- */

  const slug = "home";
  const previewScope = useMemo(() => `page:${slug}`, [slug]);

  const { index: siteIndex, isLoading: isLoadingIndex } = useReadSiteIndex();

  const homePageId = useMemo(() => {
    const pages = siteIndex?.pages ?? [];
    const home = pages.find((p) => p.slug === "home" || p.slug === "") ?? null;
    return home?.id ?? null;
  }, [siteIndex]);

  const { blocks: homeBlocks, isLoading: isLoadingHomeBlocks } =
    useListPageBlocks(homePageId ?? "");

  const homePageTitle = useMemo(() => {
    const pages = siteIndex?.pages ?? [];
    const home = pages.find((p) => p.slug === "home" || p.slug === "") ?? null;
    return home?.title ?? t("admin.shared.homeLabel");
  }, [siteIndex, t]);

  const pageBaselinePreview = useMemo<PageRenderShape>(() => {
    const pageBlocks: BlockShape[] = (homeBlocks ?? [])
      .map(toBlockShapeFromDTO)
      .filter((x): x is BlockShape => Boolean(x));

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
    useAdminPreview<PageRenderShape>(previewScope, pageBaselinePreview);

  useEffect(() => {
    lg.debug("[overview.admin.baselines]", {
      hasSettingsBundle: Boolean(settingsBundle),
      hasHeader: Boolean(headerBaselinePreview),
      hasIdentity: Boolean(identityBaselinePreview),
      hasPrimaryMenu: Boolean(primaryMenuBaselinePreview),
      hasFooter: Boolean(footerBaselinePreview),
      hasLegalMenu: Boolean(legalMenuBaselinePreview),
      hasSocial: Boolean(socialBaselinePreview),
      hasSiteIndex: Boolean(siteIndex),
      hasHomePageId: Boolean(homePageId),
      homeBlocks: homeBlocks?.length ?? 0,
      readyScopes: ready.scopes,
    });
  }, [
    settingsBundle,
    headerBaselinePreview,
    identityBaselinePreview,
    primaryMenuBaselinePreview,
    footerBaselinePreview,
    legalMenuBaselinePreview,
    socialBaselinePreview,
    siteIndex,
    homePageId,
    homeBlocks?.length,
    ready.scopes,
  ]);

  useEffect(() => {
    const isReady = (s: string) => ready.isReady(s);

    if (isReady("header") && headerBaselinePreview) {
      setBaseline("header", headerBaselinePreview);
    }

    if (isReady("identity") && identityBaselinePreview) {
      setBaseline("identity", identityBaselinePreview);
    }

    if (isReady("primaryMenu") && primaryMenuBaselinePreview) {
      setBaseline("primaryMenu", primaryMenuBaselinePreview);
    }

    if (isReady("footer") && footerBaselinePreview) {
      setBaseline("footer", footerBaselinePreview);
    }

    if (isReady("legalMenu") && legalMenuBaselinePreview) {
      setBaseline("legalMenu", legalMenuBaselinePreview);
    }

    if (isReady("social") && socialBaselinePreview) {
      setBaseline("social", socialBaselinePreview);
    }

    if (isReady("siteIndex") && siteIndex) {
      setBaseline("siteIndex", siteIndex as SiteIndexDTO);
    }

    if (isReady(previewScope)) {
      setBaseline(previewScope, pageBaselinePreview);
    }
  }, [
    ready,
    setBaseline,
    headerBaselinePreview,
    identityBaselinePreview,
    primaryMenuBaselinePreview,
    footerBaselinePreview,
    legalMenuBaselinePreview,
    socialBaselinePreview,
    siteIndex,
    previewScope,
    pageBaselinePreview,
  ]);

  const isIndexReady = !isLoadingIndex && Boolean(siteIndex);
  const hasHome = Boolean(homePageId);

  // ✅ Empty state *dans l'iframe* (PreviewFrame gère /preview/empty)
  const isEmpty = isIndexReady && !hasHome;
  const emptyLabel = t("admin.emptyPreview.homeMissing");

  const allBaselinesReady =
    Boolean(settingsBundle) &&
    Boolean(headerBaselinePreview) &&
    Boolean(identityBaselinePreview) &&
    Boolean(primaryMenuBaselinePreview) &&
    Boolean(footerBaselinePreview) &&
    Boolean(socialBaselinePreview) &&
    Boolean(legalMenuBaselinePreview) &&
    Boolean(siteIndex) &&
    Boolean(homePageId);

  const allScopesReady =
    ready.isReady("header") &&
    ready.isReady("identity") &&
    ready.isReady("primaryMenu") &&
    ready.isReady("footer") &&
    ready.isReady("social") &&
    ready.isReady("legalMenu") &&
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
      title={t("admin.shared.preview.title", {
        entity: t("admin.shared.entities.overview"),
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
          ? t("admin.emptyPreview.homeMissing")
          : !isPreviewLoading
            ? t("admin.overviewSection.preview.ready")
            : t("admin.overviewSection.preview.loading")
      }
    />
  );
}

OverviewPreviewCard.displayName = "OverviewPreviewCard";
