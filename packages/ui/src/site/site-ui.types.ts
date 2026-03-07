/**
 * @file packages/ui/src/site/public-ui.types.ts
 * @layer ui/site
 *
 * @description
 * Types définis pour le runtime UI du site (skins).
 * Ces types sont utilisés pour le runtime (merge) et le debug (inspect).
 *
 * Contrat : tous les champs sont optionnels (par défaut).
 */
import type { GalleryMaxColumns } from "@compoz/core/domain/pages/entities/cell";

/* -------------------------------------------------------------------------- */
/* Utilities                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * DeepPartial (lié au système de skins UI du site).
 */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

/* -------------------------------------------------------------------------- */
/* Global UI                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * ✅ Type runtime COMPLET : ce que le renderer consomme (aucun undefined).
 * Le `defaultGlobalUi` doit satisfaire ce type.
 */
export type SiteGlobalUi = Readonly<{
  header: SiteHeaderUi;
  footer: SiteFooterUi;

  body: Readonly<{
    surface: string;
    pageHeading: Readonly<{ h1: string }>;
    spacing: string;
    paddingTop: string;
    paddingBottom: string;
  }>;

  layoutSection: SiteLayoutSectionUi;
  blocks: SiteBlocksUi;
  pager: SiteDetailPagerUi;

  systemPage: SiteSystemPageUi;
  systemLoading: SiteSystemLoadingUi;
}>;

/** ✅ Type “skin override” : partiel (deep) */
export type SiteGlobalUiOverride = DeepPartial<SiteGlobalUi>;

/* -------------------------------------------------------------------------- */
/* Blocks                                                                     */
/* -------------------------------------------------------------------------- */

export type SiteBlocksUi = Readonly<{
  richText: SiteRichTextUi;
  image: SiteImageUi;
  navGallery: SiteNavGalleryUi;
  zoomGallery: SiteZoomGalleryUi;
  carousel: SiteCarouselUi;
}>;

export type SiteBlocksUiOverride = DeepPartial<SiteBlocksUi>;

/* -------------------------------------------------------------------------- */
/* Layout section                                                             */
/* -------------------------------------------------------------------------- */

export type SiteLayoutSectionUi = Readonly<{
  /** Container si "contained" (max-width + px + py). */
  containerContained: string;

  /** Container si "fullBleed" (w-full, et éventuellement py). */
  containerFullBleed: string;

  /** Wrapper grid. */
  grid: string;

  /** Classes conditionnelles de colonnes (pilotées par le skin). */
  gridCols: Readonly<{
    1: string;
    2: string;
    3: string;
  }>;

  /** Wrapper d’une cell. */
  cell: string;
}>;

export type SiteLayoutSectionUiOverride = DeepPartial<SiteLayoutSectionUi>;

/* -------------------------------------------------------------------------- */
/* Cells                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Richtext
 */
export type SiteRichTextUi = Readonly<{
  root: string;
}>;

export type SiteRichTextUiOverride = DeepPartial<SiteRichTextUi>;

/**
 * Image
 */
export type SiteImageUi = Readonly<{
  /** Wrapper (utilisé pour les variantes "wide"/"square"). */
  container: string;

  /** Classes de l'image (PublicAppImage). */
  image: string;

  /** Classes image quand on est en mode "cover" (wide/square). */
  imageCover: string;

  /** Classes image quand on est en mode "default" (sans frame). */
  imageDefault: string;
}>;

export type SiteImageUiOverride = DeepPartial<SiteImageUi>;

/**
 * Carousel
 */
export type SiteCarouselUi = Readonly<{
  /** Container mode ratio (ex: aspect-video) */
  containerRatio: string;

  /** Container mode fill (ex: height hero) */
  containerFill: string;

  /** Classe image (skin) */
  image: string;
}>;

export type SiteCarouselUiOverride = DeepPartial<SiteCarouselUi>;

/**
 * Galerie
 */
export type SiteNavGalleryUi = Readonly<{
  list: string;
  link: string;
  figure: string;
  image: string;
  overlayPanel: string;
  overlayContent: string;
  columns: Readonly<Record<GalleryMaxColumns, string>>;
}>;

export type SiteNavGalleryUiOverride = DeepPartial<SiteNavGalleryUi>;

export type SiteZoomGalleryUi = Readonly<{
  list: string;
  button: string;
  figure: string;
  image: string;
  overlayPanel: string;
  overlayContent: string;
  columns: Readonly<Record<GalleryMaxColumns, string>>;
  lightbox: SiteLightboxUi;
}>;

export type SiteZoomGalleryUiOverride = DeepPartial<SiteZoomGalleryUi>;

/**
 * Lightbox
 */
export type SiteLightboxUi = Readonly<{
  overlay: string;
  panel: string;
  panelEnter: string;
  panelExit: string;
  panelFrom: string;
  closeButton: string;
  closeIcon: string;
  imageWrap: string;
  image: string;
  caption: string;
}>;

export type SiteLightboxUiOverride = DeepPartial<SiteLightboxUi>;

/* -------------------------------------------------------------------------- */
/* Settings                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Footer
 */
export type SiteFooterUi = Readonly<{
  footer: string;
  footerContainer: string;
  copyright: string;
  legalMenu: SiteLegalMenuUi;
}>;

export type SiteFooterUiOverride = DeepPartial<SiteFooterUi>;

/**
 * Header
 */
export type SiteHeaderUi = Readonly<{
  /** <header> */
  header: Readonly<{
    base: string;
    sticky: string;
    blur: string;
  }>;

  /** Skip link (visible au focus). */
  skipLink: string;

  /** Conteneur interne (max-width + padding + flex) */
  headerContainer: string;

  /** logo et menus */
  logoSlot: string;

  /** nom du site */
  siteNameText: string;

  nav: string;

  /** Sous-composants */
  logo: SiteLogoUi;
  mobileMenu: SiteMobileMenuUi;
  menu: SitePrimaryMenuUi;
  social: SiteSocialMenuUi;
}>;

export type SiteHeaderUiOverride = DeepPartial<SiteHeaderUi>;

/**
 * LegalMenu
 */
export type SiteLegalMenuUi = Readonly<{
  /** Classes appliquées par le skin/template (nav). */
  nav: string;
  /** Classes appliquées par le skin/template (list). */
  list: string;
  /** Classes appliquées par le skin/template (item). */
  item: string;
  /** Classes appliquées par le skin/template (zone interactive). */
  interactive: string;
  /** Classes appliquées par le skin/template (lien). */
  link: string;
}>;

export type SiteLegalMenuUiOverride = DeepPartial<SiteLegalMenuUi>;

/**
 * PrimaryMenu
 */
export type SitePrimaryMenuUi = Readonly<{
  /** Classes appliquées par le skin/template (list). */
  list: string;

  /** Classes appliquées par le skin/template (item). */
  item: string;

  /** Classes appliquées par le skin/template (lien). */
  link: string;

  /**
   * Classes appliquées par le skin/template (zone interactive : lien + trigger dropdown).
   */
  interactive: string;

  /** Classes appliquées par le skin/template (panel dropdown). */
  dropdownPanel: string;
}>;

export type SitePrimaryMenuUiOverride = DeepPartial<SitePrimaryMenuUi>;

/**
 * SocialMenu
 */
export type SiteSocialMenuUi = Readonly<{
  /** Classes appliquées au <ul>. */
  list: string;

  /** Classes appliquées au <li>. */
  item: string;

  /** Classes appliquées à la zone interactive (lien + trigger dropdown). */
  interactive: string;

  /** Classes appliquées au lien. */
  link: string;

  /** Classes appliquées à l’icône. */
  icon: string;
}>;

export type SiteSocialMenuUiOverride = DeepPartial<SiteSocialMenuUi>;

/**
 * MobileMenu
 */
export type SiteMobileMenuUi = Readonly<{
  triggerButton: string;
  triggerIcon: string;

  overlayBase: string;
  overlayOpen: string;
  overlayClosed: string;

  panelBase: string;
  panelOpen: string;
  panelClosed: string;

  topBar: string;
  closeButton: string;

  scrollArea: string;

  list: string;
  item: string;

  // Root link & dropdown summary share the same “interactive slot”
  interactive: string;
  link: string;

  details: string;
  summary: string;
  dropdownList: string;
  childItem: string;
  childInteractive: string;

  socialsRow: string;

  /** classes appliquées au lien social (zone interactive) */
  socialLink: string;

  /** classes appliquées à l’icône */
  socialIcon?: string;

  focusRing: string;

  // Optionnel
  emptyState: string;
}>;

export type SiteMobileMenuUiOverride = DeepPartial<SiteMobileMenuUi>;

/**
 * Logo
 */
export type SiteLogoUi = Readonly<{
  /** Classes appliquées par le skin/template (Link). */
  link: string;

  /** Classes appliquées par le skin/template (Image). */
  image: string;
}>;

export type SiteLogoUiOverride = DeepPartial<SiteLogoUi>;

/* -------------------------------------------------------------------------- */
/* Pager                                                                      */
/* -------------------------------------------------------------------------- */

export type SiteDetailPagerUi = Readonly<{
  /** <nav> wrapper */
  nav: string;

  /** Classes appliquées au lien (linkClassName) */
  link: string;

  /** Label text (ex: line-clamp) */
  label: string;

  /** Icon */
  icon: string;
}>;

export type SiteDetailPagerUiOverride = DeepPartial<SiteDetailPagerUi>;

/* -------------------------------------------------------------------------- */
/* System                                                                     */
/* -------------------------------------------------------------------------- */

export type SiteSystemLoadingUi = Readonly<{
  /** Wrapper full height du main (centrage). */
  container: string;
  /** Spinner. */
  spinner: string;
}>;

export type SiteSystemLoadingUiOverride = DeepPartial<SiteSystemLoadingUi>;

export type SiteSystemPageUi = Readonly<{
  main: string;
  prose: string;
  title: string;
  description: string;
  actions: string;
  button: string;
}>;

export type SiteSystemPageUiOverride = DeepPartial<SiteSystemPageUi>;
